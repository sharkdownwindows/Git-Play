import { describe, expect, it } from "vitest";
import { formatDuration, formatInt, formatUtc, gitVersionLabel, shortSha } from "./format";

describe("verification formatters", () => {
  it("formats counts, durations and UTC timestamps", () => {
    expect(formatInt(19_377)).toBe("19,377");
    expect(formatDuration(1_121_581.631335)).toBe("18m 42s");
    expect(formatDuration(3_661_000)).toBe("1h 1m");
    expect(formatUtc("2026-09-30T08:07:30.216Z")).toBe("30 Sep 2026, 08:07 UTC");
  });

  it("formats provenance identifiers", () => {
    expect(shortSha("4448efb8aaecea310266c3ab002b6928362db466")).toBe("4448efb");
    expect(gitVersionLabel("git version 2.43.0")).toBe("git 2.43.0");
    expect(gitVersionLabel("2.43.0")).toBe("git 2.43.0");
  });
});
