import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupBrowserResources } from "./chromeLifecycle";
import { selectBrowserBuildMode, startBrowserBenchmarkServer, type BrowserServerFactories } from "./browserServer";

const tempDirectories: string[] = [];

function makeTempDirectory(): string {
  const directory = mkdtempSync(path.join(tmpdir(), "gitscope-browser-server-test-"));
  tempDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function fakeServer(url: string) {
  return { resolvedUrls: { local: [url] }, close: vi.fn(async () => {}) };
}

describe("browser benchmark build mode", () => {
  it("defaults to development and supports explicit production or development selection", () => {
    expect(selectBrowserBuildMode([])).toBe("development");
    expect(selectBrowserBuildMode(["--production"])).toBe("production");
    expect(selectBrowserBuildMode(["--development"])).toBe("development");
    expect(() => selectBrowserBuildMode(["--production", "--development"])).toThrow(/only one/);
  });

  it("serves the Vite development page without building a bundle", async () => {
    const server = fakeServer("http://127.0.0.1:5173/");
    const factories: BrowserServerFactories = {
      createDevelopmentServer: vi.fn(async () => server),
      buildProduction: vi.fn(async () => {}),
      startProductionPreview: vi.fn(async () => fakeServer("http://127.0.0.1:4173/")),
      makeBuildDirectory: makeTempDirectory,
      repositoryRoot: () => "/repo",
    };

    const result = await startBrowserBenchmarkServer("development", factories);

    expect(result.pageUrl).toBe("http://127.0.0.1:5173/harness/bench/browser.html");
    expect(result.buildDirectory).toBeUndefined();
    expect(factories.createDevelopmentServer).toHaveBeenCalledWith({
      server: { host: "127.0.0.1", port: 0 },
    });
    expect(factories.buildProduction).not.toHaveBeenCalled();
    expect(factories.startProductionPreview).not.toHaveBeenCalled();
  });

  it("builds the benchmark HTML into a temp directory and serves it with preview", async () => {
    const server = fakeServer("http://127.0.0.1:4173/");
    const factories: BrowserServerFactories = {
      createDevelopmentServer: vi.fn(async () => fakeServer("http://127.0.0.1:5173/")),
      buildProduction: vi.fn(async () => {}),
      startProductionPreview: vi.fn(async () => server),
      makeBuildDirectory: makeTempDirectory,
      repositoryRoot: () => "/repo",
    };

    const result = await startBrowserBenchmarkServer("production", factories);
    const buildConfig = vi.mocked(factories.buildProduction).mock.calls[0]![0];
    const previewConfig = vi.mocked(factories.startProductionPreview).mock.calls[0]![0];

    expect(result.pageUrl).toBe("http://127.0.0.1:4173/harness/bench/browser.html");
    expect(result.buildDirectory).toBeDefined();
    expect(buildConfig.mode).toBe("production");
    expect(buildConfig.build.rollupOptions.input).toEqual({ browser: "/repo/harness/bench/browser.html" });
    expect(buildConfig.build.outDir).toBe(path.join(result.buildDirectory!, "dist"));
    expect(previewConfig.preview).toEqual({ host: "127.0.0.1", port: 0 });
    expect(factories.createDevelopmentServer).not.toHaveBeenCalled();

    const profile = makeTempDirectory();
    await cleanupBrowserResources({
      closeServer: () => server.close(), profile, buildDirectory: result.buildDirectory,
    });
    expect(server.close).toHaveBeenCalledOnce();
    expect(existsSync(result.buildDirectory!)).toBe(false);
    expect(existsSync(profile)).toBe(false);
  });

  it("removes the temp build if the production build or preview fails", async () => {
    const factories: BrowserServerFactories = {
      createDevelopmentServer: vi.fn(async () => fakeServer("http://127.0.0.1:5173/")),
      buildProduction: vi.fn(async () => { throw new Error("bundle failed"); }),
      startProductionPreview: vi.fn(async () => fakeServer("http://127.0.0.1:4173/")),
      makeBuildDirectory: makeTempDirectory,
      repositoryRoot: () => "/repo",
    };

    await expect(startBrowserBenchmarkServer("production", factories)).rejects.toThrow("bundle failed");
    const buildDirectory = tempDirectories.at(-1)!;
    expect(existsSync(buildDirectory)).toBe(false);
  });

  it("closes preview and removes the temp build when preview has no local URL", async () => {
    const server = { resolvedUrls: null, close: vi.fn(async () => {}) };
    const factories: BrowserServerFactories = {
      createDevelopmentServer: vi.fn(async () => fakeServer("http://127.0.0.1:5173/")),
      buildProduction: vi.fn(async () => {}),
      startProductionPreview: vi.fn(async () => server),
      makeBuildDirectory: makeTempDirectory,
      repositoryRoot: () => "/repo",
    };

    await expect(startBrowserBenchmarkServer("production", factories)).rejects.toThrow(/local URL/);
    expect(server.close).toHaveBeenCalledOnce();
    expect(existsSync(tempDirectories.at(-1)!)).toBe(false);
  });
});
