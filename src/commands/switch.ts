import { branch } from "./branch";
import { errorText, fail, succeed } from "../errors";
import type { RepoState, Result } from "../types";

export function switchTo(
  state: RepoState,
  target: string,
  detach: boolean,
  create: boolean,
): Result {
  if (create) {
    if (detach) return fail(state, "UnknownCommand");
    const created = branch(state, target);
    if (!created.ok) {
      if (created.errorClass !== "NoCommitsYet" || Object.keys(state.commits).length !== 0 ||
          Object.keys(state.branches).length !== 0 || state.head.detached || state.head.ref === null) {
        return created;
      }
      return succeed({ ...state, head: { detached: false, ref: target, commit: null } },
        [`Switched to a new branch '${target}'`]);
    }
    return succeed(
      { ...created.state, head: { detached: false, ref: target, commit: null } },
      [`Switched to a new branch '${target}'`],
    );
  }

  const branchCommit = Object.hasOwn(state.branches, target) ? state.branches[target] : undefined;
  if (branchCommit !== undefined && !Object.hasOwn(state.commits, branchCommit)) {
    return fail(state, "PathspecNotFound", target);
  }
  if (detach) {
    const id = branchCommit ?? (Object.hasOwn(state.commits, target) ? target : null);
    if (id === null) return fail(state, "PathspecNotFound", target);
    return succeed({ ...state, head: { detached: true, ref: null, commit: id } },
      [`HEAD is now at ${id}`]);
  }
  if (branchCommit !== undefined) {
    if (!state.head.detached && state.head.ref === target) {
      return succeed(state, [errorText("AlreadyOnBranch", target)]);
    }
    return succeed({ ...state, head: { detached: false, ref: target, commit: null } },
      [`Switched to branch '${target}'`]);
  }
  if (Object.hasOwn(state.commits, target)) {
    return {
      ...fail(state, "PathspecNotFound", target),
      output: [`fatal: a branch is expected, got commit '${target}'`],
    };
  }
  return fail(state, "PathspecNotFound", target);
}
