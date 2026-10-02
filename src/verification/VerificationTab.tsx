import { useEffect, useState } from "react";
import { Definitions } from "./Definitions";
import { CommandCoverage, DiffTestStats } from "./DiffTestSummary";
import { DivergenceList } from "./DivergenceList";
import { formatInt, formatUtc, gitVersionLabel, shortSha } from "./format";
import { isVerificationReport, type VerificationReport } from "./report";
import { ScalingChart } from "./ScalingChart";

type ReportLoadResult =
  | { report: VerificationReport; error: null }
  | { report: null; error: string };

export async function loadVerificationReport(): Promise<ReportLoadResult> {
  let response: Response;
  try {
    response = await fetch("/verification.json");
  } catch {
    return { report: null, error: "Verification report could not be fetched." };
  }
  if (!response.ok) return { report: null, error: response.status === 404
    ? "Verification report file is missing."
    : `Verification report could not be fetched (HTTP ${response.status}).` };
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { report: null, error: "Verification report contains invalid JSON." };
  }
  if (!isVerificationReport(data)) return { report: null, error: "Verification report has an invalid schema or unsupported schema version." };
  return { report: data, error: null };
}

export function VerificationTab() {
  const [result, setResult] = useState<ReportLoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void loadVerificationReport().then((loaded) => {
      if (active) setResult(loaded);
    });
    return () => { active = false; };
  }, [attempt]);

  function retry(): void {
    setResult(null);
    setAttempt((current) => current + 1);
  }

  if (result === null) {
    return (
      <section className="verification-page verification-page--loading" role="status">
        <p>Loading verification report…</p>
        <div className="verification-skeleton" aria-hidden="true"><span /><span /><span /></div>
      </section>
    );
  }
  return <VerificationContent {...result} onRetry={retry} />;
}

type VerificationContentProps = ReportLoadResult & { onRetry?: () => void };

export function VerificationContent({ report, error, onRetry }: VerificationContentProps) {
  const [shaCopied, setShaCopied] = useState(false);

  if (report === null) {
    return (
      <section className="verification-page verification-error">
        <p className="verification-eyebrow">VERIFICATION REPORT</p>
        <h1>Verification</h1>
        <div className="verification-callout verification-callout--error" role="alert">
          <h2>Report unavailable</h2>
          <p>{error}</p>
          <button type="button" className="verification-button" onClick={onRetry}>Retry</button>
        </div>
      </section>
    );
  }

  const scaling = report.scaling;
  const missingScaling = ["layout()", "SVG render", "animation frame"].some((label) =>
    !scaling.some((series) => series.label === label && series.points.length > 0));
  const evidenceIssues = [
    report.diffTest.exhaustiveDepth < 3 && "exhaustive depth is below 3",
    report.diffTest.randomCases === 0 && "no random run recorded",
    missingScaling && "scaling measurements missing",
  ].filter((issue): issue is string => Boolean(issue));
  const headline = report.diffTest.failed === 0
    ? `The engine matched real Git on all ${formatInt(report.diffTest.totalCases)} test cases.`
    : `The engine diverged from real Git in ${formatInt(report.diffTest.failed)} of ${formatInt(report.diffTest.totalCases)} cases.`;
  const reportSha = report.commitSha;

  async function copySha(): Promise<void> {
    try {
      await navigator.clipboard.writeText(reportSha);
      setShaCopied(true);
      window.setTimeout(() => setShaCopied(false), 1_500);
    } catch {
      setShaCopied(false);
    }
  }

  return (
    <section className="verification-page">
      <header className="verification-hero">
        <p className="verification-eyebrow">VERIFICATION REPORT</p>
        <h1>{headline}</h1>
        <div className="verification-provenance" aria-label="Report provenance">
          <span>Generated <strong>{formatUtc(report.generatedAt)}</strong></span>
          <span className="verification-provenance__commit">Commit <code>{shortSha(reportSha)}</code> <button type="button" aria-label={`Copy full SHA ${reportSha}`} onClick={() => { void copySha(); }}>{shaCopied ? "✓ Copied" : "Copy full SHA"}</button></span>
          <span>Compared against <code>{gitVersionLabel(report.gitVersion)}</code></span>
          <span>Node <code>{report.nodeVersion}</code></span>
        </div>
      </header>

      {evidenceIssues.length > 0 && (
        <div role="status" className="verification-callout verification-callout--warning">
          <strong>Verification evidence incomplete:</strong> {evidenceIssues.join("; ")}.
        </div>
      )}

      <DiffTestStats summary={report.diffTest} />
      <Definitions />
      <CommandCoverage summary={report.diffTest} coverage={report.coverage} />
      <ScalingChart series={report.scaling} />
      <DivergenceList divergences={report.divergences} />
    </section>
  );
}
