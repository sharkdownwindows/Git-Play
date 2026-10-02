interface RefLabelProps {
  x: number;
  y: number;
  label: string;
  kind: "branch" | "attached" | "detached";
  ariaLabel: string;
}

export type PracticeRefKind = "branch" | "attached" | "detached";

const textWidth = (label: string) => label.length * 6.8 + 14;

export function practiceRefWidth(kind: PracticeRefKind, label: string): number {
  return kind === "attached" ? 43 + textWidth(label) : textWidth(label);
}

export function PracticeRefLabel({ x, y, label, kind, ariaLabel }: RefLabelProps) {
  const width = textWidth(label);
  if (kind === "attached") {
    return (
      <g aria-label={ariaLabel} data-ref-kind={kind} transform={`translate(${x} ${y})`}>
        <rect className="ref-chip__head" width={42} height={20} rx={4} />
        <text className="ref-chip__head-text" x={21} y={14} textAnchor="middle">HEAD</text>
        <rect className="ref-chip__branch" x={43} width={width} height={20} rx={4} />
        <text className="ref-chip__branch-text" x={43 + width / 2} y={14} textAnchor="middle">{label}</text>
      </g>
    );
  }

  const detached = kind === "detached";
  const chipLabel = detached ? "HEAD · detached" : label;
  const chipWidth = textWidth(chipLabel);
  return (
    <g aria-label={ariaLabel} data-ref-kind={kind} transform={`translate(${x} ${y})`}>
      <rect className={detached ? "ref-chip__detached" : "ref-chip__branch"} width={chipWidth} height={20} rx={4} />
      <text className={detached ? "ref-chip__detached-text" : "ref-chip__branch-text"} x={chipWidth / 2} y={14} textAnchor="middle">
        {chipLabel}
      </text>
    </g>
  );
}

/** A visible badge for every branch ref and HEAD position. */
export function RefLabel({ x, y, label, kind, ariaLabel }: RefLabelProps) {
  const width = Math.max(56, label.length * 7 + 16);
  const left = Math.max(4, x - width / 2);
  const fill = kind === "branch"
    ? "var(--color-success)"
    : kind === "attached"
      ? "var(--color-primary)"
      : "var(--color-danger)";

  return (
    <g aria-label={ariaLabel} data-ref-kind={kind}>
      <rect x={left} y={y} width={width} height={18} rx={4} fill={fill} />
      <text x={left + width / 2} y={y + 13} textAnchor="middle" fontSize={11} fontWeight="bold" fill="var(--color-background)">
        {label}
      </text>
    </g>
  );
}
