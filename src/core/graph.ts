import type { RepoState } from "./types";

/** An ancestor is reachable through zero or more parent edges. */
export function isAncestor(state: RepoState, ancestor: string, descendant: string): boolean {
  if (!Object.hasOwn(state.commits, ancestor) || !Object.hasOwn(state.commits, descendant)) {
    return false;
  }
  const seen = new Set<string>();
  const pending = [descendant];
  while (pending.length > 0) {
    const id = pending.pop()!;
    if (id === ancestor) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    pending.push(...(state.commits[id]?.parents ?? []));
  }
  return false;
}

/** Longest path from a root; null for a missing or invalid commit graph. */
export function topologicalDepth(state: RepoState, id: string): number | null {
  if (!Object.hasOwn(state.commits, id)) return null;
  const depths = new Map<string, number>();
  const active = new Set<string>();
  const pending: Array<{ id: string; expanded: boolean }> = [{ id, expanded: false }];

  while (pending.length > 0) {
    const item = pending.pop()!;
    if (depths.has(item.id)) continue;
    const commit = state.commits[item.id];
    if (!commit) return null;
    if (item.expanded) {
      let maxParentDepth = -1;
      for (const parent of commit.parents) {
        const depth = depths.get(parent);
        if (depth === undefined) return null;
        maxParentDepth = Math.max(maxParentDepth, depth);
      }
      depths.set(item.id, maxParentDepth + 1);
      active.delete(item.id);
    } else {
      if (active.has(item.id)) return null;
      active.add(item.id);
      pending.push({ id: item.id, expanded: true });
      for (const parent of commit.parents) {
        if (!Object.hasOwn(state.commits, parent)) return null;
        if (!depths.has(parent)) pending.push({ id: parent, expanded: false });
      }
    }
  }
  return depths.get(id) ?? null;
}

function ancestors(state: RepoState, id: string): Set<string> {
  const found = new Set<string>();
  if (!Object.hasOwn(state.commits, id)) return found;
  const pending = [id];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (found.has(current) || !Object.hasOwn(state.commits, current)) continue;
    found.add(current);
    pending.push(...(state.commits[current]?.parents ?? []));
  }
  return found;
}

/** Keep every common ancestor that is not an ancestor of another common ancestor. */
export function lowestCommonAncestors(state: RepoState, left: string, right: string): string[] {
  const leftAncestors = ancestors(state, left);
  const common = new Set([...ancestors(state, right)].filter((id) => leftAncestors.has(id)));
  const older = new Set<string>();
  const pending = [...common].flatMap((id) => state.commits[id]?.parents ?? []);
  while (pending.length > 0) {
    const id = pending.pop()!;
    if (older.has(id)) continue;
    older.add(id);
    pending.push(...(state.commits[id]?.parents ?? []));
  }
  return [...common].filter((id) => !older.has(id)).sort();
}
