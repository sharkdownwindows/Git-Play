import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { layout } from "../../src/viz/layout";
import type { ScalingPoint, ScalingSeries } from "../../src/verification/report";
import { generateSyntheticDag } from "./synth";

const SIZES = [100, 1_000, 10_000, 100_000];
const WARMUPS = 2;
const ITERATIONS = 7;
const SEED = 42;

export function percentile(values: number[], quantile: number): number {
  if (values.length === 0 || quantile < 0 || quantile > 1) {
    throw new RangeError("Expected nonempty samples and a quantile from 0 to 1");
  }
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(quantile * sorted.length) - 1] ?? sorted[0]!;
}

/** Least-squares slope of log(runtime) against log(commit count). */
export function logLogSlope(points: Pick<ScalingPoint, "n" | "medianMs">[]): number {
  if (points.length < 2 || points.some((point) => point.n <= 0 || point.medianMs <= 0)) {
    throw new RangeError("Expected at least two positive scaling points");
  }
  const xs = points.map((point) => Math.log(point.n));
  const ys = points.map((point) => Math.log(point.medianMs));
  const meanX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / ys.length;
  const numerator = xs.reduce((sum, x, index) => sum + (x - meanX) * (ys[index]! - meanY), 0);
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  if (denominator === 0) throw new RangeError("Commit counts must differ");
  return numerator / denominator;
}

export function benchmarkLayout(): ScalingSeries {
  const points: ScalingPoint[] = [];
  for (const n of SIZES) {
    const state = generateSyntheticDag(n, SEED);
    const before = JSON.stringify(state);
    for (let i = 0; i < WARMUPS; i++) layout(state);
    const samples: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      layout(state);
      samples.push(performance.now() - start);
    }
    if (JSON.stringify(state) !== before) throw new Error("layout() mutated benchmark input");
    points.push({ n, medianMs: percentile(samples, 0.5), p95Ms: percentile(samples, 0.95), iterations: ITERATIONS });
  }
  return { label: "layout()", points };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const series = benchmarkLayout();
  console.log(`Layout benchmark: seed=${SEED}, warmups=${WARMUPS}, measured runs=${ITERATIONS}`);
  console.table(series.points.map((point) => ({
    commits: point.n,
    medianMs: point.medianMs.toFixed(3),
    p95Ms: point.p95Ms.toFixed(3),
    iterations: point.iterations,
  })));
  console.log(`Log-log slope (median): ${logLogSlope(series.points).toFixed(3)}`);
  console.log(`SCALING_SERIES_JSON=${JSON.stringify(series)}`);
}
