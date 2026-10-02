import type { CSSProperties } from "react";

export const INTRO_ANIMATION_MAX_MS = 1200;

interface IntroNode {
  id: string;
  x: number;
  y: number;
  delay: number;
  active?: boolean;
  head?: boolean;
  merge?: boolean;
  branch?: "feature" | "fix" | "release";
  chipSide?: "left" | "right";
}

interface IntroEdge {
  id: string;
  d: string;
  delay: number;
  active?: boolean;
}

const NODES: IntroNode[] = [
  { id: "m0", x: 72, y: 81, delay: 150 },
  { id: "m1", x: 72, y: 180, delay: 186 },
  { id: "a1", x: 172.8, y: 261, delay: 221 },
  { id: "m2", x: 72, y: 324, delay: 257 },
  { id: "a2", x: 172.8, y: 396, delay: 293 },
  { id: "m3", x: 72, y: 477, delay: 329, merge: true },
  { id: "r0", x: 1368, y: 63, delay: 364 },
  { id: "r1", x: 1368, y: 162, delay: 400 },
  { id: "d1", x: 1166.4, y: 243, delay: 436 },
  { id: "r2", x: 1368, y: 288, delay: 471 },
  { id: "r3", x: 1368, y: 423, delay: 507 },
  { id: "d2", x: 1166.4, y: 450, delay: 543 },
  { id: "r5", x: 1368, y: 693, delay: 579 },
  { id: "r6", x: 1368, y: 810, delay: 614, branch: "release", chipSide: "left" },
  { id: "x1", x: 1267.2, y: 369, delay: 450, active: true },
  { id: "x2", x: 1267.2, y: 504, delay: 504, active: true, branch: "fix", chipSide: "left" },
  { id: "r4", x: 1368, y: 576, delay: 559, active: true, merge: true },
  { id: "f1", x: 273.6, y: 558, delay: 613, active: true },
  { id: "m4", x: 72, y: 594, delay: 667, active: true },
  { id: "f2", x: 273.6, y: 684, delay: 721, active: true, branch: "feature", chipSide: "right" },
  { id: "m5", x: 72, y: 711, delay: 776, active: true },
  { id: "hd", x: 72, y: 819, delay: 850, head: true },
];

const EDGES: IntroEdge[] = [
  { id: "m0-m1", d: "M72 81 L72 180", delay: 106 },
  { id: "m1-a1", d: "M72 180 C72 220.5 172.8 220.5 172.8 261", delay: 141 },
  { id: "m1-m2", d: "M72 180 L72 324", delay: 177 },
  { id: "a1-a2", d: "M172.8 261 L172.8 396", delay: 213 },
  { id: "m2-m3", d: "M72 324 L72 477", delay: 249 },
  { id: "a2-m3", d: "M172.8 396 C172.8 436.5 72 436.5 72 477", delay: 249 },
  { id: "r0-r1", d: "M1368 63 L1368 162", delay: 320 },
  { id: "r1-d1", d: "M1368 162 C1368 202.5 1166.4 202.5 1166.4 243", delay: 356 },
  { id: "r1-r2", d: "M1368 162 L1368 288", delay: 391 },
  { id: "r2-r3", d: "M1368 288 L1368 423", delay: 427 },
  { id: "d1-d2", d: "M1166.4 243 L1166.4 450", delay: 463 },
  { id: "r4-r5", d: "M1368 576 L1368 693", delay: 499 },
  { id: "r5-r6", d: "M1368 693 L1368 810", delay: 534 },
  { id: "r2-x1", d: "M1368 288 C1368 328.5 1267.2 328.5 1267.2 369", delay: 370 },
  { id: "x1-x2", d: "M1267.2 369 L1267.2 504", delay: 424, active: true },
  { id: "r3-r4", d: "M1368 423 L1368 576", delay: 479 },
  { id: "x2-r4", d: "M1267.2 504 C1267.2 540 1368 540 1368 576", delay: 479, active: true },
  { id: "m3-f1", d: "M72 477 C72 517.5 273.6 517.5 273.6 558", delay: 533 },
  { id: "m3-m4", d: "M72 477 L72 594", delay: 587 },
  { id: "f1-f2", d: "M273.6 558 L273.6 684", delay: 641, active: true },
  { id: "m4-m5", d: "M72 594 L72 711", delay: 696, active: true },
  { id: "m5-hd", d: "M72 711 L72 819", delay: 770, active: true },
  { id: "f2-hd", d: "M273.6 684 C273.6 751.5 72 751.5 72 819", delay: 770, active: true },
];

function animationDelay(delay: number): CSSProperties {
  return { animationDelay: `${delay}ms` };
}

function BranchChip({ node }: { node: IntroNode }) {
  if (!node.branch) return null;
  const width = node.branch.length * 6.8 + 14;
  const x = node.chipSide === "left" ? node.x - 23 - width : node.x + 23;
  const y = node.y - 10;

  return (
    <g className="intro-graph__chip" style={animationDelay(node.delay + 120)}>
      <rect x={x} y={y} width={width} height="20" rx="4" />
      <text x={x + width / 2} y={y + 14} textAnchor="middle">{node.branch}</text>
    </g>
  );
}

export function IntroGraph() {
  return (
    <svg
      className="intro-graph"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g className="intro-graph__edges">
        {EDGES.map((edge) => (
          <path
            key={edge.id}
            className={edge.active ? "intro-graph__edge intro-graph__edge--active" : "intro-graph__edge"}
            d={edge.d}
            pathLength="1"
            style={animationDelay(edge.delay)}
          />
        ))}
      </g>

      <g className="intro-graph__nodes">
        {NODES.map((node) => (
          <g key={node.id}>
            <g transform={`translate(${node.x} ${node.y})`}>
              <g
                className={`intro-graph__node${node.active ? " intro-graph__node--active" : ""}${node.head ? " intro-graph__node--head" : ""}`}
                style={animationDelay(node.delay)}
              >
                {node.head && <circle className="intro-graph__head-halo" r="22" />}
                <circle className="intro-graph__node-body" r="15" />
                {node.merge && <circle className="intro-graph__merge-dot" r="3" />}
              </g>
            </g>
            <BranchChip node={node} />
          </g>
        ))}

        <g
          className="intro-graph__chip intro-graph__chip--head"
          style={animationDelay(INTRO_ANIMATION_MAX_MS - 240)}
        >
          <rect x="95" y="809" width="42" height="20" rx="4" />
          <text x="116" y="823" textAnchor="middle">HEAD</text>
          <rect className="intro-graph__branch-box" x="138" y="809" width="41.2" height="20" rx="4" />
          <text className="intro-graph__branch-text" x="158.6" y="823" textAnchor="middle">main</text>
        </g>
      </g>
    </svg>
  );
}
