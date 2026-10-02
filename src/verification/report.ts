// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT 2 — ĐÓNG BĂNG NGÀY 1
// Harness (D5) GHI file này ra public/verification.json; tab Verification (D6)
// ĐỌC nó. Có contract, D6 dựng được tab trên JSON giả mà không cần chờ harness.
// ─────────────────────────────────────────────────────────────────────────────

import type { CommandKind, ErrorClass } from "../core/types";

export const SCHEMA_VERSION = 1 as const;

// ─── Differential test ───────────────────────────────────────────────────────

export interface DiffTestSummary {
  totalCases: number;
  passed: number;
  /** Lệch ở hard gate — làm đỏ CI. */
  failed: number;
  /** Lệch ở soft check (câu chữ output) — chỉ cảnh báo. */
  warnings: number;
  /** Vét cạn mọi chuỗi lệnh tới độ dài này. */
  exhaustiveDepth: number;
  /** Số case random bổ sung. */
  randomCases: number;
  /** Seed của bộ sinh random — đổi seed là đổi kết quả, nên phải publish. */
  seed: number;
  durationMs: number;
}

/**
 * hard = khác state hoặc khác errorClass → CI đỏ.
 * soft = chỉ khác câu chữ output → cảnh báo, không chặn merge.
 */
export type DivergenceSeverity = "hard" | "soft";
export type DivergenceKind = "state" | "errorClass" | "output";

export interface Divergence {
  id: string;
  kind: DivergenceKind;
  severity: DivergenceSeverity;
  /** Chuỗi lệnh dẫn tới lệch, dạng CLI, tái hiện được bằng tay. */
  commands: string[];
  /** Git thật cho ra gì. */
  expected: string;
  /** Engine cho ra gì. */
  actual: string;
  expectedErrorClass?: ErrorClass | null;
  actualErrorClass?: ErrorClass | null;
}

/** Bao nhiêu case đã chạy cho mỗi lệnh — để thấy chỗ nào phủ mỏng. */
export type CoverageByCommand = Record<CommandKind, number>;

// ─── Benchmark ───────────────────────────────────────────────────────────────

export interface ScalingPoint {
  /** Số commit trong DAG. */
  n: number;
  medianMs: number;
  p95Ms: number;
  iterations: number;
}

export interface ScalingSeries {
  label: string;
  points: ScalingPoint[];
}

// ─── Report ──────────────────────────────────────────────────────────────────

export interface VerificationReport {
  schemaVersion: typeof SCHEMA_VERSION;
  /** ISO 8601. */
  generatedAt: string;
  /** Commit sinh ra báo cáo — để biết số liệu thuộc về bản code nào. */
  commitSha: string;
  /** `git --version` của máy chạy harness. Khác version có thể khác hành vi. */
  gitVersion: string;
  nodeVersion: string;
  diffTest: DiffTestSummary;
  coverage: CoverageByCommand;
  scaling: ScalingSeries[];
  divergences: Divergence[];
}

/** Reject incomplete reports before the tab reads their fields. */
export function isVerificationReport(value: unknown): value is VerificationReport {
  const isRecord = (item: unknown): item is Record<string, unknown> =>
    typeof item === "object" && item !== null && !Array.isArray(item);
  const hasNumbers = (item: Record<string, unknown>, keys: string[]): boolean =>
    keys.every((key) => typeof item[key] === "number" && Number.isFinite(item[key]));

  if (!isRecord(value)) return false;
  const r = value;
  if (!isRecord(r.diffTest) || !isRecord(r.coverage)) return false;

  return (
    r.schemaVersion === SCHEMA_VERSION &&
    typeof r.generatedAt === "string" && !Number.isNaN(Date.parse(r.generatedAt)) &&
    typeof r.commitSha === "string" && /^[0-9a-f]{40}$/i.test(r.commitSha) &&
    typeof r.gitVersion === "string" && r.gitVersion.length > 0 &&
    typeof r.nodeVersion === "string" && r.nodeVersion.length > 0 &&
    hasNumbers(r.diffTest, [
      "totalCases", "passed", "failed", "warnings", "exhaustiveDepth",
      "randomCases", "seed", "durationMs",
    ]) &&
    hasNumbers(r.coverage, ["commit", "branch", "switch", "checkout", "merge"]) &&
    Array.isArray(r.scaling) &&
    r.scaling.every((series: unknown) =>
      isRecord(series) && typeof series.label === "string" &&
      Array.isArray(series.points) && series.points.every((point: unknown) =>
        isRecord(point) && hasNumbers(point, ["n", "medianMs", "p95Ms", "iterations"])
      )
    ) &&
    Array.isArray(r.divergences)
    && r.divergences.every((divergence: unknown) =>
      isRecord(divergence) &&
      typeof divergence.id === "string" &&
      ["state", "errorClass", "output"].includes(String(divergence.kind)) &&
      ["hard", "soft"].includes(String(divergence.severity)) &&
      Array.isArray(divergence.commands) &&
      divergence.commands.every((command: unknown) => typeof command === "string") &&
      typeof divergence.expected === "string" &&
      typeof divergence.actual === "string"
    )
  );
}
