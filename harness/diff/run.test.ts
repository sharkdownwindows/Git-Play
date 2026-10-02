import { describe, expect, it } from "vitest";
import { formatDivergenceLog, gitErrorClass, runDifferential } from "./run";
import { runEngine } from "./adapter";
import { runReal } from "./runReal";
import { normalizeEngine, normalizeReal } from "./normalize";
import { generateInvalidSequences, generateRandomSequences } from "./generate";

describe("differential runner", () => {
  it("keeps two valid merge commits with the same message distinct", () => {
    const commands = [
      { kind: "commit" as const, message: "root" },
      { kind: "branch" as const, name: "feature" },
      { kind: "commit" as const, message: "main" },
      { kind: "switch" as const, target: "feature", detach: false, create: false },
      { kind: "commit" as const, message: "feature" },
      { kind: "merge" as const, branch: "main" },
      { kind: "checkout" as const, target: "c1", create: false },
      { kind: "commit" as const, message: "detached" },
      { kind: "merge" as const, branch: "main" },
    ];
    const testCase = { fixture: "repeated-merge", setupLength: 0, suffix: commands, commands };
    const result = runDifferential(0, runEngine, runReal, [testCase]);
    expect(runEngine(commands).steps.every((step) => step.result.ok)).toBe(true);
    expect(result.summary).toMatchObject({ totalCases: 1, passed: 1, failed: 0 });
    expect(result.divergences.filter((item) => item.severity === "hard")).toEqual([]);
  });

  it("replays the first failing seed-42 random case without a hard divergence", () => {
    const testCase = generateRandomSequences(151, 42)[150]!;
    const result = runDifferential(0, runEngine, runReal, [testCase]);
    expect(result.summary).toMatchObject({ totalCases: 1, passed: 1, failed: 0 });
  }, 30_000);

  it("keeps repeated merges with identical parents as separate Git objects", () => {
    const commands = [
      { kind: "commit" as const, message: "root" },
      { kind: "branch" as const, name: "feature" },
      { kind: "switch" as const, target: "feature", detach: false, create: false },
      { kind: "commit" as const, message: "feature" },
      { kind: "checkout" as const, target: "c1", create: false },
      { kind: "commit" as const, message: "detached" },
      { kind: "merge" as const, branch: "feature" },
      { kind: "checkout" as const, target: "c3", create: false },
      { kind: "merge" as const, branch: "feature" },
    ];
    const real = runReal(commands);
    expect(real.steps[6]!.state.head).not.toEqual(real.steps[8]!.state.head);
    const testCase = { fixture: "repeat-same-parents", setupLength: 0, suffix: commands, commands };
    expect(runDifferential(0, runEngine, runReal, [testCase]).summary.failed).toBe(0);
  }, 30_000);

  it("classifies an unborn branch creation failure", () => {
    expect(gitErrorClass({ kind: "branch", name: "feature" },
      { status: 128, output: "fatal: Not a valid object name: 'main'." })).toBe("NoCommitsYet");
  });
  it("detects an injected state defect as a hard failure", () => {
    const result = runDifferential(0, (commands) => {
      const run = runEngine(commands);
      return { ...run, state: { ...run.state, branches: { ...run.state.branches, main: "missing" } } };
    });
    expect(result.summary.failed).toBe(1);
    expect(result.divergences.some((divergence) => divergence.severity === "hard")).toBe(true);
  });

  it("fails the invalid-command hard gate for an injected ErrorClass defect", () => {
    const testCase = generateInvalidSequences().find((item) => item.fixture === "empty" &&
      item.suffix[0]?.kind === "branch" && item.suffix[0].name === "feature")!;
    const result = runDifferential(0, (commands) => {
      const run = runEngine(commands);
      run.steps[0] = { ...run.steps[0]!, result: { ...run.steps[0]!.result, errorClass: "PathspecNotFound" } };
      return run;
    }, runReal, [testCase]);
    expect(result.summary.failed).toBe(1);
    expect(result.divergences.some((item) => item.kind === "errorClass" && item.severity === "hard")).toBe(true);
  });

  it("detects a corrupt intermediate step even if the final state is restored", () => {
    const result = runDifferential(0, (commands) => {
      const run = runEngine(commands);
      if (commands.length > 2) {
        const step = run.steps[2]!;
        run.steps[2] = { ...step, result: { ...step.result,
          state: { ...step.result.state, branches: { ...step.result.state.branches, main: "missing" } } } };
      }
      return run;
    });
    expect(result.summary.failed).toBe(1);
    expect(result.divergences.some((item) => item.kind === "state" && item.commands.length === 3)).toBe(true);
  });

  it.each([
    [{ kind: "branch" as const, name: "feature" }, "fatal: Not a valid object name: 'main'.", "NoCommitsYet"],
    [{ kind: "branch" as const, name: "--list" }, "fatal: '--list' is not a valid branch name", "InvalidRefName"],
    [{ kind: "branch" as const, name: "feature" }, "fatal: a branch named 'feature' already exists", "BranchAlreadyExists"],
    [{ kind: "switch" as const, target: "missing", create: false, detach: false }, "fatal: invalid reference: missing", "PathspecNotFound"],
    [{ kind: "checkout" as const, target: "missing", create: false }, "error: pathspec 'missing' did not match any file", "PathspecNotFound"],
    [{ kind: "merge" as const, branch: "missing" }, "merge: missing - not something we can merge", "PathspecNotFound"],
    [{ kind: "merge" as const, branch: "feature" }, "CONFLICT (content): Merge conflict", "MergeConflict"],
  ])("classifies known Git failure %#", (command, output, expected) => {
    expect(gitErrorClass(command, { status: 1, output })).toBe(expected);
  });

  it("leaves unsupported and unknown Git outcomes unclassified", () => {
    expect(gitErrorClass({ kind: "merge", branch: "main" }, { status: 0, output: "Already up to date." }))
      .toBeUndefined();
    expect(gitErrorClass({ kind: "switch", target: "x", create: false, detach: false },
      { status: 1, output: "unfamiliar future Git error" })).toBeUndefined();
  });

  it.each([
    [[{ kind: "commit" as const, message: "C0" }, { kind: "merge" as const, branch: "main" }], "self-merge"],
    [[{ kind: "commit" as const, message: "C0" }, { kind: "branch" as const, name: "feature" },
      { kind: "commit" as const, message: "C1" }, { kind: "merge" as const, branch: "feature" }], "ancestor merge"],
  ])("matches real Git for %s", (commands) => {
    const engine = runEngine(commands);
    const git = runReal(commands);
    const result = engine.steps.at(-1)?.result;
    expect(result?.ok).toBe(true);
    expect(result?.errorClass).toBeUndefined();
    expect(result?.state).toBe(engine.steps.at(-2)?.result.state);
    expect(git.steps.at(-1)?.result.status).toBe(0);
    expect(normalizeReal(git.state)).toEqual(normalizeReal(git.steps.at(-2)!.state));
    expect(normalizeEngine(engine.state)).toEqual(normalizeReal(git.state));
  });

  it("records run metadata, hard details and grouped soft warnings", () => {
    const result = runDifferential(0, runEngine);
    result.divergences = [
      { id: "hard-1", kind: "state", severity: "hard", commands: ["git commit -m root"], expected: "main=c1", actual: "main=c2" },
      { id: "soft-1", kind: "output", severity: "soft", commands: ["git branch feature"], expected: "Git A", actual: "Scope A" },
      { id: "soft-2", kind: "output", severity: "soft", commands: ["git branch topic"], expected: "Git B", actual: "Scope B" },
    ];
    result.summary.failed = 1;
    result.summary.warnings = 2;
    const log = formatDivergenceLog(result);
    expect(log).toContain(`Commit SHA: ${result.commitSha}`);
    expect(log).toContain(`Git version: ${result.gitVersion}`);
    expect(log).toContain("Seed: 0");
    expect(log).toContain("Exhaustive depth: 0");
    expect(log).toContain("Cases: 2");
    expect(log).toContain("Hard failures: 1");
    expect(log).toContain("Output warnings: 2");
    expect(log).toContain("Alphabet size: 15");
    expect(log).toContain("Fixtures: empty (setup 0), fork (setup 5)");
    expect(log).toContain("Minimal command sequence:");
    expect(log).toContain("Expected (Git):");
    expect(log).toContain("Actual (GitScope):");
    expect(log).toContain("Root-cause status: Pending investigation.");
    expect(log).toContain("Fixing commit: Pending.");
    expect(log).toContain("### branch (2 warnings)");
    expect(log.match(/### branch \(/g)).toHaveLength(1);
    expect(log).not.toContain("### soft-1");
    expect(log).not.toContain("### soft-2");
  });
});
