import { useEffect } from "react";
import { useLevelStore } from "../app/levelStore";
import { execute } from "../core/engine";
import type { Command } from "../core/types";
import { progressStore } from "../progress/store";
import type { CommandResult } from "../terminal/session";
import { levels } from "./data";
import { LevelList } from "./LevelList";
import { LevelPanel } from "./LevelPanel";

export function Levels() {
  const { state, dispatch } = useLevelStore();
  const selectedIndex = levels.findIndex((level) => level.id === state.selectedId);
  const selected = levels[selectedIndex]!;
  const nextLevel = levels[selectedIndex + 1] ?? null;

  useEffect(() => {
    const unsubscribe = progressStore.subscribe((progress) => dispatch({ type: "progressLoaded", progress }));
    void progressStore.load();
    return unsubscribe;
  }, [dispatch]);

  useEffect(() => {
    if (state.latestCompletion) progressStore.complete(state.latestCompletion);
  }, [state.latestCompletion]);

  function focusTerminal(): void {
    setTimeout(() => document.getElementById("terminal-input")?.focus(), 30);
  }

  function selectLevel(levelId: string): void {
    dispatch({ type: "select", levelId });
    focusTerminal();
  }

  function runCommand(command: Command): CommandResult {
    const allowed = selected.allowed.includes(command.kind);
    const result = allowed ? execute(state.repo, command) : null;
    dispatch({ type: "run", command, completedAt: new Date().toISOString() });
    return result
      ? { accepted: true, ok: result.ok, output: result.output }
      : { accepted: true, ok: false, output: [`${command.kind} is not available in this level.`] };
  }

  return (
    <section className="levels-screen">
      <h1 className="sr-only">Levels</h1>
      <LevelList
        levels={levels}
        progress={state.progress}
        selectedId={state.selectedId}
        onSelect={selectLevel}
      />
      <div className="levels-content">
        <LevelPanel
          key={selected.id}
          level={selected}
          repo={state.repo}
          commandCount={state.commandCount}
          progress={state.progress}
          latestCompletion={state.latestCompletion}
          nextLevel={nextLevel}
          onCommand={runCommand}
          onReset={() => selectLevel(selected.id)}
          onNext={nextLevel ? () => selectLevel(nextLevel.id) : undefined}
        />
      </div>
    </section>
  );
}
