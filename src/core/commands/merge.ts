import { fail, succeed } from "../errors";
import { isAncestor, lowestCommonAncestors } from "../graph";
import type { DetectConflicts, RepoState, Result } from "../types";

/**
 * Seam 4 — ranh giới hàm conflict, có mặt từ v1 và LUÔN trả null.
 * v1 chưa có nội dung file nên không thể có conflict. Three-way merge thật
 * chỉ thay thân hàm này, không đụng tới Contract 1.
 */
export const detectConflicts: DetectConflicts = () => null;

export function merge(state: RepoState, branchName: string): Result {
  if (!Object.hasOwn(state.branches, branchName)) {
    return fail(state, "PathspecNotFound", branchName);
  }
  const target = state.branches[branchName]!;
  if (!Object.hasOwn(state.commits, target)) {
    return fail(state, "PathspecNotFound", branchName);
  }
  if (!state.head.detached && state.head.ref === branchName) {
    return succeed(state, ["Already up to date."]);
  }

  const currentRef = state.head.ref;
  const current = state.head.detached
    ? state.head.commit
    : currentRef !== null && Object.hasOwn(state.branches, currentRef)
      ? state.branches[currentRef]!
      : null;
  if (current === null || !Object.hasOwn(state.commits, current)) {
    return fail(state, "NoCommitsYet");
  }
  if (isAncestor(state, target, current)) return succeed(state, ["Already up to date."]);

  const moveHead = (id: string): Pick<RepoState, "head" | "branches"> =>
    state.head.detached
      ? { head: { detached: true, ref: null, commit: id }, branches: state.branches }
      : { head: state.head, branches: { ...state.branches, [currentRef!]: id } };

  if (isAncestor(state, current, target)) {
    return succeed({ ...state, ...moveHead(target) }, [`Updating ${current}..${target}`, "Fast-forward"]);
  }

  const base = lowestCommonAncestors(state, current, target)[0] ?? null;
  const conflicts = detectConflicts(state, current, target, base);
  if (conflicts !== null && conflicts.length > 0) return fail(state, "MergeConflict");

  let sequence = Object.keys(state.commits).length + 1;
  while (Object.hasOwn(state.commits, `c${sequence}`)) sequence++;
  const id = `c${sequence}`;
  const commit = {
    id,
    message: `Merge branch '${branchName}'`,
    parents: [current, target],
    timestamp: new Date(Date.UTC(2020, 0, 1) + sequence * 1000).toISOString(),
  };
  return succeed(
    { ...state, commits: { ...state.commits, [id]: commit }, ...moveHead(id) },
    [`Merge made by the 'ort' strategy.`, `[${id}] ${commit.message}`],
  );
}
