# Browser render benchmark (#49, #50)

Run `npm run bench:browser` from the repository root with Chrome installed.
This defaults to Vite development mode. Use
`npm run bench:browser -- --production` to bundle the benchmark HTML, TSX and
CSS with Vite's production build and serve the temporary output with Vite
preview. Set `GITSCOPE_BROWSER` to another Chromium executable if needed. Both
modes use an isolated headless Chrome profile and measure the real `GraphView`
SVG with deterministic synthetic DAGs (seed 42). Production output is built
under the OS temp directory and removed in cleanup. The raw samples and
environment metadata, including `buildMode`, go to
`harness/bench/browser-results.json`.
`npm run report` includes browser series only when that file's commit SHA matches
the code commit used by the differential run. The report keeps `layout()`,
`SVG render`, and `animation frame` as separate series.

For SVG render, each size has one warm-up and five fresh DOM mounts. A sample
starts before React's synchronous commit and ends after two animation frames,
so it includes browser rendering and paint scheduling. The layout baseline is
measured separately before each mount; it is not subtracted from render time.
For n=200, two warm-ups precede ten 350 ms animations from a 199-commit graph
to a 200-commit graph. `requestAnimationFrame` timestamps provide frame
intervals, including the first render interval. The raw file records all
samples. Each browser case has a 30-second timeout, recorded as `timeout`
rather than as a made-up scaling point.

Nightly Verification runs production mode and uploads
`harness/bench/browser-results.json` in its `verification` artifact. CI smoke
continues to use development mode.

The observed saturation rule for SVG render is p95 > 100 ms or timeout.
The animation target is p95 <= 16.7 ms. The production-build run on source SHA
`2dab68b90e10b6c0a9ffe3afdae71e8eecfe7039` used Chrome 152.0.7977.64 on
Linux 6.8.0-138-generic x64, viewport 1280x800 at 1x. At n=200, ten 350 ms
animations after two warm-ups produced 216 frame intervals; median was
16.699999999999818 ms and p95 was 16.700000000000273 ms (16.70 ms rounded).
The raw values and `buildMode: production` metadata are in
`harness/bench/browser-results.json`. The SVG extends far below the viewport
at larger n, so render measurements cover DOM construction and browser
scheduling but cannot prove that every offscreen node was rasterized.

## Open follow-up: production build recheck

**Title:** Inspect graph animation frame budget at 200 commits

**Observation:** The production run recorded 216 frame intervals at n=200,
with median 16.699999999999818 ms and p95 16.700000000000273 ms. The p95 is
slightly above 16.7 ms under the existing strict threshold; no optimization
has been made. GitHub issue
[#47](https://github.com/sharkdownwindows/GitPlay/issues/47) remains open for
profiling and a follow-up decision. Raw samples and metadata are in
`harness/bench/browser-results.json` and the nightly workflow artifact.

**Next step:** Capture a Chrome Performance trace for the production benchmark
at n=200 and inspect main-thread scripting, style/layout, paint and compositing
costs. Compare multiple runs before proposing a targeted change; do not change
`GraphView` based on the p95 alone.
