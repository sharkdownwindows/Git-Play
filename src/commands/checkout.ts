import { branch } from "./branch";
import { errorText, fail, succeed } from "../errors";
import type { RepoState, Result } from "../types";

export function checkout(state: RepoState, target: string, create: boolean): Result {
  if (create) {
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

  if (Object.hasOwn(state.branches, target)) {
    const id = state.branches[target]!;
    if (!Object.hasOwn(state.commits, id)) return fail(state, "PathspecNotFound", target);
    if (!state.head.detached && state.head.ref === target) {
      return succeed(state, [errorText("AlreadyOnBranch", target)]);
    }
    return succeed({ ...state, head: { detached: false, ref: target, commit: null } },
      [`Switched to branch '${target}'`]);
  }
  if (!Object.hasOwn(state.commits, target)) return fail(state, "PathspecNotFound", target);
  return succeed(
    { ...state, head: { detached: true, ref: null, commit: target } },
    [`Note: switching to '${target}'.`, "You are in 'detached HEAD' state."],
  );
}
