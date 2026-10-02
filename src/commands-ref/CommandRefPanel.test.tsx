import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CommandRefPanel,
  COPY_FEEDBACK_MS,
  ReferenceDetail,
  copyReferenceSyntax,
} from "./CommandRefPanel";
import { commandReferences } from "./data";
import { MiniDiagram } from "./MiniDiagram";

describe("CommandRefPanel", () => {
  it("renders one five-command rail and opens commit by default at every viewport", () => {
    const html = renderToStaticMarkup(createElement(CommandRefPanel));
    expect(html.match(/<nav aria-label="Commands">/g)).toHaveLength(1);
    expect(html.match(/class="reference-rail"/g)).toHaveLength(1);
    expect(html).not.toContain("reference-accordion");
    expect(html).not.toContain("aria-expanded");
    expect(html).toContain('aria-current="true"');
    expect(html.match(/aria-label="Git commit graph"/g)).toHaveLength(2);
    for (const entry of commandReferences) {
      expect(html).toContain(entry.description);
      expect(html).toContain(`git ${entry.key}`);
    }
  });

  it("maps every entry to syntax, effect, gotcha and real before/after graphs", () => {
    for (const entry of commandReferences) {
      const html = renderToStaticMarkup(createElement(ReferenceDetail, {
        entry,
        copied: false,
        onCopy: () => undefined,
        headingId: `${entry.key}-title`,
      }));
      expect(html).toContain(entry.syntax.replaceAll('"', '&quot;'));
      expect(html).toContain(entry.effect);
      expect(html).toContain(entry.gotcha);
      expect(html).toContain("What changes");
      expect(html).toContain("Gotcha");
      expect(html.match(/aria-label="Git commit graph"/g)).toHaveLength(2);
    }
  });

  it("shows attached HEAD before checkout and detached HEAD afterward", () => {
    const checkout = commandReferences.find((entry) => entry.key === "checkout")!;
    const html = renderToStaticMarkup(createElement(MiniDiagram, { entry: checkout }));
    expect(html).toContain('aria-label="HEAD attached to main"');
    expect(html).toContain('aria-label="HEAD detached at c1"');
    expect(html).toContain('data-ref-kind="detached"');
  });

  it("highlights changed merge nodes and edges and labels both parents", () => {
    const merge = commandReferences.find((entry) => entry.key === "merge")!;
    const html = renderToStaticMarkup(createElement(MiniDiagram, { entry: merge }));
    expect(html).toContain("+ commit c4");
    expect(html).toContain("main → c4");
    expect(html.match(/commit-node__changed-ring/g)).toHaveLength(1);
    expect(html.match(/graph-edge--changed/g)).toHaveLength(2);
    expect(html).toContain("1st parent");
    expect(html).toContain("2nd parent");
  });

  it("renders Before and After as a two-figure auto-fit grid without an arrow", () => {
    const html = renderToStaticMarkup(createElement(MiniDiagram, { entry: commandReferences[0]! }));
    const css = readFileSync(new URL("../app/layout.css", import.meta.url), "utf8");
    expect(html.match(/<figure>/g)).toHaveLength(2);
    expect(html).not.toContain("reference-diagram__arrow");
    expect(css).toMatch(/\.reference-diagram\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit, minmax\(300px, 1fr\)\)[\s\S]*?gap:\s*16px/);
    expect(css).toMatch(/\.reference-diagram__canvas\s*\{[\s\S]*?min-height:\s*280px[\s\S]*?padding:\s*16px/);
  });

  it("reports copy success only when the clipboard write resolves", async () => {
    const writes: string[] = [];
    const success = await copyReferenceSyntax("git branch feature", {
      writeText: async (text) => { writes.push(text); },
    });
    const failure = await copyReferenceSyntax("git merge feature", {
      writeText: async () => { throw new Error("blocked"); },
    });

    expect(success).toBe(true);
    expect(failure).toBe(false);
    expect(await copyReferenceSyntax("git commit", undefined)).toBe(false);
    expect(writes).toEqual(["git branch feature"]);
    expect(COPY_FEEDBACK_MS).toBe(1500);
  });
});
