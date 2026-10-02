import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { formatInt } from "./format";
import type { Divergence, DivergenceSeverity } from "./report";
import { nextSegmentIndex } from "./segmentedKeyboard";

export type DivergenceFilter = "all" | DivergenceSeverity;

const PAGE_SIZE = 50;

export function filterDivergences(divergences: Divergence[], filter: DivergenceFilter): Divergence[] {
  const hard: Divergence[] = [];
  const soft: Divergence[] = [];
  for (const divergence of divergences) {
    if (divergence.severity === "hard") hard.push(divergence);
    else soft.push(divergence);
  }
  if (filter === "hard") return hard;
  if (filter === "soft") return soft;
  return hard.concat(soft);
}

export function nextVisibleCount(current: number, total: number): number {
  return Math.min(current + PAGE_SIZE, total);
}

function CollapsedText({ value }: { value: string }) {
  const lines = value.split(/\r?\n/);
  const hiddenLines = Math.max(0, lines.length - 2);
  return (
    <>
      <span className="divergence-text">{lines.slice(0, 2).join("\n")}</span>
      {hiddenLines > 0 && <span className="divergence-more">+{formatInt(hiddenLines)} more lines</span>}
    </>
  );
}

function DivergenceRow({ divergence }: { divergence: Divergence }) {
  return (
    <li className="divergence-row" data-divergence-row={divergence.id}>
      <div className="divergence-identity">
        <span>{divergence.id}</span>
        <span className={`divergence-chip divergence-chip--${divergence.severity}`}>
          {divergence.severity} · {divergence.kind}
        </span>
      </div>
      <div>
        <span className="divergence-label">Commands</span>
        <CollapsedText value={divergence.commands.join(" → ")} />
      </div>
      <div>
        <span className="divergence-label">Real git</span>
        <CollapsedText value={divergence.expected} />
      </div>
      <div>
        <span className="divergence-label">GitScope</span>
        <CollapsedText value={divergence.actual} />
      </div>
    </li>
  );
}

export function DivergenceList({ divergences }: { divergences: Divergence[] }) {
  const hardCount = divergences.reduce((count, item) => count + Number(item.severity === "hard"), 0);
  const softCount = divergences.length - hardCount;
  const [filter, setFilter] = useState<DivergenceFilter>(hardCount > 0 ? "hard" : "soft");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filterRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const filtered = useMemo(() => filterDivergences(divergences, filter), [divergences, filter]);
  const visible = filtered.slice(0, visibleCount);

  function chooseFilter(nextFilter: DivergenceFilter): void {
    setFilter(nextFilter);
    setVisibleCount(PAGE_SIZE);
  }

  function handleFilterKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const nextIndex = nextSegmentIndex(index, event.key, 3);
    if (nextIndex === null) return;
    event.preventDefault();
    const nextFilter = (["all", "hard", "soft"] as const)[nextIndex];
    if (!nextFilter) return;
    chooseFilter(nextFilter);
    filterRefs.current[nextIndex]?.focus();
  }

  return (
    <section className="verification-section" aria-labelledby="divergences-heading">
      <div className="verification-section__heading">
        <h2 id="divergences-heading">Divergences</h2>
        <div className="segmented" role="tablist" aria-label="Filter by severity">
          {([
            ["all", divergences.length],
            ["hard", hardCount],
            ["soft", softCount],
          ] as const).map(([value, count], index) => (
            <button
              key={value}
              ref={(element) => { filterRefs.current[index] = element; }}
              id={`divergence-${value}-tab`}
              type="button"
              role="tab"
              aria-controls="divergence-results"
              aria-selected={filter === value}
              tabIndex={filter === value ? 0 : -1}
              onClick={() => chooseFilter(value)}
              onKeyDown={(event) => handleFilterKeyDown(event, index)}
            >
              {value[0]?.toUpperCase()}{value.slice(1)} {formatInt(count)}
            </button>
          ))}
        </div>
      </div>

      <div id="divergence-results" role="tabpanel" aria-labelledby={`divergence-${filter}-tab`} className="divergence-list">
        {filtered.length === 0 ? (
          <p className="divergence-empty">
            {filter === "hard"
              ? "✓ No hard divergences recorded — every case ends in the same commits, branches and HEAD as real git."
              : "No divergences recorded for this filter."}
          </p>
        ) : (
          <ul>{visible.map((divergence) => <DivergenceRow key={divergence.id} divergence={divergence} />)}</ul>
        )}
        <footer className="divergence-footer">
          <span>{filtered.length === 0
            ? "Showing 0 of 0"
            : `Showing 1–${formatInt(visible.length)} of ${formatInt(filtered.length)}`}</span>
          {visible.length < filtered.length && (
            <button
              type="button"
              className="verification-button"
              onClick={() => setVisibleCount((count) => nextVisibleCount(count, filtered.length))}
            >
              Show 50 more
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}
