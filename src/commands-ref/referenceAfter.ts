import { execute } from "../core/engine";
import type { RepoState } from "../core/types";
import { parse } from "../terminal/parse";
import type { CommandReference } from "./data";

export function referenceAfter(entry: CommandReference): RepoState | null {
  const command = parse(entry.syntax);
  if (!("kind" in command)) return null;
  const result = execute(entry.before, command);
  return result.ok ? result.state : null;
}
