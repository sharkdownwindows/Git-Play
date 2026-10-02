interface Props {
  id: string;
  x: number;
  y: number;
  kind: "normal" | "head" | "detached";
  isNew?: boolean;
  ghost?: boolean;
  changed?: boolean;
  title: string;
  ariaLabel: string;
  children?: React.ReactNode;
}

function shortId(id: string): string {
  return id.length <= 4 ? id : `${id.slice(0, 3)}…`;
}

export function CommitNode({ id, x, y, kind, isNew = false, ghost = false, changed = false, title, ariaLabel, children }: Props) {
  const label = shortId(id);
  return (
    <g
      data-commit-id={id}
      className={`graph-node${isNew ? " graph-node--new" : ""}${ghost ? " graph-node--ghost" : ""}`}
      style={{ transform: `translate(${x}px, ${y}px)` }}
      tabIndex={0}
      aria-label={ariaLabel}
    >
      <title>{title}</title>
      <circle className="commit-node__focus-ring" cx={0} cy={0} r={21} />
      {isNew && <circle className="commit-node__halo" cx={0} cy={0} r={23} />}
      {changed && <circle className="commit-node__changed-ring" cx={0} cy={0} r={23} />}
      <g className="commit-node__body">
        <circle className={`commit-node commit-node--${kind}`} cx={0} cy={0} r={16} />
        <text
          className={`commit-node__label commit-node__label--${kind}`}
          x={0}
          y={4}
          textAnchor="middle"
          fontSize={label.length > 3 ? 10 : 11}
        >
          {label}
        </text>
      </g>
      {children}
    </g>
  );
}
