import { describe, expect, it } from "vitest";
import { ACTIONS, FIXTURES, generateSequences, generateValidSequences, generateRandomSequences, generateInvalidSequences } from "./generate";
import { runEngine } from "./adapter";

describe("fixed exhaustive command generation", () => {
  it("enumerates every suffix of length zero through two for each fixture", () => {
    const cases = generateSequences(2);
    expect(cases).toHaveLength(FIXTURES.length * (1 + ACTIONS.length + ACTIONS.length ** 2));
    expect(cases).toHaveLength(482);
    expect(cases).toEqual(generateSequences(2));
    expect(new Set(cases.map((item) => JSON.stringify(item.commands))).size).toBe(cases.length);
    expect(cases.every((item) => item.commands.length === item.setupLength + item.suffix.length)).toBe(true);
    expect(new Set(cases.flatMap((item) => item.suffix.map((command) => command.kind))))
      .toEqual(new Set(["commit", "branch", "switch", "checkout", "merge"]));
  });

  it("retains invalid actions and all merge outcomes", () => {
    const cases = generateSequences(2);
    expect(cases.some((item) => item.fixture === "empty" && item.suffix.some((command) =>
      command.kind === "branch" && command.name === "--list"))).toBe(true);
    expect(cases.some((item) => item.fixture === "empty" && item.suffix.some((command) =>
      command.kind === "merge" && command.branch === "missing"))).toBe(true);
    expect(cases.some((item) => item.fixture === "fork" && item.suffix.some((command) =>
      command.kind === "merge" && command.branch === "feature"))).toBe(true);
    expect(cases.some((item) => item.fixture === "fork" && item.suffix.some((command) =>
      command.kind === "merge" && command.branch === "main"))).toBe(true);
  });
});

describe("M4 case generation", () => {
  it("enumerates only successful transitions through depth three", () => {
    const cases = generateValidSequences(3);
    expect(cases.length).toBeGreaterThan(generateValidSequences(2).length);
    expect(cases.every(({ commands }) => runEngine(commands).steps.every(({ result }) => result.ok))).toBe(true);
    expect(cases.some(({ suffix }) => suffix.length === 3)).toBe(true);
  });

  it("replays the same seeded random cases and bounds length", () => {
    const first = generateRandomSequences(100, 42);
    expect(first).toEqual(generateRandomSequences(100, 42));
    expect(first).not.toEqual(generateRandomSequences(100, 43));
    expect(first.every(({ suffix, commands }) => suffix.length <= 20 &&
      runEngine(commands).steps.every(({ result }) => result.ok))).toBe(true);
  });

  it("keeps deliberate invalid transitions out of valid suites", () => {
    const cases = generateInvalidSequences();
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.every(({ commands }) => runEngine(commands).steps.at(-1)?.result.ok === false)).toBe(true);
  });
});
