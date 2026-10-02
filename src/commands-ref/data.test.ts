import { describe, expect, it } from "vitest";
import type { RepoState } from "../core/types";
import { parse } from "../terminal/parse";
import { commandReferences } from "./data";
import { referenceAfter } from "./referenceAfter";

function expectValidState(state: RepoState): void {
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string): void {
    expect(visiting.has(id), `cycle at ${id}`).toBe(false);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const parent of state.commits[id]?.parents ?? []) visit(parent);
    visiting.delete(id);
    visited.add(id);
  }

  for (const [id, commit] of Object.entries(state.commits)) {
    expect(commit.id).toBe(id);
    expect(Number.isNaN(Date.parse(commit.timestamp))).toBe(false);
    expect(commit.parents.length).toBeLessThanOrEqual(2);
    for (const parent of commit.parents) {
      expect(state.commits[parent], `${id} has missing parent ${parent}`).toBeDefined();
    }
    visit(id);
  }
  for (const [branch, id] of Object.entries(state.branches)) {
    expect(state.commits[id], `${branch} points to missing commit ${id}`).toBeDefined();
  }

  if (state.head.detached) {
    expect(state.head.ref).toBeNull();
    expect(state.head.commit).not.toBeNull();
    if (state.head.commit !== null) expect(state.commits[state.head.commit]).toBeDefined();
  } else {
    expect(state.head.commit).toBeNull();
    expect(state.head.ref).not.toBeNull();
    if (state.head.ref !== null) expect(state.branches[state.head.ref]).toBeDefined();
  }
  expect(state.snapshot).toBeNull();
  expect(state.workingTree).toBeNull();
  expect(state.index).toBeNull();
  expect(state.conflicts).toBeNull();
}

describe("command reference data", () => {
  it("contains exactly the five Tier 1 commands with unique keys", () => {
    const keys = commandReferences.map((entry) => entry.key);
    expect(keys).toHaveLength(5);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual(["branch", "checkout", "commit", "merge", "switch"]);
  });

  it("provides nonempty English text and syntax accepted by the parser", () => {
    for (const entry of commandReferences) {
      for (const text of [entry.syntax, entry.description, entry.effect, entry.gotcha]) {
        expect(text.trim().length).toBeGreaterThan(0);
      }
      expect(parse(entry.syntax)).toMatchObject({ kind: entry.key });
    }
  });

  it("uses valid commits, parents, branches, and HEAD in every before/after state", () => {
    for (const entry of commandReferences) {
      expectValidState(entry.before);
      expectValidState(entry.after);
    }
  });

  it("is JSON serializable without losing data", () => {
    expect(JSON.parse(JSON.stringify(commandReferences))).toEqual(commandReferences);
  });

  it("stores the exact after-state produced by the real engine", () => {
    for (const entry of commandReferences) {
      const before = structuredClone(entry.before);
      expect(referenceAfter(entry), entry.key).toEqual(entry.after);
      expect(entry.before).toEqual(before);
    }
  });
});
