import { errorText } from "../core/errors";
import type { Command, ErrorClass, ParseError } from "../core/types";

export type ParseResult = Command | ParseError;

function parseError(errorClass: ErrorClass, ...args: string[]): ParseError {
  return {
    ok: false,
    output: [errorText(errorClass, ...args)],
    errorClass,
  };
}

/** Tokenize the supported Git subset while preserving quoted arguments. */
function tokenize(input: string): string[] | null {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let tokenStarted = false;

  for (const character of input) {
    if (quote !== null) {
      if (character === quote) {
        quote = null;
      } else {
        current += character;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      tokenStarted = true;
    } else if (/\s/.test(character)) {
      if (tokenStarted) {
        tokens.push(current);
        current = "";
        tokenStarted = false;
      }
    } else {
      current += character;
      tokenStarted = true;
    }
  }

  if (quote !== null) return null;
  if (tokenStarted) tokens.push(current);
  return tokens;
}

/** Parse syntax only. Repository-state validation belongs to the engine. */
export function parse(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed.length === 0) return parseError("NotGitCommand", "");

  const tokens = tokenize(trimmed);
  if (tokens === null) return parseError("UnknownCommand");

  const executable = tokens[0];
  if (executable !== "git") {
    return parseError("NotGitCommand", executable ?? trimmed);
  }

  const subcommand = tokens[1];
  if (subcommand === undefined) return parseError("UnknownSubcommand", "");

  const args = tokens.slice(2);
  switch (subcommand) {
    case "commit":
      return parseCommit(args);
    case "branch":
      return parseBranch(args);
    case "switch":
      return parseSwitch(args);
    case "checkout":
      return parseCheckout(args);
    case "merge":
      return parseMerge(args);
    default:
      return parseError("UnknownSubcommand", subcommand);
  }
}

function parseCommit(args: string[]): ParseResult {
  if (args.length === 0) return { kind: "commit" };
  if (args[0] !== "-m" || args.length > 2) {
    return parseError("UnknownCommand");
  }
  if (args.length === 1) return parseError("MissingArgument");
  return { kind: "commit", message: args[1] };
}

function parseBranch(args: string[]): ParseResult {
  if (args.length === 0) return { kind: "branch" };
  if (args.length === 1) return { kind: "branch", name: args[0] };
  return parseError("UnknownCommand");
}

function parseSwitch(args: string[]): ParseResult {
  if (args.length === 0) return parseError("MissingArgument");

  if (args[0] === "-c") {
    if (args.length === 1) return parseError("MissingArgument");
    if (args.length !== 2) return parseError("UnknownCommand");
    return {
      kind: "switch",
      target: args[1]!,
      detach: false,
      create: true,
    };
  }

  if (args[0] === "--detach") {
    if (args.length === 1) return parseError("MissingArgument");
    if (args.length !== 2) return parseError("UnknownCommand");
    return {
      kind: "switch",
      target: args[1]!,
      detach: true,
      create: false,
    };
  }

  if (args.length !== 1) return parseError("UnknownCommand");
  return {
    kind: "switch",
    target: args[0]!,
    detach: false,
    create: false,
  };
}

function parseCheckout(args: string[]): ParseResult {
  if (args.length === 0) return parseError("MissingArgument");

  if (args[0] === "-b") {
    if (args.length === 1) return parseError("MissingArgument");
    if (args.length !== 2) return parseError("UnknownCommand");
    return { kind: "checkout", target: args[1]!, create: true };
  }

  if (args.length !== 1) return parseError("UnknownCommand");
  return { kind: "checkout", target: args[0]!, create: false };
}

function parseMerge(args: string[]): ParseResult {
  if (args.length === 0) return parseError("MissingArgument");
  if (args.length !== 1) return parseError("UnknownCommand");
  return { kind: "merge", branch: args[0]! };
}
