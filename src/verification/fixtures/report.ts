import type { VerificationReport } from "../report";

/** Stable unit-test data. This is deliberately separate from the CI report. */
export const verificationReportFixture: VerificationReport = {
  schemaVersion: 1,
  generatedAt: "2026-09-30T00:00:00.000Z",
  commitSha: "a".repeat(40),
  gitVersion: "git version 2.43.0",
  nodeVersion: "v24.21.0",
  diffTest: {
    totalCases: 10,
    passed: 10,
    failed: 0,
    warnings: 1,
    exhaustiveDepth: 3,
    randomCases: 5_000,
    seed: 42,
    durationMs: 1_000,
  },
  coverage: { commit: 10, branch: 9, switch: 8, checkout: 7, merge: 6 },
  scaling: [
    { label: "layout()", points: [{ n: 100, medianMs: 1, p95Ms: 2, iterations: 7 }] },
    { label: "SVG render", points: [{ n: 100, medianMs: 20, p95Ms: 30, iterations: 5 }] },
    { label: "animation frame", points: [{ n: 200, medianMs: 16.6, p95Ms: 16.7, iterations: 215 }] },
  ],
  divergences: [{
    id: "soft-1", kind: "output", severity: "soft", commands: ["git branch"],
    expected: "feature", actual: "  feature",
  }],
};
