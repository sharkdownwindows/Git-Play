import { useEffect, useRef, useState } from "react";
import { Terminal } from "../terminal/Terminal";
import { GraphView } from "../viz/GraphView";
import { resolveHeadCommit, resolveRootCommit, scrollCommitIntoView } from "./practiceGraphNavigation";
import { useRepo } from "./store";

export const GRAPH_ANIMATION_MS = 300;
export const PRACTICE_GRAPH_CANVAS_ID = "practice-graph-canvas";

export function scheduleInputUnlock(dispatch: (action: { type: "unlockInput" }) => void): () => void {
  const timer = setTimeout(() => dispatch({ type: "unlockInput" }), GRAPH_ANIMATION_MS);
  return () => clearTimeout(timer);
}

export function Practice() {
  const { state, dispatch, run } = useRepo();
  const [newId, setNewId] = useState<string | null>(null);
  const [terminalKey, setTerminalKey] = useState(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const pendingHeadScroll = useRef<string | null>(null);

  useEffect(() => {
    if (!state.inputLocked) return;
    return scheduleInputUnlock(dispatch);
  }, [state.inputLocked, dispatch]);

  useEffect(() => {
    const commitId = pendingHeadScroll.current;
    if (!commitId || !canvasRef.current) return;
    pendingHeadScroll.current = null;
    scrollCommitIntoView(
      canvasRef.current,
      commitId,
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
    );
  }, [state.repo]);

  const onCommand = (command: Parameters<typeof run>[0]) => {
    const animate = !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const result = run(command, animate);
    if (result.accepted) {
      const created = Object.keys(result.repo.commits).find((id) => !(id in result.previousRepo.commits));
      setNewId(created ?? null);
      const previousHead = resolveHeadCommit(result.previousRepo);
      const nextHead = resolveHeadCommit(result.repo);
      if (nextHead && nextHead !== previousHead) pendingHeadScroll.current = nextHead;
    }
    return result;
  };

  const commitCount = Object.keys(state.repo.commits).length;
  const branchCount = Object.keys(state.repo.branches).length;
  const headCommit = resolveHeadCommit(state.repo);
  const rootCommit = resolveRootCommit(state.repo);
  const headText = state.repo.head.detached
    ? `HEAD detached @ ${headCommit ?? "?"}`
    : headCommit
      ? `HEAD → ${state.repo.head.ref ?? "?"} @ ${headCommit}`
      : `HEAD → ${state.repo.head.ref ?? "?"} (unborn)`;
  const headKind = state.repo.head.detached ? "detached" : headCommit ? "attached" : "unborn";

  function reset(): void {
    dispatch({ type: "reset" });
    setNewId(null);
    setTerminalKey((key) => key + 1);
    setTimeout(() => document.getElementById("terminal-input")?.focus(), 0);
  }

  function jumpTo(commitId: string | null): void {
    if (!commitId || !canvasRef.current) return;
    scrollCommitIntoView(
      canvasRef.current,
      commitId,
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false,
    );
  }

  return (
    <section className="practice">
      <h1 className="sr-only">Practice</h1>
      <Terminal key={terminalKey} onCommand={onCommand} locked={state.inputLocked} variant="practice" />

      <section className="practice-graph" aria-label="Commit graph">
        <header className="practice-graph__header">
          <span className="practice-graph__eyebrow">COMMIT GRAPH</span>
          <span className="practice-graph__meta">
            {commitCount} {commitCount === 1 ? "commit" : "commits"} · {branchCount} {branchCount === 1 ? "branch" : "branches"}
          </span>
          <span className="practice-graph__spacer" />
          <span className={`head-chip head-chip--${headKind}`} title={headText}>
            <span className="head-chip__text">{headText}</span>
          </span>
          <span className="practice-graph__divider" aria-hidden="true" />
          <span className="practice-graph__navigation">
            <button
              type="button"
              aria-label="Jump to root commit"
              aria-controls={PRACTICE_GRAPH_CANVAS_ID}
              disabled={!rootCommit}
              onClick={() => jumpTo(rootCommit)}
            >Root</button>
            <button
              type="button"
              aria-label="Jump to HEAD commit"
              aria-controls={PRACTICE_GRAPH_CANVAS_ID}
              disabled={!headCommit}
              onClick={() => jumpTo(headCommit)}
            >HEAD</button>
          </span>
          <span className="practice-graph__divider" aria-hidden="true" />
          <span className="practice-graph__actions">
            <button type="button" disabled={state.past.length === 0} onClick={() => { dispatch({ type: "undo" }); setNewId(null); }}>Undo</button>
            <button type="button" disabled={state.future.length === 0} onClick={() => { dispatch({ type: "redo" }); setNewId(null); }}>Redo</button>
            <button type="button" onClick={reset}>Reset</button>
          </span>
        </header>

        <div
          ref={canvasRef}
          id={PRACTICE_GRAPH_CANVAS_ID}
          className="practice-graph__canvas"
          tabIndex={0}
          role="region"
          aria-label="Scrollable commit graph"
        >
          <div className="practice-graph__stage">
            {commitCount === 0 ? (
              <div className="graph-empty">
                <span className="graph-empty__node" aria-hidden="true" />
                <strong>No commits yet</strong>
                <span className="head-chip head-chip--unborn">{headText}</span>
                <p>Your first commit will appear here as a circle. Branch labels sit to its right.</p>
              </div>
            ) : (
              <GraphView state={state.repo} presentation="practice" scale={1.0} newId={newId} />
            )}
          </div>
        </div>

        <footer className="graph-legend" aria-label="Graph legend">
          <span><i className="legend-node" aria-hidden="true" />commit</span>
          <span><i className="legend-node legend-node--head" aria-hidden="true" />HEAD commit</span>
          <span><i className="legend-branch" aria-hidden="true">main</i>branch</span>
          <span><i className="legend-head" aria-hidden="true">HEAD</i>attached</span>
          <span><i className="legend-detached" aria-hidden="true">HEAD · detached</i>detached</span>
          <span><i className="legend-new" aria-hidden="true" />just created</span>
        </footer>
      </section>
    </section>
  );
}
