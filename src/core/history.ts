import { emptyState, type RepoState, type Result } from "./types";

export interface HistoryState {
  repo: RepoState;
  past: RepoState[];
  future: RepoState[];
}

export function initialHistory(repo: RepoState = emptyState()): HistoryState {
  return { repo, past: [], future: [] };
}

export function recordResult(history: HistoryState, result: Result): HistoryState {
  if (!result.ok) return history;
  return {
    repo: result.state,
    past: [...history.past, history.repo],
    future: [],
  };
}

export function undo(history: HistoryState): HistoryState {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return {
    repo: previous,
    past: history.past.slice(0, -1),
    future: [history.repo, ...history.future],
  };
}

export function redo(history: HistoryState): HistoryState {
  const next = history.future[0];
  if (!next) return history;
  return {
    repo: next,
    past: [...history.past, history.repo],
    future: history.future.slice(1),
  };
}
