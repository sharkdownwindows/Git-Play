import { spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { gitArgs, type AbstractCommand } from "./adapter";

export interface GitInvocation { status: number; output: string }
export interface RawGitCommit { hash: string; message: string; parents: string[] }
export interface RawGitState {
  commits: RawGitCommit[];
  branches: Record<string, string>;
  head: { detached: false; ref: string } | { detached: true; hash: string };
  /** Hashes in creation order, including commits no longer reachable by a ref. */
  creationOrder: string[];
}
export interface RealStep { command: AbstractCommand; result: GitInvocation; state: RawGitState }
export interface RealRun { steps: RealStep[]; state: RawGitState; gitVersion: string; tempDirectory: string }

const gitEnvironment = {
  ...process.env,
  LC_ALL: "C",
  LANG: "C",
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
  GIT_TERMINAL_PROMPT: "0",
};

function invoke(cwd: string, args: string[], environment: Record<string, string> = {}): GitInvocation {
  const result = spawnSync("git", args, { cwd, env: { ...gitEnvironment, ...environment }, encoding: "utf8", shell: false });
  if (result.error) throw result.error;
  return { status: result.status ?? 1, output: `${result.stdout}${result.stderr}`.trim() };
}

function required(cwd: string, args: string[]): string {
  const result = invoke(cwd, args);
  if (result.status !== 0) throw new Error(`git ${args[0]} failed: ${result.output}`);
  return result.output;
}

export function gitVersion(): string {
  return required(process.cwd(), ["--version"]);
}

export function isPinnedGit(version: string): boolean {
  return /^git version 2\.43(?:\.|$)/.test(version);
}

function readState(cwd: string, knownHashes: Iterable<string>): RawGitState {
  const creationOrder = [...knownHashes];
  const branches: Record<string, string> = Object.create(null);
  for (const line of required(cwd, ["for-each-ref", "--format=%(refname:short)%00%(objectname)", "refs/heads"]).split("\n")) {
    if (!line) continue;
    const [name, hash] = line.split("\0");
    if (name && hash) branches[name] = hash;
  }
  const symbolic = invoke(cwd, ["symbolic-ref", "-q", "--short", "HEAD"]);
  const head = symbolic.status === 0
    ? { detached: false as const, ref: symbolic.output }
    : { detached: true as const, hash: required(cwd, ["rev-parse", "HEAD"]) };
  const logArgs = ["log", "-z", "--all", ...(head.detached ? ["HEAD"] : []), ...creationOrder,
    "--format=%H%x00%P%x00%B"];
  const commits: RawGitCommit[] = [];
  const seen = new Set<string>();
  const records = required(cwd, logArgs).split("\0");
  for (let i = 0; i + 2 < records.length; i += 3) {
    const hash = records[i];
    const parentText = records[i + 1];
    const message = records[i + 2]?.replace(/\n$/, "");
    if (!hash || message === undefined || seen.has(hash)) continue;
    seen.add(hash);
    commits.push({ hash, message, parents: parentText ? parentText.split(" ") : [] });
  }
  return { commits, branches, head, creationOrder };
}

/** Each call owns and removes its repository, including when Git or parsing fails. */
export function runReal(commands: readonly AbstractCommand[], read: typeof readState = readState): RealRun {
  const version = gitVersion();
  const directory = mkdtempSync(join(tmpdir(), "gitscope-diff-"));
  try {
    required(directory, ["init", "-q", "-b", "main"]);
    required(directory, ["config", "--local", "user.name", "GitScope Test"]);
    required(directory, ["config", "--local", "user.email", "gitscope@example.invalid"]);
    const hashes = new Map<string, string>();
    const steps: RealStep[] = [];
    let state = read(directory, hashes.values());
    for (const command of commands) {
      const args = gitArgs(command, (target) => hashes.get(target) ?? target,
        (name) => Object.hasOwn(state.branches, name));
      // Distinct deterministic seconds prevent identical repeated merges from
      // collapsing to one Git object hash during a fast harness run.
      const date = new Date(Date.UTC(2020, 0, 1) + steps.length * 1000).toISOString();
      const result = invoke(directory, args, { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date });
      state = read(directory, hashes.values());
      if (result.status === 0 && (command.kind === "commit" || command.kind === "merge")) {
        const headHash = state.head.detached ? state.head.hash : state.branches[state.head.ref];
        if (headHash && ![...hashes.values()].includes(headHash)) hashes.set(`c${hashes.size + 1}`, headHash);
      }
      state.creationOrder = [...hashes.values()];
      steps.push({ command, result, state });
    }
    return { steps, state: read(directory, hashes.values()), gitVersion: version, tempDirectory: directory };
  } finally {
    if (realpathSync(dirname(directory)) !== realpathSync(tmpdir()) ||
        !basename(directory).startsWith("gitscope-diff-")) {
      throw new Error(`Unsafe temporary directory: ${directory}`);
    }
    rmSync(directory, { recursive: true, force: true });
  }
}
