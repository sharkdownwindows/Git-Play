import { describe, expect, it } from "vitest";
import { logLogSlope, percentile } from "./layout";

describe("layout benchmark statistics", () => {
  it("computes median and nearest-rank p95 without changing samples", () => {
    const samples = [9, 1, 5, 3, 7];
    expect(percentile(samples, 0.5)).toBe(5);
    expect(percentile(samples, 0.95)).toBe(9);
    expect(samples).toEqual([9, 1, 5, 3, 7]);
  });

  it("calculates a known log-log slope", () => {
    expect(logLogSlope([
      { n: 100, medianMs: 1 },
      { n: 1_000, medianMs: 10 },
      { n: 10_000, medianMs: 100 },
    ])).toBeCloseTo(1, 10);
    expect(logLogSlope([
      { n: 100, medianMs: 2 },
      { n: 1_000, medianMs: 2 },
    ])).toBeCloseTo(0, 10);
  });
});
