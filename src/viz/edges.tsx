interface Props {
  from: { x: number; y: number };
  to: { x: number; y: number };
  changed?: boolean;
  ghost?: boolean;
  parentIndex?: number;
  showLabel?: boolean;
}

export function GraphEdge({ from, to, changed = false, ghost = false, parentIndex = -1, showLabel = false }: Props) {
  const path = from.x === to.x
    ? `M ${from.x} ${from.y - 16} L ${to.x} ${to.y + 16}`
    : `M ${from.x} ${from.y - 16} C ${from.x} ${from.y - 46} ${to.x} ${to.y + 46} ${to.x} ${to.y + 16}`;
  const labelX = (from.x + to.x) / 2 + (parentIndex === 0 ? -8 : 8);
  const labelY = (from.y + to.y) / 2 + (parentIndex === 0 ? -6 : 12);
  const label = parentIndex === 0 ? "1st parent" : "2nd parent";
  return (
    <g className={`graph-edge-wrap${ghost ? " graph-edge-wrap--ghost" : ""}`}>
      <path d={path} className={`graph-edge${changed ? " graph-edge--changed" : ""}`} fill="none" />
      {showLabel && (
        <text className="graph-edge__label" x={labelX} y={labelY} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}
