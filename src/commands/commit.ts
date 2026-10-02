import { fail, succeed } from "../errors";
import type { RepoState, Result } from "../types";

export function commit(state: RepoState, message?: string): Result {
  const ref = state.head.ref;
  if (!state.head.detached && ref === null) return fail(state, "NoCommitsYet");

  const parent = state.head.detached
    ? state.head.commit
    : ref !== null && Object.hasOwn(state.branches, ref)
      ? state.branches[ref]!
      : null;
  if (
    (parent === null && (state.head.detached || Object.keys(state.commits).length !== 0)) ||
    (parent !== null && !Object.hasOwn(state.commits, parent))
  ) {
    return fail(state, "NoCommitsYet");
  }

  let sequence = Object.keys(state.commits).length + 1;
  while (Object.hasOwn(state.commits, `c${sequence}`)) sequence++;
  const id = `c${sequence}`;
  const commit = {
    id,
    message: message ?? "",
    parents: parent === null ? [] : [parent],
    timestamp: new Date(Date.UTC(2020, 0, 1) + sequence * 1000).toISOString(),
  };
  const next: RepoState = {
    ...state,
    commits: { ...state.commits, [id]: commit },
    branches:
      state.head.detached || ref === null
        ? state.branches
        : { ...state.branches, [ref]: id },
    head: state.head.detached
      ? { detached: true, ref: null, commit: id }
      : state.head,
  };
  const label = state.head.detached ? "detached HEAD" : ref;
  const root = parent === null ? " (root-commit)" : "";
  return succeed(next, [`[${label}${root} ${id}] ${commit.message}`]);
}
