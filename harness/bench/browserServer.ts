import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { build, createServer, preview } from "vite";

export type BrowserBuildMode = "development" | "production";

export interface BrowserServerHandle {
  resolvedUrls: { local: string[] } | null;
  close(): Promise<void>;
}

export interface BrowserServerFactories {
  createDevelopmentServer(config: { server: { host: string; port: number } }): Promise<BrowserServerHandle>;
  buildProduction(config: {
    root: string;
    configFile: string;
    mode: "production";
    build: { outDir: string; emptyOutDir: true; rollupOptions: { input: Record<string, string> } };
  }): Promise<unknown>;
  startProductionPreview(config: {
    root: string;
    configFile: string;
    mode: "production";
    build: { outDir: string };
    preview: { host: string; port: number };
  }): Promise<BrowserServerHandle>;
  makeBuildDirectory(): string;
  repositoryRoot(): string;
}

export interface BrowserBenchmarkServer {
  server: BrowserServerHandle;
  pageUrl: string;
  buildDirectory?: string;
}

const defaultFactories: BrowserServerFactories = {
  async createDevelopmentServer(config) {
    const server = await createServer(config);
    await server.listen();
    return server;
  },
  buildProduction: (config) => build(config),
  startProductionPreview: (config) => preview(config),
  makeBuildDirectory: () => mkdtempSync(path.join(tmpdir(), "gitscope-browser-build-")),
  repositoryRoot: () => process.cwd(),
};

export function selectBrowserBuildMode(args: readonly string[]): BrowserBuildMode {
  const production = args.includes("--production");
  const development = args.includes("--development");
  if (production && development) throw new Error("Choose only one browser build mode");
  return production ? "production" : "development";
}

export async function startBrowserBenchmarkServer(
  mode: BrowserBuildMode,
  factories: BrowserServerFactories = defaultFactories,
): Promise<BrowserBenchmarkServer> {
  const host = "127.0.0.1";
  const root = factories.repositoryRoot();
  if (mode === "development") {
    const server = await factories.createDevelopmentServer({ server: { host, port: 0 } });
    const baseUrl = server.resolvedUrls?.local[0];
    if (!baseUrl) {
      await server.close();
      throw new Error("Vite development server did not report a local URL");
    }
    return { server, pageUrl: new URL("harness/bench/browser.html", baseUrl).toString() };
  }

  const buildDirectory = factories.makeBuildDirectory();
  const outDir = path.join(buildDirectory, "dist");
  let server: BrowserServerHandle | undefined;
  try {
    await factories.buildProduction({
      root,
      configFile: path.join(root, "vite.config.ts"),
      mode: "production",
      build: {
        outDir,
        emptyOutDir: true,
        rollupOptions: { input: { browser: path.join(root, "harness/bench/browser.html") } },
      },
    });
    server = await factories.startProductionPreview({
      root,
      configFile: path.join(root, "vite.config.ts"),
      mode: "production",
      build: { outDir },
      preview: { host, port: 0 },
    });
    const baseUrl = server.resolvedUrls?.local[0];
    if (!baseUrl) throw new Error("Vite preview server did not report a local URL");
    return { server, pageUrl: new URL("harness/bench/browser.html", baseUrl).toString(), buildDirectory };
  } catch (error) {
    await server?.close().catch(() => {});
    rmSync(buildDirectory, { recursive: true, force: true });
    throw error;
  }
}
