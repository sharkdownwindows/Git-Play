# GitScope design handoff — source of truth

This directory is the curated design handoff. It keeps reviewed screenshots,
motion captures, a corrected prototype reference, and the prototype corrections
together. It does not define application behavior or replace the product and
architecture contracts.

## Authority order

1. **Corrected screenshots and videos** decide the visual appearance and
   motion. Use the stills for exact visual states and the videos for timing and
   transitions.
2. **`UI_IMPLEMENTATION_SPEC.md` when it is created** decides responsive
   behavior, accessibility requirements, and component states. Until then,
   `docs/UI_POLISH_SPEC.md` remains the current implementation specification.
3. **Existing application code and accepted contracts** decide Git engine
   behavior, repository state, local progress, and verification data. Preserve
   these contracts while changing presentation.
4. **Prototype data is illustrative only.** Do not hardcode its sample
   commits, verification counts, timestamps, SHA values, divergence rows, or
   progress. Read application state and the verification report instead.
5. **The raw prototype is not an authority when it conflicts with the
   corrected reference.** The corrected prototype is retained for inspection,
   but screenshots, videos, this precedence list, and the application
   contracts govern decisions.

## Prototype defects that must not be reproduced

- `componentDidUpdate` reads `prevState` even though the runtime does not pass
  it, causing updates to throw.
- Focus does not move to **Next** when a level is completed.
- Terminal logs do not scroll to the newest entry.
- The splash does not keep keyboard focus inside its dialog.
- Rive keeps running when reduced motion is enabled.
- Clicking the animation area closes the intro unintentionally.
- The splash uses `left: -53px` and `top: -41px`, shifting and oversizing it.
- The USTH logo is oversized and cropped on mobile in the raw version.
- The prototype downloads Rive from a remote CDN. Production UI must not
  depend on this remote request.

The corrected prototype fixes selected visual defects, but it still contains
the runtime issues above (including the `componentDidUpdate` failure, focus,
scroll, reduced-motion, and click behavior). Treat it as a visual reference,
not as production code. Its included verification report and Git examples are
sample data.

## Curated contents

- `INTRO_MOTION_SPEC.md`: measured description of the corrected reference and
  known limitations.
- `screenshots/`: corrected stills only; raw-comparison captures remain in the
  local artifacts directory.
- `motion/`: the three corrected prototype recordings.
- `reference/`: corrected prototype HTML, its correction diff, local runtime
  scripts, and the poster/logo images. The HTML copy uses paths matching this
  curated flat directory; the source prototype keeps its original `assets/`
  paths.
- `artifacts/prototype-handoff/capture-scripts/` remains local for audit and
  is not part of this handoff.

The corrected prototype still references a remote Rive script and the omitted
20 MB `.riv` file. Do not treat those as dependencies of the application; the
poster is included so the reference HTML retains its fallback image.

## Artifact manifest

The manifest covers the copied source specification and all copied reference
assets. `SOURCE_OF_TRUTH.md` is the manifest itself and is not listed here,
since embedding its own SHA-256 would be self-referential.

| Path | Artifact type | Viewport / duration | Size | SHA-256 | Purpose |
|---|---|---|---:|---|---|
| `docs/design/INTRO_MOTION_SPEC.md` | Motion specification | Measured states and timing | 16,605 B | `254c77165b347d26c0078b0de8416de32ce79b083be084e9eb836bec2e90548c` | Measured corrected prototype behavior and known limitations |
| `docs/design/motion/video-commit-graph-animation-1440x900.mp4` | Reference video | 1440×900 · 19.76 s | 1,123,245 B | `ea55a1671ebe2dcbc2d0d04915b2492c23891911f33654243558bc189f37ccbe` | Commit/branch/merge graph motion sequence |
| `docs/design/motion/video-intro-load-to-app-1440x900.mp4` | Reference video | 1440×900 · 8.60 s | 569,732 B | `b980538d73c1ec7d8376d5811ff90519a5a376fd97ee33afee4ea97ff3e651a0` | Intro load, CTA, and transition into the app |
| `docs/design/motion/video-level-complete-transition-1440x900.mp4` | Reference video | 1440×900 · 7.72 s | 546,197 B | `99730b3535c1815d4aa360052127193b444c71e14341c9d704eaaa26b8322b7e` | Level completion and next-level transition |
| `docs/design/reference/CORRECTIONS.diff` | Source correction diff | N/A | 13,139 B | `3e5916e8b4d5264460142cf8c0cbb47a7564718cbd3484d50777b3952583c3ec` | Raw-to-corrected prototype changes |
| `docs/design/reference/GitScope-Prototype-Corrected.html` | Corrected prototype HTML | Interactive · responsive reference | 74,257 B | `e51dc961f89efe19ae22001540170746f1ad18b80ea3cbb937908302f55d7cdb` | Inspect corrected prototype structure and interactions; not production source |
| `docs/design/reference/gitscope-engine.js` | Prototype engine | N/A | 15,021 B | `85f55a153dff31db7752114cb53f3fb40b64e0fbe2554fa3fac9c6608881b336` | Illustrative prototype command/graph engine; not application source |
| `docs/design/reference/messy-files-poster.png` | Reference image | 880x550 source image | 11,600 B | `b27a0bcee186c3f592b2361c028ead00d727aa77dae13e124d08c4343df1302d` | Poster shown while Rive is loading or unavailable |
| `docs/design/reference/support.js` | Prototype runtime | N/A | 69,150 B | `8fe7df74405f3c55f49b7249c74ea1397e65d07dea2b1bd3b4a489bec2e28cbe` | Local runtime support for inspecting the corrected prototype |
| `docs/design/reference/usth-logo.png` | Reference image | 554x554 source image | 25,889 B | `fcff10b3e8eae2934d99a31de22f48560059c5cf0037fdec4552813f13ef7a88` | USTH logo used in the corrected intro |
| `docs/design/screenshots/intro-0000ms-1440x900.png` | Corrected screenshot | 1440x900 · t=0000 ms | 5,850 B | `d5398960a510b55c800892e2fc1da886d043e35e2c5caeb71dc94d93d5b32a20` | Corrected intro at animation start |
| `docs/design/screenshots/intro-0500ms-1440x900.png` | Corrected screenshot | 1440x900 · t=0500 ms | 18,130 B | `f65facc9ec4bb6b2629d962714c8e9e408779662ff0b9cfade468edd2ed5f6b3` | Corrected intro at 500 ms |
| `docs/design/screenshots/intro-1300ms-1440x900.png` | Corrected screenshot | 1440x900 · t=1300 ms | 32,866 B | `e0584d492b7ab23f4ec5638337abdab9433a1da6e58848d46aaf48d027dfd62e` | Corrected intro at 1,300 ms |
| `docs/design/screenshots/intro-cta-keyboard-focus-1440x900.png` | Corrected screenshot | 1440x900 | 37,402 B | `543c4c4c6f72d80a889d82305fb61843bfb2d51984fe31ced039cbf5517863ee` | Keyboard-visible focus ring on intro CTA |
| `docs/design/screenshots/intro-cta-ready-1440x900.png` | Corrected screenshot | 1440x900 | 35,416 B | `14c7ef288975fc1af03d77f7d2991c7646d5736a3ef45faadb9eab3edd613ebd` | Ready intro state on desktop |
| `docs/design/screenshots/intro-cta-ready-390x844.png` | Corrected screenshot | 390x844 | 26,820 B | `821ac6507f9c7a74d1a2a7f766b0288e69baa56a5fd3139133338b4676d237f0` | Ready intro state on mobile; verifies logo/CTA fit |
| `docs/design/screenshots/intro-reduced-motion-1440x900.png` | Corrected screenshot | 1440x900 | 36,115 B | `302b33be41c8dd7585f34b202839867bc61564323abe7758bba3522c0d13fb68` | Reduced-motion state capture; documents current Rive motion defect |
| `docs/design/screenshots/intro-rive-fallback-1440x900.png` | Corrected screenshot | 1440x900 | 34,450 B | `e36237c675eb958795cf1ff3c3e08c6ec2ab97bb9dc54e6375f7f43e803a02e5` | Intro poster fallback when Rive is unavailable |
| `docs/design/screenshots/levels-1440x900.png` | Corrected screenshot | 1440x900 | 77,984 B | `f1c3c39d87fed943ae3238b66079415a0f3cfa287b707447917aa3ad58c385ae` | Levels default state on desktop |
| `docs/design/screenshots/levels-390x844.png` | Corrected screenshot | 390x844 | 43,082 B | `daf81b8a89162b7ee77ab37a79d241d5b816f96c3a3bf8417b496fe940b6db1b` | Levels default state on mobile |
| `docs/design/screenshots/levels-completed-1024x768.png` | Corrected screenshot | 1024x768 | 73,695 B | `6803ffa84f9e1a6dfe54979fa58edb4366c43c97c06e766225de0cff2529da87` | Completed-level state at tablet viewport |
| `docs/design/screenshots/practice-1440x900.png` | Corrected screenshot | 1440x900 | 70,873 B | `82b455cccc0b7a7867e468bac7eae182f9e7aa7717f7e18bb686ee952fe0246e` | Practice default state on desktop |
| `docs/design/screenshots/practice-390x844.png` | Corrected screenshot | 390x844 | 60,281 B | `e549c774c82535cb645448aa3966aaeee9d9a674272b0214e1c5f2ba27640d13` | Practice default state on mobile |
| `docs/design/screenshots/reference-1440x900.png` | Corrected screenshot | 1440x900 | 88,095 B | `221785c3742156fabe524e88c9bebc0fc327f89140b293ee39a41fea68690bbb` | Command Reference state on desktop |
| `docs/design/screenshots/verification-1440x900-fullpage.png` | Corrected screenshot | 1440x900 viewport; full-page 1440x1310 | 186,482 B | `94ed2cf1b7b50c2648f2dbded118bfc7ac4d2949535cd6c4d5640697beef9d38` | Verification full-page sample-data layout on desktop |
| `docs/design/screenshots/verification-1440x900.png` | Corrected screenshot | 1440x900 | 134,285 B | `f6a7233233098c50181e494e3f42fdbd4a3beb10e57e1cb5981945562a2f8b62` | Verification initial viewport on desktop |
| `docs/design/screenshots/verification-390x844-fullpage.png` | Corrected screenshot | 390x844 viewport; full-page 390x2846 | 188,037 B | `b1b396b3cd9636ad8c336b93a3db8ba464a164bad0347dc872a26c8d2c56666f` | Verification full-page sample-data layout on mobile |
| `docs/design/screenshots/verification-390x844.png` | Corrected screenshot | 390x844 | 61,028 B | `9775c58af3d3eb1350a5c9681fb8191c6d4e9882de7e5f045c7640b46dc57475` | Verification initial viewport on mobile |
