import type { RepoState } from "../../src/core/types";
import type { RawGitState } from "./runReal";

export interface NormalizedState {
  commits: Record<string, string[]>;
  branches: Record<string, string>;
  head: { detached: false; ref: string } | { detached: true; commit: string };
}

interface SourceCommit { id: string; message: string; parents: string[] }

function normalize(
  commits: SourceCommit[], branches: Record<string, string>,
  head: { detached: false; ref: string } | { detached: true; commit: string },
  creationOrder: string[],
): NormalizedState {
  const byId = new Map(commits.map((commit) => [commit.id, commit]));
  if (byId.size !== commits.length) throw new Error("Duplicate commit ID");
  const counts = new Map<string, number>();
  for (const commit of commits) {
    counts.set(commit.message, (counts.get(commit.message) ?? 0) + 1);
  }
  if (creationOrder.length !== commits.length || new Set(creationOrder).size !== commits.length) {
    throw new Error("Incomplete commit creation order");
  }
  const occurrences = new Map<string, number>();
  const messages = new Map<string, string>();
  for (const id of creationOrder) {
    const commit = byId.get(id);
    if (!commit) throw new Error(`Unresolved commit order: ${id}`);
    const occurrence = (occurrences.get(commit.message) ?? 0) + 1;
    occurrences.set(commit.message, occurrence);
    // A message remains the label when unique. Repeated merge messages gain
    // a creation-order ordinal; NUL cannot occur in a Git commit message.
    messages.set(id, counts.get(commit.message) === 1
      ? commit.message : `${commit.message}\0${occurrence}`);
  }
  const resolve = (id: string): string => {
    const message = messages.get(id);
    if (message === undefined) throw new Error(`Unresolved commit: ${id}`);
    return message;
  };
  const normalizedCommits: Record<string, string[]> = Object.create(null);
  for (const commit of [...commits].sort((a, b) => resolve(a.id).localeCompare(resolve(b.id)))) {
    normalizedCommits[resolve(commit.id)] = commit.parents.map(resolve);
  }
  const normalizedBranches: Record<string, string> = Object.create(null);
  for (const name of Object.keys(branches).sort()) normalizedBranches[name] = resolve(branches[name]!);
  if (!head.detached && commits.length > 0 && !Object.hasOwn(normalizedBranches, head.ref)) {
    throw new Error(`Unresolved HEAD branch: ${head.ref}`);
  }
  return {
    commits: normalizedCommits,
    branches: normalizedBranches,
    head: head.detached ? { detached: true, commit: resolve(head.commit) } : head,
  };
}

export function normalizeEngine(state: RepoState): NormalizedState {
  return normalize(Object.values(state.commits), state.branches,
    state.head.detached
      ? { detached: true, commit: state.head.commit ?? "" }
      : { detached: false, ref: state.head.ref ?? "" }, Object.keys(state.commits));
}

export function normalizeReal(state: RawGitState): NormalizedState {
  return normalize(state.commits.map((commit) => ({ id: commit.hash, message: commit.message, parents: commit.parents })),
    state.branches, state.head.detached
      ? { detached: true, commit: state.head.hash }
      : { detached: false, ref: state.head.ref }, state.creationOrder);
}
