# GitScope UI implementation plan

## Purpose and guardrails

This plan turns the curated handoff into an implementation sequence. Follow
`docs/design/SOURCE_OF_TRUTH.md`: application contracts govern behavior and
data, `UI_IMPLEMENTATION_SPEC.md` governs responsive behavior/accessibility/
component states, and corrected screenshots/videos govern visual appearance
and motion. Prototype records and sample data are illustrative only. Do not
read raw prototype artifacts as implementation authority.

The product remains Tier 1 only. Preserve the engine, parser, repository
state, deterministic graph layout, level checking/progress, and verification
report schema. UI state changes go through the app store where the store owns
that state. Progress stays in localStorage. Do not add `git add`, a backend,
authentication, synchronization, or dependencies. Keep every implementation
slice within its allowed-file list below. Stop and resolve a contract conflict
before changing behavior or data.

**Locked language decision:** all production UI, including the intro splash,
uses English. `docs/TECHNICAL_OVERVIEW.md` is the language source of truth.
Vietnamese copy in prototype references is a visual placeholder. Preserve the
intro layout, typography, line count, and visual hierarchy with concise
English copy of comparable length; the final strings are recorded in section 2.

The current worktree already contains an intro implementation and focused
tests. The intro slice below is an audit/alignment pass against the approved
spec, not a reason to replace working code wholesale. Review the current diff
before beginning any implementation milestone so unrelated or user-owned
changes remain intact.

## Sequence and dependencies

1. **Tokens and app shell (S0)** is the prerequisite for all UI slices.
2. **Intro (S1)** can follow S0. Graph primitives and terminal work can proceed
   independently after S0; Practice follows both, then Levels follows Practice.
3. **Reference (S6)** and **Verification (S7)** can proceed independently after
   S0, subject to the contracts and explicit file scopes below.
4. **Responsive/accessibility (S8)** is checked during every slice and closed
   as a cross-cutting gate before visual QA.
5. **Visual QA** follows all screen implementations. **Production benchmark
   #47** is the final measurement gate after the UI changes are stable.

Parallel work must not produce simultaneous edits to shared files such as
`src/app/App.tsx`, `src/app/layout.css`, or `src/terminal/Terminal.tsx`. Assign
exclusive ownership of those files for each implementation interval.

## 1. Tokens and app shell

**References**

- `docs/design/screenshots/practice-1440x900.png`,
  `practice-390x844.png`, `levels-1440x900.png`, and `reference-1440x900.png`
  for the shared shell and selected tab.
- `docs/design/UI_IMPLEMENTATION_SPEC.md` §2 and §4.1 (S0); the intro
  screenshots are for layering and skip-link interaction only.

**Files allowed to change**

- `src/app/layout.css`
- `src/app/App.tsx`, `src/app/App.test.ts`
- Add a focused app-shell component/test under `src/app/` only if the current
  component cannot express the specified shell without unrelated refactoring.

**Behavior to preserve**

- Existing tab selection, application/store ownership, and selected tab
  semantics. Do not change routes or engine behavior.
- Maintain the existing accessible tab relationships and keyboard operation.
- An intro, when present, layers above the app and makes the background inert;
  the skip link remains the first useful keyboard navigation target once the
  app is available.

**Props/state to add or confirm**

- Keep the selected app tab in its existing owner; do not duplicate it in CSS
  or a second component state.
- Add only shell presentation props if a component boundary is necessary
  (for example `activeTab`, `onTabChange`, and `children`). Use semantic
  `aria-selected`, `aria-controls`, and tabpanel IDs.
- Add the spec's named color, duration, layer, and header-height tokens,
  including accent hover, navigation text, branch border, terminal controls,
  disabled text, success/warning colors, skip/header/intro z-indices, and
  banner/halo durations.

**Tests**

- Extend `src/app/App.test.ts` for tab selection/relationships, skip link,
  focus visibility, and intro/app layering where applicable.
- Keep tests consistent with the existing Vitest/SSR style; do not add a DOM
  testing dependency.

**Acceptance criteria**

- Header, tabs, page background, spacing, and shared type hierarchy match the
  applicable corrected desktop/mobile captures.
- Tokens are centralized; no component adds one-off values where a specified
  token exists.
- Keyboard tab navigation and tab-to-panel relationships remain usable.

**Validation**

- Run focused app tests, `npm run typecheck`, and `npm run lint:imports`.
- Inspect at 1440×900 and 390×844 with keyboard focus visible.

**Stop conditions**

- Stop if a shell change requires changing app-store ownership, core contracts,
  or unsupported navigation behavior.
- Stop if any production shell text is not English or if a language change
  would require changing product behavior rather than presentation.

## 2. Intro

**References**

- Screenshots: `intro-0000ms-1440x900.png`, `intro-0500ms-1440x900.png`,
  `intro-1300ms-1440x900.png`, `intro-cta-ready-1440x900.png`,
  `intro-cta-ready-390x844.png`, `intro-cta-keyboard-focus-1440x900.png`,
  `intro-reduced-motion-1440x900.png`, and `intro-rive-fallback-1440x900.png`.
- Video: `docs/design/motion/video-intro-load-to-app-1440x900.mp4`.
- Timing and focus details: `docs/design/INTRO_MOTION_SPEC.md` and
  `docs/design/UI_IMPLEMENTATION_SPEC.md` §4.2 (S1). Use
  `docs/design/reference/CORRECTIONS.diff` only to understand corrected visual
  intent, not as production code.

**Files allowed to change**

- `src/app/Intro.tsx`, `src/app/introBehavior.ts`, `src/app/Intro.test.ts`
- `src/app/App.tsx`, `src/app/App.test.ts`, `src/app/layout.css`
- Existing optimized files under `public/assets/intro/` only if an asset
  correction is needed. No `.riv`, CDN, remote media, or new dependency.

**Behavior to preserve**

- Video is muted, autoplaying, and `playsInline` when motion is allowed; poster
  remains visible on load/error/play rejection and under reduced motion.
- All production UI copy, including the intro splash, is English. Vietnamese
  strings in prototype references are visual placeholders only.
- Media failure must not block entering Practice or any Tier 1 workflow.
- Intro can close only through its CTA or the explicitly specified Enter/Space
  activation. Clicking media/background does not close it; Escape is not a
  close action. Focus stays in the dialog and returns to the terminal on close.
- Preserve the spec's entrance/exit timing, CTA focus timing, responsive
  placement, and one-time/reopen rule. Do not introduce a Rive runtime.

**Props/state to add or confirm**

- Keep `isOpen`/completion policy owned by the app; keep media status and
  reduced-motion behavior local to Intro where possible.
- Confirm props for `onClose`, terminal focus-return target, and media
  readiness/error. Avoid duplicating intro visibility state.
- Use English document language for intro content (`lang="en"` where an
  explicit language attribute is needed).
- Final intro copy:
  - Supporting text: **“Learn Git by typing commands and watching the commit graph change.”**
  - CTA: **“Click to begin →”**
  - Keyboard hint: **“or press Enter”**
- These strings keep the same three text roles and comparable lengths as the
  visual placeholders to preserve measured line count and reduce layout shift.
  Keep the `GitScope` title unchanged.

**Tests**

- Keep/add focused cases in `Intro.test.ts` and `App.test.ts` for successful
  video load, poster fallback on error/rejected playback, reduced motion,
  closing, focus trap, focus restoration, and intro recurrence policy.
- Add keyboard timing/activation coverage for Enter before CTA autofocus,
  Space while focused on CTA, no close from outside click, and no Escape close.
- Manually inspect in a browser because the current test environment does not
  render real media or perform browser focus navigation.

**Acceptance criteria**

- Visual progression and exit align with the measured motion spec; logo fits
  390×844 without crop or negative-position workaround.
- Every production intro string matches the English copy locked above. The
  supporting text, CTA, and hint retain their reference line count at
  1440×900 and 390×844. Preserve layout, typography, and visual hierarchy.
- No external request or Rive dependency is required; failed media leaves a
  usable poster and working CTA.
- Reduced motion does not autoplay video and shortens/removes transitions.
- Focus enters and remains in the dialog, then returns to the terminal.

**Validation**

- Run focused intro/app tests, `npm run typecheck`, `npm run build`, and
  `npm run lint:imports`.
- Verify online and with browser offline after initial page load; inspect the
  browser network panel for any request outside localhost.

**Stop conditions**

- Stop if the approved English strings change the line count or create a
  visible hierarchy/layout shift at either reference viewport; adjust concise
  wording while retaining the approved meaning and English-only rule.
- Stop if the only way to match motion requires a remote asset, `.riv` file, or
  blocking Tier 1 interaction.
- Stop if focus is lost, media failure hides the CTA/poster, or reduced-motion
  still starts animation.

## 3. Practice

**References**

- Screenshots: `practice-1440x900.png` and `practice-390x844.png`.
- Video: `docs/design/motion/video-commit-graph-animation-1440x900.mp4` for
  graph/command transitions; use only relevant frames, not its sample graph
  data.
- `docs/design/UI_IMPLEMENTATION_SPEC.md` §3.2–3.4 and §4.3–4.5 (graph,
  terminal, and Practice slices); `docs/TECHNICAL_OVERVIEW.md` for store and
  graph contracts.

**Files allowed to change**

- `src/viz/GraphView.tsx`, `src/viz/RefLabel.tsx`, `src/viz/MiniGraph.tsx`,
  `src/viz/CommitNode.tsx`, `src/viz/edges.tsx`, and their focused tests.
- `src/terminal/Terminal.tsx`, `src/terminal/session.ts`, and their focused
  tests.
- `src/app/Practice.tsx`, its focused tests, and `src/app/layout.css`.
- Add UI-only graph/terminal components and tests under `src/viz/` or
  `src/app/` only where the spec calls for them.

**Behavior to preserve**

- Commands still parse and execute through the existing app store. Parser,
  engine, RepoState, history/undo-redo, and command semantics are unchanged.
- Layout remains deterministic and pure; it never mutates RepoState. Preserve
  graph animation semantics and avoid changing benchmark parameters in this
  slice.
- Terminal command history, error classification, Enter execution, and
  ↑/↓ recall stay intact. Input lock prevents overlapping commands without
  dropping accepted output.
- Use actual store/session output; never copy prototype commit labels or
  terminal history into the UI.

**Props/state to add or confirm**

- Graph primitives receive laid-out commit/edge/ref data, selection/animation
  state, and callbacks as props; they do not compute or mutate repository
  state. Keep selection derived or in its current UI/store owner.
- Extend terminal entry presentation to represent command, success/error
  output, and optional status without losing session history. Expose the
  specified `locked`, placeholder/hint, examples, and presentation variant as
  props rather than parallel state.
- Practice derives graph, terminal, status, and lock state from the existing
  store/session; add only transient presentation state required by the spec.

**Tests**

- Update `GraphView.test.ts`, animation/layout-facing tests, `Terminal.test.ts`,
  `Practice.test.ts`, and relevant store tests.
- Cover commit/ref/edge rendering, graph update transition, command acceptance,
  pending lock, success/error unified log, auto-scroll, history navigation,
  and narrow layout order.
- Keep deterministic layout tests unchanged unless a UI-only test seam is
  needed; do not change `src/viz/layout.ts`.

**Acceptance criteria**

- Practice matches the desktop two-column and mobile graph-first composition;
  terminal input/output hierarchy and graph labels remain legible.
- A command produces the same repository transition as before and renders its
  real result once. Output scrolls to the newest entry without moving focus.
- No new state contract leaks into the core engine or persisted progress.

**Validation**

- Run focused Practice, Terminal, store, GraphView, and animation tests;
  `npm run typecheck`; `npm run lint:imports`.
- Manually exercise at least one valid command, one invalid command, undo,
  redo, and a graph update at 1440×900 and 390×844.

**Stop conditions**

- Stop if the requested visual change would alter command semantics, RepoState,
  parser/engine logic, layout determinism, or history behavior.
- Stop if graph animation introduces a benchmark parameter change or requires
  editing `src/viz/layout.ts` before the production benchmark result is known.

## 4. Levels

**References**

- Screenshots: `levels-1440x900.png`, `levels-390x844.png`, and
  `levels-completed-1024x768.png`.
- Video: `docs/design/motion/video-level-complete-transition-1440x900.mp4`.
- `docs/design/UI_IMPLEMENTATION_SPEC.md` §3.5 and §4.6 (S5); use level
  definitions/contracts as the source of available levels and requirements.

**Files allowed to change**

- `src/levels/Levels.tsx`, `src/levels/LevelList.tsx`,
  `src/levels/LevelPanel.tsx`, `src/app/layout.css`, and focused tests in
  `src/levels/`.
- Add `LevelBrief`, `CompletionBanner`, `LevelPicker`, or equivalent UI-only
  components under `src/levels/` with focused tests.
- Do not change `src/levels/**`, level data, `levelStore.ts`, engine, or
  persistence contracts for presentation work.

**Behavior to preserve**

- Keep current selected-level, local progress, automatic goal checking, and
  level reset/continue behavior. Do not hardcode screenshot progress or sample
  level names/status.
- On completion, focus moves to **Next** when available; if no next level is
  available, focus moves to the completion heading/action. Preserve the
  existing terminal state and repo while switching presentation.

**Props/state to add or confirm**

- Add a local responsive view mode only if needed (`rail`/`select`, derived
  from width); selected level continues to come from `levelStore`.
- Pass `level`, `progress`, `isSelected`, completion status, and selection/
  continue callbacks into UI components. Keep completion announcement state
  tied to the actual `latestCompletion` event.
- Completion CTA refs/focus target are UI refs, not persisted state.

**Tests**

- Add focused component tests under `src/levels/` and update
  `src/app/levelStore.test.ts` only if UI integration needs coverage. Existing
  checker tests/contracts remain unchanged.
- Cover desktop rail selection, narrow select interaction, completed/locked
  states, focus movement to Next, announcement, and no false completion when
  the underlying goal is not met.

**Acceptance criteria**

- At wide viewport the level rail/brief and Practice action align with the
  corrected reference. At 1024 and 390 layouts, controls remain operable and
  selected level is visible.
- Completion feedback matches the reference motion and is announced once;
  focus reaches the next actionable control.
- All displayed progress is read from existing local state.

**Validation**

- Run focused Levels, level-store, and checker tests; `npm run typecheck` and
  `npm run lint:imports`.
- Manually complete a level using real commands, then navigate Next/Previous
  and reload to verify local progress.

**Stop conditions**

- Stop if the view requires changing level definitions, goal checking,
  persistence format, or completion semantics.
- Stop if a completion state cannot be represented from current store events
  without inventing or hardcoding progress.

## 5. Reference

**References**

- Screenshot: `docs/design/screenshots/reference-1440x900.png`.
- `docs/design/UI_IMPLEMENTATION_SPEC.md` §3.6 and §4.7 (S6); command strings
  and explanatory material come from the current Reference data/contracts,
  not the corrected prototype's examples.

**Files allowed to change**

- `src/commands-ref/CommandRefPanel.tsx`, `src/commands-ref/MiniDiagram.tsx`,
  `src/app/layout.css`, and focused component tests under `src/commands-ref/`.
- Add UI-only reference subcomponents under `src/commands-ref/` with focused
  tests.
- Do not edit `src/commands-ref/data.ts`, `referenceAfter.ts`, engine/parser,
  or command definitions for a visual change.

**Behavior to preserve**

- Keep the exact supported command set, syntax, explanatory meaning, and
  before/after repository states sourced by existing data.
- Search/filtering and disclosure behavior must remain keyboard accessible;
  copying a command must not execute it or mutate the repository.

**Props/state to add or confirm**

- Add local `selectedCommand`, `searchQuery`, and copy feedback state only as
  required by the spec. Keep selected detail derived from current reference
  data.
- Pass command metadata, selection state, and callbacks into list/detail
  components. Represent copy status as transient UI state with an accessible
  announcement.

**Tests**

- Update `CommandRefPanel.test.tsx` and relevant data tests only if UI mapping
  exposes a contract gap; data contents themselves stay stable.
- Cover master/detail selection, search/empty result, keyboard navigation,
  copy success/failure feedback, and mini-graph state from real reference
  snapshots.

**Acceptance criteria**

- Reference hierarchy and selected detail match the desktop capture while
  remaining usable at narrow widths.
- Selecting or copying an item does not mutate RepoState; displayed graphs
  reflect the existing before/after state.
- Sample values from the prototype are not present in production UI.

**Validation**

- Run focused Reference/component/data tests, `npm run typecheck`, and
  `npm run lint:imports`.
- Manually test keyboard selection and copy behavior with clipboard permission
  available and denied.

**Stop conditions**

- Stop if a UI request requires adding unsupported commands or changing
  command syntax, parser behavior, or source reference data without a separate
  accepted requirement.
- Stop if copy feedback cannot distinguish success from clipboard failure.

## 6. Verification

**References**

- Screenshots: `verification-1440x900.png`,
  `verification-1440x900-fullpage.png`, `verification-390x844.png`, and
  `verification-390x844-fullpage.png`.
- `docs/design/UI_IMPLEMENTATION_SPEC.md` §3.7 and §4.8 (S7); current
  `public/verification.json` and its TypeScript schema are data authorities.

**Files allowed to change**

- `src/verification/VerificationTab.tsx`,
  `src/verification/DiffTestSummary.tsx`,
  `src/verification/ScalingChart.tsx`, `src/app/layout.css`, and focused tests
  under `src/verification/`.
- Add UI-only Verification components under `src/verification/` with focused
  tests.
- Do not change `src/verification/report.ts`, `public/verification.json`,
  report-generation scripts, benchmark harness, or schema as part of UI work.

**Behavior to preserve**

- Continue loading and validating the current report. Error/retry behavior,
  schema, source SHA checks, and real report values stay intact.
- Never hardcode prototype counts, timestamps, SHA values, divergence rows, or
  benchmark values. Keep Layout and animation-frame series distinct.
- Keep the report's counts and labels semantically correct; the displayed
  number must derive from the appropriate report collection.

**Props/state to add or confirm**

- Keep report load/error/retry ownership in the existing loader. Add UI-local
  filter, table/chart view, visible-page count, and copied-SHA feedback state
  only as needed.
- Pass typed report data and callback props to summary, chart, filter, and
  divergence-list components; avoid a second report cache.

**Tests**

- Update `VerificationTab.test.ts`, `ScalingChart.test.ts`, and report-facing
  component tests.
- Cover loading/error/retry, all filters, empty filters, pagination, chart/table
  toggle, accessible chart alternative, SHA copy feedback, and the correct
  frame-series p95 display.
- Ensure existing schema/validation tests still prove malformed or mismatched
  report input is rejected.

**Acceptance criteria**

- Summary, chart, and divergence list match desktop/mobile hierarchy and keep
  values readable without overflow.
- All filtering/pagination/chart data uses the loaded report; user can inspect
  the underlying sample table.
- Animation-frame p95 and render/layout metrics are labeled as separate
  measurements; no UI reinterpretation of the 16.7 ms threshold.

**Validation**

- Run focused Verification/report/chart tests, `npm run typecheck`,
  `npm run lint:imports`, and `npm run build`.
- Manually inspect a valid report, a missing/invalid report, filter empty state,
  and narrow viewport.

**Stop conditions**

- Stop if satisfying the layout requires editing report data/schema or making
  sample values production constants.
- Stop if report metrics are ambiguous or counts disagree with the schema;
  resolve the data contract before presenting them.

## 7. Responsive and accessibility

**References**

- Mobile/tablet captures: `practice-390x844.png`, `levels-390x844.png`,
  `levels-completed-1024x768.png`, `intro-cta-ready-390x844.png`, and
  `verification-390x844-fullpage.png`.
- All intro keyboard/reduced-motion captures; `docs/design/INTRO_MOTION_SPEC.md`;
  `docs/design/UI_IMPLEMENTATION_SPEC.md` §2.2, §2.3, and §3.8 (S8).

**Files allowed to change**

- The app/component/CSS files listed in sections 1–6, with each file edited by
  its owning slice. Shared cross-cutting changes are limited to
  `src/app/layout.css`, `src/app/App.tsx`/tests, and the specific component/test
  whose semantics are affected.
- No core, data, or benchmark files.

**Behavior to preserve**

- Keyboard operation, visible focus, semantic headings/landmarks, labels,
  announcements, dialog focus management, and reduced-motion preferences.
- Respect specified breakpoints: mobile below 768px; Levels/Reference narrow
  mode below 900px; Practice wraps based on available width and places graph
  first. Do not introduce an unsupported 1280px breakpoint.
- Controls remain usable at zoom and narrow viewport; no horizontal page
  overflow or pointer-only action.

**Props/state to add or confirm**

- Prefer semantic HTML and CSS media/container queries over viewport state.
- Add only accessible state already needed by a component (selected tab,
  expanded item, loading/error, status announcement); expose state with native
  controls/ARIA instead of hidden duplicate state.
- Refs are permitted for focus restoration/scroll-to-latest, not as behavioral
  stores.

**Tests**

- Add focused keyboard and state-announcement tests alongside the component
  suites named above. Keep axe/testing dependencies out unless separately
  approved as necessary.
- Manual checks: keyboard-only traversal, reduced motion, 200% zoom, narrow
  mobile, focus restoration, and no focus loss during terminal updates.

**Acceptance criteria**

- Every primary flow works without a pointer, has a visible focus indicator,
  and reports meaningful names/state to assistive technology.
- Layout reflows at documented thresholds; content and controls do not clip or
  overlap at 390×844, 768px boundary, 900px boundary, 1024×768, and 1440×900.
- Motion honors `prefers-reduced-motion`; status changes are announced once
  without moving focus unexpectedly.

**Validation**

- Run all focused UI tests and the full `npm test`, typecheck, build, and import
  lint after the responsive/accessibility gate closes.
- Complete a manual keyboard and reduced-motion pass at desktop and mobile
  sizes. Record viewport/browser and any exceptions in QA notes.

**Stop conditions**

- Stop if a required behavior cannot be made keyboard-accessible without
  changing a product contract; document the conflict.
- Stop on clipped content, invisible focus, focus traps outside the intro, or
  unannounced completion/errors.

## 8. Visual QA

**References**

- Use all 18 files in `docs/design/screenshots/` as the still-image set.
- Use all three videos in `docs/design/motion/` for transition timing and
  motion: intro-to-app, commit/graph animation, and level completion.
- Consult `docs/design/INTRO_MOTION_SPEC.md` and
  `docs/design/reference/CORRECTIONS.diff` for measured intro details and
  corrections. The corrected HTML is inspection-only.

**Files allowed to change**

- Only the UI implementation files already allowed in sections 1–7, and only
  to fix a reproduced discrepancy. Add QA notes/screenshots outside source
  files if the project has an agreed local capture location; do not commit
  generated captures or build output as product code.
- No engine, parser, data, report, or benchmark parameter edits.

**Behavior to preserve**

- Reference data/state must remain live. Screenshots are visual targets, not
  permission to hardcode text, commit graphs, progress, or verification rows.
- Preserve responsive, focus, reduced-motion, loading/error/empty, and
  completion states while making visual corrections.

**Props/state to add or confirm**

- No new application state is expected in this phase. If a discrepancy appears
  to require state, return it to its owning slice and specify the state there
  before implementation.
- No “screenshot mode” flags or production-only sample data.

**Tests**

- Add a focused regression test only when a visual discrepancy corresponds to
  a behavior/state defect. Keep purely visual comparisons in manual/browser QA
  unless an existing stable capture tool is already available.
- Re-run the focused suite for each corrected component.

**Acceptance criteria**

- Review every reference still at its source viewport and relevant responsive
  counterpart; compare spacing, hierarchy, color, alignment, wrapping, and
  visible state. Review all video transitions at the documented timestamps.
- Log discrepancies as file/component + viewport/state + observed/expected;
  close each against the matching spec requirement.
- No console errors, broken local media, network requests beyond localhost,
  or horizontal overflow in the reviewed app states.

**Validation**

- Produce local browser captures for 1440×900, 1024×768, 390×844, and documented
  breakpoint boundaries; review intro animation with normal and reduced
  motion.
- Run focused UI tests after fixes and `git diff --check` before sign-off.

**Stop conditions**

- Stop if a mismatch can only be “fixed” by copying prototype sample content,
  adding remote resources, changing a protected contract, or changing the
  benchmark workload.
- Stop and return to the relevant slice if visual QA reveals a behavior or
  accessibility regression.

## 9. Final validation and production benchmark #47

**References**

- `docs/design/UI_IMPLEMENTATION_SPEC.md` §4.10 (S9/final gate),
  `docs/render-benchmark.md`, issue #47 in `docs/ISSUES.md`, and the
  `docs/STATUS.md` production measurement history.
- Reference screenshots/videos are already enumerated in sections 1–8; this
  gate uses the final built application state, not prototype sample data.

**Files allowed to change**

- If a final defect is found, only its owning UI files listed in sections 1–8.
- Benchmark source/workflow files are out of scope for this UI plan unless the
  benchmark implementation itself is independently shown to be broken and a
  separate task authorizes it. Never change measurement parameters, the
  16.7 ms threshold, or GraphView before obtaining the production result.
- Do not edit `public/verification.json` or generated benchmark results as UI
  implementation output.

**Behavior to preserve**

- Preserve all Tier 1 command, graph, progress, verification, undo/redo, and
  offline behavior. Production UI and intro assets must load without external
  network dependencies.
- The benchmark remains production mode at n=200, with its current warmups,
  run count, duration, seed, viewport, and sample collection unchanged.
- Keep raw browser frame samples and metadata together; require
  `buildMode: "production"` when using results to assess #47.

**Props/state to add or confirm**

- No app props/state are expected. Confirm each state is rendered from its
  existing owner and all temporary UI state resets on the same transitions as
  before.
- Benchmark metadata must identify commit SHA, Chrome, OS, viewport, build
  mode, warmups/runs, and sample series. Results generated by the benchmark
  should be captured with the associated workflow artifact for the measured
  source revision.

**Tests**

- Before measurement run the required full suite: `npm run typecheck`,
  `npm test`, `npm run build`, `npm run lint:imports`, and `git diff --check`.
- Run the production browser benchmark at n=200 and inspect
  `harness/bench/browser-results.json` for production metadata and raw frame
  samples. Confirm the nightly workflow uploads the verification artifact that
  contains the measurement.
- Run offline browser inspection of the production build and check for
  requests outside localhost.

**Acceptance criteria**

- All UI acceptance criteria and offline checks pass on the final UI revision.
- Production result is tied to the measured commit SHA and reports Chrome,
  OS, viewport, sample count, median, and p95 from raw frame samples.
- If animation-frame p95 is **≤16.7 ms**, prepare evidence-based wording for
  issue #47 and recommend closing it. If p95 is **>16.7 ms**, leave it open and
  recommend a Chrome Performance trace/profiling pass to identify scripting,
  layout, paint, or compositing cost before proposing a targeted change.
- Do not close the GitHub issue, post comments, commit, or push as part of this
  planning document or its implementation sequence unless separately asked.

**Validation**

- Run all commands above on the exact revision intended for review; do not
  compare a development measurement to the production threshold.
- Retain the raw result, metadata, workflow run/artifact link, and concise
  environment summary for issue evidence. Confirm no generated files are
  accidentally included in the UI diff.

**Stop conditions**

- Stop if any full validation command fails; classify code vs environment
  failure and resolve before sign-off.
- Stop if the benchmark times out, lacks raw frame samples, reports a
  development build, or SHA/environment metadata does not match the measured
  revision. Rerun only after correcting the cause without changing parameters.
- If p95 exceeds 16.7 ms, stop before changing GraphView or its workload. The
  next step is profiling evidence, followed by a separately scoped decision.
