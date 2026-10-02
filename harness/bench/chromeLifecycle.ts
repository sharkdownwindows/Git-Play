import type { ChildProcess } from "node:child_process";
import { readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export const CHROME_STARTUP_TIMEOUT_MS = 30_000;
export const CHROME_STDERR_LIMIT = 8_000;

export class ChromeProcessError extends Error {}

type ChromeFailure =
  | { kind: "error"; error: Error }
  | { kind: "exit"; code: number | null; signal: NodeJS.Signals | null };

export class ChromeProcessMonitor {
  private failureValue: ChromeFailure | undefined;
  private stderrValue = "";
  private stderrTruncated = false;

  private readonly onError = (error: Error): void => {
    this.failureValue ??= { kind: "error", error };
  };

  private readonly onExit = (code: number | null, signal: NodeJS.Signals | null): void => {
    this.failureValue ??= { kind: "exit", code, signal };
  };

  private readonly onStderr = (chunk: Buffer | string): void => {
    const combined = this.stderrValue + String(chunk);
    if (combined.length > CHROME_STDERR_LIMIT) {
      this.stderrValue = combined.slice(-CHROME_STDERR_LIMIT);
      this.stderrTruncated = true;
    } else {
      this.stderrValue = combined;
    }
  };

  constructor(readonly executable: string, readonly processHandle: ChildProcess) {
    processHandle.on("error", this.onError);
    processHandle.on("exit", this.onExit);
    processHandle.stderr?.on("data", this.onStderr);
  }

  get failure(): ChromeFailure | undefined {
    return this.failureValue;
  }

  error(reason: string): ChromeProcessError {
    const failure = this.failureValue;
    const processStatus = failure?.kind === "exit"
      ? `Exit code: ${failure.code ?? "null"}; signal: ${failure.signal ?? "null"}`
      : failure?.kind === "error"
        ? `Process error: ${failure.error.message}; exit code: null; signal: null`
        : "Exit code: not observed; signal: not observed";
    const stderrLabel = this.stderrTruncated
      ? `Chrome stderr (last ${CHROME_STDERR_LIMIT} characters; truncated)`
      : "Chrome stderr";
    return new ChromeProcessError([
      reason,
      `Executable: ${this.executable}`,
      processStatus,
      `${stderrLabel}:\n${this.stderrValue.trimEnd() || "<empty>"}`,
    ].join("\n"));
  }

  dispose(): void {
    this.processHandle.off("error", this.onError);
    this.processHandle.off("exit", this.onExit);
    this.processHandle.stderr?.off("data", this.onStderr);
  }
}

function parseDebuggingPort(content: string): number {
  const firstLine = content.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (!/^\d+$/.test(firstLine)) return Number.NaN;
  const port = Number(firstLine);
  return Number.isSafeInteger(port) && port >= 1 && port <= 65_535 ? port : Number.NaN;
}

export async function waitForChromeDebuggingPort(profile: string, monitor: ChromeProcessMonitor,
  options: { timeoutMs?: number; pollIntervalMs?: number } = {}): Promise<number> {
  const timeoutMs = Math.min(options.timeoutMs ?? CHROME_STARTUP_TIMEOUT_MS, CHROME_STARTUP_TIMEOUT_MS);
  const pollIntervalMs = options.pollIntervalMs ?? 100;
  const portFile = path.join(profile, "DevToolsActivePort");
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    if (monitor.failure) {
      await delay(0);
      throw monitor.error("Chrome exited before opening its debugging port");
    }

    try {
      const content = readFileSync(portFile, "utf8");
      const port = parseDebuggingPort(content);
      if (!Number.isFinite(port)) {
        throw monitor.error(`DevToolsActivePort contains an invalid port: ${JSON.stringify(content)}`);
      }
      return port;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }

    await delay(pollIntervalMs);
  }

  throw monitor.error(`Chrome did not open its debugging port within ${timeoutMs} ms`);
}

interface BrowserResources {
  processHandle?: ChildProcess;
  closeServer?: () => Promise<void>;
  profile: string;
  buildDirectory?: string;
  waitAfterKillMs?: number;
  warn?: (message: string) => void;
}

export async function cleanupBrowserResources(resources: BrowserResources): Promise<void> {
  const warn = resources.warn ?? console.warn;
  try {
    resources.processHandle?.kill();
  } catch (error) {
    warn(`Could not stop Chrome: ${String(error)}`);
  }

  try {
    await resources.closeServer?.();
  } catch (error) {
    warn(`Could not stop Vite server: ${String(error)}`);
  }

  if (resources.processHandle) await delay(resources.waitAfterKillMs ?? 1_000);

  removeTemporaryDirectory(resources.profile, "Chrome profile", warn);
  if (resources.buildDirectory) removeTemporaryDirectory(resources.buildDirectory, "production build", warn);
}

function removeTemporaryDirectory(directory: string, label: string, warn: (message: string) => void): void {
  try {
    const resolved = realpathSync(directory);
    const tempRoot = realpathSync(tmpdir()) + path.sep;
    if (!resolved.startsWith(tempRoot)) {
      warn(`Refusing to remove ${label} outside the temp directory: ${resolved}`);
      return;
    }
    rmSync(resolved, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
  } catch (error) {
    warn(`Could not remove temporary ${label}: ${String(error)}`);
  }
}
