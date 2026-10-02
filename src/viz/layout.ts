// KHÔNG import React hay bất kỳ thư viện UI nào ở file này!

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

export interface LayoutEdge {
  from: string;
  to: string;
}

export interface Layout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

export interface CommitLike {
  id: string;
  parents: string[];
  [key: string]: any;
}

export interface RepoState {
  commits: Record<string, CommitLike> | Map<string, CommitLike>;
  // Cho phép nhận các trường khác của RepoState mà không gây lỗi
  [key: string]: any;
}

const GRID_SPACING = 80;
const PADDING = 40;

export function layout(state: RepoState): Layout {
  // Chuẩn hóa danh sách commit thành Map
  const commitMap = new Map<string, CommitLike>();
  if (state.commits instanceof Map) {
    for (const [id, c] of state.commits.entries()) {
      commitMap.set(id, c);
    }
  } else if (state.commits && typeof state.commits === "object") {
    for (const [id, c] of Object.entries(state.commits)) {
      if (c) {
        commitMap.set(id, c);
      }
    }
  }

  const commitIds = Array.from(commitMap.keys());
  if (commitIds.length === 0) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  // 1. Tính depth (Longest-path từ root) bằng Memoization / DFS
  const depthMemo = new Map<string, number>();

  function getDepth(id: string): number {
    if (depthMemo.has(id)) {
      return depthMemo.get(id)!;
    }

    const commit = commitMap.get(id);
    if (!commit || !commit.parents || commit.parents.length === 0) {
      depthMemo.set(id, 0);
      return 0;
    }

    let maxParentDepth = -1;
    for (const pId of commit.parents) {
      // Bỏ qua nếu parent commit chưa nằm trong state/lịch sử được tải
      if (commitMap.has(pId)) {
        const pDepth = getDepth(pId);
        if (pDepth > maxParentDepth) {
          maxParentDepth = pDepth;
        }
      }
    }

    const d = maxParentDepth === -1 ? 0 : maxParentDepth + 1;
    depthMemo.set(id, d);
    return d;
  }

  let maxDepth = 0;
  for (const id of commitIds) {
    const d = getDepth(id);
    if (d > maxDepth) {
      maxDepth = d;
    }
  }

  // 2. Sắp xếp các commit theo thứ tự topo tăng dần (depth nhỏ lên trước)
  // Tie-breaker bằng id để đảm bảo 100% deterministic
  const sortedIds = [...commitIds].sort((a, b) => {
    const dDiff = depthMemo.get(a)! - depthMemo.get(b)!;
    if (dDiff !== 0) return dDiff;
    return a.localeCompare(b);
  });

  // 3. Gán làn (Lane Allocation)
  const nodeLane = new Map<string, number>();
  // Tập các làn đã bị chiếm ở mỗi độ sâu: Map<depth, Set<lane>>
  const occupiedLanesByDepth = new Map<number, Set<number>>();

  function isLaneOccupied(depth: number, lane: number): boolean {
    const set = occupiedLanesByDepth.get(depth);
    return set ? set.has(lane) : false;
  }

  function markLaneOccupied(depth: number, lane: number): void {
    let set = occupiedLanesByDepth.get(depth);
    if (!set) {
      set = new Set<number>();
      occupiedLanesByDepth.set(depth, set);
    }
    set.add(lane);
  }

  let maxLane = 0;

  for (const id of sortedIds) {
    const commit = commitMap.get(id)!;
    const depth = depthMemo.get(id)!;
    const parents = commit.parents || [];

    let chosenLane = -1;

    // Ưu tiên kế thừa làn của parent đầu tiên nếu chưa bị chiếm ở độ sâu này
    const firstParent = parents[0];
    if (firstParent !== undefined && commitMap.has(firstParent)) {
      const firstParentLane = nodeLane.get(firstParent);
      if (
        firstParentLane !== undefined &&
        !isLaneOccupied(depth, firstParentLane)
      ) {
        chosenLane = firstParentLane;
      }
    }

    // Nếu không kế thừa được, lấy làn nguyên không âm nhỏ nhất còn trống
    if (chosenLane === -1) {
      let candidate = 0;
      while (isLaneOccupied(depth, candidate)) {
        candidate++;
      }
      chosenLane = candidate;
    }

    nodeLane.set(id, chosenLane);
    markLaneOccupied(depth, chosenLane);

    if (chosenLane > maxLane) {
      maxLane = chosenLane;
    }
  }

  // 4. Tính toạ độ Nodes
  const nodes: LayoutNode[] = [];
  for (const id of commitIds) {
    const depth = depthMemo.get(id)!;
    const lane = nodeLane.get(id)!;

    // Root ở trên; mỗi child nằm dưới parent theo độ sâu topo.
    const x = lane * GRID_SPACING + PADDING;
    const y = depth * GRID_SPACING + PADDING;

    nodes.push({ id, x, y });
  }

  // 5. Sinh Edges (từ child commit trỏ về parent commit)
  const edges: LayoutEdge[] = [];
  for (const id of commitIds) {
    const commit = commitMap.get(id)!;
    if (commit.parents) {
      for (const pId of commit.parents) {
        if (commitMap.has(pId)) {
          edges.push({ from: id, to: pId });
        }
      }
    }
  }

  // Sắp xếp nodes và edges theo id để đảm bảo tính đồng nhất khi so sánh deep-equal
  nodes.sort((a, b) => a.id.localeCompare(b.id));
  edges.sort((a, b) => {
    const cmp = a.from.localeCompare(b.from);
    return cmp !== 0 ? cmp : a.to.localeCompare(b.to);
  });

  const width = (maxLane + 1) * GRID_SPACING + PADDING;
  const height = (maxDepth + 1) * GRID_SPACING + PADDING;

  return { nodes, edges, width, height };
}
