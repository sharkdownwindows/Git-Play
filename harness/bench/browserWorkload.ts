import type { RepoState } from "../../src/core/types";

export interface PracticeGraphProps {
  state: RepoState;
  presentation: "practice";
  scale: 1;
  newId: string | null;
}

/** Props used by Practice when displaying a newly accepted repository state. */
export function practiceGraphProps(before: RepoState, after: RepoState): PracticeGraphProps {
  const newId = Object.keys(after.commits).find((id) => !(id in before.commits)) ?? null;
  return { state: after, presentation: "practice", scale: 1, newId };
}
