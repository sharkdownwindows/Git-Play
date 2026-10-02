import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { generateSyntheticDag } from "./synth";
import { layout } from "../../src/viz/layout";
import { GraphView } from "../../src/viz/GraphView";
import { practiceGraphProps } from "./browserWorkload";

const params = new URLSearchParams(location.search);
const n = Number(params.get("n"));
const mode = params.get("mode");
const seed = 42;
const renderWarmups = Number(params.get("renderWarmups") ?? 1);
const renderIterations = Number(params.get("renderIterations") ?? 5);
const frameWarmups = Number(params.get("frameWarmups") ?? 2);
const animationRuns = Number(params.get("animationRuns") ?? 10);
const animationMs = Number(params.get("animationMs") ?? 350);
const root = createRoot(document.getElementById("root")!);
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const afterPaint = async () => { await nextFrame(); await nextFrame(); };

async function measureRender(): Promise<{ render: number[]; layout: number[] }> {
  const state = generateSyntheticDag(n, seed);
  const render: number[] = [];
  const layouts: number[] = [];
  for (let i = 0; i < renderWarmups + renderIterations; i++) {
    flushSync(() => root.render(null));
    const layoutStart = performance.now();
    layout(state);
    const layoutMs = performance.now() - layoutStart;
    const start = performance.now();
    flushSync(() => root.render(createElement(GraphView, { state })));
    await afterPaint();
    if (i >= renderWarmups) { render.push(performance.now() - start); layouts.push(layoutMs); }
  }
  return { render, layout: layouts };
}

async function measureFrames(): Promise<{ frame: number[]; layout: number[] }> {
  const before = generateSyntheticDag(n - 1, seed);
  const after = generateSyntheticDag(n, seed);
  const frames: number[] = [];
  const layouts: number[] = [];
  for (let i = 0; i < frameWarmups + animationRuns; i++) {
    flushSync(() => root.render(createElement(GraphView, practiceGraphProps(before, before))));
    await afterPaint();
    const layoutStart = performance.now();
    layout(after);
    const layoutMs = performance.now() - layoutStart;
    let last = performance.now();
    const samples: number[] = [];
    const start = performance.now();
    flushSync(() => root.render(createElement(GraphView, practiceGraphProps(before, after))));
    while (performance.now() - start < animationMs) {
      await new Promise<void>((resolve) => requestAnimationFrame((time) => {
        samples.push(time - last);
        last = time;
        resolve();
      }));
    }
    if (i >= frameWarmups) { frames.push(...samples); layouts.push(layoutMs); }
  }
  return { frame: frames, layout: layouts };
}

void (async () => {
  try {
    const result = mode === "frame" ? await measureFrames() : await measureRender();
    document.body.dataset.result = JSON.stringify({ ok: true, ...result });
  } catch (error) {
    document.body.dataset.result = JSON.stringify({ ok: false, error: String(error) });
  }
})();
