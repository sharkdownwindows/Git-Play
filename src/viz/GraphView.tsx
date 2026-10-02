import type { RepoState } from "../core/types";
import { CommitNode } from "./CommitNode";
import { GraphEdge } from "./edges";
import { layout } from "./layout";
import { PracticeRefLabel, practiceRefWidth, RefLabel, type PracticeRefKind } from "./RefLabel";

interface Props {
  state: RepoState;
  width?: number;
  height?: number;
  presentation?: "legacy" | "practice";
  scale?: number;
  newId?: string | null;
  changed?: ReadonlySet<string>;
  changedEdges?: ReadonlySet<string>;
  ghostIds?: ReadonlySet<string>;
  parentLabels?: boolean;
}

interface NodeRef {
  kind: PracticeRefKind;
  label: string;
  ariaLabel: string;
}

const practiceX = (x: number) => 2 * (x - 40) + 40;

function refsForNode(state: RepoState, id: string, names: string[]): NodeRef[] {
  const attached = !state.head.detached && state.head.ref !== null && state.branches[state.head.ref] === id;
  const refs: NodeRef[] = [];
  if (attached && state.head.ref) {
    refs.push({ kind: "attached", label: state.head.ref, ariaLabel: `HEAD attached to ${state.head.ref}` });
  }
  for (const name of names) {
    if (!attached || name !== state.head.ref) {
      refs.push({ kind: "branch", label: name, ariaLabel: `branch ${name}` });
    }
  }
  if (state.head.detached && state.head.commit === id) {
    refs.push({ kind: "detached", label: "HEAD · detached", ariaLabel: `HEAD detached at ${id}` });
  }
  return refs;
}

/** SVG view of the repository. CSS animates positions; layout() remains the source of truth. */
export function GraphView({
  state,
  width,
  height,
  presentation = "legacy",
  scale = 1.35,
  newId = null,
  changed = new Set<string>(),
  changedEdges = new Set<string>(),
  ghostIds = new Set<string>(),
  parentLabels = false,
}: Props) {
  const graph = layout(state);
  const positions = new Map(graph.nodes.map((node) => [node.id, node]));
  const branches = Object.entries(state.branches).sort(([a], [b]) => a.localeCompare(b));

  if (presentation === "practice") {
    const nodes = graph.nodes.map((node) => {
      const names = branches.filter(([, commitId]) => commitId === node.id).map(([name]) => name);
      return { ...node, x: practiceX(node.x), names, refs: refsForNode(state, node.id, names) };
    });
    const practicePositions = new Map(nodes.map((node) => [node.id, node]));
    const right = nodes.reduce((maximum, node) => {
      const chipWidth = node.refs.reduce((widest, ref) => Math.max(widest, practiceRefWidth(ref.kind, ref.label)), 0);
      return Math.max(maximum, node.x + (chipWidth ? 30 + chipWidth : 24));
    }, 0);
    const naturalWidth = Math.max(right + 16, 160);
    const naturalHeight = Math.max(nodes.reduce((maximum, node) => Math.max(maximum, node.y), 40) + 40, 80);

    return (
      <svg
        width={width ?? Math.round(naturalWidth * scale)}
        height={height ?? Math.round(naturalHeight * scale)}
        viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
        role="img"
        aria-label="Git commit graph"
        className="graph-view graph-view--practice"
      >
        {graph.edges.map((edge) => {
          const parentIndex = state.commits[edge.from]?.parents.indexOf(edge.to) ?? -1;
          return (
            <GraphEdge
              key={`${edge.from}:${edge.to}`}
              from={practicePositions.get(edge.from)!}
              to={practicePositions.get(edge.to)!}
              changed={changedEdges.has(`${edge.from}>${edge.to}`)}
              ghost={ghostIds.has(edge.from)}
              parentIndex={parentIndex}
              showLabel={parentLabels && (state.commits[edge.from]?.parents.length ?? 0) > 1}
            />
          );
        })}
        {nodes.map((node) => {
          const commit = state.commits[node.id]!;
          const attached = !state.head.detached && state.head.ref !== null && state.branches[state.head.ref] === node.id;
          const detached = state.head.detached && state.head.commit === node.id;
          const kind = detached ? "detached" : attached ? "head" : "normal";
          const parentText = commit.parents.length ? `parents ${commit.parents.join(", ")}` : "root";
          const ariaParts = [
            `commit ${node.id}`,
            commit.parents.length ? `parents ${commit.parents.join(" ")}` : "root commit",
            ...node.names.map((name) => `branch ${name}`),
            attached ? `HEAD attached to ${state.head.ref}` : "",
            detached ? "HEAD detached" : "",
          ].filter(Boolean);
          const y0 = -(node.refs.length * 24 - 4) / 2;
          return (
            <CommitNode
              key={node.id}
              id={node.id}
              x={node.x}
              y={node.y}
              kind={kind}
              isNew={node.id === newId}
              ghost={ghostIds.has(node.id)}
              changed={changed.has(node.id)}
              title={`${node.id} — ${commit.message} · ${parentText}`}
              ariaLabel={ariaParts.join(", ")}
            >
              {node.refs.map((ref, index) => (
                <PracticeRefLabel
                  key={`${ref.kind}-${ref.label}`}
                  x={30}
                  y={y0 + index * 24}
                  kind={ref.kind}
                  label={ref.label}
                  ariaLabel={ref.ariaLabel}
                />
              ))}
            </CommitNode>
          );
        })}
      </svg>
    );
  }

  const naturalWidth = Math.max(graph.width + 160, 240);
  const naturalHeight = Math.max(graph.height + 80, 100);

  return (
    <svg
      width={width ?? naturalWidth}
      height={height ?? naturalHeight}
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      role="img"
      aria-label="Git commit graph"
    >
      {graph.nodes.length === 0 && (
        <>
          <text x={16} y={32} fill="currentColor">No commits yet</text>
          <RefLabel x={90} y={42} kind={state.head.detached ? "detached" : "attached"}
            ariaLabel={state.head.detached ? "HEAD detached" : `HEAD attached to ${state.head.ref}`}
            label={state.head.detached ? "HEAD detached" : `HEAD → ${state.head.ref ?? "?"} (unborn)`} />
        </>
      )}

      {graph.edges.map((edge) => {
        const from = positions.get(edge.from)!;
        const to = positions.get(edge.to)!;
        return (
          <line
            key={`${edge.from}:${edge.to}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="var(--color-edge)"
            strokeWidth={2}
          />
        );
      })}

      {graph.nodes.map((node) => {
        const names = branches
          .filter(([, commitId]) => commitId === node.id)
          .map(([name]) => name);
        const attached = !state.head.detached && names.includes(state.head.ref ?? "");
        const detached = state.head.detached && state.head.commit === node.id;

        return (
          <g key={node.id} data-commit-id={node.id} className="graph-node"
            style={{ transform: `translate(${node.x}px, ${node.y}px)` }}>
            <circle cx={0} cy={0} r={14} fill="var(--color-background)" stroke="var(--color-node)" strokeWidth={2} />
            <text x={0} y={4} textAnchor="middle" fontSize={10} fill="var(--color-text)">
              {node.id}
            </text>
            {names.map((name, index) => (
              <RefLabel key={name} x={0} y={20 + index * 20}
                label={name} kind="branch" ariaLabel={`branch ${name}`} />
            ))}
            {(attached || detached) && (
              <RefLabel
                x={0}
                y={20 + names.length * 20}
                kind={attached ? "attached" : "detached"}
                ariaLabel={attached
                  ? `HEAD attached to ${state.head.ref}`
                  : `HEAD detached at ${node.id}`}
                label={attached ? `HEAD → ${state.head.ref}` : `HEAD detached at ${node.id}`}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
