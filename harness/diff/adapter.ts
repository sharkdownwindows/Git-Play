import { execute } from "../../src/core/engine";
import { emptyState, type Command, type RepoState, type Result } from "../../src/core/types";

/** The same command value is sent to both targets. Commit targets are resolved by the CLI adapter. */
export type AbstractCommand = Command;

export interface EngineStep {
  command: AbstractCommand;
  result: Result;
}

export function runEngine(commands: readonly AbstractCommand[]): { state: RepoState; steps: EngineStep[] } {
  let state = emptyState();
  const steps: EngineStep[] = [];
  for (const command of commands) {
    const result = execute(state, command);
    steps.push({ command, result });
    state = result.state;
  }
  return { state, steps };
}

/** Convert a typed command to argv; no shell interpolation is involved. */
export function gitArgs(
  command: AbstractCommand,
  resolveCommit: (id: string) => string,
  hasBranch: (name: string) => boolean = () => false,
): string[] {
  const target = (name: string): string => hasBranch(name) ? name : resolveCommit(name);
  switch (command.kind) {
    case "commit": return ["commit", "--allow-empty", "-m", command.message ?? ""];
    case "branch": return command.name === undefined ? ["branch"] : ["branch", "--", command.name];
    case "switch": return command.create
      ? ["switch", "-c", command.target]
      : ["switch", ...(command.detach ? ["--detach"] : []), "--", target(command.target)];
    case "checkout": return command.create
      ? ["checkout", "-b", command.target]
      : ["checkout", command.target.startsWith("-")
        ? `refs/heads/${command.target}` : target(command.target)];
    case "merge": return ["merge", "-m", `Merge branch '${command.branch}'`, "--", command.branch];
  }
}

export function commandText(command: AbstractCommand): string {
  return `git ${gitArgs(command, (target) => target).map((part) =>
    /\s/.test(part) ? JSON.stringify(part) : part).join(" ")}`;
}
