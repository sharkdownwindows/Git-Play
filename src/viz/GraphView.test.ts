import { readFileSync, readdirSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { emptyState, type RepoState } from "../core/types";
import { GraphView } from "./GraphView";
import { layout } from "./layout";

function sampleState(): RepoState {
  const state = emptyState();
  state.commits = {
    c1: { id: "c1", parents: [], message: "root", timestamp: "2020-01-01T00:00:00Z" },
    c2: { id: "c2", parents: ["c1"], message: "next", timestamp: "2020-01-02T00:00:00Z" },
  };
  state.branches = { main: "c2", feature: "c1" };
  return state;
}

function render(state: RepoState): string {
  return renderToStaticMarkup(createElement(GraphView, { state }));
}

function renderPractice(state: RepoState, newId?: string): string {
  return renderToStaticMarkup(createElement(GraphView, {
    state,
    presentation: "practice",
    newId,
  }));
}

describe("GraphView", () => {
  it("repo rỗng vẫn render SVG và HEAD unborn", () => {
    const html = render(emptyState());
    expect(html).toContain("<svg");
    expect(html).toContain("No commits yet");
    expect(html).toContain("HEAD → main (unborn)");
    expect(html).not.toContain("<circle");
    expect(html).not.toContain("<line");
  });

  it("render node và cạnh tại tọa độ layout thật", () => {
    const state = sampleState();
    const html = render(state);
    const positions = new Map(layout(state).nodes.map((node) => [node.id, node]));
    const child = positions.get("c2")!;
    const parent = positions.get("c1")!;
    expect(html).toContain('data-commit-id="c1"');
    expect(html).toContain('data-commit-id="c2"');
    expect(html.match(/<circle\b/g)).toHaveLength(2);
    expect(html).toContain(`transform:translate(${child.x}px, ${child.y}px)`);
    expect(html).toContain(`transform:translate(${parent.x}px, ${parent.y}px)`);
    expect(html.match(/<circle cx="0" cy="0"/g)).toHaveLength(2);
    expect(html).toContain(
      `<line x1="${child.x}" y1="${child.y}" x2="${parent.x}" y2="${parent.y}"`,
    );
  });

  it("hiển thị branch labels và attached HEAD trên đúng commit", () => {
    const html = render(sampleState());
    expect(html).toContain('aria-label="branch feature"');
    expect(html).toContain('aria-label="branch main"');
    expect(html).toContain('aria-label="HEAD attached to main"');
    expect(html).toContain("HEAD → main");
    expect(html.match(/data-ref-kind="branch"/g)).toHaveLength(2);
    expect(html).toContain('data-ref-kind="attached"');
    expect(html).not.toContain('data-ref-kind="detached"');
    expect(html).toContain('fill="var(--color-primary)"');
  });

  it("hiển thị detached HEAD tại commit thay vì gắn với branch", () => {
    const state = sampleState();
    state.head = { detached: true, ref: null, commit: "c1" };
    const html = render(state);
    expect(html).toContain('aria-label="HEAD detached at c1"');
    expect(html).toContain("HEAD detached");
    expect(html).not.toContain("HEAD → main");
    expect(html).toContain('data-ref-kind="detached"');
    expect(html).not.toContain('data-ref-kind="attached"');
    expect(html).toContain('fill="var(--color-danger)"');
  });

  it("does not mutate RepoState when rendering animated nodes", () => {
    const state = sampleState();
    const before = structuredClone(state);
    const html = render(state);
    expect(state).toEqual(before);
    expect(html).toContain('class="graph-node"');
  });

  it("Practice nhân đôi lane x, dùng node r=16 và edge đúng hướng", () => {
    const state = sampleState();
    const html = renderPractice(state);
    const positions = new Map(layout(state).nodes.map((node) => [node.id, node]));
    const child = positions.get("c2")!;
    const parent = positions.get("c1")!;
    const childX = 2 * (child.x - 40) + 40;
    const parentX = 2 * (parent.x - 40) + 40;
    expect(html).toContain(`transform:translate(${childX}px, ${child.y}px)`);
    expect(html).toContain(`transform:translate(${parentX}px, ${parent.y}px)`);
    expect(html).toContain('class="commit-node commit-node--head" cx="0" cy="0" r="16"');
    expect(html).toContain(`d="M ${childX} ${child.y - 16} L ${parentX} ${parent.y + 16}"`);
  });

  it("Practice render HEAD ghép với branch, refs bên phải và node focusable", () => {
    const html = renderPractice(sampleState());
    expect(html).toContain('data-ref-kind="attached" transform="translate(30 ');
    expect(html).toContain('class="ref-chip__head"');
    expect(html).toContain('class="ref-chip__branch"');
    expect(html).toContain('aria-label="commit c2, parents c1, branch main, HEAD attached to main"');
    expect(html).toContain('tabindex="0"');
  });

  it("Practice chỉ gắn animation và halo vào commit mới", () => {
    const html = renderPractice(sampleState(), "c2");
    expect(html.match(/graph-node--new/g)).toHaveLength(1);
    expect(html.match(/commit-node__halo/g)).toHaveLength(1);
    expect(html).toContain("c2 — next · parents c1");
  });

  it("Practice cắt id dài trong node nhưng giữ id đầy đủ trong title", () => {
    const state = sampleState();
    const longBranch = "this-is-a-very-long-branch-name-that-keeps-going";
    state.commits.longCommit = {
      id: "longCommit",
      parents: ["c2"],
      message: "long id",
      timestamp: "2020-01-03T00:00:00Z",
    };
    state.branches = { [longBranch]: "longCommit" };
    state.head.ref = longBranch;
    const html = renderPractice(state);
    expect(html).toContain("lon…");
    expect(html).toContain("longCommit — long id · parents c2");
    expect(html).toContain(`branch ${longBranch}`);
    expect(html).toContain(`HEAD attached to ${longBranch}`);
  });

  it("Practice renders target-only nodes and edges dashed with merge parent labels", () => {
    const state = sampleState();
    state.commits.c3 = {
      id: "c3",
      parents: ["c2", "c1"],
      message: "merge",
      timestamp: "2020-01-03T00:00:00Z",
    };
    state.branches.main = "c3";
    const html = renderToStaticMarkup(createElement(GraphView, {
      state,
      presentation: "practice",
      ghostIds: new Set(["c3"]),
      parentLabels: true,
    }));
    expect(html.match(/graph-node--ghost/g)).toHaveLength(1);
    expect(html.match(/graph-edge-wrap--ghost/g)).toHaveLength(2);
    expect(html).toContain("1st parent");
    expect(html).toContain("2nd parent");
  });

  it("viz không import terminal, levels hoặc verification", () => {
    for (const file of readdirSync(new URL(".", import.meta.url))) {
      if (!/\.tsx?$/.test(file) || file.endsWith(".test.ts")) continue;
      const source = readFileSync(new URL(file, import.meta.url), "utf8");
      expect(source).not.toMatch(/\bfrom\s*["'][^"']*\/(terminal|levels|verification)(?:\/|["'])/);
    }
  });
});
