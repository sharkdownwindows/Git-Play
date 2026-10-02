import { describe, expect, it } from "vitest";
import { generateSyntheticDag } from "./synth";
import { practiceGraphProps } from "./browserWorkload";

describe("browser animation workload", () => {
  it("uses Practice presentation props and marks only the commit added in after", () => {
    const before = generateSyntheticDag(199, 42);
    const after = generateSyntheticDag(200, 42);

    expect(practiceGraphProps(before, before)).toEqual({
      state: before, presentation: "practice", scale: 1, newId: null,
    });
    expect(practiceGraphProps(before, after)).toEqual({
      state: after, presentation: "practice", scale: 1, newId: "c199",
    });
  });
});
