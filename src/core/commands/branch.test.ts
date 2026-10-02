import { describe, expect, it } from "vitest";
import { execute } from "../engine";
import { emptyState, type RepoState } from "../types";

function committedState(): RepoState {
  const result = execute(emptyState(), { kind: "commit", message: "root" });
  expect(result.ok).toBe(true);
  return result.state;
}

describe("branch", () => {
  it("liệt kê repo chưa có commit mà không tạo ref", () => {
    const initial = emptyState();
    const result = execute(initial, { kind: "branch" });
    expect(result).toMatchObject({ ok: true, state: initial, output: [] });
  });

  it("liệt kê branch theo tên và đánh dấu branch đang attached", () => {
    const initial = committedState();
    initial.branches.alpha = initial.branches.main!;
    expect(execute(initial, { kind: "branch" }).output).toEqual(["  alpha", "* main"]);
  });

  it("tạo branch tại commit đang attached mà không dịch HEAD", () => {
    const initial = committedState();
    const result = execute(initial, { kind: "branch", name: "feature" });
    expect(result.ok).toBe(true);
    expect(result.state.branches.feature).toBe(initial.branches.main);
    expect(result.state.head).toEqual(initial.head);
    expect(result.output).toEqual([]);
  });

  it("tạo branch tại commit của detached HEAD", () => {
    const root = committedState();
    const initial = execute(root, { kind: "commit", message: "second" }).state;
    initial.head = { detached: true, ref: null, commit: root.branches.main! };
    const result = execute(initial, { kind: "branch", name: "feature/sub" });
    expect(result.ok).toBe(true);
    expect(result.state.branches["feature/sub"]).toBe(initial.head.commit);
    expect(result.state.branches["feature/sub"]).not.toBe(initial.branches.main);
    expect(result.state.head).toEqual(initial.head);
  });

  it("khi HEAD detached, danh sách không đánh dấu branch nào đang attached", () => {
    const initial = committedState();
    initial.head = { detached: true, ref: null, commit: initial.branches.main! };
    expect(execute(initial, { kind: "branch" }).output).toEqual(["  main"]);
  });

  it("lỗi khi tạo branch trên repo chưa có commit", () => {
    const initial = emptyState();
    const result = execute(initial, { kind: "branch", name: "feature" });
    expect(result).toMatchObject({ ok: false, errorClass: "NoCommitsYet", state: initial });
  });

  it("lỗi khi tên branch đã tồn tại", () => {
    const initial = committedState();
    const result = execute(initial, { kind: "branch", name: "main" });
    expect(result).toMatchObject({ ok: false, errorClass: "BranchAlreadyExists", state: initial });
  });

  it.each(["", "bad name", "-bad", "bad..name", "bad/", "bad.lock", "bad@{x"])(
    "lỗi InvalidRefName cho tên %j",
    (name) => {
      const initial = committedState();
      const result = execute(initial, { kind: "branch", name });
      expect(result).toMatchObject({ ok: false, errorClass: "InvalidRefName", state: initial });
    },
  );

  it("không sửa state đầu vào khi tạo branch hoặc báo lỗi", () => {
    const initial = committedState();
    const before = structuredClone(initial);
    execute(initial, { kind: "branch", name: "feature" });
    execute(initial, { kind: "branch", name: "main" });
    expect(initial).toEqual(before);
  });

  it("HEAD trỏ tới commit không tồn tại thì không tạo dangling ref", () => {
    const initial = committedState();
    initial.head = { detached: true, ref: null, commit: "missing" };
    const result = execute(initial, { kind: "branch", name: "feature" });
    expect(result).toMatchObject({ ok: false, errorClass: "NoCommitsYet", state: initial });
  });
});
