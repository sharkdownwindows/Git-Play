import type { Head, RepoState } from "../core/types";
import type { RepoShape } from "./schema";

interface Graph {
  parents: Record<string, string[]>;
  branches: Record<string, string>;
  head: Head;
}

function branchNamesByCommit(graph: Graph): Map<string, string[]> {
  const names = new Map<string, string[]>();
  for (const [branch, commit] of Object.entries(graph.branches)) {
    const current = names.get(commit) ?? [];
    current.push(branch);
    current.sort();
    names.set(commit, current);
  }
  return names;
}

function childCounts(graph: Graph): Map<string, number> | null {
  const counts = new Map(Object.keys(graph.parents).map((id) => [id, 0]));
  const remainingParents = new Map<string, number>();
  const children = new Map<string, string[]>();
  for (const [id, parents] of Object.entries(graph.parents)) {
    remainingParents.set(id, parents.length);
    for (const parent of parents) {
      const count = counts.get(parent);
      if (count === undefined) return null;
      counts.set(parent, count + 1);
      const siblings = children.get(parent) ?? [];
      siblings.push(id);
      children.set(parent, siblings);
    }
  }

  const ready = [...remainingParents]
    .filter(([, count]) => count === 0)
    .map(([id]) => id);
  let visited = 0;
  for (let index = 0; index < ready.length; index++) {
    visited++;
    for (const child of children.get(ready[index]!) ?? []) {
      const count = remainingParents.get(child)! - 1;
      remainingParents.set(child, count);
      if (count === 0) ready.push(child);
    }
  }
  if (visited !== counts.size) return null;
  return counts;
}

function sameHeadMode(actual: Head, target: Head): boolean {
  if (actual.detached !== target.detached) return false;
  if (actual.detached) {
    return (
      actual.ref === null &&
      target.ref === null &&
      actual.commit !== null &&
      target.commit !== null
    );
  }
  return (
    actual.ref === target.ref && actual.commit === null && target.commit === null
  );
}

function hasValidReferences(graph: Graph): boolean {
  const ids = new Set(Object.keys(graph.parents));
  if (Object.values(graph.branches).some((commit) => !ids.has(commit))) {
    return false;
  }
  if (graph.head.detached) {
    return graph.head.commit !== null && ids.has(graph.head.commit);
  }
  if (graph.head.ref === null || graph.head.commit !== null) return false;
  return ids.size === 0 || Object.hasOwn(graph.branches, graph.head.ref);
}

function graphsAreIsomorphic(actual: Graph, target: Graph): boolean {
  const actualIds = Object.keys(actual.parents);
  const targetIds = Object.keys(target.parents);
  if (actualIds.length !== targetIds.length) return false;
  if (!hasValidReferences(actual) || !hasValidReferences(target)) return false;
  if (!sameHeadMode(actual.head, target.head)) return false;

  const actualBranches = Object.keys(actual.branches).sort();
  const targetBranches = Object.keys(target.branches).sort();
  if (
    actualBranches.length !== targetBranches.length ||
    actualBranches.some((name, index) => name !== targetBranches[index])
  ) {
    return false;
  }

  const actualChildren = childCounts(actual);
  const targetChildren = childCounts(target);
  if (actualChildren === null || targetChildren === null) return false;

  const actualBranchNames = branchNamesByCommit(actual);
  const targetBranchNames = branchNamesByCommit(target);
  const mapping = new Map<string, string>();
  const reverse = new Map<string, string>();

  const sameStaticShape = (actualId: string, targetId: string): boolean => {
    const actualParents = actual.parents[actualId];
    const targetParents = target.parents[targetId];
    if (actualParents === undefined || targetParents === undefined) return false;
    if (actualParents.length !== targetParents.length) return false;
    if (actualChildren.get(actualId) !== targetChildren.get(targetId)) return false;

    const actualRefs = actualBranchNames.get(actualId) ?? [];
    const targetRefs = targetBranchNames.get(targetId) ?? [];
    if (
      actualRefs.length !== targetRefs.length ||
      actualRefs.some((name, index) => name !== targetRefs[index])
    ) {
      return false;
    }

    const actualIsHead = actual.head.detached && actual.head.commit === actualId;
    const targetIsHead = target.head.detached && target.head.commit === targetId;
    return actualIsHead === targetIsHead;
  };

  const consistentWithMapping = (actualId: string, targetId: string): boolean => {
    const actualParents = actual.parents[actualId]!;
    const targetParents = target.parents[targetId]!;
    for (let index = 0; index < actualParents.length; index++) {
      const actualParent = actualParents[index]!;
      const targetParent = targetParents[index]!;
      if (mapping.has(actualParent) && mapping.get(actualParent) !== targetParent) {
        return false;
      }
      if (reverse.has(targetParent) && reverse.get(targetParent) !== actualParent) {
        return false;
      }
    }
    return true;
  };

  const candidates = new Map(
    actualIds.map((actualId) => [
      actualId,
      targetIds.filter((targetId) => sameStaticShape(actualId, targetId)),
    ]),
  );
  if ([...candidates.values()].some((items) => items.length === 0)) return false;

  const mappingPreservesEdges = (): boolean =>
    actualIds.every((actualId) => {
      const targetId = mapping.get(actualId);
      if (targetId === undefined) return false;
      const actualParents = actual.parents[actualId]!;
      const targetParents = target.parents[targetId]!;
      return actualParents.every(
        (parent, index) => mapping.get(parent) === targetParents[index],
      );
    });

  const visit = (): boolean => {
    if (mapping.size === actualIds.length) return mappingPreservesEdges();

    const next = actualIds
      .filter((id) => !mapping.has(id))
      .map((id) => ({
        id,
        candidates: candidates.get(id)!.filter(
          (candidate) =>
            !reverse.has(candidate) && consistentWithMapping(id, candidate),
        ),
      }))
      .sort((a, b) => a.candidates.length - b.candidates.length)[0];

    if (next === undefined || next.candidates.length === 0) return false;

    for (const candidate of next.candidates) {
      mapping.set(next.id, candidate);
      reverse.set(candidate, next.id);
      if (visit()) return true;
      mapping.delete(next.id);
      reverse.delete(candidate);
    }
    return false;
  };

  return visit();
}

export function check(state: RepoState, target: RepoShape | null): boolean {
  if (target === null) return false;

  const actual: Graph = {
    parents: Object.fromEntries(
      Object.entries(state.commits).map(([id, commit]) => [id, commit.parents]),
    ),
    branches: state.branches,
    head: state.head,
  };

  return graphsAreIsomorphic(actual, target);
}
