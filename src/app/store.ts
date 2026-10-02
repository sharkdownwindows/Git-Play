import { useCallback, useRef, useState } from "react";
import { execute } from "../core/engine";
import { initialHistory, recordResult, redo, undo, type HistoryState } from "../core/history";
import { emptyState, type Command, type RepoState } from "../core/types";

export interface RunResult {
  accepted: boolean;
  ok: boolean;
  output: string[];
  previousRepo: RepoState;
  repo: RepoState;
}

/**
 * useReducer bọc engine — không Redux, không Zustand. Engine đã là single
 * source of truth; thêm một thư viện state nữa chỉ là thêm một nguồn sự thật
 * thứ hai để hai nguồn lệch nhau.
 *
 * Các module UI KHÔNG import lẫn nhau — chúng gặp nhau ở đây.
 */
export interface AppState extends HistoryState {
  output: string[];
  inputLocked: boolean;
}

export type Action =
  | { type: "run"; command: Command; animate?: boolean }
  | { type: "unlockInput" }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset"; state?: RepoState };

export function initialAppState(repo: RepoState = emptyState()): AppState {
  return { ...initialHistory(repo), output: [], inputLocked: false };
}

function runCommand(state: AppState, command: Command, animate = false) {
  if (state.inputLocked) return null;
  const result = execute(state.repo, command);
  return {
    result,
    state: {
      ...recordResult(state, result),
      output: [...state.output, ...result.output],
      inputLocked: Boolean(animate && result.ok && result.state !== state.repo),
    } satisfies AppState,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "run": {
      return runCommand(state, action.command, action.animate)?.state ?? state;
    }
    case "unlockInput":
      return state.inputLocked ? { ...state, inputLocked: false } : state;
    case "undo": {
      const history = undo(state);
      return history === state ? state : { ...state, ...history };
    }
    case "redo": {
      const history = redo(state);
      return history === state ? state : { ...state, ...history };
    }
    case "reset":
      return initialAppState(action.state);
  }
}

export function useRepo(initial?: RepoState) {
  const [state, setState] = useState(() => initialAppState(initial));
  const current = useRef(state);
  const dispatch = useCallback((action: Action) => {
    current.current = reducer(current.current, action);
    setState(current.current);
  }, []);
  const run = useCallback((command: Command, animate = false): RunResult => {
    const previous = current.current;
    const execution = runCommand(previous, command, animate);
    if (execution === null) {
      return { accepted: false, ok: false, output: [], previousRepo: previous.repo, repo: previous.repo };
    }
    current.current = execution.state;
    setState(execution.state);
    return {
      accepted: true,
      ok: execution.result.ok,
      output: execution.result.output,
      previousRepo: previous.repo,
      repo: execution.state.repo,
    };
  }, []);
  return { state, dispatch, run };
}
