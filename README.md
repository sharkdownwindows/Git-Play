# GitPlay

GitPlay is a static educational web app for learning how Git changes a commit graph. A learner enters a command, watches the DAG, branches and `HEAD` change, and works through eight levels with automatic goal checking.

The product is deliberately limited to five commands: `commit`, `branch`, `switch`, `checkout` and `merge`. It has no backend, account system or progress synchronization. Progress stays in the browser's `localStorage`.

The measured results, limitations and provenance are in the [final report](docs/FINAL_REPORT.md).

## Requirements

- Node.js 24.x, matching CI
- npm, supplied with Node.js
- Git only if you want to run the differential harness against real Git; CI pins Git 2.43

## Install and run in development

From the repository root:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Test and build

```bash
npm run typecheck
npm test
npm run lint:imports
npm run build
```

The production bundle is written to `dist/`. The build is entirely static.

Additional verification commands:

```bash
npm run diff:quick
npm run bench
```

- `diff:quick` compares GitScope with the locally installed Git over a small exhaustive command set. A local Git version other than 2.43 is reported explicitly.
- `bench` measures deterministic graph layout at 100, 1,000, 10,000 and 100,000 commits.
- The longer nightly workflow and browser benchmark are documented in [the final report](docs/FINAL_REPORT.md); they are not required to run the app.

Tests live beside their source files. The normal CI workflow runs typecheck, unit tests, import-boundary checks, the production build, a depth-2 differential gate and a browser benchmark smoke test.

## Run the production build offline

Install dependencies and build once while dependencies are available, then serve the already-built files locally:

```bash
npm run build
npm run preview -- --host 127.0.0.1
```

Open `http://127.0.0.1:4173`, then the machine may be disconnected from the internet while the preview process remains running. The app, its assets and `verification.json` are local and require no runtime backend or external service.

Do not open `dist/index.html` directly with a `file://` URL: browser module and fetch rules require an HTTP server. GitScope does not install a service worker, so it does not promise that a previously hosted deployment can be reopened after its server becomes unavailable.

## Supported commands

The terminal parser accepts only the following syntax:

| Command | Supported forms | Effect |
|---|---|---|
| `commit` | `git commit`, `git commit -m "message"` | Creates a commit. An attached branch moves to it; detached `HEAD` moves without changing a branch. |
| `branch` | `git branch`, `git branch <name>` | Lists branches or creates a branch at the current commit. It does not switch branches. |
| `switch` | `git switch <branch>`, `git switch -c <branch>`, `git switch --detach <commit-or-branch>` | Attaches `HEAD` to a branch, creates and switches to a branch, or explicitly detaches `HEAD`. |
| `checkout` | `git checkout <branch-or-commit>`, `git checkout -b <branch>` | Switches to a branch, detaches at a commit, or creates and switches to a branch. |
| `merge` | `git merge <branch>` | Reports already-up-to-date, performs a fast-forward, or creates a two-parent merge commit. |

The parser validates syntax; the engine validates repository state. Unsupported flags and subcommands return an error instead of being passed to the host machine.

## Architecture

```text
Terminal input
    -> syntax parser
    -> pure Git engine -> RepoState -> deterministic layout -> SVG graph
                         |         -> level goal checker
                         |         -> undo/redo snapshots
                         +-------- -> application store -> React UI

localStorage <-> level progress
verification.json -> Verification tab

Node harness -> GitScope engine <-> real Git
             -> layout/browser benchmarks
             -> verification.json
```

Key boundaries:

- `src/core/` is independent of React, the DOM and browser APIs. Commands return a new serializable `RepoState`; errors are values rather than thrown exceptions.
- `src/terminal/` owns tokenization and syntax validation.
- `src/app/store.ts` is the path for UI state changes and owns undo/redo integration.
- `src/viz/` computes deterministic layout without mutating repository state, then renders SVG.
- `src/levels/` contains eight levels and the DAG-isomorphism goal checker.
- `src/progress/` persists only level completion records in `localStorage`.
- `src/verification/` validates and displays the CI-generated `public/verification.json`.
- `harness/` runs differential tests and benchmarks in Node.js.

## Product limits

GitScope models commits, parent relationships, branch pointers and attached/detached `HEAD`. It does not model file contents, a working tree, staging, `git add`, content conflicts, remotes, rebase, tags or arbitrary Git flags. Merge conflict detection therefore always returns no content conflict.

Commit IDs such as `c1` are simulator IDs, not Git hashes. Some success and advice text is intentionally shorter than real Git; the verification report records those wording differences as soft warnings.

Progress is local to one browser profile. Clearing site data removes it. The current user-evaluation dataset has no participant rows, so the project makes no measured claim about learning outcomes or usability; see [evaluation results](docs/evaluation/RESULTS.md).

## Repository map

```text
src/core/          pure Git engine and history
src/terminal/      parser, terminal session and UI
src/viz/           deterministic layout and graph rendering
src/levels/        eight levels and goal checker
src/progress/      localStorage progress
src/verification/  report validation and Verification UI
src/commands-ref/  five-command reference
src/app/           application shell and store
harness/           differential and benchmark tooling
docs/evaluation/   protocol, raw schema and evaluation status
```

Start with the [PRD](docs/PRD.md), [technical overview](docs/TECHNICAL_OVERVIEW.md) and [final report](docs/FINAL_REPORT.md) for the product contract and evidence.
