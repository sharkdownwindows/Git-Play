import { fail, succeed } from "../errors";
import type { RepoState, Result } from "../types";

function validBranchName(name: string): boolean {
  if (
    name === "" ||
    name === "@" ||
    name.startsWith("-") ||
    name.includes("..") ||
    name.includes("@{")
  ) {
    return false;
  }
  if (/[\x00-\x20\x7f~^:?*\\\[]/.test(name)) return false;
  return name.split("/").every(
    (part) =>
      part !== "" &&
      !part.startsWith(".") &&
      !part.endsWith(".") &&
      !part.endsWith(".lock"),
  );
}

export function branch(state: RepoState, name?: string): Result {
  if (name === undefined) {
    return succeed(
      state,
      Object.keys(state.branches)
        .sort()
        .map(
          (branchName) =>
            `${!state.head.detached && state.head.ref === branchName ? "*" : " "} ${branchName}`,
        ),
    );
  }
  if (!validBranchName(name)) return fail(state, "InvalidRefName");
  if (Object.hasOwn(state.branches, name)) {
    return fail(state, "BranchAlreadyExists", name);
  }

  const current = state.head.detached
    ? state.head.commit
    : state.head.ref !== null && Object.hasOwn(state.branches, state.head.ref)
      ? state.branches[state.head.ref]!
      : null;
  if (current === null || !Object.hasOwn(state.commits, current)) {
    return fail(state, "NoCommitsYet");
  }

  return succeed({ ...state, branches: { ...state.branches, [name]: current } }, []);
}
