import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { BrowserMeasurement, BrowserPoint } from "./browserMetrics";
import { classifyFrameBudget, classifySaturation, FRAME_BUDGET_MS, percentile, RENDER_SATURATION_BUDGET_MS } from "./browserMetrics";
import { selectBrowserBuildMode, startBrowserBenchmarkServer, type BrowserBenchmarkServer } from "./browserServer";
import { ChromeProcessError, ChromeProcessMonitor, cleanupBrowserResources,
  waitForChromeDebuggingPort } from "./chromeLifecycle";

const smoke = process.argv.includes("--smoke");
const traceFrames = process.argv.includes("--trace");
const buildMode = selectBrowserBuildMode(process.argv.slice(2));
const chrome = process.env.GITSCOPE_BROWSER ?? (process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : "google-chrome");
const profile = mkdtempSync(path.join(tmpdir(), "gitscope-browser-"));
let server: BrowserBenchmarkServer["server"] | undefined;
let buildDirectory: string | undefined;
let processHandle: ReturnType<typeof spawn> | undefined;
let processMonitor: ChromeProcessMonitor | undefined;

async function connect(url: string) {
  const ws = new WebSocket(url);
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener("open", () => resolve(), { once: true });
    ws.addEventListener("error", () => reject(new Error("CDP WebSocket failed")), { once: true });
  });
  let nextId = 0;
  const pending = new Map<number, (value: any) => void>();
  const eventHandlers = new Map<string, Array<(message: any) => void>>();
  ws.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)!(message);
      pending.delete(message.id);
    } else if (message.method) {
      for (const handler of eventHandlers.get(message.method) ?? []) handler(message);
    }
  });
  return {
    call(method: string, params: Record<string, unknown> = {}): Promise<any> {
      const id = ++nextId;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    },
    onEvent(method: string, handler: (message: any) => void): () => void {
      const handlers = eventHandlers.get(method) ?? [];
      handlers.push(handler);
      eventHandlers.set(method, handlers);
      return () => eventHandlers.set(method, handlers.filter((item) => item !== handler));
    },
    close: () => ws.close(),
  };
}

async function measure(port: number, url: string, kind: "render" | "frame", n: number,
  timeoutMs: number, trace = false): Promise<{ point: BrowserPoint; layout: BrowserPoint; traceEvents?: unknown[] }> {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  if (!target.ok) throw new Error(`Cannot create Chrome tab: ${target.status}`);
  const tab = await target.json() as { webSocketDebuggerUrl: string; id: string };
  const cdp = await connect(tab.webSocketDebuggerUrl);
  try {
    const traceEvents: unknown[] = [];
    let finishTrace: Promise<any> | undefined;
    if (trace) {
      cdp.onEvent("Tracing.dataCollected", (event) => traceEvents.push(...(event.params?.value ?? [])));
      finishTrace = new Promise((resolve) => cdp.onEvent("Tracing.tracingComplete", resolve));
      await cdp.call("Tracing.start", { transferMode: "ReportEvents",
        categories: "devtools.timeline,v8.execute,blink,cc,disabled-by-default-devtools.timeline" });
    }
    const finish = async () => {
      if (!trace) return undefined;
      await cdp.call("Tracing.end");
      await finishTrace;
      return traceEvents;
    };
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      const response = await cdp.call("Runtime.evaluate", {
        expression: "document.body?.dataset.result ?? ''", returnByValue: true,
      });
      const value = response.result?.result?.value;
      if (value) {
        const result = JSON.parse(value) as { ok: boolean; error?: string;
          render?: number[]; frame?: number[]; layout: number[] };
        if (!result.ok) throw new Error(result.error);
        const events = await finish();
        return {
          point: { n, status: "ok", samplesMs: result[kind] ?? [] },
          layout: { n, status: "ok", samplesMs: result.layout },
          ...(events ? { traceEvents: events } : {}),
        };
      }
      await delay(100);
    }
    const events = await finish();
    return { point: { n, status: "timeout", samplesMs: [] },
      layout: { n, status: "timeout", samplesMs: [] }, ...(events ? { traceEvents: events } : {}) };
  } finally {
    cdp.close();
    await fetch(`http://127.0.0.1:${port}/json/close/${tab.id}`).catch(() => {});
  }
}

try {
  const browserServer = await startBrowserBenchmarkServer(buildMode);
  server = browserServer.server;
  buildDirectory = browserServer.buildDirectory;
  const chromeArguments = ["--headless=new", "--no-first-run", "--no-default-browser-check",
    "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--window-size=1280,800",
    "--force-device-scale-factor=1", "--remote-allow-origins=*"];
  if (process.platform === "linux") {
    chromeArguments.push("--no-sandbox", "--disable-dev-shm-usage",
      "--remote-debugging-address=127.0.0.1");
  }
  chromeArguments.push("about:blank");
  processHandle = spawn(chrome, chromeArguments,
    { stdio: ["ignore", "ignore", "pipe"], windowsHide: true });
  processMonitor = new ChromeProcessMonitor(chrome, processHandle);
  const port = await waitForChromeDebuggingPort(profile, processMonitor);
  const browserInfo = await fetch(`http://127.0.0.1:${port}/json/version`).then((r) => r.json()) as { Browser: string };
  const commitSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const renderSizes = smoke ? [20] : [100, 1_000, 10_000];
  const frameSize = smoke ? 20 : 200;
  const renderWarmups = 1;
  const renderIterations = smoke ? 2 : 5;
  const frameWarmups = smoke ? 1 : 2;
  const animationRuns = smoke ? 2 : 10;
  const animationMs = smoke ? 50 : 350;
  const result: BrowserMeasurement = {
    commitSha, generatedAt: new Date().toISOString(), browser: browserInfo.Browser,
    os: `${os.platform()} ${os.release()} ${os.arch()}`,
    nodeVersion: process.version,
    gitVersion: execFileSync("git", ["--version"], { encoding: "utf8" }).trim(),
    buildMode, seed: 42, warmups: { render: renderWarmups, frame: frameWarmups }, renderIterations,
    animationRuns, viewport: "1280x800@1x", mode: "headless", saturationPoint: null,
    render: [], frame: [], layout: [],
  };
  for (const n of renderSizes) {
    const params = new URLSearchParams({ mode: "render", n: String(n),
      renderWarmups: String(renderWarmups), renderIterations: String(renderIterations) });
    const url = `${browserServer.pageUrl}?${params}`;
    const measured = await measure(port, url, "render", n, 30_000);
    result.render.push(measured.point);
    result.layout.push(measured.layout);
    console.log(`SVG render n=${n}: ${measured.point.status}${measured.point.samplesMs.length
      ? ` median=${percentile(measured.point.samplesMs, 0.5).toFixed(2)} p95=${percentile(measured.point.samplesMs, 0.95).toFixed(2)} ms` : ""}`);
  }
  const frameParams = new URLSearchParams({ mode: "frame", n: String(frameSize),
    frameWarmups: String(frameWarmups), animationRuns: String(animationRuns), animationMs: String(animationMs) });
  const frame = await measure(port, `${browserServer.pageUrl}?${frameParams}`, "frame", frameSize, 30_000, traceFrames);
  if (frame.traceEvents) {
    writeFileSync(path.join(tmpdir(), "gitscope-browser-trace.json"), JSON.stringify({ traceEvents: frame.traceEvents }));
    console.log(`Chrome Performance trace: ${path.join(tmpdir(), "gitscope-browser-trace.json")} (${frame.traceEvents.length} events)`);
  }
  result.frame.push(frame.point);
  result.layout.push(frame.layout);
  const saturation = result.render.filter((point) =>
    classifySaturation(point, RENDER_SATURATION_BUDGET_MS)).sort((a, b) => a.n - b.n)[0];
  result.saturationPoint = saturation ? { metric: "SVG render", n: saturation.n } : null;
  const frameSamples = frame.point.samplesMs;
  const frameP95 = frameSamples.length ? percentile(frameSamples, 0.95) : null;
  console.log(`Animation frames n=${frameSize}: ${frame.point.status}${frameP95 !== null
    ? ` median=${percentile(frameSamples, 0.5)} ms, p95=${frameP95} ms, max=${Math.max(...frameSamples)} ms, ${frameSamples.length} frames` : ""}`);
  if (frameSamples.length) {
    console.log(`Raw frames >16.7ms: ${frameSamples.filter((sample) => sample > 16.7).length}; >17ms: ${frameSamples.filter((sample) => sample > 17).length}; >20ms: ${frameSamples.filter((sample) => sample > 20).length}`);
  }
  console.log(`Build mode: ${buildMode}`);
  console.log(`Frame budget exceeded (p95 rounded to 0.1ms, budget ${FRAME_BUDGET_MS}ms): ${classifyFrameBudget(frame.point)}`);
  console.log(`SVG saturation point (p95 > ${RENDER_SATURATION_BUDGET_MS} ms or timeout): ${result.saturationPoint?.n ?? "none"}`);
  if (smoke) {
    if (result.render.some((point) => point.status !== "ok" || point.samplesMs.length !== renderIterations) ||
        frame.point.status !== "ok" || frame.point.samplesMs.length === 0) {
      throw new Error("Browser smoke measurement did not produce all requested samples");
    }
    console.log(`Browser smoke passed: Chrome=${result.browser}; SHA=${result.commitSha}; renderSamples=${renderIterations}; frameSamples=${frame.point.samplesMs.length}`);
  } else {
    writeFileSync("harness/bench/browser-results.json", `${JSON.stringify(result, null, 2)}\n`);
  }
} catch (error) {
  if (error instanceof ChromeProcessError) throw error;
  if (processMonitor?.failure) {
    throw processMonitor.error(`Chrome failed during the browser benchmark: ${String(error)}`);
  }
  throw error;
} finally {
  const runningServer = server;
  await cleanupBrowserResources({
    processHandle,
    closeServer: runningServer ? () => runningServer.close() : undefined,
    profile,
    buildDirectory,
  });
  processMonitor?.dispose();
}
