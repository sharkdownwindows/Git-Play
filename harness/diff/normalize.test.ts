import { describe, expect, it } from "vitest";
import { emptyState } from "../../src/core/types";
import { normalizeEngine, normalizeReal } from "./normalize";

describe("DAG normalization", () => {
  it("ignores hashes and timestamps while preserving parent order, refs, and HEAD", () => {
    const engine = emptyState();
    engine.commits = {
      c1: { id: "c1", message: "C1", parents: [], timestamp: "2020-01-01" },
      c2: { id: "c2", message: "C2", parents: ["c1"], timestamp: "2020-01-02" },
      c3: { id: "c3", message: "merge", parents: ["c2", "c1"], timestamp: "2020-01-03" },
    };
    engine.branches = { main: "c3", feature: "c1" };
    const real = {
      commits: [
        { hash: "ccc", message: "merge", parents: ["bbb", "aaa"] },
        { hash: "aaa", message: "C1", parents: [] },
        { hash: "bbb", message: "C2", parents: ["aaa"] },
      ],
      branches: { feature: "aaa", main: "ccc" },
      head: { detached: false as const, ref: "main" },
      creationOrder: ["aaa", "bbb", "ccc"],
    };
    expect(normalizeReal(real)).toEqual(normalizeEngine(engine));
    expect(normalizeReal({ ...real, commits: [{ ...real.commits[0]!, parents: ["aaa", "bbb"] }, ...real.commits.slice(1)] }))
      .not.toEqual(normalizeEngine(engine));
  });

  it("distinguishes repeated messages and rejects unresolved references", () => {
    const state = emptyState();
    state.commits.c1 = { id: "c1", message: "same", parents: [], timestamp: "" };
    state.commits.c2 = { id: "c2", message: "same", parents: ["c1"], timestamp: "" };
    state.branches.main = "c2";
    expect(Object.keys(normalizeEngine(state).commits)).toEqual(["same\0" + "1", "same\0" + "2"]);
    state.commits.c2.message = "other";
    state.branches.main = "missing";
    expect(() => normalizeEngine(state)).toThrow("Unresolved commit");
    state.branches.main = "c1";
    state.head.ref = "absent";
    expect(() => normalizeEngine(state)).toThrow("Unresolved HEAD branch");
  });

  it.each(["__proto__", "constructor", "toString"])("serializes special message %s", (message) => {
    const state = emptyState();
    state.commits.c1 = { id: "c1", message, parents: [], timestamp: "" };
    state.branches.main = "c1";
    const normalized = normalizeEngine(state);
    expect(Object.hasOwn(normalized.commits, message)).toBe(true);
    expect(JSON.parse(JSON.stringify(normalized)).commits[message]).toEqual([]);
  });

  it.each(["__proto__", "constructor", "toString"])("serializes special ref %s", (ref) => {
    const state = emptyState();
    state.commits.c1 = { id: "c1", message: "C1", parents: [], timestamp: "" };
    state.branches = { [ref]: "c1" };
    state.head.ref = ref;
    const normalized = normalizeEngine(state);
    expect(Object.hasOwn(normalized.branches, ref)).toBe(true);
    expect(JSON.parse(JSON.stringify(normalized)).branches[ref]).toBe("C1");
  });
});
