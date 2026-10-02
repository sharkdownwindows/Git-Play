import { describe, expect, it } from "vitest";
import { ERROR_TEXT, errorText, fail } from "./errors";
import { emptyState } from "./types";

describe("engine errors", () => {
  it("has a nonempty message for every ErrorClass", () => {
    for (const errorClass of Object.keys(ERROR_TEXT) as Array<keyof typeof ERROR_TEXT>) {
      expect(errorText(errorClass, "target").trim().length).toBeGreaterThan(0);
    }
  });

  it("returns a classified failure with the original state", () => {
    const state = emptyState();
    expect(fail(state, "BranchAlreadyExists", "main")).toEqual({
      state,
      ok: false,
      errorClass: "BranchAlreadyExists",
      output: ["fatal: a branch named 'main' already exists"],
    });
  });
});
