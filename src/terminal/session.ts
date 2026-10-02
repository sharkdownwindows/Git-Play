import type { Command } from "../core/types";
import { helpForInput } from "./help";
import { parse } from "./parse";

export interface TerminalEntry {
  command: string;
  output: string[];
  isError: boolean;
}

export interface CommandResult {
  accepted: boolean;
  ok: boolean;
  output: readonly string[];
}

export interface TerminalSession {
  input: string;
  history: string[];
  cursor: number | null;
  draft: string;
  entries: TerminalEntry[];
  lastSubmissionErrored: boolean;
}

export function initialTerminalSession(): TerminalSession {
  return { input: "", history: [], cursor: null, draft: "", entries: [], lastSubmissionErrored: false };
}

export function editInput(session: TerminalSession, input: string): TerminalSession {
  return { ...session, input, lastSubmissionErrored: false };
}

export function previousCommand(session: TerminalSession): TerminalSession {
  if (session.history.length === 0) return session;
  const cursor = session.cursor === null
    ? session.history.length - 1
    : Math.max(0, session.cursor - 1);
  return {
    ...session,
    input: session.history[cursor]!,
    cursor,
    draft: session.cursor === null ? session.input : session.draft,
  };
}

export function nextCommand(session: TerminalSession): TerminalSession {
  if (session.cursor === null) return session;
  const cursor = session.cursor + 1;
  if (cursor === session.history.length) {
    return { ...session, input: session.draft, cursor: null };
  }
  return { ...session, input: session.history[cursor]!, cursor };
}

function completeSubmission(
  session: TerminalSession,
  command: string,
  output: readonly string[],
  isError: boolean,
): TerminalSession {
  return {
    input: "",
    history: [...session.history, command],
    cursor: null,
    draft: "",
    entries: [...session.entries, { command, output: [...output], isError }],
    lastSubmissionErrored: isError,
  };
}

export function submitInput(
  session: TerminalSession,
  onCommand: (command: Command) => CommandResult | boolean | void,
): TerminalSession {
  const command = session.input.trim();
  if (command === "") return session;

  const helpOutput = helpForInput(command);
  if (helpOutput !== null) {
    return completeSubmission(session, command, helpOutput, false);
  }

  const parsed = parse(command);
  const parseFailed = "ok" in parsed;
  const execution = parseFailed ? undefined : onCommand(parsed);
  if (execution === false || (typeof execution === "object" && !execution.accepted)) return session;
  const output = parseFailed
    ? parsed.output
    : typeof execution === "object"
      ? [...execution.output]
      : [];
  const isError = parseFailed || (typeof execution === "object" && !execution.ok);

  return completeSubmission(session, command, output, isError);
}
