import { describe, expect, it } from "vitest";
import { emptyState, type RepoState } from "../core/types";
import { layout } from "./layout";

function state(entries: Array<[string, string[]]>): RepoState {
  const result = emptyState();
  result.commits = Object.fromEntries(entries.map(([id, parents]) => [
    id,
    { id, parents, message: id, timestamp: "2020-01-01T00:00:00.000Z" },
  ]));
  if (entries.length > 0) result.branches = { main: entries.at(-1)![0] };
  return result;
}

function nodePositions(input: RepoState): Map<string, { x: number; y: number }> {
  return new Map(layout(input).nodes.map(({ id, x, y }) => [id, { x, y }]));
}

describe("layout", () => {
  it("trả layout rỗng cho repo chưa có commit", () => {
    expect(layout(emptyState())).toEqual({ nodes: [], edges: [], width: 0, height: 0 });
  });

  it("chuỗi tuyến tính kế thừa cùng làn và tăng độ sâu topo", () => {
    const input = state([["R", []], ["A", ["R"]], ["B", ["A"]]]);
    const positions = nodePositions(input);
    expect(positions.get("R")!.x).toBe(positions.get("A")!.x);
    expect(positions.get("A")!.x).toBe(positions.get("B")!.x);
    expect(positions.get("R")!.y).toBeLessThan(positions.get("A")!.y);
    expect(positions.get("A")!.y).toBeLessThan(positions.get("B")!.y);
    expect(layout(input).edges).toEqual([
      { from: "A", to: "R" },
      { from: "B", to: "A" },
    ]);
  });

  it("hai branch cùng độ sâu dùng hai làn riêng", () => {
    const positions = nodePositions(state([["R", []], ["A", ["R"]], ["B", ["R"]]]));
    expect(positions.get("A")!.y).toBe(positions.get("B")!.y);
    expect(positions.get("A")!.x).not.toBe(positions.get("B")!.x);
    expect(positions.get("A")!.x).toBe(positions.get("R")!.x);
  });

  it("merge có hai parent, lấy độ sâu lớn nhất và kế thừa làn first-parent", () => {
    const input = state([
      ["R", []], ["A", ["R"]], ["B", ["R"]], ["C", ["A"]], ["M", ["C", "B"]],
    ]);
    const positions = nodePositions(input);
    expect(positions.get("M")!.y).toBeGreaterThan(positions.get("C")!.y);
    expect(positions.get("M")!.y).toBeGreaterThan(positions.get("B")!.y);
    expect(positions.get("M")!.x).toBe(positions.get("C")!.x);
    expect(layout(input).edges).toContainEqual({ from: "M", to: "C" });
    expect(layout(input).edges).toContainEqual({ from: "M", to: "B" });
  });

  it("cùng input luôn cho cùng output", () => {
    const input = state([["R", []], ["A", ["R"]], ["B", ["R"]]]);
    expect(layout(input)).toEqual(layout(input));
  });

  it("mọi parent nằm phía trên child", () => {
    const result = layout(state([
      ["R", []], ["A", ["R"]], ["B", ["R"]], ["C", ["A"]], ["M", ["C", "B"]],
    ]));
    const positions = new Map(result.nodes.map((node) => [node.id, node]));
    for (const edge of result.edges) {
      expect(positions.get(edge.to)!.y).toBeLessThan(positions.get(edge.from)!.y);
    }
  });

  it("không mutate RepoState", () => {
    const input = state([["R", []], ["A", ["R"]]]);
    const before = structuredClone(input);
    layout(input);
    expect(input).toEqual(before);
  });

  it("không phụ thuộc thứ tự key trong commits", () => {
    const forward = state([["R", []], ["A", ["R"]], ["B", ["R"]], ["M", ["A", "B"]]]);
    const reverse = state([["M", ["A", "B"]], ["B", ["R"]], ["A", ["R"]], ["R", []]]);
    expect(layout(reverse)).toEqual(layout(forward));
  });
});
