# GitScope — trạng thái mốc

Cập nhật: 2026-09-30, source SHA `4448efb8aaecea310266c3ab002b6928362db466`.

| Mốc | Trạng thái | Bằng chứng |
|---|---|---|
| M1 — scaffold và ba contract | **Complete** | Ba contract chuẩn trong `src/core/types.ts`, `src/verification/report.ts`, `src/progress/types.ts`; CI và Tier 1 build đã có. |
| M2 — vertical slice | **Complete** | Terminal → parser → engine → `RepoState` → `GraphView` đã nối; issues #13–#26 được triển khai. |
| M3 — năm lệnh và harness v1 | **Complete** | Năm lệnh có trong engine; CI differential gate chạy Git 2.43. |
| M4 — cổng quyết định | **Complete** | [Nightly Verification run 36685786989](https://github.com/sharkdownwindows/GitPlay/actions/runs/36685786989) hoàn tất xanh trên source SHA ở trên, gồm đo browser, full differential/invalid gate, layout benchmark và publish report. |

## Quyết định M5 — scope chính thức

M5 chính thức cắt Tier 2. GitScope là sản phẩm Tier 1-only; không triển khai `add`, authentication, server hoặc đồng bộ. Tiến độ level chỉ lưu trong localStorage. Tier 2 từng được cân nhắc sau khi cổng M4 đạt, nhưng quyết định cuối cùng tại M5 là không thực hiện.

Tám level hiện tại (01–08) đáp ứng điều kiện thoát của #59; không làm level 09–12. Vì không có level 09, #60 bị cắt. #52–#58 được đánh dấu Cancelled / Out of scope. Phần việc còn lại trong M5 là #61–#64: user evaluation, sửa lỗi, trạng thái rỗng/lỗi và kiểm tra offline. Sau đó tập trung UI polish, stability và demo theo M6.

## Bằng chứng M4 và issues #43–#51

Nightly report do CI tạo lúc `2026-09-30T08:07:30Z`, commit `4448efb8aaecea310266c3ab002b6928362db466`, Git 2.43.0:

- **#43 — Complete:** vét cạn depth 3 và 5.000 chuỗi random, seed 42; 6.160/6.160 pass, 0 hard failures.
- **#44 — Complete:** bước “Full differential, invalid gate and layout benchmark” xanh; invalid `ErrorClass` gate không có hard failure. 19.806 cảnh báo output là khác biệt mềm.
- **#45 — Complete:** workflow sinh report thật có `generatedAt`, source SHA, Git version, số liệu differential và benchmark.
- **#46 — Complete:** `nightly.yml` khai báo `workflow_dispatch`; nightly workflow đã chạy xanh và publish report.
- **#47 — Complete:** Verification UI render report có metadata và dữ liệu đo, không còn fixture giả trong luồng chính.
- **#48 — Complete:** level 05–08 có mục tiêu và lời giải được kiểm bằng parser, engine và goal checker.
- **#49 — Complete:** callback `requestAnimationFrame` ghi 220 khoảng frame ở n=200; p95 CI là 16.7 ms. AC trong `ISSUES.md` yêu cầu lưu mẫu rAF và tính p95.
- **#50 — Complete:** render SVG được đo riêng với `layout()`; p95 vượt ngân sách 100 ms đầu tiên tại n=1.000.
- **#51 — Complete:** hoàn tất level được lưu local và marker vẫn tồn tại sau khi nạp lại store; test ở `src/app/levelStore.test.ts`.

GitHub issue [#47 — Recheck animation frame p95 in production build](https://github.com/sharkdownwindows/GitPlay/issues/47) vẫn **Open**. Production bundle đã được đo ở SHA `2dab68b90e10b6c0a9ffe3afdae71e8eecfe7039`; p95 thô là `16.700000000000273 ms`, cao hơn ngưỡng 16.7 ms theo phép so sánh hiện tại. Bước tiếp theo là profiling Chrome trên production build; chưa tối ưu `GraphView`.

## Validation local trước snapshot M4 (2026-09-28)

| Lệnh | Exit code | Kết quả |
|---|---:|---|
| `npm run typecheck` | 0 | TypeScript pass. |
| `npm test` | 0 | 16 test files, 125/125 tests pass. |
| `npm run build` | 0 | Vite production build pass. |
| `npm run lint:imports` | 0 | Luật import cho `src/core` và `src/progress` pass với `node scripts/check-imports.ts`. |
| `git diff --check` | 0 | Không có lỗi whitespace trong unstaged diff. |

## Spike #23 — thời gian gọi Git (2026-09-28)

Chạy `node scripts/bench-git-spawn.mjs`: tạo một repo Git trong thư mục tạm, đo 100 lần `spawnSync("git", ["status", "--porcelain"])` bằng đồng hồ monotonic, rồi xóa thư mục tạm trong `finally`. Đã xác nhận thư mục không còn sau benchmark. Không warm-up; số đo gồm chi phí spawn **và** thực thi `git status`, không phải chi phí spawn thuần.

| Số lần | Mean | Median | p95 |
|---:|---:|---:|---:|
| 100 | 29.21 ms | 29.22 ms | 31.60 ms |

Môi trường: Node `v24.16.0`; Git `2.31.1.windows.1`; Windows `win32 10.0.26200 x64`. Đây là một lần đo local; ngân sách CI và số process Git cho mỗi test case cần được đo trên CI trước khi quyết định chạy vét cạn độ sâu 3 trên mọi PR.

## Việc tiếp theo

- Hoàn thành M5 #61–#64, sau đó tập trung polish giao diện, stability và demo M6.
- Profiling Chrome trên production build để xử lý GitHub issue #47. Đo hiện tại là headless trên máy Linux; chưa có trace để quy trách nhiệm cho scripting, layout, paint hay compositing.
- `BRIEF.md` vẫn là placeholder; PRD hiện dựa trên issue list, technical overview và các contract đã chấp nhận.
