import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import currentReport from "../../public/verification.json";
import { DiffTestSummary } from "./DiffTestSummary";
import { DivergenceList, filterDivergences, nextVisibleCount } from "./DivergenceList";
import { formatInt } from "./format";
import { verificationReportFixture } from "./fixtures/report";
import { isVerificationReport, type Divergence, type VerificationReport } from "./report";
import { loadVerificationReport, VerificationContent, VerificationTab } from "./VerificationTab";

const render = (element: React.ReactElement) => renderToStaticMarkup(element);
const fixture = verificationReportFixture;

function divergence(id: string, severity: "hard" | "soft"): Divergence {
  return { id, severity, kind: severity === "hard" ? "state" : "output", commands: [`git commit -m ${id}`], expected: "real", actual: "simulated" };
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("committed verification report", () => {
  it("conforms to the frozen report schema", () => {
    expect(isVerificationReport(currentReport)).toBe(true);
  });

  it("renders real report values and no more than 50 initial divergence rows", () => {
    const html = render(createElement(VerificationContent, { report: currentReport as VerificationReport, error: null }));
    expect(html).toContain(`all ${formatInt(currentReport.diffTest.totalCases)} test cases`);
    expect(html).toContain(`All ${formatInt(currentReport.divergences.length)}`);
    expect(html).toContain(`Soft output warnings</dt><dd>${formatInt(currentReport.diffTest.warnings)}`);
    expect(html.match(/data-divergence-row=/g)).toHaveLength(Math.min(50, currentReport.divergences.length));
    expect(html).toContain("Show 50 more");
  });
});

describe("verification report loading and errors", () => {
  it("loads and validates /verification.json", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => fixture }));
    vi.stubGlobal("fetch", fetchMock);
    const loaded = await loadVerificationReport();
    expect(fetchMock).toHaveBeenCalledWith("/verification.json");
    expect(loaded).toEqual({ report: fixture, error: null });
  });

  it.each([
    ["missing file", async () => ({ ok: false, status: 404, json: async () => fixture }), "Verification report file is missing."],
    ["invalid schema", async () => ({ ok: true, json: async () => ({ ...fixture, schemaVersion: 2 }) }), "Verification report has an invalid schema or unsupported schema version."],
    ["invalid JSON", async () => ({ ok: true, json: async () => { throw new SyntaxError("bad JSON"); } }), "Verification report contains invalid JSON."],
    ["network failure", async () => { throw new Error("offline"); }, "Verification report could not be fetched."],
  ])("shows the exact error and Retry for %s", async (_case, response, message) => {
    vi.stubGlobal("fetch", vi.fn(response));
    const loaded = await loadVerificationReport();
    expect(loaded).toEqual({ report: null, error: message });
    const html = render(createElement(VerificationContent, loaded));
    expect(html).toContain("Report unavailable");
    expect(html).toContain(message);
    expect(html).toContain(">Retry</button>");
    expect(html).not.toContain("Differential test summary");
  });

  it("renders the loading state before fetch completes", () => {
    const html = render(createElement(VerificationTab));
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading verification report");
  });
});

describe("verification presentation", () => {
  it("renders the conclusion, provenance, four cards, definitions and coverage", () => {
    const html = render(createElement(VerificationContent, { report: fixture, error: null }));
    expect(html).toContain("The engine matched real Git on all 10 test cases.");
    expect(html).toContain("30 Sep 2026, 00:00 UTC");
    expect(html).toContain("Commit <code>aaaaaaa</code>");
    expect(html).toContain("Compared against <code>git 2.43.0</code>");
    expect(html.match(/class="verification-stat /g)).toHaveLength(4);
    expect(html).toContain("Differential test");
    expect(html).toContain("Hard divergence");
    expect(html).toContain("Soft warning");
    expect(html).toContain("Command coverage");
    expect(html.indexOf("Differential test")).toBeLessThan(html.indexOf("Command coverage"));
  });

  it("keeps stat cards on the auto-fit grid at tablet widths", () => {
    const css = readFileSync(new URL("../app/layout.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.verification-stats\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fit, minmax\(200px, 1fr\)\)/);
    expect(css).not.toMatch(/\.verification-stats\s*\{\s*grid-template-columns:\s*repeat\(2,/);
  });

  it("formats summary counts and run metadata", () => {
    const html = render(createElement(DiffTestSummary, {
      summary: { ...fixture.diffTest, totalCases: 8_000, passed: 7_998, failed: 2, warnings: 1_234 },
      coverage: { ...fixture.coverage, commit: 4_000, branch: 3_000 },
    }));
    expect(html).toContain("Cases passed</dt><dd>7,998 <span>/ 8,000");
    expect(html).toContain("Hard divergences</dt><dd>2");
    expect(html).toContain("Soft output warnings</dt><dd>1,234");
    expect(html).toContain("Depth 3 exhaustive + 5,000 random · seed 42");
    expect(html).toContain("<strong>4,000</strong>");
  });

  it("marks missing benchmark evidence as incomplete", () => {
    const report: VerificationReport = { ...fixture, scaling: fixture.scaling.slice(0, 1) };
    const html = render(createElement(VerificationContent, { report, error: null }));
    expect(html).toContain("Verification evidence incomplete");
    expect(html).toContain("scaling measurements missing");
  });
});

describe("divergence filtering and pagination", () => {
  const rows = [divergence("soft-1", "soft"), divergence("hard-1", "hard"), divergence("soft-2", "soft"), divergence("hard-2", "hard")];

  it("filters every severity and keeps hard rows before soft rows in All", () => {
    expect(filterDivergences(rows, "all").map((item) => item.id)).toEqual(["hard-1", "hard-2", "soft-1", "soft-2"]);
    expect(filterDivergences(rows, "hard").map((item) => item.id)).toEqual(["hard-1", "hard-2"]);
    expect(filterDivergences(rows, "soft").map((item) => item.id)).toEqual(["soft-1", "soft-2"]);
  });

  it("caps the initial render at 50 rows and exposes the next page control", () => {
    const manyRows = Array.from({ length: 74 }, (_, index) => divergence(`soft-${index + 1}`, "soft"));
    const html = render(createElement(DivergenceList, { divergences: manyRows }));
    expect(html.match(/data-divergence-row=/g)).toHaveLength(50);
    expect(html).toContain("Showing 1–50 of 74");
    expect(html).toContain("Show 50 more");
    expect(html).toContain('aria-controls="divergence-results"');
    expect(html).toContain('role="tabpanel"');
    expect(html.match(/tabindex="-1"/g)).toHaveLength(2);
  });

  it("increments pages by 50 without exceeding the filtered total", () => {
    expect(nextVisibleCount(50, 124)).toBe(100);
    expect(nextVisibleCount(100, 124)).toBe(124);
    expect(nextVisibleCount(124, 124)).toBe(124);
  });
});
