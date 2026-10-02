import { describe, expect, it, vi } from "vitest";
import { emptyState, type RepoState } from "../core/types";
import {
  findCommitNode,
  graphScrollBehavior,
  resolveHeadCommit,
  resolveRootCommit,
  scrollCommitIntoView,
} from "./practiceGraphNavigation";

function graphState(): RepoState {
  const state = emptyState();
  state.commits = {
    c1: { id: "c1", parents: [], message: "root", timestamp: "2020-01-01T00:00:00Z" },
    c2: { id: "c2", parents: ["c1"], message: "next", timestamp: "2020-01-02T00:00:00Z" },
  };
  state.branches = { main: "c2" };
  return state;
}

describe("Practice graph navigation", () => {
  it("resolves the root without mutating RepoState", () => {
    const state = graphState();
    const before = structuredClone(state);
    expect(resolveRootCommit(state)).toBe("c1");
    expect(state).toEqual(before);
  });

  it("resolves attached and detached HEAD", () => {
    const attached = graphState();
    expect(resolveHeadCommit(attached)).toBe("c2");
    const detached = graphState();
    detached.head = { detached: true, ref: null, commit: "c1" };
    expect(resolveHeadCommit(detached)).toBe("c1");
  });

  it("finds a target without interpolating the commit id into a selector", () => {
    const unusualId = 'c1\"] .anything';
    const querySelectorAll = vi.fn(() => [
      { getAttribute: () => unusualId },
    ] as unknown as NodeListOf<Element>);
    const target = findCommitNode({ querySelectorAll } as unknown as ParentNode, unusualId);
    expect(target).not.toBeNull();
    expect(querySelectorAll).toHaveBeenCalledWith("[data-commit-id]");
  });

  it("scrolls the canvas to the requested node and uses instant reduced-motion behavior", () => {
    const scrollIntoView = vi.fn();
    const target = {
      getAttribute: () => "c2",
      scrollIntoView,
    };
    const container = {
      querySelectorAll: vi.fn(() => [target]),
    } as unknown as HTMLElement;
    expect(scrollCommitIntoView(container, "c2", true)).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "instant",
      block: "center",
      inline: "center",
    });
    expect(graphScrollBehavior(false)).toBe("auto");
  });
});
