import { describe, expect, it, vi } from "vitest";
import { isVerificationReport } from "../src/verification/report";
import { runDifferential } from "./diff/run";
import { combineValidResults, makeVerificationReport, passesReportGate,
  printHardDivergences, validateGeneratedReport } from "./writeReport";

describe("verification report generator", () => {
  it("uses measured differential metadata and supplied scaling data", () => {
    const diff = runDifferential(0);
    const scaling = { label: "layout()", points: [100, 1000, 10000, 100000].map((n) =>
      ({ n, medianMs: 1.2, p95Ms: 1.5, iterations: 7 })) };
    const report = makeVerificationReport(diff, scaling);
    expect(isVerificationReport(report)).toBe(true);
    expect(report.commitSha).toBe(diff.commitSha);
    expect(report.gitVersion).toBe(diff.gitVersion);
    expect(report.diffTest).toEqual(diff.summary);
    expect(report.diffTest.exhaustiveDepth).toBe(0);
    expect(report.diffTest.randomCases).toBe(0);
    expect(report.coverage).toEqual(diff.coverage);
    expect(Object.values(report.coverage).every((cases) => cases <= report.diffTest.totalCases)).toBe(true);
    expect(report.scaling).toEqual([scaling]);
    expect(makeVerificationReport(diff, scaling, [{ label: "SVG render", points: [
      { n: 100, medianMs: 30, p95Ms: 40, iterations: 5 },
    ] }]).scaling.map((series) => series.label)).toEqual(["layout()", "SVG render"]);
    expect(new Date(report.generatedAt).toISOString()).toBe(report.generatedAt);
    expect(() => validateGeneratedReport(report)).not.toThrow();
    expect(() => validateGeneratedReport({ ...report, commitSha: "0".repeat(40) })).toThrow();
    expect(() => validateGeneratedReport({ ...report, scaling: [{ label: "layout()", points: [
      { n: 100, medianMs: 0, p95Ms: 1, iterations: 7 },
    ] }] })).toThrow();
  });

  it("keeps invalid cases separate from valid totals and records random seed", () => {
    const exhaustive = runDifferential(0);
    const random = { ...exhaustive, summary: { ...exhaustive.summary,
      totalCases: 0, passed: 0, failed: 0, randomCases: 0, seed: 42 } };
    const combined = combineValidResults(exhaustive, random);
    expect(combined.summary.totalCases).toBe(exhaustive.summary.totalCases);
    expect(combined.summary.seed).toBe(42);
    expect(combined.summary.randomCases).toBe(0);
  });

  it("prints hard divergences and rejects the observed random pass rate", () => {
    const base = runDifferential(0);
    const hard = { id: "d1", kind: "state" as const, severity: "hard" as const,
      commands: ["git merge feature"], expected: "Git", actual: "GitScope" };
    const soft = { ...hard, id: "d2", kind: "output" as const, severity: "soft" as const };
    const write = vi.fn();
    printHardDivergences({ ...base, divergences: [hard, soft] }, write);
    expect(write).toHaveBeenCalledExactlyOnceWith(JSON.stringify(hard));
    const exhaustive = { ...base, summary: { ...base.summary, totalCases: 1160, passed: 1160, failed: 0 } };
    const random = { ...base, summary: { ...base.summary, totalCases: 5000, passed: 4969, failed: 31 } };
    expect(passesReportGate(exhaustive, random, base, true)).toBe(false);
    expect(passesReportGate(exhaustive, { ...random,
      summary: { ...random.summary, passed: 4995, failed: 5 } }, base, true)).toBe(true);
  });

  it("requires all browser series for a full report", () => {
    const diff = runDifferential(0);
    const fullDiff = { ...diff, summary: { ...diff.summary, totalCases: 6_160, passed: 6_160,
      failed: 0, exhaustiveDepth: 3, randomCases: 5_000, seed: 42 } };
    const layout = { label: "layout()", points: [100, 1000, 10000, 100000].map((n) =>
      ({ n, medianMs: 1, p95Ms: 2, iterations: 7 })) };
    const incomplete = makeVerificationReport(fullDiff, layout);
    expect(() => validateGeneratedReport(incomplete, true)).toThrow(/Invalid generated verification report/);
    const complete = makeVerificationReport(fullDiff, layout, [
      { label: "SVG render", points: [{ n: 100, medianMs: 20, p95Ms: 30, iterations: 5 }] },
      { label: "animation frame", points: [{ n: 200, medianMs: 16.6, p95Ms: 16.7, iterations: 215 }] },
    ]);
    expect(() => validateGeneratedReport(complete, true)).not.toThrow();
    expect(() => validateGeneratedReport(complete)).not.toThrow();
  });
});
