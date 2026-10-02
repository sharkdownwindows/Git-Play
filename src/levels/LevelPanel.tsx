import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Command, CommandKind, RepoState } from "../core/types";
import type { LevelRecord, ProgressSet } from "../progress/types";
import { Terminal } from "../terminal/Terminal";
import type { CommandResult } from "../terminal/session";
import { GraphView } from "../viz/GraphView";
import { check } from "./check";
import type { Level } from "./schema";
import { repoFromShape } from "./state";

interface Props {
  level: Level;
  repo: RepoState;
  commandCount: number;
  progress: ProgressSet;
  latestCompletion: LevelRecord | null;
  nextLevel: Level | null;
  onCommand: (command: Command) => CommandResult;
  onReset: () => void;
  onNext?: () => void;
}

interface FocusTarget {
  focus: () => void;
}

export const COMPLETION_FOCUS_DELAY_MS = 60;

export function scheduleCompletionFocus(
  next: FocusTarget | null,
  fallback: FocusTarget | null,
): () => void {
  const timer = setTimeout(() => (next ?? fallback)?.focus(), COMPLETION_FOCUS_DELAY_MS);
  return () => clearTimeout(timer);
}

function structuralSignature(repo: RepoState, id: string, memo = new Map<string, string>()): string {
  const cached = memo.get(id);
  if (cached) return cached;
  const signature = `(${(repo.commits[id]?.parents ?? []).map((parent) => structuralSignature(repo, parent, memo)).join(",")})`;
  memo.set(id, signature);
  return signature;
}

export function targetGhostIds(current: RepoState, target: RepoState): ReadonlySet<string> {
  const remaining = new Map<string, number>();
  for (const id of Object.keys(current.commits)) {
    const signature = structuralSignature(current, id);
    remaining.set(signature, (remaining.get(signature) ?? 0) + 1);
  }
  const ghosts = new Set<string>();
  for (const id of Object.keys(target.commits)) {
    const signature = structuralSignature(target, id);
    const count = remaining.get(signature) ?? 0;
    if (count === 0) ghosts.add(id);
    else remaining.set(signature, count - 1);
  }
  return ghosts;
}

function exampleFor(kind: CommandKind, level: Level): string {
  switch (kind) {
    case "commit": return 'git commit -m "next"';
    case "branch": return "git branch feature";
    case "merge": return "git merge feature";
    case "switch": {
      const target = level.target?.head.detached ? null : level.target?.head.ref;
      return `git switch ${target ?? "main"}`;
    }
    case "checkout": {
      const target = level.target?.head.detached
        ? level.target.head.commit
        : level.target?.head.ref;
      return `git checkout ${target ?? "main"}`;
    }
  }
}

function headText(repo: RepoState): string {
  if (repo.head.detached) return `HEAD detached @ ${repo.head.commit ?? "?"}`;
  const name = repo.head.ref ?? "?";
  const commit = repo.branches[name];
  return commit ? `HEAD → ${name} @ ${commit}` : `HEAD → ${name} (unborn)`;
}

function nextGraphViewIndex(currentIndex: number, key: string): number | null {
  if (key === "ArrowRight" || key === "ArrowDown") return (currentIndex + 1) % 2;
  if (key === "ArrowLeft" || key === "ArrowUp") return (currentIndex + 1) % 2;
  if (key === "Home") return 0;
  if (key === "End") return 1;
  return null;
}

export function LevelPanel({
  level,
  repo,
  commandCount,
  progress,
  latestCompletion,
  nextLevel,
  onCommand,
  onReset,
  onNext,
}: Props) {
  const [graphView, setGraphView] = useState<"current" | "target">("current");
  const [terminalKey, setTerminalKey] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const completionRef = useRef<HTMLHeadingElement>(null);
  const graphViewRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const justCompleted = latestCompletion?.levelId === level.id;
  const completedBefore = Object.hasOwn(progress, level.id) && !justCompleted;
  const matchesTarget = check(repo, level.target);
  const number = level.order.toString().padStart(2, "0");
  const examples = level.allowed.map((kind) => exampleFor(kind, level));
  const targetRepo = level.target ? repoFromShape(level.target) : null;
  const graphRepo = graphView === "target" && targetRepo ? targetRepo : repo;
  const ghostIds = targetRepo ? targetGhostIds(repo, targetRepo) : new Set<string>();

  useEffect(() => {
    if (!justCompleted) return;
    return scheduleCompletionFocus(nextRef.current, completionRef.current);
  }, [justCompleted]);

  function reset(): void {
    setGraphView("current");
    setTerminalKey((value) => value + 1);
    onReset();
  }

  function handleGraphViewKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const nextIndex = nextGraphViewIndex(index, event.key);
    if (nextIndex === null) return;
    event.preventDefault();
    const nextView = nextIndex === 0 ? "current" : "target";
    setGraphView(nextView);
    graphViewRefs.current[nextIndex]?.focus();
  }

  const status = justCompleted
    ? "Complete"
    : completedBefore
      ? "Completed before · replaying"
      : "In progress";

  return (
    <>
      <section className="level-brief" aria-label="Level brief">
        <div className="level-brief__main">
          <p className="levels-eyebrow levels-eyebrow--accent">LEVEL {number} · {status.toUpperCase()}</p>
          <h2>{level.title}</h2>
          <p className="level-brief__goal">{level.goal}</p>
          <div className="level-brief__allowed">
            <span>Allowed</span>
            {level.allowed.map((command) => <code key={command}>git {command}</code>)}
          </div>
        </div>
        <div className="level-brief__meta">
          <p>Commands used <strong>{commandCount}</strong></p>
          <button type="button" className="levels-secondary" onClick={reset}>Reset level</button>
        </div>
      </section>

      {justCompleted && (
        <section className="level-completion" role="status" aria-label="Level completed">
          <span className="level-completion__check" aria-hidden="true">✓</span>
          <div className="level-completion__copy">
            <h3 ref={completionRef} tabIndex={nextLevel ? undefined : -1}>
              Level complete · {latestCompletion.commandCount} {latestCompletion.commandCount === 1 ? "command" : "commands"}
            </h3>
            <p>{nextLevel ? "Your graph matches the target." : "Your graph matches the target — all 8 levels done."}</p>
          </div>
          {nextLevel && onNext && (
            <button ref={nextRef} type="button" className="level-completion__next" onClick={onNext}>
              Next: {nextLevel.order.toString().padStart(2, "0")} {nextLevel.title} →
            </button>
          )}
        </section>
      )}

      <div className="levels-workspace">
        <Terminal
          key={terminalKey}
          onCommand={(command) => {
            setGraphView("current");
            return onCommand(command);
          }}
          variant="practice"
          examples={examples}
          placeholder={examples[0] ?? "git commit"}
          hint={`Allowed here: ${level.allowed.join(" · ")}`}
          showHistoryHint={false}
          emptyDescription={`Only ${level.allowed.map((command) => `git ${command}`).join(" and ")} ${level.allowed.length === 1 ? "works" : "work"} in this level. Toggle Target on the graph to see the goal.`}
        />

        <section className="levels-graph" aria-label="Commit graph">
          <header className="levels-graph__header">
            <span className="levels-eyebrow levels-eyebrow--muted">COMMIT GRAPH</span>
            <span className="levels-graph__spacer" />
            {matchesTarget && <span className="levels-graph__match">✓ Matches target</span>}
            {targetRepo && (
              <div className="levels-graph__view" role="tablist" aria-label="Graph view">
                {(["current", "target"] as const).map((view, index) => (
                  <button
                    key={view}
                    ref={(element) => { graphViewRefs.current[index] = element; }}
                    id={`level-graph-${view}-tab`}
                    type="button"
                    role="tab"
                    aria-controls="level-graph-panel"
                    aria-selected={graphView === view}
                    tabIndex={graphView === view ? 0 : -1}
                    onClick={() => setGraphView(view)}
                    onKeyDown={(event) => handleGraphViewKeyDown(event, index)}
                  >
                    {view === "current" ? "Current" : "Target"}
                  </button>
                ))}
              </div>
            )}
          </header>
          <div
            id={targetRepo ? "level-graph-panel" : undefined}
            role={targetRepo ? "tabpanel" : undefined}
            aria-labelledby={targetRepo ? `level-graph-${graphView}-tab` : undefined}
            className={`levels-graph__canvas${graphView === "target" ? " is-target" : ""}`}
          >
            {graphView === "target" && (
              <p className="levels-graph__target-note">Target — what your graph should look like · dashed = not created yet</p>
            )}
            {Object.keys(graphRepo.commits).length === 0 ? (
              <div className="levels-graph__empty">
                <span className="graph-empty__node" aria-hidden="true" />
                <strong>No commits yet</strong>
                <span className="head-chip head-chip--unborn">{headText(graphRepo)}</span>
              </div>
            ) : (
              <GraphView
                state={graphRepo}
                presentation="practice"
                scale={1.35}
                ghostIds={graphView === "target" ? ghostIds : undefined}
                parentLabels={graphView === "target"}
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}
