import type { LevelRecord, ProgressSet } from "./types";

/**
 * Hợp nhất hai ProgressSet. Hàm thuần — không I/O, không thời gian, không random.
 *
 * Luật giải xung đột khi cùng levelId có ở cả hai bên:
 *   1. Giữ bản hoàn thành SỚM hơn (completedAt nhỏ hơn) — record tốt hơn được giữ.
 *   2. Bằng nhau về thời gian → giữ commandCount nhỏ hơn (lời giải tốt hơn).
 *
 * Hợp nhất chứ không ghi đè toàn bộ: một cập nhật không làm mất level đã lưu.
 */
export function merge(current: ProgressSet, incoming: ProgressSet): ProgressSet {
  const out: ProgressSet = { ...current };
  for (const [levelId, record] of Object.entries(incoming)) {
    const existing = out[levelId];
    out[levelId] = existing ? better(existing, record) : record;
  }
  return out;
}

function better(a: LevelRecord, b: LevelRecord): LevelRecord {
  const aTime = Date.parse(a.completedAt);
  const bTime = Date.parse(b.completedAt);
  if (aTime !== bTime) {
    return aTime < bTime ? a : b;
  }
  return a.commandCount <= b.commandCount ? a : b;
}
