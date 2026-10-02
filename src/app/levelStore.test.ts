import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse } from "../terminal/parse";
import { levels } from "../levels/data";
import { LevelList } from "../levels/LevelList";
import { check } from "../levels/check";
import { Levels } from "../levels/Levels";
import { initialLevelAppState, levelReducer } from "./levelStore";

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe("Levels application store", () => {
  it("renders eight ordered levels and marks progress from ProgressSet", () => {
    const html = renderToStaticMarkup(createElement(LevelList, {
      levels: [...levels].reverse(), selectedId: levels[0]!.id,
      progress: { [levels[5]!.id]: { levelId: levels[5]!.id,
        completedAt: "2026-09-29T00:00:00.000Z", commandCount: 1 } }, onSelect: () => {},
    }));
    expect(html.match(/<li>/g)).toHaveLength(8);
    expect(html.indexOf("First commit")).toBeLessThan(html.indexOf("Fast-forward merge"));
    expect(html.indexOf("Fast-forward merge")).toBeLessThan(html.indexOf("When fast-forward is impossible"));
    expect(html).toContain("Level 06, Fast-forward merge, completed");
    expect(html.match(/is-complete/g)).toHaveLength(1);
  });

  it("renders the first level in the Levels tab without a backend", () => {
    const html = renderToStaticMarkup(createElement(Levels));
    expect(html).toContain("Create the first commit on main.");
    expect(html).toContain('aria-label="Git terminal"');
    expect(html).toContain('aria-label="Commit graph"');
  });

  it("restores the completion marker from localStorage after reload", async () => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    });
    const record = { levelId: levels[0]!.id, completedAt: "2026-09-29T00:00:00.000Z", commandCount: 1 };
    const { progressStore: first } = await import("../progress/store");
    await first.load();
    first.complete(record);
    vi.resetModules();
    const { progressStore: reloaded } = await import("../progress/store");
    await reloaded.load();
    const html = renderToStaticMarkup(createElement(LevelList, { levels, progress: reloaded.getAll(),
      selectedId: record.levelId, onSelect: () => {} }));
    expect(html).toContain("Level 01, First commit, completed");
    expect(html.match(/is-complete/g)).toHaveLength(1);
  });

  it("records completion with levelId, ISO timestamp and command count", () => {
    const level = levels[5]!;
    const timestamp = "2026-09-29T12:00:00.000Z";
    let state = levelReducer(initialLevelAppState(), { type: "select", levelId: level.id });
    const parsed = parse("git merge feature");
    if (!("kind" in parsed)) throw new Error("Cannot parse merge");
    state = levelReducer(state, { type: "run", command: parsed, completedAt: timestamp });
    expect(state.progress[level.id]).toEqual({ levelId: level.id, completedAt: timestamp, commandCount: 1 });
    expect(state.latestCompletion).toEqual(state.progress[level.id]);
  });

  it("keeps the earlier completion when the same level is solved again", () => {
    const level = levels[5]!;
    const parsed = parse("git merge feature");
    if (!("kind" in parsed)) throw new Error("Cannot parse merge");
    let state = levelReducer(initialLevelAppState(), { type: "select", levelId: level.id });
    state = levelReducer(state, { type: "run", command: parsed, completedAt: "2026-09-29T12:00:00.000Z" });
    state = levelReducer(state, { type: "select", levelId: level.id });
    state = levelReducer(state, { type: "run", command: parsed, completedAt: "2026-09-29T13:00:00.000Z" });
    expect(state.progress[level.id]?.completedAt).toBe("2026-09-29T12:00:00.000Z");
    expect(state.progress[level.id]?.commandCount).toBe(1);
  });

  it("shows a disallowed command error without changing repo or command count", () => {
    const initial = initialLevelAppState();
    const parsed = parse("git branch x");
    if (!("kind" in parsed)) throw new Error("Cannot parse branch");
    const state = levelReducer(initial, {
      type: "run",
      command: parsed,
      completedAt: "2026-10-01T00:00:00.000Z",
    });
    expect(state.repo).toBe(initial.repo);
    expect(state.commandCount).toBe(0);
    expect(state.latestCompletion).toBeNull();
    expect(state.output.at(-1)).toBe("branch is not available in this level.");
  });

  it("never completes sandbox without a target", () => {
    const state = initialLevelAppState();
    expect(check(state.repo, null)).toBe(false);
  });
});
