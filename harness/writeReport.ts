import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { ScalingSeries, VerificationReport } from "../src/verification/report";
import { SCHEMA_VERSION, isVerificationReport } from "../src/verification/report";
import { benchmarkLayout } from "./bench/layout";
import { browserSeriesForReport } from "./bench/browserMetrics";
import { formatDivergenceLog, runDifferential, type DifferentialResult } from "./diff/run";
import { runEngine } from "./diff/adapter";
import { generateInvalidSequences, generateRandomSequences, generateValidSequences } from "./diff/generate";
import { runReal } from "./diff/runReal";

const SEED = 42;

export function combineValidResults(exhaustive: DifferentialResult, random: DifferentialResult): DifferentialResult {
  const seen = new Set<string>();
  const divergences = [...exhaustive.divergences, ...random.divergences].filter((item) => {
    const key = JSON.stringify([item.kind, item.commands]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((item, index) => ({ ...item, id: `d${index + 1}` }));
  const coverage = { ...exhaustive.coverage };
  for (const kind of Object.keys(coverage) as (keyof typeof coverage)[]) coverage[kind] += random.coverage[kind];
  const summary = {
    totalCases: exhaustive.summary.totalCases + random.summary.totalCases,
    passed: exhaustive.summary.passed + random.summary.passed,
    failed: exhaustive.summary.failed + random.summary.failed,
    warnings: exhaustive.summary.warnings + random.summary.warnings,
    exhaustiveDepth: exhaustive.summary.exhaustiveDepth,
    randomCases: random.summary.totalCases,
    seed: random.summary.seed,
    durationMs: exhaustive.summary.durationMs + random.summary.durationMs,
  };
  return { ...exhaustive, summary, sequences: summary.totalCases, coverage, divergences };
}

export function validateGeneratedReport(report: VerificationReport, requireBrowserSeries = false): void {
  const layoutPoints = report.scaling.find((series) => series.label === "layout()")?.points;
  const requiredLabels = ["layout()", "SVG render", "animation frame"];
  if (!isVerificationReport(report) || !/^[0-9a-f]{40}$/.test(report.commitSha) ||
      /^0{40}$/.test(report.commitSha) || new Date(report.generatedAt).toISOString() !== report.generatedAt ||
      !/^git version \d+\.\d+/.test(report.gitVersion) || !/^v\d+\.\d+/.test(report.nodeVersion) ||
      report.diffTest.totalCases !== report.diffTest.passed + report.diffTest.failed ||
      report.diffTest.randomCases > report.diffTest.totalCases ||
      (requireBrowserSeries && (report.diffTest.exhaustiveDepth !== 3 ||
        report.diffTest.randomCases !== 5_000 || report.diffTest.failed !== 0 ||
        report.diffTest.totalCases === 0 || report.diffTest.passed / report.diffTest.totalCases < 0.999)) ||
      layoutPoints?.map((point) => point.n).join(",") !== "100,1000,10000,100000" ||
      (requireBrowserSeries && requiredLabels.some((label) =>
        !report.scaling.some((series) => series.label === label && series.points.length > 0))) ||
      report.scaling.some((series) => series.points.some((point) =>
        point.n <= 0 || point.medianMs <= 0 || point.p95Ms <= 0 || point.iterations <= 0))) {
    throw new Error("Invalid generated verification report");
  }
}

function writeAtomically(path: string, content: string): void {
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, content);
  renameSync(temporary, path);
}

export function makeVerificationReport(diff: DifferentialResult, scaling: ScalingSeries,
  browserScaling: ScalingSeries[] = []): VerificationReport {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    commitSha: diff.commitSha,
    gitVersion: diff.gitVersion,
    nodeVersion: process.version,
    diffTest: diff.summary,
    coverage: diff.coverage,
    scaling: [scaling, ...browserScaling],
    divergences: diff.divergences,
  };
}

export function printHardDivergences(diff: DifferentialResult,
  write: (line: string) => void = console.error): void {
  for (const divergence of diff.divergences.filter((item) => item.severity === "hard")) {
    write(JSON.stringify(divergence));
  }
}

export function passesReportGate(exhaustive: DifferentialResult, random: DifferentialResult,
  invalid: DifferentialResult, full: boolean): boolean {
  return exhaustive.summary.failed === 0 && invalid.summary.failed === 0 &&
    (!full || random.summary.passed / random.summary.totalCases >= 0.999);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const full = process.argv.includes("--full");
  const depth = full ? 3 : 2;
  const randomCount = full ? 5_000 : 0;
  const exhaustive = runDifferential(depth, runEngine, runReal, generateValidSequences(depth));
  const random = runDifferential(0, runEngine, runReal,
    generateRandomSequences(randomCount, SEED), randomCount, SEED);
  const invalid = runDifferential(0, runEngine, runReal, generateInvalidSequences());
  if (invalid.summary.failed > 0) {
    for (const divergence of invalid.divergences.filter((item) => item.severity === "hard")) {
      console.error(JSON.stringify(divergence));
    }
    throw new Error(`${invalid.summary.failed} invalid-command hard failures`);
  }
  const diff = combineValidResults(exhaustive, random);
  const browserPath = "harness/bench/browser-results.json";
  let browserScaling: ScalingSeries[] = [];
  if (existsSync(browserPath)) {
    try {
      browserScaling = browserSeriesForReport(JSON.parse(readFileSync(browserPath, "utf8")), diff.commitSha);
    } catch (error) {
      if (full) throw error;
      console.warn(`Browser measurements omitted: ${String(error)}`);
    }
  }
  if (full && browserScaling.length !== 2) {
    throw new Error("Full report requires matching SVG render and animation frame measurements");
  }
  const report = makeVerificationReport(diff, benchmarkLayout(), browserScaling);
  validateGeneratedReport(report, full);
  writeAtomically("public/verification.json", `${JSON.stringify(report, null, 2)}\n`);
  writeAtomically("docs/divergences.md", formatDivergenceLog(diff));
  console.log(`Exhaustive depth ${depth}: ${exhaustive.summary.passed}/${exhaustive.summary.totalCases}, ${exhaustive.summary.durationMs.toFixed(0)} ms`);
  console.log(`Random seed ${SEED}, max depth 20: ${random.summary.passed}/${random.summary.totalCases}, ${random.summary.durationMs.toFixed(0)} ms`);
  console.log(`Invalid transitions: ${invalid.summary.passed}/${invalid.summary.totalCases}, ${invalid.summary.durationMs.toFixed(0)} ms`);
  printHardDivergences(diff);
  if (!passesReportGate(exhaustive, random, invalid, full)) process.exitCode = 1;
}
