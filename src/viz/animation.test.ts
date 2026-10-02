import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { initialAppState, reducer } from "../app/store";
import { Terminal } from "../terminal/Terminal";
import { GraphView } from "./GraphView";
import { layout } from "./layout";

describe("graph movement", () => {
  it("keeps the visual transition below 400 ms and disables it for reduced motion", () => {
    const css = readFileSync(new URL("../app/layout.css", import.meta.url), "utf8");
    const duration = Number(css.match(/\.graph-node\s*\{\s*transition:\s*transform\s+(\d+)ms/)?.[1]);
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThanOrEqual(400);
    expect(css).toMatch(/animation:\s*graph-node-enter\s+300ms/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*\.graph-node\s*\{\s*transition:\s*none/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*animation:\s*none/);
    expect(css).not.toMatch(/\.graph-node\s*\{[^}]*transform:\s*none\s*!important/);
  });

  it("renders the final store position after two immediate commands without locking input", () => {
    const first = reducer(initialAppState(), { type: "run", command: { kind: "commit", message: "first" } });
    const final = reducer(first, { type: "run", command: { kind: "commit", message: "second" } });
    const before = structuredClone(final.repo);
    const html = renderToStaticMarkup(createElement(GraphView, { state: final.repo, presentation: "practice", newId: "c2" }));
    for (const node of layout(final.repo).nodes) {
      expect(html).toContain(`data-commit-id="${node.id}"`);
      expect(html).toContain(`transform:translate(${2 * (node.x - 40) + 40}px, ${node.y}px)`);
    }
    expect(final.repo.branches.main).toBe("c2");
    expect(final.repo).toEqual(before);
    const terminal = renderToStaticMarkup(createElement(Terminal, { onCommand: () => {}, variant: "practice" }));
    expect(terminal).toContain('aria-label="Git command"');
    expect(terminal).not.toMatch(/<input[^>]*\sdisabled(?:=|\s|>)/);
  });
});
