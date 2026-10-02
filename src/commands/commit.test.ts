import { describe, expect, it } from "vitest";
import { execute } from "../engine";
import { emptyState, type RepoState } from "../types";

function committedState(): RepoState {
  const result = execute(emptyState(), { kind: "commit", message: "first" });
  expect(result.ok).toBe(true);
  return result.state;
}

describe("commit", () => {
  it("tạo root commit và branch main từ repo rỗng", () => {
    const result = execute(emptyState(), { kind: "commit", message: "root" });
    expect(result.ok).toBe(true);
    const id = result.state.branches.main!;
    expect(result.state.commits[id]).toMatchObject({ id, message: "root", parents: [] });
    expect(result.state.head).toEqual({ detached: false, ref: "main", commit: null });
    expect(Number.isNaN(Date.parse(result.state.commits[id]!.timestamp))).toBe(false);
  });

  it("attached HEAD tạo parent và dịch branch hiện tại", () => {
    const initial = committedState();
    const parent = initial.branches.main!;
    const result = execute(initial, { kind: "commit", message: "second" });
    const id = result.state.branches.main!;
    expect(result.ok).toBe(true);
    expect(id).not.toBe(parent);
    expect(result.state.commits[id]!.parents).toEqual([parent]);
    expect(result.state.head).toEqual(initial.head);
  });

  it("chỉ dịch branch đang attached, không dịch branch khác", () => {
    const initial = committedState();
    initial.branches.feature = initial.branches.main!;
    const feature = initial.branches.feature;
    const result = execute(initial, { kind: "commit", message: "main only" });
    expect(result.state.branches.feature).toBe(feature);
    expect(result.state.branches.main).not.toBe(feature);
  });

  it("detached HEAD chỉ dịch HEAD, không dịch branch", () => {
    const initial = committedState();
    const parent = initial.branches.main!;
    initial.head = { detached: true, ref: null, commit: parent };
    const result = execute(initial, { kind: "commit", message: "detached" });
    const id = result.state.head.commit!;
    expect(result.ok).toBe(true);
    expect(id).not.toBe(parent);
    expect(result.state.commits[id]!.parents).toEqual([parent]);
    expect(result.state.branches).toEqual(initial.branches);
  });

  it("không dùng lại ID commit đã tồn tại", () => {
    const initial = committedState();
    initial.commits.c2 = { id: "c2", message: "existing", parents: [], timestamp: "2020-01-01T00:00:00.000Z" };
    const result = execute(initial, { kind: "commit", message: "next" });
    expect(Object.keys(result.state.commits)).toHaveLength(3);
    expect(result.state.commits.c2).toEqual(initial.commits.c2);
    expect(result.state.branches.main).toBe("c3");
  });

  it("cùng input cho cùng ID và timestamp, kể cả khi gọi lặp lại", () => {
    const initial = committedState();
    const command = { kind: "commit" as const, message: "same" };
    expect(execute(initial, command)).toEqual(execute(initial, command));
  });

  it("không sửa state đầu vào", () => {
    const initial = committedState();
    const before = structuredClone(initial);
    execute(initial, { kind: "commit", message: "new" });
    expect(initial).toEqual(before);
  });

  it("không có message thì vẫn tạo commit với message rỗng", () => {
    const result = execute(emptyState(), { kind: "commit" });
    expect(result.ok).toBe(true);
    expect(result.state.commits[result.state.branches.main!]!.message).toBe("");
  });

  it("HEAD trỏ tới commit không tồn tại thì trả lỗi, không tạo parent hỏng", () => {
    const initial = committedState();
    initial.head = { detached: true, ref: null, commit: "missing" };
    const result = execute(initial, { kind: "commit", message: "invalid" });
    expect(result).toMatchObject({ ok: false, errorClass: "NoCommitsYet", state: initial });
  });
});
