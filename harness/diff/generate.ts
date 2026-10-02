import type { AbstractCommand } from "./adapter";
import { execute } from "../../src/core/engine";
import { emptyState, type RepoState } from "../../src/core/types";

/** Fixed action alphabet. Invalid transitions remain in the search space. */
export const ACTIONS = [
  "commit", "branch-feature", "branch-list", "branch-invalid",
  "switch-main", "switch-feature", "switch-create", "switch-missing",
  "checkout-main", "checkout-c1", "checkout-create", "checkout-missing",
  "merge-main", "merge-feature", "merge-missing",
] as const;

export interface Fixture { name: string; setup: AbstractCommand[] }
export const FIXTURES: readonly Fixture[] = [
  { name: "empty", setup: [] },
  { name: "fork", setup: [
    { kind: "commit", message: "C0" },
    { kind: "branch", name: "feature" },
    { kind: "switch", target: "feature", detach: false, create: false },
    { kind: "commit", message: "C1" },
    { kind: "checkout", target: "main", create: false },
  ] },
];

export interface DifferentialCase { fixture: string; setupLength: number; suffix: AbstractCommand[]; commands: AbstractCommand[] }

export function action(key: typeof ACTIONS[number], position: number): AbstractCommand {
  switch (key) {
    case "commit": return { kind: "commit", message: `C${position + 2}` };
    case "branch-feature": return { kind: "branch", name: "feature" };
    case "branch-list": return { kind: "branch" };
    case "branch-invalid": return { kind: "branch", name: "--list" };
    case "switch-main": return { kind: "switch", target: "main", create: false, detach: false };
    case "switch-feature": return { kind: "switch", target: "feature", create: false, detach: false };
    case "switch-create": return { kind: "switch", target: "topic", create: true, detach: false };
    case "switch-missing": return { kind: "switch", target: "--help", create: false, detach: false };
    case "checkout-main": return { kind: "checkout", target: "main", create: false };
    case "checkout-c1": return { kind: "checkout", target: "c1", create: false };
    case "checkout-create": return { kind: "checkout", target: "topic", create: true };
    case "checkout-missing": return { kind: "checkout", target: "--help", create: false };
    case "merge-main": return { kind: "merge", branch: "main" };
    case "merge-feature": return { kind: "merge", branch: "feature" };
    case "merge-missing": return { kind: "merge", branch: "missing" };
  }
}

function fixtureState(fixture: Fixture): RepoState {
  return fixture.setup.reduce((state, command) => execute(state, command).state, emptyState());
}

/** Every suffix transition succeeds in the engine; invalid commands have a separate gate. */
export function generateValidSequences(depth: number): DifferentialCase[] {
  if (!Number.isInteger(depth) || depth < 0) throw new RangeError("depth must be non-negative");
  const cases: DifferentialCase[] = [];
  for (const fixture of FIXTURES) {
    let frontier = [{ suffix: [] as AbstractCommand[], state: fixtureState(fixture) }];
    for (let level = 0; level <= depth; level++) {
      for (const entry of frontier) cases.push({ fixture: fixture.name, setupLength: fixture.setup.length,
        suffix: entry.suffix, commands: [...fixture.setup, ...entry.suffix] });
      if (level === depth) break;
      frontier = frontier.flatMap(({ suffix, state }) => ACTIONS.flatMap((key) => {
        const command = action(key, suffix.length);
        const result = execute(state, command);
        return result.ok ? [{ suffix: [...suffix, command], state: result.state }] : [];
      }));
    }
  }
  return cases;
}

export function generateRandomSequences(count: number, seed: number, maxDepth = 20): DifferentialCase[] {
  if (!Number.isInteger(count) || count < 0 || !Number.isInteger(seed) ||
      !Number.isInteger(maxDepth) || maxDepth < 1) throw new RangeError("Invalid random configuration");
  let value = seed >>> 0;
  const next = () => (value = (Math.imul(value, 1664525) + 1013904223) >>> 0);
  const pick = (size: number) => Math.floor(next() / 0x1_0000_0000 * size);
  const cases: DifferentialCase[] = [];
  const seen = new Set<string>();
  let attempts = 0;
  while (cases.length < count) {
    if (++attempts > count * 1000) throw new Error("Could not generate enough distinct random sequences");
    const fixture = FIXTURES[pick(FIXTURES.length)]!;
    const depth = 1 + pick(maxDepth);
    let state = fixtureState(fixture);
    const suffix: AbstractCommand[] = [];
    for (let step = 0; step < depth; step++) {
      const candidates = ACTIONS.map((key) => action(key, step))
        .map((command) => ({ command, result: execute(state, command) }))
        .filter(({ result }) => result.ok);
      if (candidates.length === 0) break;
      const chosen = candidates[pick(candidates.length)]!;
      suffix.push(chosen.command);
      state = chosen.result.state;
    }
    const commands = [...fixture.setup, ...suffix];
    const key = JSON.stringify(commands);
    if (seen.has(key)) continue;
    seen.add(key);
    cases.push({ fixture: fixture.name, setupLength: fixture.setup.length, suffix, commands });
  }
  return cases;
}

export function generateInvalidSequences(): DifferentialCase[] {
  const cases: DifferentialCase[] = [];
  for (const fixture of FIXTURES) {
    const state = fixtureState(fixture);
    for (const key of ACTIONS) {
      const command = action(key, 0);
      if (execute(state, command).ok) continue;
      cases.push({ fixture: fixture.name, setupLength: fixture.setup.length,
        suffix: [command], commands: [...fixture.setup, command] });
    }
  }
  return cases;
}

/** Exhaustive Cartesian products of the alphabet, including the empty suffix. */
export function generateSequences(depth: number): DifferentialCase[] {
  if (!Number.isInteger(depth) || depth < 0) throw new RangeError("depth must be non-negative");
  const cases: DifferentialCase[] = [];
  for (const fixture of FIXTURES) {
    let frontier: AbstractCommand[][] = [[]];
    for (let level = 0; level <= depth; level++) {
      for (const suffix of frontier) cases.push({ fixture: fixture.name, setupLength: fixture.setup.length,
        suffix, commands: [...fixture.setup, ...suffix] });
      frontier = frontier.flatMap((suffix) => ACTIONS.map((key) => [...suffix, action(key, suffix.length)]));
    }
  }
  return cases;
}
