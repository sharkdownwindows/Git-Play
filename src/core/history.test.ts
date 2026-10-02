import { describe, expect, it } from "vitest";
import { execute } from "./engine";
import { initialHistory, recordResult, redo, undo } from "./history";
import type { Command } from "./types";

const commands: Command[] = [
  { kind: "commit", message: "root" },
  { kind: "branch", name: "feature" },
  { kind: "commit", message: "main second" },
  { kind: "switch", target: "feature", detach: false, create: false },
  { kind: "commit", message: "feature second" },
];

describe("history", () => {
  it("undoes five successful commands and redoes the exact RepoStates", () => {
    const initial = initialHistory();
    let history = initial;
    const states = [initial.repo];
    for (const command of commands) {
      const result = execute(history.repo, command);
      expect(result.ok).toBe(true);
      history = recordResult(history, result);
      states.push(history.repo);
    }
    expect(history.past).toHaveLength(5);
    for (let i = 4; i >= 0; i--) {
      history = undo(history);
      expect(history.repo).toEqual(states[i]);
    }
    expect(history.repo).toEqual(initial.repo);
    expect(history.future).toHaveLength(5);
    for (let i = 1; i <= 5; i++) {
      history = redo(history);
      expect(history.repo).toEqual(states[i]);
    }
    expect(history.future).toEqual([]);
    expect(initial.past).toEqual([]);
  });

  it("does not snapshot a failed command", () => {
    const initial = initialHistory();
    const failed = execute(initial.repo, { kind: "branch", name: "feature" });
    expect(failed.ok).toBe(false);
    expect(recordResult(initial, failed)).toBe(initial);
  });

  it("clears redo after a new successful command following undo", () => {
    let history = initialHistory();
    for (const command of commands.slice(0, 3)) {
      history = recordResult(history, execute(history.repo, command));
    }
    history = undo(history);
    expect(history.future).toHaveLength(1);
    const before = structuredClone(history);
    history = recordResult(history, execute(history.repo, { kind: "branch", name: "topic" }));
    expect(history.future).toEqual([]);
    expect(redo(history)).toBe(history);
    expect(before.future).toHaveLength(1);
  });

  it("returns the same history when undo or redo has no snapshot", () => {
    const initial = initialHistory();
    expect(undo(initial)).toBe(initial);
    expect(redo(initial)).toBe(initial);
  });
});
