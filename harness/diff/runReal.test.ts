import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { runReal, gitVersion, isPinnedGit } from "./runReal";
import { runEngine } from "./adapter";
import { normalizeEngine, normalizeReal } from "./normalize";
import { gitErrorClass } from "./run";

describe("real Git runner", () => {
  it("runs all five commands and removes its repository", () => {
    const run = runReal([
      { kind: "commit", message: "C1" },
      { kind: "branch", name: "feature" },
      { kind: "switch", target: "feature", detach: false, create: false },
      { kind: "commit", message: "C2" },
      { kind: "checkout", target: "main", create: false },
      { kind: "merge", branch: "feature" },
    ]);
    expect(run.steps.every((step) => step.result.status === 0)).toBe(true);
    expect(run.state.branches.main).toBe(run.state.branches.feature);
    expect(run.gitVersion).toBe(gitVersion());
    expect(existsSync(run.tempDirectory)).toBe(false);
  });

  it("cleans up after a failed Git command", () => {
    const run = runReal([{ kind: "checkout", target: "missing", create: false }]);
    expect(run.steps[0]?.result.status).not.toBe(0);
    expect(existsSync(run.tempDirectory)).toBe(false);
  });

  it("cleans up when state reading throws", () => {
    let directory = "";
    expect(() => runReal([], (cwd) => { directory = cwd; throw new Error("injected read failure"); }))
      .toThrow("injected read failure");
    expect(directory).not.toBe("");
    expect(existsSync(directory)).toBe(false);
  });

  it("retains a detached commit after switching away", () => {
    const run = runReal([
      { kind: "commit", message: "C1" },
      { kind: "checkout", target: "c1", create: false },
      { kind: "commit", message: "orphan" },
      { kind: "switch", target: "main", create: false, detach: false },
    ]);
    expect(run.state.commits.map((commit) => commit.message).sort()).toEqual(["C1", "orphan"]);
    expect(existsSync(run.tempDirectory)).toBe(false);
  });

  it("recognizes the pinned CI Git version", () => {
    expect(isPinnedGit("git version 2.43.0")).toBe(true);
    expect(isPinnedGit("git version 2.44.0")).toBe(false);
  });

  it("prefers a branch named c1 over synthetic commit c1 for checkout and switch", () => {
    const commands = [
      { kind: "commit" as const, message: "C1" },
      { kind: "branch" as const, name: "c1" },
      { kind: "checkout" as const, target: "c1", create: false },
      { kind: "switch" as const, target: "main", create: false, detach: false },
      { kind: "switch" as const, target: "c1", create: false, detach: false },
    ];
    const real = runReal(commands);
    const engine = runEngine(commands);
    expect(real.steps[2]?.state.head).toEqual({ detached: false, ref: "c1" });
    expect(real.state.head).toEqual({ detached: false, ref: "c1" });
    expect(normalizeReal(real.state)).toEqual(normalizeEngine(engine.state));
  });

  it.each(["switch", "checkout"] as const)("creates c1 as a branch via %s", (kind) => {
    const commands = [{ kind: "commit" as const, message: "C1" },
      kind === "switch" ? { kind, target: "c1", create: true, detach: false }
        : { kind, target: "c1", create: true }];
    const real = runReal(commands);
    const engine = runEngine(commands);
    expect(real.steps[1]?.result.status).toBe(0);
    expect(real.state.head).toEqual({ detached: false, ref: "c1" });
    expect(normalizeReal(real.state)).toEqual(normalizeEngine(engine.state));
  });

  it("reads full multiline commit messages", () => {
    const commands = [{ kind: "commit" as const, message: "first line\nsecond line" }];
    const real = runReal(commands);
    expect(real.state.commits[0]?.message).toBe("first line\nsecond line");
    expect(normalizeReal(real.state)).toEqual(normalizeEngine(runEngine(commands).state));
  });

  it("does not interpret option-shaped targets as options", () => {
    const commands = [
      { kind: "commit" as const, message: "C1" },
      { kind: "branch" as const, name: "--list" },
      { kind: "switch" as const, target: "--help", create: false, detach: false },
      { kind: "checkout" as const, target: "--help", create: false },
    ];
    const real = runReal(commands);
    expect(real.steps.slice(1).every((step) => step.result.status !== 0)).toBe(true);
    expect(Object.keys(real.state.branches)).toEqual(["main"]);
    expect(real.state.head).toEqual({ detached: false, ref: "main" });
  });

  it.each(["switch", "checkout"] as const)("does not execute help for %s create target", (kind) => {
    const command = kind === "switch"
      ? { kind, target: "--help", create: true, detach: false }
      : { kind, target: "--help", create: true };
    const real = runReal([{ kind: "commit", message: "C1" }, command]);
    const engine = runEngine([{ kind: "commit", message: "C1" }, command]);
    expect(real.steps[1]?.result.status).not.toBe(0);
    expect(real.steps[1]?.result.output.toLowerCase()).not.toContain("usage:");
    expect(real.state.head).toEqual({ detached: false, ref: "main" });
    expect(gitErrorClass(command, real.steps[1]!.result)).toBe(engine.steps[1]?.result.errorClass);
  });
});
