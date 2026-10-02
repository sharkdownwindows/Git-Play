import { describe, expect, it } from "vitest";
import type { Command } from "../core/types";
import { initialAppState, reducer } from "./store";

describe("app reducer", () => {
  it("dispatch command thành công đổi RepoState và lưu undo snapshot", () => {
    const initial = initialAppState();
    const next = reducer(initial, { type: "run", command: { kind: "commit", message: "root" } });
    expect(next.repo).not.toBe(initial.repo);
    expect(Object.keys(next.repo.commits)).toHaveLength(1);
    expect(next.past).toEqual([initial.repo]);
    expect(next.future).toEqual([]);
    expect(initial.repo.commits).toEqual({});
  });

  it("command lỗi giữ RepoState và không thêm undo snapshot", () => {
    const initial = initialAppState();
    const next = reducer(initial, { type: "run", command: { kind: "branch", name: "feature" } });
    expect(next.repo).toBe(initial.repo);
    expect(next.past).toEqual([]);
    expect(next.future).toEqual([]);
    expect(next.output).toHaveLength(1);
  });

  it("command mới sau undo xóa redo stack", () => {
    const root = reducer(initialAppState(), { type: "run", command: { kind: "commit", message: "root" } });
    const second = reducer(root, { type: "run", command: { kind: "commit", message: "second" } });
    const undone = reducer(second, { type: "undo" });
    expect(undone.future).toEqual([second.repo]);

    const branched = reducer(undone, { type: "run", command: { kind: "branch", name: "feature" } });
    expect(branched.repo.branches.feature).toBe(root.repo.branches.main);
    expect(branched.future).toEqual([]);
    expect(reducer(branched, { type: "redo" })).toBe(branched);
  });

  it("undo và redo năm command qua reducer khôi phục đúng RepoState", () => {
    const commands: Command[] = [
      { kind: "commit", message: "root" },
      { kind: "branch", name: "feature" },
      { kind: "commit", message: "main second" },
      { kind: "switch", target: "feature", detach: false, create: false },
      { kind: "commit", message: "feature second" },
    ];
    let app = initialAppState();
    const states = [app.repo];
    for (const command of commands) {
      app = reducer(app, { type: "run", command });
      states.push(app.repo);
    }
    for (let i = 4; i >= 0; i--) {
      app = reducer(app, { type: "undo" });
      expect(app.repo).toEqual(states[i]);
    }
    for (let i = 1; i <= 5; i++) {
      app = reducer(app, { type: "redo" });
      expect(app.repo).toEqual(states[i]);
    }
  });

  it("failed command after undo preserves redo history", () => {
    const first = reducer(initialAppState(), { type: "run", command: { kind: "commit" } });
    const second = reducer(first, { type: "run", command: { kind: "commit" } });
    const undone = reducer(second, { type: "undo" });
    const failed = reducer(undone, { type: "run", command: { kind: "branch", name: "main" } });
    expect(failed.future).toEqual(undone.future);
    expect(failed.past).toEqual(undone.past);
    expect(reducer(failed, { type: "redo" }).repo).toEqual(second.repo);
  });
});
