import type { ErrorClass, Result, RepoState } from "./types";

/** Chuỗi lỗi khớp NGUYÊN VĂN Git thật — harness so chúng như dữ liệu. */
export const ERROR_TEXT: Record<ErrorClass, string> = {
  NotGitCommand: "{0}: command not found",
  UnknownSubcommand: "git: '{0}' is not a git command. See 'git --help'.",
  MissingArgument: "fatal: you must specify a target",
  InvalidRefName: "fatal: invalid reference name",
  BranchAlreadyExists: "fatal: a branch named '{0}' already exists",
  PathspecNotFound:
    "error: pathspec '{0}' did not match any file(s) known to git",
  NothingToCommit: "nothing to commit, working tree clean",
  NoCommitsYet: "fatal: your current branch does not have any commits yet",
  AlreadyOnBranch: "Already on '{0}'",
  CannotMergeIntoSelf: "fatal: cannot merge a branch into itself",
  AlreadyUpToDate: "Already up to date.",
  MergeConflict: "Automatic merge failed; fix conflicts and then commit.",
  BranchNotFullyMerged: "error: the branch '{0}' is not fully merged",
  UnknownCommand: "fatal: unknown command",
};

export function errorText(cls: ErrorClass, ...args: string[]): string {
  return ERROR_TEXT[cls].replace(/\{(\d)\}/g, (_m, i) => args[Number(i)] ?? "");
}

/** Dựng Result lỗi. State trả về NGUYÊN VẸN — engine không bao giờ sửa khi lỗi. */
export function fail(
  state: RepoState,
  cls: ErrorClass,
  ...args: string[]
): Result {
  return { state, output: [errorText(cls, ...args)], ok: false, errorClass: cls };
}

export function succeed(state: RepoState, output: string[]): Result {
  return { state, output, ok: true };
}
