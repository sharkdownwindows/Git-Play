# GitScope — Issue list theo 6 mốc

Version 1.0 · Đi kèm `PRD.md`, `TECHNICAL_OVERVIEW.md`, `STRUCTURE.md`

Mỗi buổi họp là một mốc. Buổi họp **không phải** để cập nhật tiến độ — tiến độ đọc trên board. Buổi họp để **kiểm tra điều kiện thoát** và **chốt một quyết định**.

Ngày là ngày lịch, tính từ ngày bắt đầu dự án.

| Mốc | Ngày | Tên | Quyết định phải chốt |
|---|---|---|---|
| M1 | 1 | Kickoff · đóng băng contract | Ba contract có được chốt không? |
| M2 | 5 | Vertical slice | Đủ tốc độ hay phải cắt scope ngay? |
| M3 | 8 | Engine đủ 5 lệnh · harness v1 | Có cần chuyển diff-test sâu sang nightly? |
| M4 | 10 | **Cổng quyết định** | Đánh giá bằng chứng cho năm lệnh, differential test và report CI. |
| M5 | 14 | Scope chốt · nội dung và eval | Hoàn tất phạm vi Tier 1-only trước feature freeze. |
| M6 | 17 | Feature freeze đã qua · tổng duyệt | Ai trình bày phần nào? Sẵn sàng chưa? |

Demo: ngày 21. Feature freeze: ngày 15, không thương lượng.

**Quy ước issue**

- `[D1]`…`[D6]` = chủ sở hữu. `[ALL]` = cả nhóm.
- `⛔ A` = bị chặn bởi issue A.
- **AC** = acceptance criteria. Một issue chỉ đóng khi AC kiểm chứng được, không phải khi tác giả nói đã xong.
- `P0` phải xong trước mốc. `P1` nên xong. `P2` cắt được.
- Ước lượng theo giờ người, không phải ngày.

**Quy tắc chung:** không demo được nghĩa là chưa xong. Không có trạng thái "gần xong".

---

## M1 · Ngày 1 — Kickoff và đóng băng contract

**Mục tiêu:** kết thúc buổi họp, 5 người còn lại có thể bắt đầu code ngay mà không phải chờ Dev 1.

**Điều kiện thoát:** `npm run dev` chạy được trên máy cả 6 người, `npm test` xanh, CI xanh, ba contract đã merge vào `main`.

**Quyết định phải chốt:** ba contract. Sau buổi này, đổi contract cần cả nhóm đồng ý. Nếu không chốt được trong buổi họp, kéo dài buổi họp — không được hoãn sang hôm sau, vì mọi việc khác đều chặn ở đây.

| # | Issue | Chủ | Chặn bởi | AC | Ưu tiên | Giờ |
|---|---|---|---|---|---|---|
| 1 | Scaffold: Vite + TS + Tailwind + Vitest, cây thư mục theo STRUCTURE §2 | D1 | — | `npm run dev` mở được trang trắng; 9 thư mục `src/*` đều tồn tại và có ≥1 file | P0 | 2 |
| 2 | Cài dependencies ứng dụng và công cụ dev | D1 | ⛔1 | `package.json` có các dependency cần cho app và validation; không ai phải sửa `package.json` sau ngày 1. | P0 | 0.5 |
| 3 | **CONTRACT 1** — `src/core/types.ts` | D1 | ⛔1 | `RepoState`, `Command`, `Result`, `ErrorClass` đầy đủ. Bốn seam staging có mặt, luôn `null`. Cả nhóm review và đồng ý trong buổi họp. | P0 | 2 |
| 4 | **CONTRACT 2** — `src/verification/report.ts` | D6 | ⛔1 | Kiểu cho diff-test summary, scaling series, `generatedAt`, `commitSha`, `gitVersion`, `divergences[]` | P0 | 1 |
| 5 | **CONTRACT 3** — `src/progress/types.ts` | D4 | ⛔1 | `LevelRecord`, `ProgressSet` cho tiến độ localStorage. | P0 | 0.5 |
| 6 | Stub engine: 5 lệnh trả state hardcoded, đúng kiểu, không throw | D1 | ⛔3 | `execute(state, cmd)` chạy được cho cả 5 `kind`; `npm test` có 1 test xanh | P0 | 1.5 |
| 7 | App shell: 4 tab rỗng (Practice · Levels · Reference · Verification) | D2 | ⛔1 | Chuyển tab được, không lỗi console | P0 | 1.5 |
| 8 | `viz/MiniGraph.tsx` stub nhận `RepoState`, render một hình chữ nhật | D2 | ⛔3 | D4 import được mà không cần D2 làm xong visualizer | P0 | 0.5 |
| 9 | `public/verification.json` giả, đúng Contract 2 | D6 | ⛔4 | Parse được bằng kiểu ở Contract 2; có đủ trường bắt buộc | P0 | 0.5 |
| 10 | CI `ci.yml`: typecheck + unit test | D5 | ⛔1 | Chạy xanh trên PR đầu tiên | P0 | 1 |
| 11 | Lint rule chặn import DOM/React trong `src/core/` và `src/progress/` | D5 | ⛔1 | Cố ý thêm `import React` vào `core/engine.ts` thì CI phải đỏ | P0 | 1 |
| 12 | README: cách chạy, cách test, sơ đồ kiến trúc 1 hình | D6 | ⛔1 | Người ngoài nhóm clone và chạy được theo README | P1 | 1 |

**Rủi ro của mốc này:** #3 là issue quan trọng nhất toàn dự án. Nếu Contract 1 sai, chi phí sửa tăng theo từng ngày. Dành thời gian cho nó, cắt #12 nếu cần.

---

## M2 · Ngày 5 — Vertical slice

**Mục tiêu:** một lệnh đi hết đường từ bàn phím tới pixel.

**Điều kiện thoát:** gõ `git commit` vào terminal → engine thật chạy → graph vẽ lại → output hiện đúng định dạng Git. Không stub ở bất kỳ khâu nào của đường đi này.

**Quyết định phải chốt:** đủ tốc độ hay không. Trượt mốc này là tín hiệu sớm nhất và đáng tin nhất. Trượt → cắt ngay mục 1 và 2 của cut list (animation, số level 12→8), đừng chờ tới M4.

| # | Issue | Chủ | Chặn bởi | AC | Ưu tiên | Giờ |
|---|---|---|---|---|---|---|
| 13 | `commit` thật: tạo node, dịch ref, xử lý detached HEAD | D1 | ⛔3 | Unit test: commit khi attached dịch branch; commit khi detached chỉ dịch HEAD | P0 | 3 |
| 14 | `branch` thật + lỗi trùng tên, tên không hợp lệ | D1 | ⛔3 | Unit test cả đường đúng và đường lỗi; engine không throw | P0 | 2 |
| 15 | `viz/layout.ts`: hàm thuần, y = độ sâu topo, x = làn cột | D2 | ⛔3 | Test thuần: cùng input → cùng output; parent luôn ở trên child | P0 | 4 |
| 16 | `GraphView` render tĩnh: node, cạnh, nhãn branch, nhãn HEAD | D2 | ⛔15 | Cho một `RepoState` mẫu thì vẽ đúng, không animation | P0 | 4 |
| 17 | `terminal/parse.ts`: string → `Command` \| `ParseError` | D3 | ⛔3 | Test bảng: 5 lệnh hợp lệ + 8 chuỗi sai đều ra kết quả đúng kiểu | P0 | 3 |
| 18 | `Terminal.tsx`: nhập, lịch sử, mũi tên lên/xuống | D3 | ⛔17 | Gõ được, ↑ lấy lại lệnh trước | P0 | 3 |
| 19 | `app/store.ts`: `useReducer` bọc engine | D2 | ⛔6 | Dispatch một command làm state đổi và UI vẽ lại | P0 | 2 |
| 20 | `levels/schema.ts` + `check.ts` — đẳng cấu DAG, bỏ qua commit ID | D4 | ⛔3 | Test: hai DAG khác tên commit nhưng cùng cấu trúc và cùng vị trí ref → pass | P0 | 4 |
| 21 | `progress/store.ts` + `merge.ts` (union) | D4 | ⛔5 | Unit test thuần cho `merge()`; reload trang giữ nguyên tiến độ | P0 | 2 |
| 22 | Unit test cho `commit` + `branch`, ≥ 12 case | D5 | ⛔13,14 | Coverage `core/commands/` ≥ 80% cho 2 lệnh này | P0 | 3 |
| 23 | SPIKE: đo thời gian spawn `git` trong tmpdir, 100 lần | D5 | — | Con số cụ thể ghi vào issue. Quyết định ngân sách CI dựa trên nó, không dựa trên phỏng đoán. | P0 | 2 |
| 24 | `harness/bench/synth.ts`: sinh DAG n = 10²…10⁵ có seed | D6 | ⛔3 | Cùng seed → cùng DAG; n=10⁵ sinh xong < 10 s | P1 | 3 |
| 25 | `VerificationTab` render `verification.json` giả | D6 | ⛔4,9 | Tab hiển thị số liệu giả đúng; thiếu file thì hiện trạng thái rỗng, không crash | P1 | 3 |
| 26 | Nội dung `commands-ref/data.ts` cho 5 lệnh | D4 | — | Mỗi lệnh có cú pháp, mô tả 1 câu, tác động lên state, `RepoState` mẫu before/after | P1 | 3 |

**Lưu ý về #23.** Đây là issue dễ bỏ qua nhất và ảnh hưởng trực tiếp tới M3. Nếu spawn `git` mất 40 ms, vét cạn độ sâu 3 với 5 lệnh và 3 tên branch sẽ vượt ngân sách CI 10 phút. Biết con số này ở ngày 5 thì còn xoay xở được; biết ở ngày 12 thì không.

---

## M3 · Ngày 8 — Engine đủ 5 lệnh, harness v1 xanh

**Mục tiêu:** engine hoàn chỉnh và có bằng chứng nó đúng.

**Điều kiện thoát:** cả 5 lệnh chạy; `npm run diff:quick` với vét cạn độ sâu 2 chạy xanh trong CI.

**Quyết định phải chốt:** dựa trên số đo ở #23 và thời gian CI thực tế, quyết định vét cạn độ sâu 3 chạy mỗi PR hay chuyển sang nightly. Quyết định bằng số, không bằng cảm tính.

| # | Issue | Chủ | Chặn bởi | AC | Ưu tiên | Giờ |
|---|---|---|---|---|---|---|
| 27 | `switch` + `checkout`: gồm detached HEAD và cảnh báo giống Git | D1 | ⛔13 | `checkout <commit>` tách HEAD và in đúng cảnh báo; `switch <commit>` báo lỗi như Git | P0 | 3 |
| 28 | `graph.ts`: ancestor, LCA, độ sâu topo | D1 | ⛔3 | Test trên DAG có nhiều common ancestor; LCA loại đúng ancestor-của-ancestor | P0 | 3 |
| 29 | `merge`: fast-forward vs commit 2 parent | D1 | ⛔28 | FF khi một bên là ancestor; ngược lại tạo node 2 cạnh. Test cả hai nhánh. | P0 | 4 |
| 30 | `errors.ts`: chuỗi lỗi + `ErrorClass` cho mọi đường lỗi của 5 lệnh | D1 | ⛔3 | Mỗi đường lỗi có 1 `ErrorClass` và 1 chuỗi; không đường nào trả chuỗi rỗng | P0 | 2 |
| 31 | `history.ts`: undo/redo snapshot | D1 | ⛔3 | Undo 5 lần rồi redo 5 lần cho lại đúng state; lệnh mới xóa redo stack | P0 | 2 |
| 32 | `harness/diff/adapter.ts` — abstract command → engine call \| git CLI | D5 | ⛔3 | Cùng `AbstractCommand` chạy được trên cả hai target | P0 | 3 |
| 33 | `harness/diff/runReal.ts` — tmpdir, git ghim 2.43, `LC_ALL=C`, `--allow-empty`, merge luôn có `-m` | D5 | ⛔32 | Chạy 1 chuỗi 5 lệnh trên git thật, dọn tmpdir sau khi xong | P0 | 4 |
| 34 | `harness/diff/normalize.ts` — khóa theo **commit message**, không theo hash | D5 | ⛔33 | Hai DAG từ hai target chuẩn hóa về cùng một cấu trúc so sánh được | P0 | 4 |
| 35 | `harness/diff/run.ts` — vét cạn độ sâu ≤2, so sánh, in divergence | D5 | ⛔34 | CI xanh; một lỗi cố ý chèn vào engine phải làm CI đỏ | P0 | 3 |
| 36 | Animation: CSS transform, khóa input ≤ 400 ms | D2 | ⛔16 | Node dịch mượt; gõ nhanh 2 lệnh không làm lệch view khỏi state | P0 | 5 |
| 37 | `RefLabel`: phân biệt rõ branch ref và HEAD, HEAD detached nổi bật | D2 | ⛔16 | Người chưa dùng bao giờ nhìn ra HEAD đang ở đâu mà không cần chú thích | P0 | 3 |
| 38 | Level 01–04 (first commit, branching, switch vs checkout, detached HEAD) | D4 | ⛔20 | Mỗi level giải được; `check.ts` nhận đúng ít nhất 2 đường giải khác nhau | P0 | 5 |
| 39 | `CommandRefPanel` + `MiniDiagram` dùng `MiniGraph` thật | D4 | ⛔8,26 | Sơ đồ before/after sinh từ engine thật, không vẽ tay | P1 | 4 |
| 40 | `harness/bench/layout.ts` — đo headless n = 10²…10⁵ | D6 | ⛔15,24 | Ra bảng số; độ dốc log–log ≈ 1 | P1 | 3 |
| 41 | `ScalingChart.tsx` — SVG viết tay | D6 | ⛔40 | Vẽ đúng trên dữ liệu thật của #40 | P1 | 3 |
| 42 | **Nhật ký divergence** — file `docs/divergences.md`, ghi mọi sai lệch harness tìm ra | D5 | ⛔35 | File tồn tại từ ngày 8; mỗi mục có chuỗi lệnh, kỳ vọng, thực tế, commit sửa | P0 | 0.5 |

**Lưu ý về #42.** Đây là chi phí gần bằng 0 và là bằng chứng mạnh nhất trong buổi thuyết trình. Metric "harness bắt được ≥1 lỗi thật" không thể dựng lại vào tuần 3 nếu không ghi từ ngày 8.

---

## M4 · Ngày 10 — Cổng quyết định

**Mục tiêu:** quyết định phần scope còn lại dựa trên bằng chứng, không dựa trên mong muốn.

**Điều kiện thoát:** 5 lệnh chạy đúng; diff-test xanh trên chuỗi hợp lệ; `verification.json` sinh từ CI thật chứ không còn giả.

**Kế hoạch quyết định tại M4 (lịch sử; scope cuối cùng được chốt ở M5):**

| Tình trạng | Hành động |
|---|---|
| Đạt điều kiện thoát, còn slack | Theo kế hoạch lúc đó, có thể cân nhắc Tier 2. |
| Đạt, còn nhiều slack | Theo kế hoạch lúc đó, cân nhắc Tier 2 và `add`. |
| Chưa đạt | Không thêm gì; tập trung ổn định, nội dung level, diễn tập. |

Quy tắc: quyết định bằng trạng thái CI ở thời điểm họp, không bằng lời hứa "mai xong".

| # | Issue | Chủ | Chặn bởi | AC | Ưu tiên | Giờ | Trạng thái |
|---|---|---|---|---|---|---|---|
| 43 | Vét cạn độ sâu 3 + random có seed 5000 chuỗi | D5 | ⛔35 | Pass 100% vét cạn; ≥99.9% random; seed ghi trong report | P0 | 3 | ✅ Complete |
| 44 | Fuzzing **lệnh sai**: so `ErrorClass` (hard gate) + chuỗi (soft) | D5 | ⛔30,35 | Hard gate xanh; sai lệch chuỗi được báo cáo, không fail build | P0 | 4 | ✅ Complete |
| 45 | `harness/writeReport.ts` → `public/verification.json` thật | D5 | ⛔43 | File có `generatedAt`, `commitSha`, `gitVersion`, số liệu thật | P0 | 2 | ✅ Complete |
| 46 | `nightly.yml`: diff-test sâu + benchmark, commit lại report | D5 | ⛔45 | Chạy được thủ công bằng workflow_dispatch | P0 | 2 | ✅ Complete |
| 47 | `DiffTestSummary` render dữ liệu thật + hiển thị timestamp/SHA | D6 | ⛔45 | Tab Verification không còn dữ liệu giả ở bất kỳ chỗ nào | P0 | 3 | ✅ Complete |
| 48 | Level 05–08 (recover detached, fast-forward, merge commit, ff vs no-ff) | D4 | ⛔38 | Mỗi level giải được và có mô tả mục tiêu rõ ràng | P0 | 5 | ✅ Complete |
| 49 | Đo p95 frame time tại n = 200 bằng `PerformanceObserver` | D2 | ⛔36 | Lấy timestamp từ callback `requestAnimationFrame` trong animation 199→200 commit, tính p95 frame interval và lưu mẫu thô; nếu > 16.7 ms thì mở issue tối ưu kèm số đo | P0 | 2 | ✅ Complete |
| 50 | Đo ngưỡng bão hòa render DOM, n = 10²…10⁴ | D6 | ⛔36 | Xác định được điểm gãy; tách biểu đồ khỏi biểu đồ layout headless | P1 | 3 | ✅ Complete |
| 51 | `LevelList` + hiển thị tiến độ từ localStorage | D4 | ⛔21 | Hoàn thành level rồi reload vẫn thấy đánh dấu | P0 | 2 | ✅ Complete |

---

## M5 · Ngày 14 — scope chốt, nội dung và eval

**Mục tiêu:** chốt sản phẩm Tier 1-only, hoàn thiện nội dung và đánh giá trước feature freeze ngày 15.

**Điều kiện thoát:** ít nhất 8 level hoàn chỉnh. Tám level 01–08 hiện tại đáp ứng điều kiện thoát của #59; không yêu cầu level 09–12.

**Quyết định chính thức:** cắt Tier 2. GitScope là sản phẩm Tier 1-only. Không triển khai `add`, authentication, server hoặc đồng bộ; localStorage là nguồn tiến độ duy nhất. Trọng tâm còn lại là UI polish, user evaluation, stability và demo.

Tier 2 từng được cân nhắc sau khi cổng M4 đạt; quyết định M5 thay thế phương án dự kiến đó. Issues #52–#58 dưới đây được giữ để truy dấu kế hoạch ban đầu và đều có trạng thái Cancelled / Out of scope.

| # | Issue | Chủ | Chặn bởi | AC | Ưu tiên | Giờ | Trạng thái |
|---|---|---|---|---|---|---|---|
| 52 | `server/`: 1 process Express phục vụ static + API, `db.ts` + `schema.sql` | D5 | ⛔M4 | Không có server | P0 | 4 | Cancelled / Out of scope |
| 53 | `/api/auth`: register, login, logout — argon2id, cookie httpOnly SameSite=Lax | D5 | ⛔52 | Không có authentication | P0 | 4 | Cancelled / Out of scope |
| 54 | Rate limit `/api/auth/*`: 10 lần / IP / 15 phút | D5 | ⛔53 | Không có API auth | P0 | 1 | Cancelled / Out of scope |
| 55 | `/api/progress` GET + POST, upsert last-write-wins | D5 | ⛔52 | Tiến độ chỉ lưu localStorage | P0 | 2 | Cancelled / Out of scope |
| 56 | `sync/client.ts` + `attach.ts` — best-effort, nuốt mọi lỗi | D5 | ⛔55 | Không đồng bộ tiến độ | P0 | 3 | Cancelled / Out of scope |
| 57 | CI job `tier1-build` chạy `scripts/strip-tier2.sh` | D5 | ⛔56 | Không có build để loại phần không thuộc sản phẩm | P0 | 1.5 | Cancelled / Out of scope |
| 58 | `AuthPanel` — modal đóng được, không chặn ai | D5 | ⛔53 | Không có auth panel | P0 | 2 | Cancelled / Out of scope |
| 59 | Level 09–12 (undo ≠ git, LCA 3 nhánh, branch là con trỏ, freestyle) | D4 | ⛔48 | Điều kiện tối thiểu của issue là ≥8 level; level 01–08 hiện tại đáp ứng điều kiện thoát. Không làm level 09–12. | P0 | 5 | ✅ Complete — 8 level đủ |
| 60 | Level 09 nói rõ undo là của trình mô phỏng, Git thật chỉ có reflog | D4 | ⛔59 | Không làm level 09 | P1 | 1 | Cancelled / Out of scope |
| 61 | Eval người dùng: 6–8 bạn, quiz trước/sau 6 câu, 30 phút | D6 | — | Có bảng số liệu thô; ghi lại mọi chỗ bị kẹt | P0 | 4 | M5 scope |
| 62 | Sửa bug do diff-test và eval phát hiện | D1 | ⛔42,61 | Nhật ký divergence có ≥1 mục kèm commit sửa | P0 | 5 | M5 scope |
| 63 | Trạng thái rỗng và trạng thái lỗi cho mọi tab | D2 | — | Xóa `verification.json` → tab hiện trạng thái rỗng, không crash | P1 | 2 | M5 scope |
| 64 | Kiểm tra offline: tắt mạng, làm hết 1 level | D3 | — | Không chức năng nào suy giảm; DevTools không có request nào thất bại gây lỗi UI | P0 | 1 | M5 scope |

---

## M6 · Ngày 17 — Sau feature freeze, tổng duyệt

**Mục tiêu:** không viết tính năng nữa. Chỉ sửa lỗi, viết tài liệu, tập nói.

**Điều kiện thoát:** cả 6 người giải thích được kiến trúc trong 2 phút; slide xong; demo chạy hai lần liên tiếp không lỗi.

**Quyết định phải chốt:** phân vai thuyết trình. Vì 1–2 người được gọi ngẫu nhiên, mọi người phải chuẩn bị được toàn bộ — nhưng vẫn cần thống nhất thứ tự và ai dẫn phần nào nếu được chọn.

| # | Issue | Chủ | Chặn bởi | AC | Ưu tiên | Giờ |
|---|---|---|---|---|---|---|
| 65 | Kịch bản demo 5–7 phút, viết thành văn bản từng bước | D6 | — | Chạy thử 2 lần liên tiếp, đúng thời lượng, không lỗi | P0 | 3 |
| 66 | Slide: vấn đề → giải pháp → kiến trúc → **bằng chứng** → giới hạn | D6 | ⛔65 | Có slide riêng cho nhật ký divergence và biểu đồ scaling | P0 | 4 |
| 67 | Slide giới hạn đã biết: không staging, không conflict nội dung, n≈8 không đủ ý nghĩa thống kê | D6 | ⛔66 | Nêu trước khi bị hỏi, không né | P0 | 1 |
| 68 | Ngân hàng câu hỏi Q&A: ≥15 câu kèm câu trả lời ngắn | D6 | ⛔66 | Gồm: tại sao không dùng LGB, tại sao không có `add`, harness bắt được lỗi nào chưa, tại sao không dùng D3/ORM/LLM | P0 | 3 |
| 69 | Diễn tập Q&A chéo: mỗi người trả lời 5 câu về phần **không phải** của mình | ALL | ⛔68 | Cả 6 người qua được; ai trượt thì ôn lại và làm lại | P0 | 3 |
| 70 | Chạy lại CI đầy đủ, `verification.json` sinh mới trước demo | D5 | — | `generatedAt` cách ngày demo < 48 giờ | P0 | 1 |
| 71 | Bản dự phòng: static production deployment | D5 | — | Mở được bằng URL riêng từ production build; không cần backend và không phụ thuộc #57 | P0 | 1 |
| 72 | Báo cáo cuối: gộp kết quả eval, benchmark, diff-test | D6 | ⛔61,70 | Mọi con số trong báo cáo truy ngược được về một lần chạy CI cụ thể | P0 | 4 |
| 73 | README cuối cùng, mô tả sản phẩm Tier 1-only | D6 | — | Người ngoài nhóm chạy và hiểu được sản phẩm Tier 1-only | P1 | 1.5 |

---

## Tổng hợp theo người

| Dev | Phạm vi chính | Issue | Ước tính (giờ) |
|---|---|---|---|
| D1 | Git engine — critical path | 1,2,3,6,13,14,27,28,29,30,31,62 | ~32 |
| D2 | Visualizer, app shell | 7,8,15,16,19,36,37,49,63 | ~28 |
| D3 | Terminal | 17,18,64 | ~7 |
| D4 | Level, progress, command reference | 5,20,21,26,38,39,48,51,59 (đạt), 60 (hủy) | ~34 |
| D5 | Harness, CI, deployment | 10,11,22,23,32,33,34,35,42,43,44,45,46,70,71 | ~48 |
| D6 | Verification, benchmark, eval, tài liệu | 4,9,12,24,25,40,41,47,50,61,65,66,67,68,72,73 | ~42 |

Issue #69 (diễn tập Q&A chéo) thuộc cả nhóm, không có chủ riêng.

**Mất cân bằng đã biết và cách xử lý.**

D3 nhẹ nhất (~7 giờ) vì terminal là module nhỏ nhất. Từ M3 trở đi, D3 chuyển sang hỗ trợ: viết nội dung level cùng D4 (#38, #48, #59) và viết test cho engine cùng D5. Đây là điều chỉnh có chủ đích — đừng phát minh thêm việc cho D3 chỉ để lấp chỗ trống, vì mọi việc phát minh thêm đều là scope creep.

D5 có tải cao nhất (~48 giờ) do gánh harness, CI và deployment. Các issue hạ tầng tài khoản và đồng bộ đã bị hủy tại M5, không nằm trong kế hoạch công việc còn lại.

D1 là critical path từ M1 tới M3. Không giao thêm việc gì cho D1 ngoài engine trong giai đoạn này, kể cả việc nhỏ.

---

## Quy tắc vận hành

**Trước mỗi buổi họp.** Mọi issue P0 của mốc phải ở trạng thái `done` hoặc `blocked` kèm lý do cụ thể. Trạng thái `in progress` vào giờ họp được tính là chưa xong.

**Trong buổi họp, 30 phút, đứng.**
1. Kiểm điều kiện thoát — 10 phút. Demo, không mô tả.
2. Chốt quyết định của mốc — 10 phút.
3. Giao issue cho mốc sau — 10 phút.

**Cấm trong buổi họp:** thiết kế lại kiến trúc, tranh luận kỹ thuật chi tiết, thêm scope. Ba việc này để ngoài buổi họp.

**Cut list lịch sử — các quyết định đã áp dụng:**
1. Animation (#36) → chuyển tức thời
2. Level 09–12 (#59) → giữ 8 level; điều kiện tối thiểu đã đạt
3. Tier 2 (#52–58) → Cancelled / Out of scope; localStorage là nguồn tiến độ duy nhất
4. Sơ đồ mini Command Reference (#39) → chỉ giữ text
5. Benchmark render DOM (#50) → chỉ giữ layout scaling

Differential testing (#32–35, #42–45) và tab Verification (#25, #47) **không** nằm trong cut list. Cắt chúng là cắt mất lý do tồn tại của dự án và làm cả hai tính năng advanced trở nên vô hình với giám khảo.
