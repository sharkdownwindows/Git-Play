# GitPlay — bản đồ công việc nhóm và kế hoạch 30 commit

Tài liệu này trả lời hai câu hỏi:

1. Nhóm đã làm những phần chính nào và mã nguồn/tài liệu của từng phần nằm ở đâu?
2. Nếu xây dựng lại dự án theo một lịch sử Git gọn, dễ review, 30 commit nên được chia như thế nào?

Đây là bản đồ theo trạng thái source hiện tại, không phải bản chép lại nguyên văn lịch sử commit cũ. Phạm vi chính thức là **Tier 1-only**: năm lệnh `commit`, `branch`, `switch`, `checkout`, `merge`; không có `add`, authentication, server hoặc đồng bộ.

## 1. Bản đồ công việc chính

| Nhóm việc | Nhóm/vai trò chính | Nơi triển khai | Test hoặc bằng chứng |
|---|---|---|---|
| Phạm vi sản phẩm, yêu cầu và mốc | Cả nhóm, điều phối bởi D6 | `docs/PRD.md`, `docs/TECHNICAL_OVERVIEW.md`, `docs/ISSUES.md`, `docs/STATUS.md`, `AGENTS.md` | Quyết định Tier 1-only và trạng thái M1–M6 trong tài liệu |
| Contract repository và command | D1 | `src/core/types.ts` | Được dùng chung bởi engine, UI, level checker và harness |
| Git engine năm lệnh | D1 | `src/core/engine.ts`, `src/core/commands/*.ts`, `src/core/graph.ts`, `src/core/errors.ts` | Test đặt cạnh source: `src/core/**/*.test.ts` |
| Undo/redo | D1, nối UI bởi D2 | `src/core/history.ts`, `src/app/store.ts` | `src/core/history.test.ts`, `src/app/store.test.ts` |
| Parser và terminal | D3 | `src/terminal/parse.ts`, `format.ts`, `session.ts`, `Terminal.tsx` | `src/terminal/*.test.ts` |
| Layout và Git graph | D2 | `src/viz/layout.ts`, `GraphView.tsx`, `CommitNode.tsx`, `RefLabel.tsx`, `edges.tsx`, `MiniGraph.tsx` | `src/viz/*.test.ts`, browser benchmark |
| App shell và luồng Practice | D2 | `src/app/App.tsx`, `Practice.tsx`, `store.ts`, `bootstrap.ts`, `tabNavigation.ts` | `src/app/App.test.ts`, `Practice.test.ts`, `store.test.ts` |
| Intro và UI polish | D2, dựa trên handoff thiết kế | `src/app/IntroSplash.tsx`, `IntroGraph.tsx`, `introBehavior.ts`, `layout.css`, `public/assets/usth-logo.png` | `IntroSplash.test.ts`, ảnh review trong `docs/design/screenshots/` |
| Hệ thống level | D4 | `src/levels/schema.ts`, `state.ts`, `check.ts`, `LevelList.tsx`, `LevelPanel.tsx`, `Levels.tsx` | `src/levels/*.test.ts` |
| Nội dung 8 level | D4 | `src/levels/data/01-first-commit.json` đến `08-ff-vs-no-ff.json`; đăng ký trong `src/levels/data/index.ts` | `src/levels/data/levels.test.ts`, `src/levels/Levels.test.ts` |
| Tiến độ localStorage | D4 | `src/progress/types.ts`, `store.ts`, `merge.ts`, `src/app/levelStore.ts` | `src/progress/*.test.ts`, `src/app/levelStore.test.ts` |
| Command Reference | D4 | `src/commands-ref/data.ts`, `CommandRefPanel.tsx`, `MiniDiagram.tsx`, `referenceAfter.ts`, `refChanges.ts` | `src/commands-ref/*.test.ts` |
| Differential testing với Git thật | D5 | `harness/diff/adapter.ts`, `generate.ts`, `runReal.ts`, `normalize.ts`, `run.ts` | `harness/diff/*.test.ts`, `npm run diff:quick` |
| Benchmark layout, SVG và animation | D5/D6 | `harness/bench/*.ts`, `harness/bench/browser.html`, `harness/bench/browser-results.json` | `harness/bench/*.test.ts`, `npm run bench`, `npm run bench:browser` |
| Sinh verification report | D5 | `harness/writeReport.ts`, `public/verification.json`, `docs/divergences.md` | `harness/writeReport.test.ts`, nightly workflow |
| Verification UI | D6 | `src/verification/report.ts`, `VerificationTab.tsx`, `DiffTestSummary.tsx`, `ScalingChart.tsx`, `DivergenceList.tsx`, `Definitions.tsx` | `src/verification/*.test.ts` |
| CI và nightly verification | D5 | `.github/workflows/ci.yml`, `.github/workflows/nightly.yml`, `scripts/check-imports.ts` | GitHub Actions: typecheck, test, build, import lint, diff gate, browser smoke |
| Design handoff và visual review | Thiết kế + D2 | `docs/UI_POLISH_SPEC.md`, `docs/design/SOURCE_OF_TRUTH.md`, `UI_IMPLEMENTATION_SPEC.md`, `UI_IMPLEMENTATION_PLAN.md`, `VISUAL_REVIEW.md` | Ảnh/video trong `docs/design/screenshots/` và `docs/design/motion/` |
| User evaluation | D6 | Toàn bộ `docs/evaluation/` | `evaluationSchema.test.ts`, `raw-results.csv`, `clean-results.csv`, `RESULTS.md` |
| Demo, Q&A và báo cáo cuối | D6 + cả nhóm | `docs/demo/DEMO_SCRIPT.md`, `docs/demo/Q_AND_A.md`, `docs/FINAL_REPORT.md`, `README.md` | Tổng duyệt 5–7 phút và đối chiếu report thật |
| Branding và asset trình duyệt | D2/D6 | `index.html`, `public/favicon.svg`, `public/assets/usth-logo.png` | Production build chứa favicon và logo |

## 2. Muốn sửa một phần thì vào đâu?

### 2.1 Level được viết ở đâu?

Một level hoàn chỉnh đi qua bốn lớp:

1. **Nội dung và state:** sửa hoặc thêm JSON trong `src/levels/data/`.
2. **Đăng ký level đang hoạt động:** import JSON trong `src/levels/data/index.ts`.
3. **Luật kiểm tra mục tiêu:** `src/levels/schema.ts`, `state.ts` và `check.ts`.
4. **Giao diện:** `LevelList.tsx`, `LevelPanel.tsx` và `Levels.tsx`.

Test tương ứng nằm ở:

- `src/levels/data/levels.test.ts` — dữ liệu level hợp lệ;
- `src/levels/check.test.ts` — goal checker nhận đúng cấu trúc DAG, branch và HEAD;
- `src/levels/Levels.test.ts` — hành vi UI và hoàn thành level;
- `src/app/levelStore.test.ts` — hoàn thành level được lưu local.

Sản phẩm hiện chỉ kích hoạt level `01–08`. Các file `09–12` vẫn còn như dấu vết kế hoạch cũ nhưng không được import trong `src/levels/data/index.ts`; không được mô tả chúng như tính năng đã phát hành.

### 2.2 User evaluation được viết ở đâu?

| Việc đánh giá | File |
|---|---|
| Quy trình tuyển người, consent, thời lượng và cách điều phối | `docs/evaluation/PROTOCOL.md` |
| Nhiệm vụ người tham gia thực hiện | `docs/evaluation/TASKS.md` |
| Quiz trước và sau | `docs/evaluation/PRE_QUIZ.md`, `POST_QUIZ.md` |
| Phiếu ghi quan sát | `docs/evaluation/OBSERVATION_TEMPLATE.md` |
| Contract cột dữ liệu và hướng dẫn nhập | `docs/evaluation/README.md` |
| Dữ liệu gốc | `docs/evaluation/raw-results.csv` |
| Dữ liệu đã làm sạch | `docs/evaluation/clean-results.csv` |
| Kết quả, findings và limitations | `docs/evaluation/RESULTS.md` |
| Biểu đồ | `docs/evaluation/charts/` |
| Test bảo vệ schema | `docs/evaluation/evaluationSchema.test.ts` |

Không điền participant giả và không đổi `N/A` thành `0%`. Khi có dữ liệu thật, cập nhật `raw-results.csv`, tạo lại bảng sạch, biểu đồ và `RESULTS.md`, rồi cập nhật `docs/FINAL_REPORT.md` và đoạn evaluation trong kịch bản demo.

### 2.3 Verification và benchmark được viết ở đâu?

- Contract report: `src/verification/report.ts`.
- Chạy engine và Git thật: `harness/diff/`.
- Đo layout/SVG/animation: `harness/bench/`.
- Gộp kết quả: `harness/writeReport.ts`.
- Report mà frontend đọc: `public/verification.json`.
- UI trình bày: `src/verification/`.
- Tự động chạy và publish: `.github/workflows/nightly.yml`.

Không sửa số trực tiếp trong UI. Số liệu phải đi từ harness → `verification.json` → Verification UI.

### 2.4 UI được thiết kế và code ở đâu?

- Nguồn quyết định thiết kế: `docs/design/SOURCE_OF_TRUTH.md`.
- Handoff/kế hoạch triển khai: `docs/design/UI_IMPLEMENTATION_SPEC.md` và `UI_IMPLEMENTATION_PLAN.md`.
- Intro: `src/app/IntroSplash.tsx`, `IntroGraph.tsx`, `introBehavior.ts`.
- App shell và các tab: `src/app/App.tsx`.
- Style và responsive behavior: `src/app/layout.css`.
- Graph: `src/viz/`.
- Ảnh kiểm chứng: `docs/design/screenshots/`.

File HTML prototype và asset tham chiếu trong `docs/design/reference/` chỉ là bằng chứng/handoff; application chạy từ source React trong `src/`.

## 3. Luồng dữ liệu chính

```text
Người dùng nhập lệnh
  → terminal/parse.ts kiểm tra cú pháp
  → app/store.ts gửi Command vào core/engine.ts
  → core/commands/*.ts tạo RepoState mới
  → viz/layout.ts tính vị trí tất định
  → GraphView.tsx render commit, edge, branch và HEAD
  → levels/check.ts so state hiện tại với target
  → progress/store.ts lưu kết quả level vào localStorage
```

Verification là luồng độc lập:

```text
GitScope engine + Git thật
  → harness/diff chuẩn hóa và so sánh
  → harness/bench đo hiệu năng
  → harness/writeReport.ts
  → public/verification.json
  → src/verification/VerificationTab.tsx
```

## 4. Nếu làm lại: kế hoạch 30 commit

Mỗi hàng là một commit có thể review độc lập. Cột “Files” liệt kê file chính; test đặt cùng commit với behavior mà nó bảo vệ. Các lệnh dưới đây là kế hoạch tham khảo, không phải yêu cầu chạy lại trên repository hiện tại.

| # | Lệnh commit | Files/phạm vi được triển khai |
|---:|---|---|
| 1 | `git commit -m "chore: scaffold React Vite TypeScript project"` | `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx` |
| 2 | `git commit -m "docs: define Tier 1 product scope and milestones"` | `AGENTS.md`, `docs/BRIEF.md`, `PRD.md`, `TECHNICAL_OVERVIEW.md`, `STRUCTURE.md`, `ISSUES.md`, `STATUS.md` |
| 3 | `git commit -m "feat: define repository progress and verification contracts"` | `src/core/types.ts`, `src/progress/types.ts`, `src/verification/report.ts`, `src/verification/report.test.ts`, `src/verification/fixtures/report.ts`, report placeholder trong `public/verification.json` |
| 4 | `git commit -m "feat(core): implement commit and branch commands"` | `src/core/commands/commit.ts`, `commit.test.ts`, `branch.ts`, `branch.test.ts` |
| 5 | `git commit -m "feat(core): implement switch and checkout commands"` | `src/core/commands/switch.ts`, `switch.test.ts`, `checkout.ts`, `checkout.test.ts` |
| 6 | `git commit -m "feat(core): implement graph helpers and merge"` | `src/core/graph.ts`, `graph.test.ts`, `src/core/commands/merge.ts`, `merge.test.ts` |
| 7 | `git commit -m "feat(core): add error classes and engine dispatcher"` | `src/core/errors.ts`, `errors.test.ts`, `engine.ts`, `engine.test.ts` |
| 8 | `git commit -m "feat(core): add snapshot undo and redo history"` | `src/core/history.ts`, `history.test.ts` |
| 9 | `git commit -m "feat(terminal): parse the five supported Git commands"` | `src/terminal/parse.ts`, `parse.test.ts` |
| 10 | `git commit -m "feat(terminal): add formatted output history and terminal UI"` | `src/terminal/format.ts`, `session.ts`, `Terminal.tsx`, `Terminal.test.ts` |
| 11 | `git commit -m "feat(viz): implement deterministic DAG layout"` | `src/viz/layout.ts`, `layout.test.ts` |
| 12 | `git commit -m "feat(viz): render commits edges refs and HEAD"` | `src/viz/GraphView.tsx`, `GraphView.test.ts`, `CommitNode.tsx`, `RefLabel.tsx`, `edges.tsx`, `MiniGraph.tsx`, `animation.test.ts` |
| 13 | `git commit -m "feat(app): connect Practice terminal store and graph"` | `src/app/store.ts`, `store.test.ts`, `Practice.tsx`, `Practice.test.ts`, `bootstrap.ts`, `practiceGraphNavigation.ts`, `practiceGraphNavigation.test.ts` |
| 14 | `git commit -m "feat(levels): define level schema state and goal checker"` | `src/levels/schema.ts`, `state.ts`, `check.ts`, `check.test.ts` |
| 15 | `git commit -m "feat(levels): add introductory levels 01 through 04"` | `src/levels/data/01-first-commit.json` đến `04-detached-head.json`, `src/levels/data/index.ts`, `levels.test.ts` |
| 16 | `git commit -m "feat(levels): add recovery and merge levels 05 through 08"` | `src/levels/data/05-recover-detached.json` đến `08-ff-vs-no-ff.json`, cập nhật `data/index.ts`, `levels.test.ts` |
| 17 | `git commit -m "feat(levels): build level navigation target view and completion UI"` | `src/levels/LevelList.tsx`, `LevelPanel.tsx`, `Levels.tsx`, `Levels.test.ts` |
| 18 | `git commit -m "feat(progress): persist level completion in localStorage"` | `src/progress/store.ts`, `store.test.ts`, `merge.ts`, `merge.test.ts`, `src/app/levelStore.ts`, `levelStore.test.ts` |
| 19 | `git commit -m "feat(reference): document five commands with engine-backed diagrams"` | `src/commands-ref/data.ts`, `data.test.ts`, `CommandRefPanel.tsx`, `CommandRefPanel.test.tsx`, `MiniDiagram.tsx`, `referenceAfter.ts`, `refChanges.ts`, `refChanges.test.ts` |
| 20 | `git commit -m "test(diff): run commands against real Git and normalize state"` | `harness/diff/adapter.ts`, `adapter.test.ts`, `runReal.ts`, `runReal.test.ts`, `normalize.ts`, `normalize.test.ts` |
| 21 | `git commit -m "test(diff): generate deterministic exhaustive and random cases"` | `harness/diff/generate.ts`, `generate.test.ts`, `run.ts`, `run.test.ts` |
| 22 | `git commit -m "feat(verification): generate report and divergence log"` | `harness/writeReport.ts`, `writeReport.test.ts`, `public/verification.json`, `docs/divergences.md` |
| 23 | `git commit -m "perf: benchmark deterministic layout on synthetic DAGs"` | `harness/bench/synth.ts`, `synth.test.ts`, `layout.ts`, `layout.test.ts`, `docs/render-benchmark.md` |
| 24 | `git commit -m "perf: measure production SVG rendering and animation frames"` | `harness/bench/browser.ts`, `browser.html`, `browserPage.tsx`, `browserMetrics.ts`, `browserWorkload.ts`, `browserServer.ts`, `chromeLifecycle.ts`, các test tương ứng và `browser-results.json` |
| 25 | `git commit -m "feat(verification): present differential and scaling evidence"` | `src/verification/VerificationTab.tsx`, `DiffTestSummary.tsx`, `ScalingChart.tsx`, `DivergenceList.tsx`, `Definitions.tsx`, `format.ts`, `segmentedKeyboard.ts` và các test UI |
| 26 | `git commit -m "ci: enforce validation and publish nightly verification"` | `.github/workflows/ci.yml`, `.github/workflows/nightly.yml`, `scripts/check-imports.ts`, `scripts/bench-git-spawn.mjs`, scripts trong `package.json` |
| 27 | `git commit -m "docs(design): record the UI source of truth and handoff"` | `docs/UI_POLISH_SPEC.md`, `docs/design/SOURCE_OF_TRUTH.md`, `UI_IMPLEMENTATION_SPEC.md`, `UI_IMPLEMENTATION_PLAN.md`, reference assets cần thiết |
| 28 | `git commit -m "feat(ui): add GitPlay intro responsive polish and graph navigation"` | `src/app/App.tsx`, `App.test.ts`, `IntroSplash.tsx`, `IntroSplash.test.ts`, `IntroGraph.tsx`, `introBehavior.ts`, `tabNavigation.ts`, `layout.css`, `public/assets/usth-logo.png`, `public/favicon.svg`, `index.html` |
| 29 | `git commit -m "docs(eval): add user evaluation protocol data contract and results"` | Toàn bộ `docs/evaluation/`, gồm protocol, tasks, quizzes, observation template, CSV, charts, `RESULTS.md`, `evaluationSchema.test.ts` |
| 30 | `git commit -m "docs: finalize demo runbook Q&A report and project README"` | `README.md`, `docs/FINAL_REPORT.md`, `docs/demo/DEMO_SCRIPT.md`, `docs/demo/Q_AND_A.md`, `docs/STATUS.md`, `docs/design/VISUAL_REVIEW.md`, ảnh/video bằng chứng đã chọn lọc |

## 5. Validation nên chạy theo các mốc commit

| Sau commit | Validation tối thiểu |
|---:|---|
| 3 | `npm run typecheck`, `npm test` |
| 8 | `npm test -- src/core`, `npm run typecheck` |
| 13 | `npm test`, `npm run build` |
| 19 | `npm test`, `npm run lint:imports`, `npm run build` |
| 22 | `npm run diff:quick`, `npm test` |
| 25 | `npm run bench`, `npm run bench:browser -- --smoke --production` |
| 26 | Xác nhận CI và nightly chạy xanh trên GitHub |
| 28 | Test keyboard/focus, viewport desktop, error/empty states và offline level |
| 29 | Xác nhận schema evaluation; không publish participant data nhận diện được |
| 30 | `npm ci`, `npm run typecheck`, `npm test`, `npm run lint:imports`, `npm run build`, chạy demo hai lần liên tiếp |

## 6. Những phần cố tình không triển khai

- `git add`, staging area, working-tree contents và content conflicts;
- authentication, server, database và synchronization;
- remote Git: `push`, `pull`, `fetch`, `clone`;
- level 09–12 trong sản phẩm đang kích hoạt;
- ML/LLM trong runtime;
- dữ liệu user evaluation giả.

Hosting production hiện được cấu hình ngoài source repository. Repo cung cấp production build tĩnh qua `npm run build`, nhưng thông tin dashboard/domain và quyền truy cập phải được kiểm tra riêng trước demo.
