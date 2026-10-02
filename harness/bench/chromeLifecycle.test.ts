import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChromeProcessMonitor, cleanupBrowserResources, waitForChromeDebuggingPort } from "./chromeLifecycle";

class FakeChromeProcess extends EventEmitter {
  stderr = new PassThrough();
  kill = vi.fn(() => true);
}

const profiles: string[] = [];

function makeProfile(): string {
  const profile = mkdtempSync(path.join(tmpdir(), "gitscope-chrome-test-"));
  profiles.push(profile);
  return profile;
}

function monitorProcess(executable = "/opt/chrome/chrome") {
  const processHandle = new FakeChromeProcess();
  const monitor = new ChromeProcessMonitor(executable, processHandle as unknown as ChildProcess);
  return { processHandle, monitor };
}

afterEach(() => {
  for (const profile of profiles.splice(0)) rmSync(profile, { recursive: true, force: true });
});

describe("Chrome startup lifecycle", () => {
  it("accepts a valid DevToolsActivePort file", async () => {
    const profile = makeProfile();
    writeFileSync(path.join(profile, "DevToolsActivePort"), "45123\n/devtools/browser/id\n");
    const { monitor } = monitorProcess();

    await expect(waitForChromeDebuggingPort(profile, monitor, { timeoutMs: 50, pollIntervalMs: 1 }))
      .resolves.toBe(45_123);
    monitor.dispose();
  });

  it("rejects an invalid DevToolsActivePort file", async () => {
    const profile = makeProfile();
    writeFileSync(path.join(profile, "DevToolsActivePort"), "70000\n");
    const { monitor } = monitorProcess();

    await expect(waitForChromeDebuggingPort(profile, monitor, { timeoutMs: 50, pollIntervalMs: 1 }))
      .rejects.toThrow(/invalid port.*70000/s);
    monitor.dispose();
  });

  it("reports an early Chrome exit with executable, code, signal and stderr", async () => {
    const profile = makeProfile();
    const { processHandle, monitor } = monitorProcess("/custom/google-chrome");
    processHandle.stderr.write("sandbox setup failed\n");
    processHandle.emit("exit", 17, "SIGTERM");

    const result = waitForChromeDebuggingPort(profile, monitor, { timeoutMs: 100, pollIntervalMs: 1 });
    await expect(result).rejects.toThrow(/Executable: \/custom\/google-chrome[\s\S]*Exit code: 17; signal: SIGTERM[\s\S]*sandbox setup failed/);
    monitor.dispose();
  });

  it("bounds captured Chrome stderr", async () => {
    const profile = makeProfile();
    const { processHandle, monitor } = monitorProcess();
    processHandle.stderr.write(`discard-me-${"x".repeat(9_000)}-keep-me`);
    processHandle.emit("exit", 1, null);

    await expect(waitForChromeDebuggingPort(profile, monitor, { timeoutMs: 100, pollIntervalMs: 1 }))
      .rejects.toThrow(/Chrome stderr \(last 8000 characters; truncated\)[\s\S]*keep-me/);
    monitor.dispose();
  });

  it("reports a process error even when no exit event is emitted", async () => {
    const profile = makeProfile();
    const { processHandle, monitor } = monitorProcess("/missing/chrome");
    processHandle.emit("error", new Error("spawn ENOENT"));

    await expect(waitForChromeDebuggingPort(profile, monitor, { timeoutMs: 100, pollIntervalMs: 1 }))
      .rejects.toThrow(/Executable: \/missing\/chrome[\s\S]*Process error: spawn ENOENT/);
    monitor.dispose();
  });

  it("times out when Chrome neither exits nor writes a port file", async () => {
    const profile = makeProfile();
    const { monitor } = monitorProcess();

    await expect(waitForChromeDebuggingPort(profile, monitor, { timeoutMs: 10, pollIntervalMs: 1 }))
      .rejects.toThrow(/within 10 ms/);
    monitor.dispose();
  });

  it("still closes the server and removes the profile when stopping Chrome fails", async () => {
    const profile = makeProfile();
    const processHandle = new FakeChromeProcess();
    processHandle.kill.mockImplementation(() => { throw new Error("kill failed"); });
    const closeServer = vi.fn().mockRejectedValue(new Error("close failed"));
    const warn = vi.fn();

    await cleanupBrowserResources({
      processHandle: processHandle as unknown as ChildProcess,
      closeServer,
      profile,
      waitAfterKillMs: 0,
      warn,
    });

    expect(processHandle.kill).toHaveBeenCalledOnce();
    expect(closeServer).toHaveBeenCalledOnce();
    expect(existsSync(profile)).toBe(false);
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
