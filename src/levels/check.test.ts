import { describe, expect, it } from "vitest";
import type { Head, RepoState } from "../core/types";
import { check } from "./check";
import type { RepoShape } from "./schema";

function state(
  parents: Record<string, string[]>,
  branches: Record<string, string>,
  head: Head = { detached: false, ref: "main", commit: null },
): RepoState {
  return {
    commits: Object.fromEntries(
      Object.entries(parents).map(([id, commitParents], index) => [
        id,
        {
          id,
          message: `message-${index}`,
          parents: commitParents,
          timestamp: `2026-09-01T00:00:0${index}.000Z`,
        },
      ]),
    ),
    branches,
    head,
    snapshot: null,
    workingTree: null,
    index: null,
    conflicts: null,
  };
}

const target: RepoShape = {
  parents: { C1: [], C2: ["C1"] },
  branches: { main: "C2" },
  head: { detached: false, ref: "main", commit: null },
};

describe("check", () => {
  it("khớp cấu trúc dù tên và message commit khác nhau (FR-29)", () => {
    expect(check(state({ aaa: [], bbb: ["aaa"] }, { main: "bbb" }), target)).toBe(
      true,
    );
  });

  it("bỏ qua message và timestamp", () => {
    const actual = state({ aaa: [], bbb: ["aaa"] }, { main: "bbb" });
    actual.commits.aaa!.message = "different";
    actual.commits.bbb!.timestamp = "2030-01-01T00:00:00.000Z";
    expect(check(actual, target)).toBe(true);
  });

  it("giữ đúng vị trí branch", () => {
    expect(
      check(
        state({ aaa: [], bbb: ["aaa"] }, { main: "aaa" }),
        target,
      ),
    ).toBe(false);
  });

  it("giữ đúng detached HEAD", () => {
    const detachedTarget: RepoShape = {
      ...target,
      head: { detached: true, ref: null, commit: "C2" },
    };
    expect(
      check(
        state(
          { aaa: [], bbb: ["aaa"] },
          { main: "bbb" },
          { detached: true, ref: null, commit: "bbb" },
        ),
        detachedTarget,
      ),
    ).toBe(true);
    expect(check(state({ aaa: [], bbb: ["aaa"] }, { main: "bbb" }), detachedTarget)).toBe(false);
  });

  it("từ chối branch hoặc detached HEAD trỏ đến commit không tồn tại", () => {
    expect(check(state({ aaa: [], bbb: ["aaa"] }, { main: "missing" }), target)).toBe(false);
    expect(check(state({ aaa: [], bbb: ["aaa"] }, { main: "bbb" }), {
      ...target,
      branches: { main: "missing" },
    })).toBe(false);
    expect(check(state(
      { aaa: [], bbb: ["aaa"] },
      { main: "bbb" },
      { detached: true, ref: null, commit: "missing" },
    ), {
      ...target,
      head: { detached: true, ref: null, commit: "C2" },
    })).toBe(false);
  });

  it("attached HEAD phải trỏ đến branch sở hữu, kể cả tên trùng thuộc tính prototype", () => {
    const invalidHead: Head = { detached: false, ref: "toString", commit: null };
    expect(check(state({ a: [] }, {}, invalidHead), {
      parents: { A: [] },
      branches: {},
      head: invalidHead,
    })).toBe(false);
  });

  it("từ chối đồ thị có chu trình dù hai phía giống nhau", () => {
    const cyclic: RepoShape = {
      parents: { A: ["B"], B: ["A"] },
      branches: { main: "A" },
      head: { detached: false, ref: "main", commit: null },
    };
    expect(check(state({ a: ["b"], b: ["a"] }, { main: "a" }), cyclic)).toBe(false);
  });

  it("không nhầm DAG dùng chung parent với hai parent độc lập", () => {
    const sharingTarget: RepoShape = {
      parents: {
        R1: [],
        R2: [],
        A: ["R1"],
        B: ["R2"],
        M: ["A", "B"],
      },
      branches: { main: "M" },
      head: { detached: false, ref: "main", commit: null },
    };
    const sharedParent = state(
      {
        root: [],
        unused: [],
        left: ["root"],
        right: ["root"],
        merge: ["left", "right"],
      },
      { main: "merge" },
    );

    expect(check(sharedParent, sharingTarget)).toBe(false);
  });

  it("giữ thứ tự first-parent của merge commit", () => {
    const mergeTarget: RepoShape = {
      parents: { R: [], A: ["R"], B: ["R"], M: ["A", "B"] },
      branches: { main: "M", feature: "B" },
      head: { detached: false, ref: "main", commit: null },
    };
    const reversed = state(
      { root: [], left: ["root"], right: ["root"], merge: ["right", "left"] },
      { main: "merge", feature: "right" },
    );

    expect(check(reversed, mergeTarget)).toBe(false);
  });

  it("sandbox không bao giờ tự đánh dấu hoàn thành", () => {
    expect(check(state({}, {}), null)).toBe(false);
  });

  it("không sửa RepoState đầu vào", () => {
    const actual = state({ aaa: [], bbb: ["aaa"] }, { main: "bbb" });
    const before = structuredClone(actual);
    expect(check(actual, target)).toBe(true);
    expect(actual).toEqual(before);
  });
});
