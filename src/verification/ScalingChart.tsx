import { useRef, useState, type KeyboardEvent } from "react";
import { formatInt, formatMilliseconds } from "./format";
import type { ScalingPoint, ScalingSeries } from "./report";
import { nextSegmentIndex } from "./segmentedKeyboard";

const LEFT = 34;
const RIGHT = 286;
const TOP = 20;
const BOTTOM = 126;

interface KeyedScalingPoint extends ScalingPoint { key: string }

function withPointKeys(points: ScalingPoint[]): KeyedScalingPoint[] {
  const occurrences = new Map<string, number>();
  return points.map((point) => {
    const identity = JSON.stringify([point.n, point.medianMs, point.p95Ms, point.iterations]);
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    return { ...point, key: `${identity}:${occurrence}` };
  });
}

function exponentLabel(value: number): string {
  const exponent = Math.log10(value);
  const superscript = String(exponent)
    .replace(/0/g, "⁰").replace(/1/g, "¹").replace(/2/g, "²").replace(/3/g, "³")
    .replace(/4/g, "⁴").replace(/5/g, "⁵").replace(/6/g, "⁶").replace(/7/g, "⁷")
    .replace(/8/g, "⁸").replace(/9/g, "⁹");
  return Number.isInteger(exponent) ? `10${superscript}` : formatInt(value);
}

function SeriesChart({ label, points }: { label: string; points: KeyedScalingPoint[] }) {
  const ordered = [...points].sort((a, b) => a.n - b.n);
  const xs = ordered.map((point) => Math.log10(point.n));
  const ys = ordered.flatMap((point) => [Math.log10(point.medianMs), Math.log10(point.p95Ms)]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const x = (n: number) => xMin === xMax ? (LEFT + RIGHT) / 2
    : LEFT + (Math.log10(n) - xMin) / (xMax - xMin) * (RIGHT - LEFT);
  const y = (ms: number) => yMin === yMax ? (TOP + BOTTOM) / 2
    : BOTTOM - (Math.log10(ms) - yMin) / (yMax - yMin) * (BOTTOM - TOP);
  const line = (metric: "medianMs" | "p95Ms") => ordered
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(point.n)},${y(point[metric])}`).join(" ");

  return (
    <svg viewBox="0 0 300 150" role="img" aria-label={`${label} scaling chart`}>
      <title>{`${label} by commit count`}</title>
      <desc>Logarithmic axes. Solid line shows median time and dashed line shows p95 time.</desc>
      <line x1={LEFT} y1={BOTTOM} x2={RIGHT} y2={BOTTOM} className="scaling-axis" />
      <line x1={LEFT} y1={TOP} x2={LEFT} y2={BOTTOM} className="scaling-axis" />
      <text x={LEFT - 5} y={TOP + 3} textAnchor="end">{formatMilliseconds(10 ** yMax)}</text>
      <text x={LEFT - 5} y={BOTTOM} textAnchor="end">{formatMilliseconds(10 ** yMin)}</text>
      {ordered.map((point) => <text key={`${point.key}:tick`} x={x(point.n)} y={BOTTOM + 15} textAnchor="middle">{exponentLabel(point.n)}</text>)}
      <path d={line("medianMs")} className="scaling-line scaling-line--median" />
      <path d={line("p95Ms")} className="scaling-line scaling-line--p95" />
      {ordered.flatMap((point) => (["medianMs", "p95Ms"] as const).map((metric) => (
        <circle
          key={`${point.key}:${metric}`}
          cx={x(point.n)}
          cy={y(point[metric])}
          r={2.5}
          className={`scaling-point scaling-point--${metric}`}
          data-series={label}
          data-n={point.n}
          data-metric={metric}
        />
      )))}
    </svg>
  );
}

function seriesCaption(points: KeyedScalingPoint[]): string {
  const last = [...points].sort((a, b) => a.n - b.n).at(-1);
  return last ? `${formatMilliseconds(last.medianMs)} ms @ ${exponentLabel(last.n)}` : "No data";
}

export function ScalingChart({ series, initialView = "chart" }: { series: ScalingSeries[]; initialView?: "chart" | "table" }) {
  const [view, setView] = useState<"chart" | "table">(initialView);
  const viewRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const keyedSeries = series.map((item, seriesIndex) => ({
    ...item,
    key: `${item.label}:${seriesIndex}`,
    points: withPointKeys(item.points.filter((point) =>
      point.n > 0 && point.medianMs > 0 && point.p95Ms > 0 && point.iterations > 0 &&
      Number.isFinite(point.n) && Number.isFinite(point.medianMs) && Number.isFinite(point.p95Ms) &&
      Number.isFinite(point.iterations))),
  }));

  function handleViewKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number): void {
    const nextIndex = nextSegmentIndex(index, event.key, 2);
    if (nextIndex === null) return;
    event.preventDefault();
    const nextView = nextIndex === 0 ? "chart" : "table";
    setView(nextView);
    viewRefs.current[nextIndex]?.focus();
  }

  return (
    <section className="verification-section" aria-labelledby="scaling-heading">
      <div className="verification-section__heading">
        <div className="verification-section__title-row">
          <h2 id="scaling-heading">Performance at scale</h2>
          <p>Log–log · solid = median · dashed = p95</p>
        </div>
        <div className="segmented" role="tablist" aria-label="Performance view">
          {(["chart", "table"] as const).map((value) => (
            <button
              key={value}
              ref={(element) => { viewRefs.current[value === "chart" ? 0 : 1] = element; }}
              id={`performance-${value}-tab`}
              type="button"
              role="tab"
              aria-controls="performance-view-panel"
              aria-selected={view === value}
              tabIndex={view === value ? 0 : -1}
              onClick={() => setView(value)}
              onKeyDown={(event) => handleViewKeyDown(event, value === "chart" ? 0 : 1)}
            >
              {value[0]?.toUpperCase()}{value.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {keyedSeries.length === 0 ? (
        <p id="performance-view-panel" role="tabpanel" aria-labelledby={`performance-${view}-tab`} className="verification-empty">No measured scaling data available.</p>
      ) : view === "chart" ? (
        <div id="performance-view-panel" role="tabpanel" aria-labelledby="performance-chart-tab" className="scaling-grid">
          {keyedSeries.map((item) => (
            <figure key={item.key} aria-label={item.label}>
              <figcaption><strong>{item.label}</strong><span>{item.points.length === 1 ? "1 point" : seriesCaption(item.points)}</span></figcaption>
              {item.points.length === 0 ? (
                <p>No measured scaling data available.</p>
              ) : item.points.length === 1 ? (
                <div className="scaling-single">
                  <strong>{formatMilliseconds(item.points[0]!.medianMs)} ms</strong>
                  <p>median frame at {formatInt(item.points[0]!.n)} commits, {formatInt(item.points[0]!.iterations)} frames sampled</p>
                </div>
              ) : <SeriesChart label={item.label} points={item.points} />}
            </figure>
          ))}
        </div>
      ) : (
        <div id="performance-view-panel" role="tabpanel" aria-labelledby="performance-table-tab" className="scaling-table-wrap">
          <table className="scaling-table">
            <thead><tr><th scope="col">Series</th><th scope="col">Commits (n)</th><th scope="col">Median (ms)</th><th scope="col">p95 (ms)</th><th scope="col">Iterations</th></tr></thead>
            <tbody>{keyedSeries.flatMap((item) => item.points.map((point) => (
              <tr key={`${item.key}:${point.key}`}><th scope="row">{item.label}</th><td>{formatInt(point.n)}</td><td>{formatMilliseconds(point.medianMs)}</td><td>{formatMilliseconds(point.p95Ms)}</td><td>{formatInt(point.iterations)}</td></tr>
            )))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
