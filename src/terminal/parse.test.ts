import { describe, expect, it } from "vitest";
import type { ErrorClass } from "../core/types";
import { parse } from "./parse";

describe("parse", () => {
  it.each([
    ["git commit", { kind: "commit" }],
    ['git commit -m "hello world"', { kind: "commit", message: "hello world" }],
    ["git branch", { kind: "branch" }],
    ["git branch feature", { kind: "branch", name: "feature" }],
    [
      "git switch main",
      { kind: "switch", target: "main", detach: false, create: false },
    ],
    [
      "git switch -c feature",
      { kind: "switch", target: "feature", detach: false, create: true },
    ],
    [
      "git switch --detach C2",
      { kind: "switch", target: "C2", detach: true, create: false },
    ],
    ["git checkout C2", { kind: "checkout", target: "C2", create: false }],
    [
      "git checkout -b feature",
      { kind: "checkout", target: "feature", create: true },
    ],
    ["git merge feature", { kind: "merge", branch: "feature" }],
  ])("parses %s", (input, expected) => {
    expect(parse(input)).toEqual(expected);
  });

  it("trims surrounding whitespace", () => {
    expect(parse("  git branch feature  ")).toEqual({
      kind: "branch",
      name: "feature",
    });
  });

  it.each(["git --help", "git help"])(
    "keeps terminal built-in %s outside the five-command parser contract",
    (input) => {
      expect(parse(input)).toMatchObject({
        ok: false,
        errorClass: "UnknownSubcommand",
      });
    },
  );

  it.each<[string, ErrorClass]>([
    ["", "NotGitCommand"],
    ["ls -la", "NotGitCommand"],
    ["git", "UnknownSubcommand"],
    ["git rebase main", "UnknownSubcommand"],
    ["git commit -m", "MissingArgument"],
    ["git commit --amend", "UnknownCommand"],
    ["git branch one two", "UnknownCommand"],
    ["git switch", "MissingArgument"],
    ["git switch -c", "MissingArgument"],
    ["git switch main extra", "UnknownCommand"],
    ["git checkout -b", "MissingArgument"],
    ["git merge", "MissingArgument"],
    ["git merge one two", "UnknownCommand"],
    ['git commit -m "unterminated', "UnknownCommand"],
  ])("rejects invalid syntax: %s", (input, errorClass) => {
    expect(parse(input)).toMatchObject({
      ok: false,
      errorClass,
      output: [expect.any(String)],
    });
  });
});
