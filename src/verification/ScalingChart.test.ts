import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ScalingChart } from "./ScalingChart";
import type { ScalingSeries } from "./report";
import { nextSegmentIndex } from "./segmentedKeyboard";

const render = (series: ScalingSeries[], initialView?: "chart" | "table") =>
  renderToStaticMarkup(createElement(ScalingChart, { series, initialView }));

describe("ScalingChart", () => {
  it("supports arrow and boundary keys for segmented tab controls", () => {
    expect(nextSegmentIndex(0, "ArrowRight", 3)).toBe(1);
    expect(nextSegmentIndex(0, "ArrowLeft", 3)).toBe(2);
    expect(nextSegmentIndex(1, "ArrowDown", 3)).toBe(2);
    expect(nextSegmentIndex(1, "ArrowUp", 3)).toBe(0);
    expect(nextSegmentIndex(1, "Home", 3)).toBe(0);
    expect(nextSegmentIndex(1, "End", 3)).toBe(2);
    expect(nextSegmentIndex(1, "Enter", 3)).toBeNull();
  });

  it("shows an empty state with no measurements", () => {
    expect(render([])).toContain("No measured scaling data available.");
  });

  it("presents a single-point series as a readable metric", () => {
    const html = render([{ label: "animation frame", points: [{ n: 200, medianMs: 16.7, p95Ms: 16.8, iterations: 220 }] }]);
    expect(html).toContain("1 point");
    expect(html).toContain("16.7 ms");
    expect(html).toContain("median frame at 200 commits, 220 frames sampled");
    expect(html).not.toContain("NaN");
  });

  it("renders multi-point log charts with accessible descriptions", () => {
    const html = render([{ label: "layout()", points: [
      { n: 100, medianMs: 1, p95Ms: 2, iterations: 7 },
      { n: 10_000, medianMs: 100, p95Ms: 200, iterations: 7 },
    ] }]);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="layout() scaling chart"');
    expect(html).toContain("<title>layout() by commit count</title>");
    expect(html).toContain("<desc>Logarithmic axes");
    expect(html.match(/<circle/g)).toHaveLength(4);
    expect(html).toContain('aria-controls="performance-view-panel"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain('tabindex="-1"');
  });

  it("renders the performance table with formatted measurements", () => {
    const html = render([{ label: "SVG render", points: [{ n: 1_000, medianMs: 146.8, p95Ms: 206.3, iterations: 5 }] }], "table");
    expect(html).toContain("<table");
    expect(html).toContain("Median (ms)");
    expect(html).toContain(">1,000</td>");
    expect(html).toContain(">146.8</td>");
    expect(html).toContain(">206.3</td>");
  });

  it("handles duplicate commit counts without NaN or React key warnings", () => {
    const spy = vi.spyOn(console, "error");
    const html = render([{ label: "layout()", points: [
      { n: 100, medianMs: 1, p95Ms: 2, iterations: 5 },
      { n: 100, medianMs: 1.2, p95Ms: 2.2, iterations: 5 },
    ] }]);
    expect(html.match(/data-n="100"/g)).toHaveLength(4);
    expect(html).not.toContain("NaN");
    expect(spy).not.toHaveBeenCalled();
  });
});
