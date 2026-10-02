import { emptyState, type RepoState } from "../core/types";
import type { RepoShape } from "./schema";

export function repoFromShape(shape: RepoShape): RepoState {
  return {
    ...emptyState(),
    commits: Object.fromEntries(Object.entries(shape.parents).map(([id, parents], index) => [
      id, { id, parents: [...parents], message: `seed ${index}`,
        timestamp: new Date(Date.UTC(2020, 0, 1) + index * 1000).toISOString() },
    ])),
    branches: { ...shape.branches },
    head: { ...shape.head },
  };
}
