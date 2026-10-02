import { describe, expect, it } from "vitest";
import { execute } from "../engine";
import { emptyState, type RepoState } from "../types";
import { detectConflicts } from "./merge";

function state(): RepoState {
  const repo = emptyState();
  repo.commits = {
    c1: { id: "c1", message: "root", parents: [], timestamp: "2020-01-01T00:00:00.000Z" },
    c2: { id: "c2", message: "main", parents: ["c1"], timestamp: "2020-01-02T00:00:00.000Z" },
    c3: { id: "c3", message: "feature", parents: ["c1"], timestamp: "2020-01-03T00:00:00.000Z" },
  };
  repo.branches = { main: "c2", feature: "c3" };
  return repo;
}

describe("merge", () => {
  it("fast-forwards the attached branch without creating a commit", () => {
    const initial = state();
    initial.branches.main = "c1";
    const result = execute(initial, { kind: "merge", branch: "feature" });
    expect(result.ok).toBe(true);
    expect(result.state.branches.main).toBe("c3");
    expect(result.state.head).toEqual(initial.head);
    expect(result.state.commits).toEqual(initial.commits);
    expect(result.output).toContain("Fast-forward");
  });

  it("succeeds without changing state when target is an ancestor", () => {
    const initial = state();
    initial.branches.feature = "c1";
    const before = structuredClone(initial);
    const result = execute(initial, { kind: "merge", branch: "feature" });
    expect(result).toEqual({ ok: true, state: initial, output: ["Already up to date."] });
    expect(result.state).toBe(initial);
    expect(initial).toEqual(before);
  });

  it("succeeds without changing state on self-merge", () => {
    const initial = state();
    const before = structuredClone(initial);
    const result = execute(initial, { kind: "merge", branch: "main" });
    expect(result).toEqual({ ok: true, state: initial, output: ["Already up to date."] });
    expect(result.state).toBe(initial);
    expect(initial).toEqual(before);
  });

  it("still rejects missing branches", () => {
    const initial = state();
    expect(execute(initial, { kind: "merge", branch: "missing" }))
      .toMatchObject({ ok: false, errorClass: "PathspecNotFound", state: initial });
  });

  it("does not emit the legacy no-op error classes from the v1 engine", () => {
    const initial = state();
    const ancestor = state();
    ancestor.branches.feature = "c1";
    for (const result of [
      execute(initial, { kind: "merge", branch: "main" }),
      execute(ancestor, { kind: "merge", branch: "feature" }),
    ]) {
      expect(result.ok).toBe(true);
      expect(result.errorClass).toBeUndefined();
    }
  });

  it("creates one deterministic merge commit with ordered parents", () => {
    const initial = state();
    const before = structuredClone(initial);
    const command = { kind: "merge" as const, branch: "feature" };
    const result = execute(initial, command);
    expect(result.ok).toBe(true);
    expect(Object.keys(result.state.commits)).toHaveLength(4);
    const id = result.state.branches.main!;
    expect(result.state.commits[id]).toMatchObject({
      id, parents: ["c2", "c3"], message: "Merge branch 'feature'",
    });
    expect(result.state.branches.feature).toBe("c3");
    expect(result.state.head).toEqual(initial.head);
    expect(result).toEqual(execute(initial, command));
    expect(initial).toEqual(before);
  });

  it("moves only detached HEAD when merging from a detached commit", () => {
    const initial = state();
    initial.head = { detached: true, ref: null, commit: "c2" };
    const result = execute(initial, { kind: "merge", branch: "feature" });
    expect(result.ok).toBe(true);
    const id = result.state.head.commit!;
    expect(result.state.commits[id]?.parents).toEqual(["c2", "c3"]);
    expect(result.state.branches).toEqual(initial.branches);
  });

  it("preserves the v1 no-conflict seam", () => {
    const initial = state();
    expect(detectConflicts(initial, "c2", "c3", "c1")).toBeNull();
    expect(execute(initial, { kind: "merge", branch: "feature" }).state.conflicts).toBeNull();
  });

  it("rejects an unborn HEAD without mutating input", () => {
    const initial = state();
    initial.head = { detached: false, ref: "unborn", commit: null };
    const before = structuredClone(initial);
    const result = execute(initial, { kind: "merge", branch: "feature" });
    expect(result).toMatchObject({ ok: false, errorClass: "NoCommitsYet", state: initial });
    expect(initial).toEqual(before);
  });
});
