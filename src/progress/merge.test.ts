import { describe, expect, it } from "vitest";
import { merge } from "./merge";
import type { LevelRecord } from "./types";

function record(levelId: string, completedAt: string, commandCount: number): LevelRecord {
  return { levelId, completedAt, commandCount };
}

describe("merge progress", () => {
  it("giữ level chỉ có ở mỗi tập và không mutate input", () => {
    const local = { "01": record("01", "2026-09-01T00:00:00Z", 4) };
    const incoming = { "02": record("02", "2026-09-02T00:00:00Z", 5) };
    const result = merge(local, incoming);
    expect(result).toEqual({ ...local, ...incoming });
    expect(local).toEqual({ "01": record("01", "2026-09-01T00:00:00Z", 4) });
    expect(incoming).toEqual({ "02": record("02", "2026-09-02T00:00:00Z", 5) });
  });

  it("giữ completion sớm hơn dù commandCount lớn hơn", () => {
    const earlier = record("01", "2026-09-01T00:00:00Z", 9);
    const later = record("01", "2026-09-02T00:00:00Z", 2);
    expect(merge({ "01": later }, { "01": earlier })["01"]).toEqual(earlier);
    expect(merge({ "01": earlier }, { "01": later })["01"]).toEqual(earlier);
  });

  it("so thời điểm thực khi timestamp ISO có offset khác nhau", () => {
    const earlier = record("01", "2026-09-01T01:00:00+02:00", 9);
    const later = record("01", "2026-09-01T00:00:00Z", 2);
    expect(merge({ "01": earlier }, { "01": later })["01"]).toEqual(earlier);
  });

  it("khi cùng thời gian giữ commandCount nhỏ hơn", () => {
    const faster = record("01", "2026-09-01T00:00:00Z", 3);
    const slower = record("01", "2026-09-01T00:00:00Z", 7);
    expect(merge({ "01": slower }, { "01": faster })["01"]).toEqual(faster);
    expect(merge({ "01": faster }, { "01": slower })["01"]).toEqual(faster);
  });

  it("cùng thời điểm với offset khác nhau cũng dùng commandCount", () => {
    const faster = record("01", "2026-09-01T01:00:00+01:00", 3);
    const slower = record("01", "2026-09-01T00:00:00Z", 7);
    expect(merge({ "01": slower }, { "01": faster })["01"]).toEqual(faster);
  });
});
