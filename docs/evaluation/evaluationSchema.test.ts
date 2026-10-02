import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const evaluationFile = (name: string) =>
  readFileSync(new URL(name, import.meta.url), "utf8");

describe("evaluation recruitment metadata", () => {
  it("keeps recruitment source and eligibility criteria in the collection schema", () => {
    const [header] = evaluationFile("raw-results.csv").trimEnd().split("\n");
    const columns = header.split(",");
    const observationTemplate = evaluationFile("OBSERVATION_TEMPLATE.md");

    expect(columns).toContain("recruitment_source");
    expect(columns).toContain("eligibility_criteria");
    expect(observationTemplate).toContain("`recruitment_source`");
    expect(observationTemplate).toContain("`eligibility_criteria`");
  });
});
