import { describe, expect, it } from "vitest";
import { execute } from "../engine";
import { emptyState, type RepoState } from "../types";

function state(): RepoState {
  const repo = emptyState();
  repo.commits = {
    c1: { id: "c1", message: "root", parents: [], timestamp: "2020-01-01T00:00:00.000Z" },
    c2: { id: "c2", message: "main", parents: ["c1"], timestamp: "2020-01-02T00:00:00.000Z" },
  };
  repo.branches = { main: "c2", feature: "c1" };
  return repo;
}

describe("switch", () => {
  it("attaches HEAD to an existing branch without moving refs", () => {
    const initial = state();
    const result = execute(initial, { kind: "switch", target: "feature", detach: false, create: false });
    expect(result.ok).toBe(true);
    expect(result.state.head).toEqual({ detached: false, ref: "feature", commit: null });
    expect(result.state.branches).toEqual(initial.branches);
  });

  it("creates a branch at current commit and attaches HEAD", () => {
    const result = execute(state(), { kind: "switch", target: "topic", detach: false, create: true });
    expect(result.ok).toBe(true);
    expect(result.state.branches.topic).toBe("c2");
    expect(result.state.head.ref).toBe("topic");
  });

  it("detaches at a commit or branch tip only with --detach", () => {
    for (const target of ["c1", "feature"]) {
      const result = execute(state(), { kind: "switch", target, detach: true, create: false });
      expect(result.ok).toBe(true);
      expect(result.state.head).toEqual({ detached: true, ref: null, commit: "c1" });
    }
  });

  it("rejects a commit target without --detach using a Git-style message", () => {
    const initial = state();
    const result = execute(initial, { kind: "switch", target: "c1", detach: false, create: false });
    expect(result).toMatchObject({ ok: false, errorClass: "PathspecNotFound", state: initial });
    expect(result.output[0]).toContain("a branch is expected");
  });

  it("returns classified errors for missing, duplicate, and invalid targets", () => {
    const cases = [
      { target: "missing", create: false, errorClass: "PathspecNotFound" },
      { target: "feature", create: true, errorClass: "BranchAlreadyExists" },
      { target: "bad name", create: true, errorClass: "InvalidRefName" },
    ] as const;
    for (const testCase of cases) {
      const initial = state();
      const before = structuredClone(initial);
      const result = execute(initial, {
        kind: "switch", target: testCase.target, detach: false, create: testCase.create,
      });
      expect(result).toMatchObject({ ok: false, errorClass: testCase.errorClass, state: initial });
      expect(result.output[0]?.length).toBeGreaterThan(0);
      expect(initial).toEqual(before);
    }
  });

  it("creates an unborn branch without a ref before the first commit", () => {
    const initial = emptyState();
    const before = structuredClone(initial);
    const result = execute(initial, { kind: "switch", target: "topic", detach: false, create: true });
    expect(result).toEqual({
      ok: true, output: ["Switched to a new branch 'topic'"],
      state: { ...initial, commits: {}, branches: {},
        head: { detached: false, ref: "topic", commit: null } },
    });
    expect(initial).toEqual(before);
    expect(result.state).not.toBe(initial);
    expect(execute(initial, { kind: "branch", name: "topic" }))
      .toMatchObject({ ok: false, errorClass: "NoCommitsYet", state: initial });
    expect(execute(result.state, { kind: "commit", message: "first" }).state.branches.topic).toBe("c1");
  });
});
