import { describe, expect, it } from "vitest";
import { execute } from "../../core/engine";
import type { CommandKind } from "../../core/types";
import { parse } from "../../terminal/parse";
import { check } from "../check";
import { repoFromShape } from "../state";
import { levels } from ".";

const solutions: readonly (readonly (readonly string[])[])[] = [
  [["git commit -m first"], ["git commit"]],
  [["git branch feature"], ["git switch -c feature", "git switch main"]],
  [["git switch feature"], ["git checkout feature"]],
  [["git checkout first"], ["git switch --detach first"]],
];

describe("levels 01–04", () => {
  it("contains eight valid, ordered Level and RepoShape values", () => {
    expect(levels.map((level) => level.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(levels.map((level) => level.id)).size).toBe(8);
    const kinds = new Set<CommandKind>(["commit", "branch", "switch", "checkout", "merge"]);
    for (const level of levels) {
      expect(level.title.trim()).not.toBe("");
      expect(level.goal.trim()).not.toBe("");
      expect(level.allowed.length).toBeGreaterThan(0);
      expect(level.allowed.every((kind) => kinds.has(kind))).toBe(true);
      expect(check(repoFromShape(level.initial), level.initial)).toBe(true);
      expect(level.target).not.toBeNull();
      expect(check(repoFromShape(level.target!), level.target)).toBe(true);
    }
  });

  it.each([0, 1, 2, 3])("accepts two parser-and-engine solutions for level %i", (index) => {
    const level = levels[index]!;
    const paths = solutions[index]!;
    expect(paths).toHaveLength(2);
    expect(paths[0]).not.toEqual(paths[1]);
    for (const path of paths) {
      let state = repoFromShape(level.initial);
      for (const input of path) {
        const command = parse(input);
        expect("kind" in command, input).toBe(true);
        if (!("kind" in command)) throw new Error(`Cannot parse ${input}`);
        expect(level.allowed).toContain(command.kind);
        const result = execute(state, command);
        expect(result.ok, input).toBe(true);
        state = result.state;
      }
      expect(check(state, level.target)).toBe(true);
    }
  });

  it.each([0, 1, 2, 3])("rejects unsolved and structurally wrong states for level %i", (index) => {
    const level = levels[index]!;
    expect(check(repoFromShape(level.initial), level.target)).toBe(false);
    const target = repoFromShape(level.target!);
    const firstId = Object.keys(target.commits)[0]!;
    const wrong = { ...target, branches: { ...target.branches, extra: firstId } };
    expect(check(wrong, level.target)).toBe(false);
  });
});

describe("levels 05–08", () => {
  const paths = [
    ["git switch main"],
    ["git merge feature"],
    ["git merge feature"],
    ["git commit -m main-work", "git merge feature"],
  ];

  it.each([4, 5, 6, 7])("solves level %i through parser and engine", (index) => {
    const level = levels[index]!;
    let state = repoFromShape(level.initial);
    expect(check(state, level.target)).toBe(false);
    for (const input of paths[index - 4]!) {
      const parsed = parse(input);
      expect("kind" in parsed, input).toBe(true);
      if (!("kind" in parsed)) throw new Error(`Cannot parse ${input}`);
      expect(level.allowed).toContain(parsed.kind);
      const result = execute(state, parsed);
      expect(result.ok, input).toBe(true);
      state = result.state;
    }
    expect(check(state, level.target)).toBe(true);
    const wrong = { ...state, branches: { ...state.branches, extra: Object.keys(state.commits)[0]! } };
    expect(check(wrong, level.target)).toBe(false);
  });

  it("level 08 requires divergence before merge, without --no-ff", () => {
    const level = levels[7]!;
    const parsed = parse("git merge feature");
    if (!("kind" in parsed)) throw new Error("Cannot parse merge");
    const result = execute(repoFromShape(level.initial), parsed);
    expect(result.ok).toBe(true);
    expect(check(result.state, level.target)).toBe(false);
    expect(level.goal).not.toContain("git merge --no-ff");
  });
});
