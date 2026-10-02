// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT 3 — ĐÓNG BĂNG NGÀY 1
// Kiểu tiến độ level được lưu duy nhất trong localStorage.
// ─────────────────────────────────────────────────────────────────────────────

export interface LevelRecord {
  levelId: string;
  /** ISO 8601. */
  completedAt: string;
  commandCount: number;
}

/** Khóa = levelId. Trùng với LevelRecord.levelId. */
export type ProgressSet = Record<string, LevelRecord>;
