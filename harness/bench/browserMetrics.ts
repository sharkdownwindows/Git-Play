import type { ScalingSeries } from "../../src/verification/report";

export interface BrowserPoint {
  n: number;
  samplesMs: number[];
  status: "ok" | "timeout";
}

export interface BrowserMeasurement {
  commitSha: string;
  generatedAt: string;
  browser: string;
  os: string;
  nodeVersion: string;
  gitVersion: string;
  buildMode: "development" | "production";
  seed: number;
  warmups: { render: number; frame: number };
  renderIterations: number;
  animationRuns: number;
  viewport: string;
  mode: "headless";
  saturationPoint: { metric: "SVG render"; n: number } | null;
  render: BrowserPoint[];
  frame: BrowserPoint[];
  layout: BrowserPoint[];
}

export const RENDER_SATURATION_BUDGET_MS = 100;
export const FRAME_BUDGET_MS = 16.7;

export function percentile(samples: readonly number[], quantile: number): number {
  if (!samples.length || samples.some((n) => !Number.isFinite(n) || n < 0) || quantile < 0 || quantile > 1) {
    throw new RangeError("Expected finite nonnegative samples and a quantile from 0 to 1");
  }
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(quantile * sorted.length) - 1)]!;
}

export function classifySaturation(point: BrowserPoint, budgetMs: number): boolean {
  return point.status === "timeout" ||
    (point.samplesMs.length > 0 && percentile(point.samplesMs, 0.95) > budgetMs);
}

/** Frame timestamps are quantized to 0.1 ms, so compare at the timer's resolution. */
export function classifyFrameBudget(point: BrowserPoint, budgetMs = FRAME_BUDGET_MS): boolean {
  return point.status === "timeout" ||
    (point.samplesMs.length > 0 && Math.round(percentile(point.samplesMs, 0.95) * 10) / 10 > budgetMs);
}

export function toScalingSeries(label: string, points: readonly BrowserPoint[]): ScalingSeries {
  return { label, points: points.filter((point) => point.status === "ok" && point.samplesMs.length > 0)
    .map((point) => ({ n: point.n, medianMs: percentile(point.samplesMs, 0.5),
      p95Ms: percentile(point.samplesMs, 0.95), iterations: point.samplesMs.length })) };
}

export function browserSeriesForReport(value: unknown, commitSha: string): ScalingSeries[] {
  if (!value || typeof value !== "object") throw new Error("Invalid browser measurement");
  const measurement = value as BrowserMeasurement;
  if (measurement.commitSha !== commitSha) throw new Error("Browser measurement commit SHA does not match the report source");
  if (!/^[0-9a-f]{40}$/.test(measurement.commitSha) ||
      typeof measurement.generatedAt !== "string" || Number.isNaN(Date.parse(measurement.generatedAt)) ||
      typeof measurement.browser !== "string" || measurement.browser.length === 0 ||
      typeof measurement.os !== "string" || measurement.os.length === 0 ||
      typeof measurement.nodeVersion !== "string" || !/^v\d+\.\d+/.test(measurement.nodeVersion) ||
      typeof measurement.gitVersion !== "string" || !/^git version \d+\.\d+/.test(measurement.gitVersion) ||
      !["development", "production"].includes(measurement.buildMode) ||
      !Number.isSafeInteger(measurement.seed) ||
      !Number.isSafeInteger(measurement.renderIterations) || measurement.renderIterations < 1 ||
      !Number.isSafeInteger(measurement.animationRuns) || measurement.animationRuns < 1 ||
      measurement.mode !== "headless" ||
      !measurement.warmups || !Number.isSafeInteger(measurement.warmups.render) ||
      measurement.warmups.render < 0 || !Number.isSafeInteger(measurement.warmups.frame) ||
      measurement.warmups.frame < 0) {
    throw new Error("Invalid browser measurement metadata");
  }
  if (!Array.isArray(measurement.render) || !Array.isArray(measurement.frame) ||
      !Array.isArray(measurement.layout) || !measurement.render.every(validPoint) ||
      !measurement.frame.every(validPoint) || !measurement.layout.every(validPoint) ||
      measurement.render.some((point) => point.status === "ok" && point.samplesMs.length !== measurement.renderIterations) ||
      measurement.frame.length === 0 || measurement.frame.some((point) => point.n !== 200) ||
      measurement.frame.every((point) => point.status === "timeout")) {
    throw new Error("Invalid browser measurement points");
  }
  const saturationPoint = measurement.render.filter((point) =>
    classifySaturation(point, RENDER_SATURATION_BUDGET_MS)).sort((a, b) => a.n - b.n)[0];
  const expectedSaturation = saturationPoint ? { metric: "SVG render" as const, n: saturationPoint.n } : null;
  if (JSON.stringify(measurement.saturationPoint) !== JSON.stringify(expectedSaturation)) {
    throw new Error("Browser measurement saturation point does not match its samples");
  }
  const series = [toScalingSeries("SVG render", measurement.render),
    toScalingSeries("animation frame", measurement.frame)].filter((item) => item.points.length > 0);
  if (series.length !== 2) throw new Error("Browser measurement is missing SVG render or animation frame samples");
  return series;
}

function validPoint(point: BrowserPoint): boolean {
  return Number.isSafeInteger(point?.n) && point.n > 0 &&
    ["ok", "timeout"].includes(point.status) && Array.isArray(point.samplesMs) &&
    point.samplesMs.every((sample) => Number.isFinite(sample) && sample > 0) &&
    (point.status === "timeout" || point.samplesMs.length > 0);
}
