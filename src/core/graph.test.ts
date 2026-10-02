import { describe, expect, it } from "vitest";
import { emptyState, type RepoState } from "./types";
import { isAncestor, lowestCommonAncestors, topologicalDepth } from "./graph";

function graph(): RepoState {
  const state = emptyState();
  const parents: Record<string, string[]> = {
    R: [], A: ["R"], B: ["R"], X: ["A", "B"], Y: ["B", "A"],
    Z: ["X", "Y"], W: ["Y", "X"],
  };
  for (const [id, parentIds] of Object.entries(parents)) {
    state.commits[id] = {
      id, parents: parentIds, message: id, timestamp: "2020-01-01T00:00:00.000Z",
    };
  }
  state.branches = { main: "Z", feature: "W" };
  return state;
}

describe("graph utilities", () => {
  it("checks reachability through both parents of merges", () => {
    const state = graph();
    expect(isAncestor(state, "R", "Z")).toBe(true);
    expect(isAncestor(state, "A", "Y")).toBe(true);
    expect(isAncestor(state, "X", "X")).toBe(true);
    expect(isAncestor(state, "X", "Y")).toBe(false);
    expect(isAncestor(state, "missing", "Z")).toBe(false);
  });

  it("uses the longest parent path for topological depth", () => {
    const state = graph();
    state.commits.T = {
      id: "T", parents: ["R", "Z"], message: "T", timestamp: "2020-01-01T00:00:00.000Z",
    };
    expect(topologicalDepth(state, "R")).toBe(0);
    expect(topologicalDepth(state, "X")).toBe(2);
    expect(topologicalDepth(state, "Z")).toBe(3);
    expect(topologicalDepth(state, "T")).toBe(4);
    expect(topologicalDepth(state, "missing")).toBeNull();
  });

  it("keeps both lowest ancestors in a criss-cross merge", () => {
    const state = graph();
    expect(lowestCommonAncestors(state, "X", "Y")).toEqual(["A", "B"]);
    expect(lowestCommonAncestors(state, "Z", "W")).toEqual(["X", "Y"]);
    expect(lowestCommonAncestors(state, "Z", "A")).toEqual(["A"]);
    expect(lowestCommonAncestors(state, "Z", "missing")).toEqual([]);
  });

  it("is deterministic and does not mutate RepoState", () => {
    const state = graph();
    const before = structuredClone(state);
    expect(lowestCommonAncestors(state, "Z", "W"))
      .toEqual(lowestCommonAncestors(state, "Z", "W"));
    topologicalDepth(state, "Z");
    isAncestor(state, "A", "W");
    expect(state).toEqual(before);
  });
});
