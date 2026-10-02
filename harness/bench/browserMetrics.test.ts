import { describe, expect, it } from "vitest";
import { browserSeriesForReport, classifyFrameBudget, classifySaturation, percentile, toScalingSeries } from "./browserMetrics";

describe("browser measurement summaries", () => {
  it("uses nearest-rank percentiles without mutating samples", () => {
    const samples = [9, 1, 5, 3, 7];
    expect(percentile(samples, 0.5)).toBe(5);
    expect(percentile(samples, 0.95)).toBe(9);
    expect(samples).toEqual([9, 1, 5, 3, 7]);
    expect(() => percentile([], 0.95)).toThrow();
  });

  it("classifies a timeout or exceeded measured budget as saturation", () => {
    expect(classifySaturation({ n: 10_000, status: "timeout", samplesMs: [] }, 100)).toBe(true);
    expect(classifySaturation({ n: 1_000, status: "ok", samplesMs: [80, 90, 140] }, 100)).toBe(true);
    expect(classifySaturation({ n: 100, status: "ok", samplesMs: [20, 30, 40] }, 100)).toBe(false);
  });

  it("classifies animation frame p95 at 0.1ms timer resolution without rounding samples", () => {
    const boundarySamples = [16.6, 16.700000000000728];
    const boundary = { n: 200, status: "ok" as const, samplesMs: boundarySamples };
    expect(percentile(boundary.samplesMs, 0.95)).toBe(16.700000000000728);
    expect(classifyFrameBudget(boundary)).toBe(false);
    expect(boundary.samplesMs).toEqual([16.6, 16.700000000000728]);
    expect(classifyFrameBudget({ n: 200, status: "ok", samplesMs: [16.8] })).toBe(true);
    expect(classifyFrameBudget({ n: 200, status: "timeout", samplesMs: [] })).toBe(true);
  });

  it("keeps raw frame samples and p95 values in the measurement model", () => {
    const samplesMs = [16.600000000000364, 16.700000000000728, 16.8];
    const point = { n: 200, status: "ok" as const, samplesMs };
    expect(toScalingSeries("animation frame", [point]).points[0]).toEqual({
      n: 200, medianMs: 16.700000000000728, p95Ms: 16.8, iterations: 3,
    });
    expect(point.samplesMs).toEqual([16.600000000000364, 16.700000000000728, 16.8]);
    const artifact = JSON.parse(JSON.stringify({ frame: [point], p95Ms: percentile(samplesMs, 0.95) }));
    expect(artifact.frame[0].samplesMs).toEqual(samplesMs);
    expect(artifact.p95Ms).toBe(16.8);
  });

  it("exports only completed browser measurements to ScalingSeries", () => {
    const series = toScalingSeries("SVG render", [
      { n: 100, status: "ok", samplesMs: [30, 20, 40] },
      { n: 1_000, status: "timeout", samplesMs: [] },
    ]);
    expect(series).toEqual({ label: "SVG render", points: [
      { n: 100, medianMs: 30, p95Ms: 40, iterations: 3 },
    ] });
  });

  it("rejects stale or malformed browser samples before report inclusion", () => {
    const measurement = {
      commitSha: "a".repeat(40), generatedAt: "2026-09-30T00:00:00.000Z",
      browser: "Chrome/154.0.8037.57", os: "win32 10.0.26200 x64", nodeVersion: "v24.16.0",
      gitVersion: "git version 2.43.0", buildMode: "development" as const,
      seed: 42, warmups: { render: 1, frame: 2 },
      renderIterations: 2, animationRuns: 10, viewport: "1280x800@1x", mode: "headless" as const,
      saturationPoint: { metric: "SVG render" as const, n: 1_000 },
      render: [
        { n: 100, status: "ok" as const, samplesMs: [20, 30] },
        { n: 1_000, status: "ok" as const, samplesMs: [101, 120] },
      ],
      frame: [{ n: 200, status: "ok" as const, samplesMs: [16, 17] }],
      layout: [{ n: 100, status: "ok" as const, samplesMs: [1] }],
    };
    expect(() => browserSeriesForReport(measurement, "b".repeat(40))).toThrow(/commit SHA/);
  });

  it("accepts matching provenance and exports measured browser series", () => {
    const measurement = {
      commitSha: "a".repeat(40), generatedAt: "2026-09-30T00:00:00.000Z",
      browser: "Chrome/154.0.8037.57", os: "win32 10.0.26200 x64", nodeVersion: "v24.16.0",
      gitVersion: "git version 2.43.0", buildMode: "production" as const,
      seed: 42, warmups: { render: 1, frame: 2 },
      renderIterations: 2, animationRuns: 10, viewport: "1280x800@1x", mode: "headless" as const,
      saturationPoint: { metric: "SVG render" as const, n: 1_000 },
      render: [
        { n: 100, status: "ok" as const, samplesMs: [20, 30] },
        { n: 1_000, status: "ok" as const, samplesMs: [101, 120] },
      ],
      frame: [{ n: 200, status: "ok" as const, samplesMs: [16, 17] }],
      layout: [{ n: 100, status: "ok" as const, samplesMs: [1] }],
    };
    expect(browserSeriesForReport(measurement, measurement.commitSha).map((series) => series.label))
      .toEqual(["SVG render", "animation frame"]);
    expect(browserSeriesForReport(measurement, measurement.commitSha)[0]?.points[1]).toEqual({
      n: 1_000, medianMs: 101, p95Ms: 120, iterations: 2,
    });
    expect(() => browserSeriesForReport(measurement, "b".repeat(40))).toThrow(/commit SHA/);
    expect(() => browserSeriesForReport({ ...measurement, renderIterations: 3 }, measurement.commitSha))
      .toThrow(/metadata|points/);
    expect(() => browserSeriesForReport({ ...measurement, gitVersion: "unknown" }, measurement.commitSha))
      .toThrow(/metadata/);
    expect(() => browserSeriesForReport({ ...measurement, nodeVersion: "unknown" }, measurement.commitSha))
      .toThrow(/metadata/);
    expect(() => browserSeriesForReport({ ...measurement, warmups: { render: -1, frame: 2 } }, measurement.commitSha))
      .toThrow(/metadata/);
    expect(() => browserSeriesForReport({ ...measurement, saturationPoint: null }, measurement.commitSha))
      .toThrow(/saturation point/);
  });

  it("rejects missing frame samples and inconsistent metadata", () => {
    const valid = {
      commitSha: "a".repeat(40), generatedAt: "2026-09-30T00:00:00.000Z",
      browser: "Chrome/154.0.8037.57", os: "Windows", nodeVersion: "v24.21.0",
      gitVersion: "git version 2.43.0", buildMode: "development" as const,
      seed: 42, warmups: { render: 1, frame: 2 },
      renderIterations: 2, animationRuns: 10, viewport: "1280x800@1x", mode: "headless" as const,
      saturationPoint: null,
      render: [{ n: 100, status: "ok" as const, samplesMs: [20, 30] }],
      frame: [{ n: 200, status: "ok" as const, samplesMs: [16, 17] }],
      layout: [],
    };
    expect(browserSeriesForReport(valid, valid.commitSha)).toHaveLength(2);
    expect(() => browserSeriesForReport({ ...valid, frame: [] }, valid.commitSha)).toThrow();
    expect(() => browserSeriesForReport({ ...valid, seed: Number.NaN }, valid.commitSha)).toThrow(/metadata/);
  });

  it("rejects zero or malformed samples", () => {
    const measurement = {
      commitSha: "a".repeat(40), generatedAt: "2026-09-30T00:00:00.000Z",
      browser: "Chrome", os: "Windows", nodeVersion: "v24.21.0", gitVersion: "git version 2.43.0",
      buildMode: "development" as const,
      seed: 42, warmups: { render: 1, frame: 2 }, renderIterations: 1, animationRuns: 10,
      viewport: "1280x800@1x", mode: "headless" as const, saturationPoint: null,
      render: [{ n: 100, status: "ok" as const, samplesMs: [0] }],
      frame: [{ n: 200, status: "ok" as const, samplesMs: [16] }], layout: [],
    };
    expect(() => browserSeriesForReport(measurement, measurement.commitSha)).toThrow();
  });
});
