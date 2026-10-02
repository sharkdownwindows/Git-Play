import { describe, expect, it } from "vitest";
import fixture from "../../public/verification.json";
import { isVerificationReport } from "./report";

describe("public/verification.json", () => {
  it("parse được bằng kiểu ở Contract 2", () => {
    expect(isVerificationReport(fixture)).toBe(true);
  });

  it("có đủ trường bắt buộc", () => {
    expect(fixture.generatedAt).toBeTruthy();
    expect(fixture.commitSha).toHaveLength(40);
    expect(fixture.gitVersion).toMatch(/^git version /);
    expect(Object.keys(fixture.coverage).sort()).toEqual(
      ["branch", "checkout", "commit", "merge", "switch"],
    );
    expect(fixture.scaling[0]?.points).toHaveLength(4);
  });

  it("rejects an incomplete report even when the schema version matches", () => {
    const { coverage: _coverage, ...incomplete } = fixture;
    expect(isVerificationReport(incomplete)).toBe(false);
    expect(isVerificationReport({ ...fixture, diffTest: { ...fixture.diffTest, randomCases: undefined } })).toBe(false);
    expect(isVerificationReport({ ...fixture, scaling: [{ label: "layout()", points: [{ n: 100 }] }] })).toBe(false);
  });

  it("requires a valid timestamp and full commit SHA", () => {
    expect(isVerificationReport({ ...fixture, generatedAt: "" })).toBe(false);
    expect(isVerificationReport({ ...fixture, commitSha: fixture.commitSha.slice(0, 7) })).toBe(false);
    expect(isVerificationReport(fixture)).toBe(true);
  });
});
