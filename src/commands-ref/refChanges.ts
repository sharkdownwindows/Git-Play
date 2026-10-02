import type { RepoState } from "../core/types";

export interface ReferenceChanges {
  labels: string[];
  changedNodes: ReadonlySet<string>;
  changedEdges: ReadonlySet<string>;
}

function edgeKey(from: string, to: string): string {
  return `${from}>${to}`;
}

function headPosition(state: RepoState): string {
  return state.head.detached
    ? `detached:${state.head.commit ?? "?"}`
    : `attached:${state.head.ref ?? "?"}`;
}

export function refChanges(before: RepoState, after: RepoState): ReferenceChanges {
  const labels: string[] = [];
  const changedNodes = new Set<string>();
  const beforeEdges = new Set<string>();
  const changedEdges = new Set<string>();

  for (const commit of Object.values(before.commits)) {
    for (const parent of commit.parents) beforeEdges.add(edgeKey(commit.id, parent));
  }

  for (const id of Object.keys(after.commits).sort()) {
    if (!(id in before.commits)) {
      labels.push(`+ commit ${id}`);
      changedNodes.add(id);
    }
    for (const parent of after.commits[id]!.parents) {
      const key = edgeKey(id, parent);
      if (!beforeEdges.has(key)) changedEdges.add(key);
    }
  }

  for (const branch of Object.keys(after.branches).sort()) {
    if (!(branch in before.branches)) {
      labels.push(`+ branch ${branch}`);
    } else if (before.branches[branch] !== after.branches[branch]) {
      labels.push(`${branch} → ${after.branches[branch]}`);
    }
  }

  if (headPosition(before) !== headPosition(after)) {
    labels.push(after.head.detached
      ? `HEAD detached @ ${after.head.commit ?? "?"}`
      : `HEAD → ${after.head.ref ?? "?"}`);
  }

  return { labels, changedNodes, changedEdges };
}
