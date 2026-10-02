import { useReducer } from "react";
import { execute } from "../core/engine";
import type { Command, RepoState } from "../core/types";
import { check } from "../levels/check";
import { levels } from "../levels/data";
import type { Level } from "../levels/schema";
import { repoFromShape } from "../levels/state";
import { merge } from "../progress/merge";
import type { LevelRecord, ProgressSet } from "../progress/types";

export interface LevelAppState {
  selectedId: string;
  repo: RepoState;
  output: string[];
  commandCount: number;
  progress: ProgressSet;
  latestCompletion: LevelRecord | null;
}

export type LevelAction =
  | { type: "select"; levelId: string }
  | { type: "run"; command: Command; completedAt: string }
  | { type: "progressLoaded"; progress: ProgressSet };

export function initialLevelAppState(progress: ProgressSet = {}): LevelAppState {
  const first = levels[0]!;
  return { selectedId: first.id, repo: repoFromShape(first.initial), output: [],
    commandCount: 0, progress, latestCompletion: null };
}

export function levelReducer(state: LevelAppState, action: LevelAction): LevelAppState {
  if (action.type === "progressLoaded") {
    return { ...state, progress: merge(state.progress, action.progress) };
  }
  if (action.type === "select") {
    const level = levels.find((item) => item.id === action.levelId);
    return level ? { ...state, selectedId: level.id, repo: repoFromShape(level.initial),
      output: [], commandCount: 0, latestCompletion: null } : state;
  }
  const level: Level = levels.find((item) => item.id === state.selectedId)!;
  if (!level.allowed.includes(action.command.kind)) {
    return { ...state, output: [...state.output, `${action.command.kind} is not available in this level.`] };
  }
  const result = execute(state.repo, action.command);
  const commandCount = state.commandCount + 1;
  const completed = result.ok && check(result.state, level.target);
  const record: LevelRecord | null = completed
    ? { levelId: level.id, completedAt: action.completedAt, commandCount } : null;
  return { ...state, repo: result.state, output: [...state.output, ...result.output],
    commandCount, progress: record ? merge(state.progress, { [level.id]: record }) : state.progress,
    latestCompletion: record };
}

export function useLevelStore() {
  const [state, dispatch] = useReducer(levelReducer, undefined, () => initialLevelAppState());
  return { state, dispatch };
}
