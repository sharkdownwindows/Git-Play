import type { CoverageByCommand, DiffTestSummary as Summary } from "./report";
import { formatDuration, formatInt } from "./format";

interface Props {
  summary: Summary;
  coverage: CoverageByCommand;
}

interface StatsProps {
  summary: Summary;
}

interface CoverageProps {
  summary: Summary;
  coverage: CoverageByCommand;
}

const commands = ["commit", "branch", "switch", "checkout", "merge"] as const;

export function DiffTestStats({ summary }: StatsProps) {
  return (
    <dl className="verification-stats" aria-label="Differential test summary">
        <div className={`verification-stat verification-stat--${summary.failed === 0 ? "success" : "danger"}`}>
          <dt>Cases passed</dt>
          <dd>{formatInt(summary.passed)} <span>/ {formatInt(summary.totalCases)}</span></dd>
          {summary.failed === 0 && <p>Repository state identical to git</p>}
        </div>
        <div className={`verification-stat verification-stat--${summary.failed === 0 ? "success" : "danger"}`}>
          <dt>Hard divergences</dt>
          <dd>{formatInt(summary.failed)}</dd>
          {summary.failed === 0 && <p>No commit, branch or HEAD mismatch</p>}
        </div>
        <div className="verification-stat verification-stat--warning">
          <dt>Soft output warnings</dt>
          <dd>{formatInt(summary.warnings)}</dd>
          <p>Message text differs; counted per step</p>
        </div>
        <div className="verification-stat verification-stat--neutral">
          <dt>Run</dt>
          <dd>{formatDuration(summary.durationMs)}</dd>
          <p>Depth {summary.exhaustiveDepth} exhaustive + {formatInt(summary.randomCases)} random · seed {summary.seed}</p>
        </div>
    </dl>
  );
}

export function CommandCoverage({ summary, coverage }: CoverageProps) {
  return (
    <section className="verification-section" aria-labelledby="coverage-heading">
        <div className="verification-section__title-row">
          <h2 id="coverage-heading">Command coverage</h2>
          <p>Cases that use each command, of {formatInt(summary.totalCases)}</p>
        </div>
        <ul className="coverage-list">
        {commands.map((command) => (
          <li key={command}>
            <span>{command}</span>
            <span className="coverage-track" aria-hidden="true">
              <span style={{ width: `${summary.totalCases > 0 ? Math.min(100, coverage[command] / summary.totalCases * 100) : 0}%` }} />
            </span>
            <strong>{formatInt(coverage[command])}</strong>
          </li>
        ))}
        </ul>
    </section>
  );
}

export function DiffTestSummary({ summary, coverage }: Props) {
  return (
    <>
      <DiffTestStats summary={summary} />
      <CommandCoverage summary={summary} coverage={coverage} />
    </>
  );
}
