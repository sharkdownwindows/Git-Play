import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir, release, arch } from "node:os";
import { basename, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const iterations = 100;
const tempRoot = realpathSync(tmpdir());
const directory = mkdtempSync(join(tempRoot, "gitscope-spawn-"));

function git(args) {
  const result = spawnSync("git", args, { cwd: directory, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

let report;
try {
  const gitVersion = git(["--version"]);
  git(["-c", "init.defaultBranch=main", "init", "--quiet"]);

  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    git(["status", "--porcelain"]);
    times.push(Number(process.hrtime.bigint() - start) / 1e6);
  }

  const sorted = [...times].sort((a, b) => a - b);
  report = {
    command: "git status --porcelain",
    iterations,
    meanMs: times.reduce((sum, ms) => sum + ms, 0) / iterations,
    medianMs: (sorted[49] + sorted[50]) / 2,
    p95Ms: sorted[94],
    nodeVersion: process.version,
    gitVersion,
    os: `${process.platform} ${release()} ${arch()}`,
    temporaryDirectory: directory,
  };
} finally {
  if (
    realpathSync(dirname(directory)) !== tempRoot ||
    !basename(directory).startsWith("gitscope-spawn-")
  ) {
    throw new Error(`Unsafe temporary directory: ${directory}`);
  }
  rmSync(directory, { recursive: true, force: true });
}

console.log(JSON.stringify({ ...report, temporaryDirectoryRemoved: true }, null, 2));
