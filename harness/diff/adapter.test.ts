import { describe, expect, it } from "vitest";
import { commandText, gitArgs, runEngine, type AbstractCommand } from "./adapter";

describe("differential adapters", () => {
  it("runs the typed command through the engine", () => {
    const commands: AbstractCommand[] = [{ kind: "commit", message: "C1" }, { kind: "branch", name: "feature" }];
    const run = runEngine(commands);
    expect(run.steps.every((step) => step.result.ok)).toBe(true);
    expect(run.state.branches.feature).toBe(run.state.branches.main);
  });

  it("builds argv for the same commands without shell syntax", () => {
    const command: AbstractCommand = { kind: "checkout", target: "c1", create: false };
    expect(gitArgs(command, () => "real-hash")).toEqual(["checkout", "real-hash"]);
    expect(commandText({ kind: "merge", branch: "feature" })).toContain("Merge branch");
  });

  it("preserves branch precedence and new branch names", () => {
    const resolve = () => "real-hash";
    const hasBranch = (name: string) => name === "c1";
    expect(gitArgs({ kind: "checkout", target: "c1", create: false }, resolve, hasBranch))
      .toEqual(["checkout", "c1"]);
    expect(gitArgs({ kind: "switch", target: "c1", create: false, detach: false }, resolve, hasBranch))
      .toEqual(["switch", "--", "c1"]);
    expect(gitArgs({ kind: "switch", target: "c1", create: true, detach: false }, resolve, hasBranch))
      .toEqual(["switch", "-c", "c1"]);
    expect(gitArgs({ kind: "checkout", target: "c1", create: true }, resolve, hasBranch))
      .toEqual(["checkout", "-b", "c1"]);
  });
});
