import type { RepoState } from "../core/types";

export type GraphScrollBehavior = "auto" | "instant";

export function resolveHeadCommit(state: RepoState): string | null {
  const id = state.head.detached
    ? state.head.commit
    : state.head.ref
      ? state.branches[state.head.ref] ?? null
      : null;
  return id !== null && id in state.commits ? id : null;
}

export function resolveRootCommit(state: RepoState): string | null {
  const roots = Object.values(state.commits)
    .filter((commit) => commit.parents.length === 0)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.id.localeCompare(b.id));
  return roots[0]?.id ?? null;
}

export function graphScrollBehavior(prefersReducedMotion: boolean): GraphScrollBehavior {
  return prefersReducedMotion ? "instant" : "auto";
}

export function findCommitNode(container: ParentNode, commitId: string): Element | null {
  for (const node of container.querySelectorAll("[data-commit-id]")) {
    if (node.getAttribute("data-commit-id") === commitId) return node;
  }
  return null;
}

export function scrollCommitIntoView(
  container: HTMLElement,
  commitId: string,
  prefersReducedMotion: boolean,
): boolean {
  const target = findCommitNode(container, commitId);
  if (!target) return false;
  target.scrollIntoView({
    behavior: graphScrollBehavior(prefersReducedMotion),
    block: "center",
    inline: "center",
  });
  return true;
}
