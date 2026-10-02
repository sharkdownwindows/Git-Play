import { describe, expect, it } from "vitest";
import { commandReferences } from "./data";
import { referenceAfter } from "./referenceAfter";
import { refChanges } from "./refChanges";

describe("refChanges", () => {
  it("derives commit and branch movement from the engine-produced after state", () => {
    const commit = commandReferences.find((entry) => entry.key === "commit")!;
    const after = referenceAfter(commit)!;
    const changes = refChanges(commit.before, after);

    expect(changes.labels).toEqual(["+ commit c2", "main → c2"]);
    expect([...changes.changedNodes]).toEqual(["c2"]);
    expect([...changes.changedEdges]).toEqual(["c2>c1"]);
  });

  it("tracks branch creation and HEAD-only changes without inventing commits", () => {
    const branch = commandReferences.find((entry) => entry.key === "branch")!;
    const checkout = commandReferences.find((entry) => entry.key === "checkout")!;

    expect(refChanges(branch.before, referenceAfter(branch)!).labels).toEqual(["+ branch feature"]);
    expect(refChanges(checkout.before, referenceAfter(checkout)!).labels).toEqual(["HEAD detached @ c1"]);
    expect(refChanges(checkout.before, referenceAfter(checkout)!).changedNodes.size).toBe(0);
  });

  it("marks both newly introduced merge edges", () => {
    const merge = commandReferences.find((entry) => entry.key === "merge")!;
    const changes = refChanges(merge.before, referenceAfter(merge)!);

    expect(changes.labels).toEqual(["+ commit c4", "main → c4"]);
    expect([...changes.changedEdges].sort()).toEqual(["c4>c2", "c4>c3"]);
  });
});
