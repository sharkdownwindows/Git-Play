import { describe, expect, it } from "vitest";
import { layout } from "../../src/viz/layout";
import { generateSyntheticDag } from "./synth";

describe("generateSyntheticDag", () => {
  it.each([0, 1, 2, 3, 100, 1_000, 10_000])("generates exactly %i commits", (n) => {
    const state = generateSyntheticDag(n, 7);
    expect(Object.keys(state.commits)).toHaveLength(n);
    expect(new Set(Object.keys(state.commits)).size).toBe(n);
    expect(state.branches).toEqual(n === 0 ? {} : { main: `c${n - 1}` });
  });

  it("is deeply reproducible for the same seed", () => {
    expect(generateSyntheticDag(1_000, 42)).toEqual(generateSyntheticDag(1_000, 42));
  });

  it("normally changes topology for a different seed", () => {
    expect(generateSyntheticDag(1_000, 42)).not.toEqual(generateSyntheticDag(1_000, 43));
  });

  it("references only existing, earlier parents and has no cycles", () => {
    const commits = generateSyntheticDag(1_000, 42).commits;
    const ids = Object.keys(commits);
    const creationOrder = new Map(ids.map((id, index) => [id, index]));
    const children = new Map(ids.map((id) => [id, [] as string[]]));
    const indegree = new Map(ids.map((id) => [id, 0]));

    for (const [id, commit] of Object.entries(commits)) {
      expect(commit.parents.length).toBeLessThanOrEqual(2);
      for (const parent of commit.parents) {
        expect(creationOrder.has(parent)).toBe(true);
        expect(creationOrder.get(parent)!).toBeLessThan(creationOrder.get(id)!);
        children.get(parent)!.push(id);
        indegree.set(id, indegree.get(id)! + 1);
      }
    }

    const ready = ids.filter((id) => indegree.get(id) === 0);
    let visited = 0;
    for (let i = 0; i < ready.length; i++) {
      const id = ready[i]!;
      visited++;
      for (const child of children.get(id)!) {
        const remaining = indegree.get(child)! - 1;
        indegree.set(child, remaining);
        if (remaining === 0) ready.push(child);
      }
    }
    expect(visited).toBe(ids.length);
  });

  it("contains forks and two-parent merges", () => {
    const commits = generateSyntheticDag(1_000, 42).commits;
    const childCounts = new Map<string, number>();
    for (const commit of Object.values(commits)) {
      for (const parent of commit.parents) {
        childCounts.set(parent, (childCounts.get(parent) ?? 0) + 1);
      }
    }
    expect(Object.values(commits).filter((commit) => commit.parents.length === 0)).toHaveLength(1);
    expect([...childCounts.values()].filter((count) => count >= 2).length).toBeGreaterThan(0);
    expect(Object.values(commits).filter((commit) => commit.parents.length === 2).length).toBeGreaterThan(0);
  });

  it("can be passed directly to layout without later mutation", () => {
    const state = generateSyntheticDag(100, 42);
    const before = structuredClone(state);
    const result = layout(state);
    generateSyntheticDag(100, 43);
    expect(result.nodes).toHaveLength(100);
    expect(result.edges).toHaveLength(124);
    expect(state).toEqual(before);
  });

  it("generates 100,000 commits within 10 seconds", () => {
    const start = performance.now();
    const state = generateSyntheticDag(100_000, 42);
    const elapsedMs = performance.now() - start;
    expect(Object.keys(state.commits)).toHaveLength(100_000);
    expect(elapsedMs).toBeLessThan(10_000);
  }, 12_000);
});
