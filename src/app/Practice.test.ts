import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Command } from "../core/types";
import { Terminal } from "../terminal/Terminal";
import { editInput, initialTerminalSession, previousCommand, submitInput } from "../terminal/session";
import { GraphView } from "../viz/GraphView";
import { App } from "./App";
import { GRAPH_ANIMATION_MS, PRACTICE_GRAPH_CANVAS_ID, scheduleInputUnlock } from "./Practice";
import { initialAppState, reducer } from "./store";

describe("M2 Practice", () => {
  it("render Terminal và GraphView từ store rỗng, giữ bốn tab", () => {
    const html = renderToStaticMarkup(createElement(App));
    expect(html.match(/role="tab"/g)).toHaveLength(4);
    expect(html).toContain('aria-label="Git terminal"');
    expect(html).toContain('aria-label="Git command"');
    expect(html).toContain('aria-label="Commit graph"');
    expect(html).toContain("HEAD → main (unborn)");
    expect(html).toContain("0 commits · 0 branches");
    expect(html).toContain("No commits yet");
    expect(html).toContain("Run ↵");
    expect(html).toContain("Graph legend");
    expect(html).toContain("Undo");
    expect(html).toContain("Redo");
    expect(html).toContain("Reset");
    expect(html).toContain('aria-label="Jump to root commit"');
    expect(html).toContain('aria-label="Jump to HEAD commit"');
    expect(html).toContain(`aria-controls="${PRACTICE_GRAPH_CANVAS_ID}"`);
    expect(html).toContain(`id="${PRACTICE_GRAPH_CANVAS_ID}"`);
    expect(html).toContain('aria-label="Scrollable commit graph"');
    expect(html).toContain('class="practice-graph__stage"');
  });

  it("commit → output/graph → branch label → ArrowUp đi qua cùng repo state", () => {
    let app = initialAppState();
    let terminal = initialTerminalSession();
    const run = (command: Command) => {
      const previous = app;
      app = reducer(app, { type: "run", command });
      return {
        accepted: true,
        ok: app.repo !== previous.repo,
        output: app.output.slice(previous.output.length),
      };
    };

    terminal = submitInput(editInput(terminal, 'git commit -m "first"'), run);
    expect(terminal.entries[0]?.output).toEqual(["[main (root-commit) c1] first"]);
    expect(renderToStaticMarkup(createElement(GraphView, { state: app.repo, presentation: "practice" })))
      .toContain('data-commit-id="c1"');

    terminal = submitInput(editInput(terminal, "git branch feature"), run);
    expect(renderToStaticMarkup(createElement(GraphView, { state: app.repo, presentation: "practice" })))
      .toContain('aria-label="branch feature"');
    expect(previousCommand(terminal).input).toBe("git branch feature");
  });

  it("giữ tỉ lệ desktop và đảo graph lên trên khi panel wrap trên mobile", () => {
    const css = readFileSync(new URL("./layout.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.practice\s*\{[\s\S]*?flex-wrap:\s*wrap-reverse/);
    expect(css).toMatch(/\.terminal--practice\s*\{[\s\S]*?flex:\s*5 1 380px/);
    expect(css).toMatch(/\.practice-graph\s*\{[\s\S]*?flex:\s*7 1 440px/);
    expect(css).toMatch(/\.terminal--practice\s*\{[\s\S]*?max-height:\s*100%/);
    expect(css).toMatch(/\.practice-graph\s*\{[\s\S]*?max-height:\s*100%/);
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.practice\s*\{[\s\S]*?padding:\s*var\(--space-4\)/);
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.graph-view--practice\s*\{[\s\S]*?max-width:\s*none/);
  });

  it("centers a short graph in a real-size stage and lets a long graph scroll in both axes", () => {
    const css = readFileSync(new URL("./layout.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.practice-graph__canvas\s*\{[\s\S]*?overflow:\s*auto/);
    expect(css).toMatch(/\.practice-graph__stage\s*\{[\s\S]*?width:\s*max-content[\s\S]*?min-width:\s*100%/);
    expect(css).toMatch(/\.practice-graph__stage\s*\{[\s\S]*?height:\s*max-content[\s\S]*?min-height:\s*100%/);
    expect(css).toMatch(/\.practice-graph__stage\s*\{[\s\S]*?place-items:\s*center/);
    expect(css).toMatch(/\.practice-graph__stage \.graph-view--practice\s*\{[\s\S]*?max-width:\s*none/);
  });
});

afterEach(() => vi.useRealTimers());

describe("Practice animation lock", () => {
  it("locks for the 300 ms animation and releases at the deadline", () => {
    vi.useFakeTimers();
    let state = reducer(initialAppState(), { type: "run", command: { kind: "commit", message: "root" }, animate: true });
    expect(state.inputLocked).toBe(true);
    const terminal = renderToStaticMarkup(createElement(Terminal, {
      onCommand: () => {},
      locked: state.inputLocked,
      variant: "practice",
    }));
    expect(terminal).toContain("is-locked");
    expect(terminal).toContain("Updating graph…");
    expect(terminal).not.toContain('disabled=""');
    const cleanup = scheduleInputUnlock((action) => { state = reducer(state, action); });
    expect(GRAPH_ANIMATION_MS).toBeLessThanOrEqual(400);
    vi.advanceTimersByTime(GRAPH_ANIMATION_MS - 1);
    expect(state.inputLocked).toBe(true);
    vi.advanceTimersByTime(1);
    expect(state.inputLocked).toBe(false);
    cleanup();
  });

  it("does not lock parser errors, engine failures, no-op commands or reduced motion", () => {
    const initial = initialAppState();
    const parser = submitInput(editInput(initialTerminalSession(), "git merge"), () => {
      throw new Error("parser should reject this command");
    });
    expect(parser.entries[0]?.output.length).toBeGreaterThan(0);
    const failed = reducer(initial, { type: "run", command: { kind: "branch", name: "feature" }, animate: true });
    expect(failed.inputLocked).toBe(false);
    const root = reducer(initial, { type: "run", command: { kind: "commit" } });
    const noOp = reducer(root, { type: "run", command: { kind: "merge", branch: "main" }, animate: true });
    expect(noOp.repo).toBe(root.repo);
    expect(noOp.inputLocked).toBe(false);
    expect(reducer(initial, { type: "run", command: { kind: "commit" }, animate: false }).inputLocked).toBe(false);
  });

  it("rejects a second rapid submit while locked without diverging from the store", () => {
    let state = initialAppState();
    const run = (command: Command): boolean => {
      if (state.inputLocked) return false;
      state = reducer(state, { type: "run", command, animate: true });
      return true;
    };
    const first = submitInput(editInput(initialTerminalSession(), "git commit -m first"), run);
    const second = submitInput(editInput(first, "git commit -m second"), run);
    expect(second.entries).toHaveLength(1);
    expect(second.input).toBe("git commit -m second");
    expect(Object.keys(state.repo.commits)).toHaveLength(1);
    expect(state.repo.branches.main).toBe("c1");
  });

  it("cleans up the unlock timer on unmount", () => {
    vi.useFakeTimers();
    const dispatch = vi.fn();
    const cleanup = scheduleInputUnlock(dispatch);
    expect(vi.getTimerCount()).toBe(1);
    cleanup();
    vi.advanceTimersByTime(GRAPH_ANIMATION_MS);
    expect(dispatch).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
