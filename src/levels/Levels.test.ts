import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { levels } from "./data";
import { LevelList } from "./LevelList";
import {
  COMPLETION_FOCUS_DELAY_MS,
  LevelPanel,
  scheduleCompletionFocus,
  targetGhostIds,
} from "./LevelPanel";
import { repoFromShape } from "./state";

afterEach(() => vi.useRealTimers());

describe("Levels presentation", () => {
  it("renders the eight active levels in both the desktop rail and narrow picker", () => {
    const progress = {
      [levels[0]!.id]: {
        levelId: levels[0]!.id,
        completedAt: "2026-10-01T00:00:00.000Z",
        commandCount: 1,
      },
    };
    const html = renderToStaticMarkup(createElement(LevelList, {
      levels,
      progress,
      selectedId: levels[1]!.id,
      onSelect: () => {},
    }));

    expect(html.match(/<li>/g)).toHaveLength(8);
    expect(html.match(/<option/g)).toHaveLength(8);
    expect(html).toContain("1 of 8 complete");
    expect(html).toContain("LEVEL · 1 OF 8 COMPLETE");
    expect(html).toContain("Level 01, First commit, completed");
    expect(html).toContain("Level 02, Create a branch, current");
    expect(html).toContain('aria-valuenow="1"');
  });

  it("renders a real completion event with command count, target match and Next action", () => {
    const level = levels[0]!;
    const nextLevel = levels[1]!;
    const record = {
      levelId: level.id,
      completedAt: "2026-10-01T00:00:00.000Z",
      commandCount: 1,
    };
    const html = renderToStaticMarkup(createElement(LevelPanel, {
      level,
      repo: repoFromShape(level.target!),
      commandCount: 1,
      progress: { [level.id]: record },
      latestCompletion: record,
      nextLevel,
      onCommand: () => ({ accepted: true, ok: true, output: [] }),
      onReset: () => {},
      onNext: () => {},
    }));

    expect(html).toContain("LEVEL 01 · COMPLETE");
    expect(html).toContain("Level complete · 1 command");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Level completed"');
    expect(html).toContain("Your graph matches the target.");
    expect(html).toContain("✓ Matches target");
    expect(html).toContain("Next: 02 Create a branch →");
    expect(html).toContain('aria-controls="level-graph-panel"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('tabindex="-1"');
  });

  it("marks previously completed levels as replaying without inventing a new completion banner", () => {
    const level = levels[0]!;
    const record = {
      levelId: level.id,
      completedAt: "2026-10-01T00:00:00.000Z",
      commandCount: 1,
    };
    const html = renderToStaticMarkup(createElement(LevelPanel, {
      level,
      repo: repoFromShape(level.initial),
      commandCount: 0,
      progress: { [level.id]: record },
      latestCompletion: null,
      nextLevel: levels[1]!,
      onCommand: () => ({ accepted: true, ok: true, output: [] }),
      onReset: () => {},
    }));

    expect(html).toContain("COMPLETED BEFORE · REPLAYING");
    expect(html).not.toContain("Level complete ·");
    expect(html).not.toContain("✓ Matches target");
  });

  it("moves focus to Next within the 100 ms acceptance window and cancels on cleanup", () => {
    vi.useFakeTimers();
    const next = { focus: vi.fn() };
    const fallback = { focus: vi.fn() };
    const cleanup = scheduleCompletionFocus(next, fallback);

    expect(COMPLETION_FOCUS_DELAY_MS).toBeLessThanOrEqual(100);
    vi.advanceTimersByTime(COMPLETION_FOCUS_DELAY_MS - 1);
    expect(next.focus).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(next.focus).toHaveBeenCalledOnce();
    expect(fallback.focus).not.toHaveBeenCalled();
    cleanup();
  });

  it("marks only target commits missing from the current structural graph as dashed", () => {
    const level = levels[6]!;
    expect([...targetGhostIds(repoFromShape(level.initial), repoFromShape(level.target!))])
      .toEqual(["merge"]);
  });

  it("uses the 272px rail, switches to a picker below 900px and keeps graph-first wrapping", () => {
    const css = readFileSync(new URL("../app/layout.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.levels-rail\s*\{[\s\S]*?flex:\s*0 0 272px/);
    expect(css).toMatch(/@media \(max-width: 899px\)[\s\S]*?\.levels-rail\s*\{[\s\S]*?display:\s*none/);
    expect(css).toMatch(/@media \(max-width: 899px\)[\s\S]*?\.levels-picker\s*\{[\s\S]*?display:\s*grid/);
    expect(css).toMatch(/\.levels-workspace\s*\{[\s\S]*?flex-wrap:\s*wrap-reverse/);
    expect(css).toMatch(/\.levels-workspace > \.terminal--practice\s*\{[\s\S]*?flex:\s*5 1 340px/);
    expect(css).toMatch(/\.levels-graph\s*\{[\s\S]*?flex:\s*6 1 400px/);
  });

  it("uses the exact Next action tokens without muting its focus state", () => {
    const css = readFileSync(new URL("../app/layout.css", import.meta.url), "utf8");
    expect(css).toMatch(/--color-accent-dark:\s*#c9151c/);
    expect(css).toMatch(/--color-accent-hover:\s*#a91118/);
    expect(css).toMatch(/\.level-completion__next\s*\{[\s\S]*?background:\s*var\(--color-accent-dark\)/);
    expect(css).toMatch(/\.level-completion__next:hover\s*\{[\s\S]*?background:\s*var\(--color-accent-hover\)/);
  });
});
