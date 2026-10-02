import { branch } from "./commands/branch";
import { checkout } from "./commands/checkout";
import { commit } from "./commands/commit";
import { merge } from "./commands/merge";
import { switchTo } from "./commands/switch";
import { fail } from "./errors";
import type { Command, RepoState, Result } from "./types";

/**
 * Điểm vào duy nhất của engine.
 *
 * HAI BẢO ĐẢM, cả hai đều là điều kiện để differential testing chạy được:
 *   1. KHÔNG BAO GIỜ throw. Mọi lỗi đi qua ok:false + output + errorClass.
 *   2. KHÔNG sửa `state` tại chỗ. Lỗi → trả lại chính state cũ.
 *
 * File này và toàn bộ core/ không import React, DOM, hay bất kỳ module UI nào —
 * harness Node import trực tiếp vào đây.
 */
export function execute(state: RepoState, command: Command): Result {
  try {
    switch (command.kind) {
      case "commit":
        return commit(state, command.message);
      case "branch":
        return branch(state, command.name);
      case "switch":
        return switchTo(state, command.target, command.detach, command.create);
      case "checkout":
        return checkout(state, command.target, command.create);
      case "merge":
        return merge(state, command.branch);
      default: {
        // Lệnh lạ (JSON hỏng, level file sai) vẫn phải ra Result, không ra exception.
        const exhaustive: never = command;
        void exhaustive;
        return fail(state, "UnknownCommand");
      }
    }
  } catch {
    // Lưới an toàn. Bug trong command KHÔNG được thoát ra ngoài dạng exception,
    // vì harness so lỗi như dữ liệu chứ không bắt exception.
    return fail(state, "UnknownCommand");
  }
}
