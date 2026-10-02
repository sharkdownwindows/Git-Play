# GitScope — Tài liệu tổng quan và kỹ thuật

Version 1.0 · Tài liệu hợp nhất · Đi kèm `BRIEF.md` và `PRD.md`

Tài liệu này mô tả **cách** xây dựng. Yêu cầu chi tiết (FR/NFR/user stories) nằm ở `PRD.md`; phần dưới chỉ tham chiếu tới mã FR khi cần.

---

## 1. Tóm tắt

GitScope là web app tĩnh mô phỏng 5 lệnh Git trên commit DAG: `commit`, `branch`, `switch`, `checkout`, `merge`. Người dùng gõ lệnh, thấy graph thay đổi, làm level có kiểm tra tự động, undo/redo tự do. Cạnh khung graph là Command Reference tóm tắt 5 lệnh kèm sơ đồ mini before→after, sinh từ chính engine.

Giao diện chỉ dùng tiếng Anh.

Điểm khác biệt kỹ thuật không nằm ở visualizer mà ở **differential testing**: một harness Node đối chiếu engine với `git` thật. Vì không gian lệnh nhỏ, hệ thống vét cạn được mọi chuỗi đến độ sâu 3 và random có seed đến độ sâu 20. Kết quả hiển thị trong app qua tab Verification, đọc từ JSON do CI sinh.

GitScope là sản phẩm Tier 1-only, chạy dưới static hosting. M5 đã loại tài khoản, server và đồng bộ; localStorage là nguồn tiến độ duy nhất. Trọng tâm còn lại là UI polish, user evaluation, stability và demo. `add` không được triển khai. Không có ML model. Xem `STATUS.md` về quyết định M5 và §8 về ML.

---

## 2. Tổng quan dự án

| Hạng mục | Nội dung |
|---|---|
| Thời gian | 3 tuần |
| Nhân sự | 6 người |
| Loại | Others (đã được giảng viên chấp nhận) |
| Deliverable | Web app tĩnh + repo + báo cáo + slide 5–7 phút |
| Deploy | GitHub Pages hoặc Netlify (static hosting) |

### Ánh xạ sang rubric

| Yêu cầu rubric | Đáp ứng |
|---|---|
| Giao diện hoàn chỉnh | Terminal + visualizer + level + verification |
| 4–5 main features | Engine, visualizer, Command Reference, level system, undo/redo |
| Advanced functionalities | Differential testing (bao gồm stress testing qua fuzzing), benchmark + phân tích scaling |

---

## 3. Kiến trúc

### 3.1 Nguyên tắc

Kiến trúc cố tình phẳng. Lý do không phải thẩm mỹ mà là ràng buộc thuyết trình: 1–2 người được gọi ngẫu nhiên phải giải thích được toàn hệ thống (NFR-8). Mỗi tầng trừu tượng thêm vào làm giảm xác suất đó.

### 3.2 Thành phần

```
┌─────────────────────────────────────────────┐
│  Browser (tĩnh, không mạng sau khi tải)     │
│                                             │
│  ┌────────────┐  ┌──────────────┐           │
│  │  Terminal  │  │  Visualizer  │           │
│  │  parser    │  │  layout+SVG  │           │
│  └─────┬──────┘  └──────▲───────┘           │
│        │ Command        │ RepoState         │
│  ┌─────▼────────────────┴───────┐           │
│  │        Git Engine            │           │
│  │  (thuần, deterministic)      │           │
│  └─────┬──────────────┬─────────┘           │
│        │              │                     │
│  ┌─────▼─────┐  ┌─────▼──────┐              │
│  │ Undo/Redo │  │  Level     │              │
│  │ snapshots │  │  checker   │              │
│  └───────────┘  └────────────┘              │
│                                             │
│  ┌───────────────────────────────┐          │
│  │ Progress · localStorage only  │          │
│  └───────────────────────────────┘          │
│                                             │
│  ┌───────────────────────────────┐          │
│  │  Verification tab             │          │
│  │  render verification.json     │          │
│  └───────────────▲───────────────┘          │
└──────────────────┼──────────────────────────┘
                   │ (build time, tĩnh; không có runtime server)
        ┌──────────┴──────────────┐
        │  CI: GitHub Actions     │
        │  ├ diff-test harness ───┼──► git thật
        │  └ benchmark harness    │
        └─────────────────────────┘
```

**Quy tắc phụ thuộc:** Engine không import gì từ UI. Engine là hàm thuần, chạy được trong Node (điều này là bắt buộc — harness diff-test import trực tiếp engine).

### 3.3 Contract 1 — `RepoState`

Đóng băng ngày 1. Đây là giao diện giữa engine, visualizer, level checker, undo stack và normalizer. Định nghĩa chuẩn nằm trong `src/core/types.ts`.

```ts
type CommitId = string;
type RefName = string;

interface Commit {
  id: CommitId;
  message: string;
  parents: CommitId[];               // thứ tự first-parent có nghĩa
  timestamp: string;                 // ISO 8601
}

interface Head {
  detached: boolean;
  ref: RefName | null;               // tên branch khi attached
  commit: CommitId | null;           // id commit khi detached
}

interface RepoState {
  commits: Record<CommitId, Commit>;
  branches: Record<RefName, CommitId>;
  head: Head;
  snapshot: Snapshot | null;
  workingTree: WorkingTree | null;
  index: IndexState | null;
  conflicts: Conflict[] | null;
}
```

Ở v1, bốn trường seam của `RepoState` luôn `null`. Repo rỗng có `head = { detached: false, ref: "main", commit: null }`. Ràng buộc: JSON-serializable, không hàm, không tham chiếu vòng (FR-14). Đây là điều kiện cho phép undo/redo, goal-checking và normalizer đều gần như miễn phí.

### 3.4 Contract 2 — `verification.json`

Đóng băng ngày 1. Giao diện giữa CI và frontend; định nghĩa chuẩn nằm trong `src/verification/report.ts`.

```ts
interface VerificationReport {
  schemaVersion: 1;
  generatedAt: string;               // ISO 8601
  commitSha: string;
  gitVersion: string;
  nodeVersion: string;
  diffTest: {
    totalCases: number; passed: number; failed: number; warnings: number;
    exhaustiveDepth: number; randomCases: number; seed: number; durationMs: number;
  };
  coverage: Record<CommandKind, number>;
  scaling: Array<{
    label: string;
    points: Array<{ n: number; medianMs: number; p95Ms: number; iterations: number }>;
  }>;
  divergences: Array<{
    id: string;
    kind: "state" | "errorClass" | "output";
    severity: "hard" | "soft";
    commands: string[];
    expected: string;
    actual: string;
    expectedErrorClass?: ErrorClass | null;
    actualErrorClass?: ErrorClass | null;
  }>;
}
```

Frontend chỉ đọc và render (FR-43). Nếu file thiếu hoặc sai `schemaVersion`, hiển thị empty state rõ ràng — **không bao giờ hiện số liệu giả** (FR-44).

### 3.4a Contract 3 — tiến độ level (localStorage duy nhất)

`src/progress/types.ts` định nghĩa `LevelRecord = { levelId: string; completedAt: string; commandCount: number }` và `ProgressSet = Record<string, LevelRecord>`. `completedAt` là ISO 8601; khóa của `ProgressSet` trùng `levelId`. localStorage là nơi lưu tiến độ duy nhất.

### 3.5 Thuật toán layout

Không dùng force-directed và không dùng thư viện graph tổng quát. Lý do: kết quả không ổn định giữa các lần chạy và không giống hình dung của người dùng về Git.

```
y(c) = độ sâu topo = 0 nếu parents rỗng
                     ngược lại 1 + max(y(p) for p in parents)
```
Dùng `max` (đường dài nhất) chứ không phải `min`, để parent luôn nằm trên child kể cả sau merge.

```
x(c) = chỉ số cột, gán theo lineage:
       - commit kế thừa cột của parent đầu tiên nếu cột đó còn trống ở hàng y
       - ngược lại lấy cột trống nhỏ nhất
```

Deterministic, O(V+E), khoảng 60 dòng, không phụ thuộc thư viện. Đây cũng là đối tượng của benchmark scaling (NFR-3).

### 3.6 Undo/Redo

Snapshot toàn bộ `RepoState` trước mỗi lệnh, hai stack. Không dùng command-inverse pattern.

Lý do: inverse của `merge` là không tầm thường, và mọi lệnh inverse là một chỗ để sai. Snapshot của 50 commit dạng JSON vào khoảng vài chục KB — chi phí không đáng kể so với rủi ro lỗi logic.

---

## 4. Kế hoạch đánh giá (eval)

Đây là phần có giá trị học thuật nhất của dự án. Có ba tầng.

### 4.1 Tầng 1 — Unit test

Vitest. Mỗi lệnh có test cho: trường hợp thường, trường hợp biên, và trường hợp lỗi. Đích: mọi nhánh trong engine được chạm tới.

### 4.2 Tầng 2 — Differential testing (cốt lõi)

**Nguyên tắc.** Differential testing (McKeeman, 1998) so sánh hai cài đặt độc lập của cùng một đặc tả trên cùng đầu vào; khác biệt tức là ít nhất một bên sai. Ở đây oracle là `git` thật — cài đặt tham chiếu.

**Vì sao phải chạy ngoài browser.** Không có cách chạy `git` thật trong trình duyệt với độ tin cậy chấp nhận được trong 3 tuần. `wasm-git` (libgit2 biên dịch sang WASM) có rủi ro tích hợp cao; `isomorphic-git` là một bản reimplementation bằng JavaScript nên dùng nó làm oracle là so sánh hai bản mô phỏng với nhau — oracle yếu. Vì vậy harness là chương trình Node, chạy trong CI.

**Luồng thực thi.**

```
sinh chuỗi lệnh
      │
      ├──► GitScope engine ──► RepoState ──┐
      │                                     ├──► normalize ──► so sánh
      └──► git thật (tmpdir) ──► git log ──┘
```

**Chi tiết thực thi cần lưu ý.** Git thật từ chối commit rỗng; harness phải dùng `git commit --allow-empty -m "C1"`. Đặt `LC_ALL=C` và `GIT_CONFIG_GLOBAL=/dev/null` để loại bỏ ảnh hưởng của locale và config người dùng.

**Chuẩn hóa — phần khó nhất.** Không thể so sánh hash trực tiếp. Trích xuất trạng thái git thật bằng một lệnh:

```
git log --all --format='%H %P %D'
```

cho ra: commit, parents, và refs trỏ vào nó. Sau đó ánh xạ commit của hai bên theo **thứ tự topo + cấu trúc parent**, không theo hash. Kết quả chuẩn hóa gồm: DAG, vị trí branch, vị trí và trạng thái HEAD (attached/detached).

Vì v1 không có working tree, **không cần** `git status --porcelain=v2`. So với thiết kế ban đầu có staging area, việc này giảm khoảng 40% công việc của harness.

**Hai chế độ.**

| Chế độ | Đầu vào | Kiểm tra |
|---|---|---|
| Parity trạng thái | Chuỗi lệnh hợp lệ | Trạng thái chuẩn hóa khớp nhau |
| Parity thông báo lỗi | Lệnh sai / không hợp lệ | Thông báo lỗi khớp nhau |

**Vét cạn có giới hạn.** Không gian action mỗi trạng thái vào khoảng 13–15 (5 lệnh × pool 3 tên branch + commit target). Do đó:

| Độ sâu | Số chuỗi (xấp xỉ) | Kế hoạch |
|---|---|---|
| ≤ 3 | ~3.4K | Vét cạn, mỗi PR |
| 4 | ~50K | Vét cạn, nightly, chạy song song |
| ≤ 20 | 5K mẫu | Random có seed, mỗi PR |

*Ước lượng thời gian:* mỗi chuỗi cần `git init` + N lệnh + 1 lần đọc log ≈ 60–70 ms. Độ sâu 3 ≈ 3.5 phút đơn luồng; độ sâu 4 ≈ 50 phút đơn luồng, khoảng 6–7 phút với 8 worker. **Đây là ước lượng, chưa đo.** Dev 5 phải đo thực tế trước ngày 8 (Q1 trong PRD). Nếu sai lệch lớn, giảm pool tên branch từ 3 xuống 2 để thu nhỏ nhánh.

Claim trong báo cáo: *"vét cạn mọi chuỗi lệnh đến độ sâu 3, random có seed đến độ sâu 20"*. Điều này chỉ khả thi **nhờ** quyết định thu hẹp phạm vi ở D-1 — nên trình bày như một lựa chọn phương pháp, không phải như hệ quả của việc cắt tính năng.

**Giới hạn phải nêu rõ.** Text lỗi của Git không phải API ổn định và thay đổi giữa các phiên bản. Ghim một phiên bản cụ thể trong CI và ghi vào báo cáo. Với các chuỗi lỗi dễ thay đổi, so sánh *loại lỗi* thay vì chuỗi chính xác.

### 4.3 Tầng 3 — Benchmark

Chỉ để báo cáo và hiển thị tĩnh (D-6). Không có logic đo lúc runtime.

**Layout scaling.** Sinh DAG tổng hợp ở n = 10², 10³, 10⁴, 10⁵. Đo thời gian layout, báo cáo median và p95 theo `ScalingPoint`. Vẽ log–log; độ dốc ≈ 1 là mục tiêu cần kiểm chứng bằng số đo.

**Render.** `performance.now()` / `PerformanceObserver` quanh các lần animate. Báo cáo **p95 frame time**, không phải trung bình — trung bình che mất giật hình.

**SVG vs Canvas.** So sánh giới hạn của cách render hiện tại để hỗ trợ quyết định polish UI. Chỉ làm nếu còn thời gian sau stability và user evaluation.

**Trung thực bắt buộc.** Tải thực tế của công cụ dạy học là ~10² node. Slide phải nói rõ: *"chúng tôi đo để tìm giới hạn của thiết kế, không phải để tuyên bố có nhu cầu tối ưu."* Giám khảo tinh ý sẽ hỏi điều này; trả lời trước sẽ được điểm, bị bắt bài sẽ mất điểm.

### 4.4 Đánh giá với người dùng

Nhẹ nhưng bắt buộc: 6 sinh viên chưa từng dùng công cụ, làm hết các level, đo tỉ lệ hoàn thành level detached HEAD (mục tiêu ≥ 5/6) và ghi lại chỗ bị kẹt. n = 6 là quá nhỏ để suy rộng — báo cáo như quan sát định tính, không phải kết quả thống kê.

---

## 5. Data sources

Dự án không dùng dataset ngoài. Toàn bộ dữ liệu tự sinh hoặc tự viết.

| Nguồn | Nội dung | Sinh bởi | Lưu ở |
|---|---|---|---|
| Định nghĩa level | Trạng thái đầu, mô tả, trạng thái đích | Viết tay | `src/levels/data/*.json` |
| Nội dung Command Reference | 5 lệnh × (cú pháp, mô tả, tác động, ví dụ, state mẫu cho sơ đồ) | Viết tay | `src/commands-ref/data.ts` |
| Chuỗi lệnh test | Vét cạn + random có seed | Harness | Sinh lúc chạy, seed lưu trong report |
| Trạng thái tham chiếu | Output từ `git` thật | `git` trong CI | Thư mục tạm, không commit |
| DAG tổng hợp cho benchmark | n = 10²…10⁵ | Generator có seed | Sinh lúc chạy |
| Verification report | Kết quả diff-test + benchmark | CI | `public/verification.json` |

`verification.json` được commit vào repo và CI regenerate khi có thay đổi. Cách này đảm bảo build tĩnh luôn có dữ liệu và demo chạy offline được (NFR-1). File có thể cũ hơn code — vì vậy FR-41 bắt buộc hiển thị `generatedAt` và `commitSha` để người xem tự đánh giá.

Mọi dữ liệu sinh ra đều **có seed và tái lập được**. Seed ghi trong report.

---

## 6. Seam cho staging area — không thuộc phạm vi sản phẩm

Bốn trường seam được giữ trong contract ngày 1 để tương thích kiểu dữ liệu; chúng không phải roadmap cho staging.

| # | Seam | Cài đặt v1 |
|---|---|---|
| 1 | `RepoState.snapshot: Snapshot \| null` | luôn `null` |
| 2 | `RepoState.workingTree: WorkingTree \| null` | luôn `null` |
| 3 | `RepoState.index: IndexState \| null` | luôn `null` |
| 4 | `RepoState.conflicts: Conflict[] \| null`; kiểu `DetectConflicts` | `conflicts` luôn `null`; `DetectConflicts` trả `null` ở v1 |

Các seam giữ tương thích với contract ngày 1, nhưng không có kế hoạch triển khai staging hoặc `add` trong scope đã chốt tại M5.

---

## 7. Tech stack

| Tầng | Lựa chọn | Lý do |
|---|---|---|
| Ngôn ngữ | TypeScript | Contract `RepoState` cần được kiểm tra ở compile time; đây là cơ chế chính giữ 6 người không lệch nhau |
| Build | Vite | Khởi động nhanh, output tĩnh, không cấu hình |
| UI | React | Cả nhóm đã biết; state → view mapping hợp với engine thuần |
| Styling | Tailwind | Tốc độ; không cần design system cho 3 tuần |
| Visualizer | SVG inline + CSS transform | Không thư viện. Xem §3.5. |
| Biểu đồ (tab Verification) | SVG viết tay, ~40 dòng | Một biểu đồ log–log không đáng để thêm thư viện chart |
| Terminal | Component tự viết | `xterm.js` dành cho PTY thật, thừa ở đây |
| Sơ đồ mini Command Reference | Tái dùng `viz/layout.ts` + engine | Sinh từ engine thật nên không bao giờ lệch với hành vi; không thêm code vẽ |
| Test | Vitest | Cùng hệ với Vite |
| Harness | Node + `node:child_process` | Import trực tiếp engine; gọi `git` qua subprocess |
| CI | GitHub Actions | Ghim phiên bản Git, `LC_ALL=C` |
| Hosting | GitHub Pages / Netlify | Tĩnh, miễn phí |

**Các thư viện đã cân nhắc và loại:** D3 (force layout không ổn định, và chúng tôi không cần phần còn lại), `xterm.js` (thừa), Redux/Zustand (engine đã là single source of truth; thêm state library là tầng trừu tượng không có lý do), `wasm-git` / `isomorphic-git` (xem §4.2).

Mỗi dòng "loại" ở trên là một câu trả lời sẵn cho câu hỏi Q&A "tại sao không dùng X".

---

## 8. Model selection

**Không có ML model trong dự án này.**

Đây là kết luận, không phải thiếu sót. GitScope là bộ mô phỏng tất định của một cấu trúc dữ liệu được đặc tả rõ (DAG + named pointer). Thêm học máy vào đây sẽ làm hệ thống tệ đi: nó phá determinism (NFR-4) và làm cho differential testing — giá trị chính của dự án — mất ý nghĩa, vì không còn hành vi cố định để đối chiếu.

Vì vậy:
- Không có training data, không có model, không có metric dạng accuracy/F1.
- Fuzzer sinh chuỗi lệnh là một thủ tục tìm kiếm ngẫu nhiên có seed, **không phải** mô hình sinh. Không nên mô tả nó bằng ngôn ngữ ML trong báo cáo.
- Khả năng duy nhất có thể đưa AI vào là gợi ý sinh bởi LLM khi người dùng bị kẹt. Đã loại ở D-4: cần mạng (phá NFR-1), phá determinism, và không kiểm chứng được bằng diff-test.

Nếu tài liệu môn học yêu cầu một mục "model selection", điền đúng phần này kèm lý do. Bịa ra một thành phần ML để lấp template sẽ bị hỏi trong Q&A và sẽ trả lời không được.

---

## 9. Success criteria và success metrics

### 9.1 Success criteria (nhị phân — đạt hoặc không)

| ID | Tiêu chí |
|---|---|
| SC-1 | 5 lệnh chạy đúng đặc tả ở PRD §3.1 |
| SC-2 | Differential test 100% pass ở vét cạn độ sâu ≤ 3 |
| SC-3 | Tab Verification render dữ liệu thật từ một CI run cụ thể, kèm timestamp và commit SHA |
| SC-4 | App chạy hoàn toàn offline sau khi tải (NFR-1) |
| SC-5 | Có ít nhất một level dạy detached HEAD và một level dạy fast-forward vs merge commit |
| SC-6 | Cả 6 thành viên giải thích được kiến trúc trong 2 phút (NFR-8) |
| SC-7 | Feature freeze đúng ngày 15 |

SC-6 và SC-7 là tiêu chí về quy trình, không phải sản phẩm. Chúng được đưa vào vì rủi ro lớn nhất của dự án là tổ chức, không phải kỹ thuật.

### 9.2 Success metrics (định lượng)

| Metric | Mục tiêu | Cách đo | Báo cáo ở |
|---|---|---|---|
| Chuỗi diff-test đã chạy | ≥ 8K (vét cạn ≤3 + random 5K) | Harness | Tab Verification |
| Tỉ lệ pass | 100% vét cạn; ≥ 99.9% random | Harness | Tab Verification |
| Độ dốc scaling của layout | ≈ 1.0 trên log–log | Benchmark n = 10²…10⁵ | Tab Verification |
| p95 frame time @ n=200 | < 16.7 ms | `PerformanceObserver` | Tab Verification |
| Tải lần đầu | < 2 s | Lighthouse | Báo cáo |
| Bundle size | < 300 KB gzipped | `vite build` | Báo cáo |
| Hoàn thành level detached HEAD | ≥ 5/6 người thử | Quan sát người dùng | Báo cáo |
| Thời gian CI mỗi PR | < 10 phút | GitHub Actions | Repo |

Metric cuối cùng là ràng buộc vận hành thật: nếu CI vượt 10 phút, vòng lặp phát triển chậm lại đúng vào tuần 3 khi đang sửa bug.

### 9.3 Đối chứng (anti-metrics)

Những con số **không** dùng để tự đánh giá, vì chúng khuyến khích hành vi sai:

- Số dòng code — khuyến khích over-engineering.
- Số lệnh hỗ trợ — dự án chủ động chọn làm ít lệnh nhưng đúng.
- Độ mượt animation đánh giá bằng mắt — dùng p95 frame time thay thế.

---

## 10. Phân công và luồng phụ thuộc

| Dev | Phạm vi | Chặn ai | Bị chặn bởi |
|---|---|---|---|
| 1 | Git engine (critical path) | 2,3,4,5 | Schema freeze |
| 2 | Visualizer: layout + animation | — | `RepoState` |
| 3 | Terminal: parser, history, error messages | — | `RepoState` |
| 4 | Level system + nội dung + Command Reference | — | `RepoState`, engine, `viz/layout.ts` |
| 5 | Diff-test harness + CI | 6 | Engine (import trực tiếp) |
| 6 | Verification tab + benchmark + docs + slide | — | `verification.json` |

**Tuần 1, Dev 5 và 6 chưa có đầu vào thật.** Giao việc trước: Dev 5 viết unit test cho engine và dựng skeleton CI; Dev 6 dựng generator DAG tổng hợp và dựng tab Verification chạy trên `verification.json` giả theo đúng schema. Cả hai việc này không cần chờ engine xong.

Đây là lý do các contract phải đóng băng ngày 1: chúng gỡ chặn cho các nhóm trong suốt tuần 1.

---

## 11. Rủi ro

| # | Rủi ro | Xác suất | Tác động | Giảm thiểu |
|---|---|---|---|---|
| R-1 | Schema thay đổi sau tuần 1 | Trung bình | Cao | Đóng băng ngày 1; thay đổi cần cả nhóm đồng ý |
| R-2 | Vét cạn độ sâu 4 vượt ngân sách CI | Trung bình | Thấp | Chuyển sang nightly; giảm pool tên branch 3→2 |
| R-3 | Text lỗi Git khác giữa các phiên bản | Cao | Trung bình | Ghim version, `LC_ALL=C`, so loại lỗi thay vì chuỗi |
| R-4 | Tính năng advanced vô hình với giám khảo | **Cao nếu không có tab Verification** | Cao | Tab Verification, ưu tiên P0, không nằm trong cut list |
| R-5 | Animation ngốn hết tuần 2 | Trung bình | Trung bình | Mục 1 trong cut list; layout tĩnh phải chạy trước |
| R-6 | Tích hợp dồn sang tuần 3 | Trung bình | Cao | Vertical slice ngày 5; nếu trượt thì cắt scope ngay |
| R-7 | Người được gọi ngẫu nhiên không trả lời được Q&A | Trung bình | Cao | Kiến trúc phẳng + diễn tập chéo tuần 3 (SC-6) |
| R-8 | Không có wifi lúc demo | Thấp | Cao | NFR-1: offline hoàn toàn, đã test bằng cách tắt mạng |
| R-9 | `verification.json` cũ hơn code lúc demo | Trung bình | Thấp | FR-41 hiển thị timestamp + SHA; chạy lại CI trước buổi demo |

R-4 là rủi ro được xử lý muộn nhất trong quá trình lập kế hoạch và cũng là rủi ro có tác động lớn nhất lên điểm số. Cả differential testing lẫn benchmark đều chạy ngoài trình duyệt; nếu không có tab Verification, giám khảo sẽ không thấy bất kỳ bằng chứng nào của phần công việc chiếm tỉ trọng lớn nhất.

---

## 12. Giới hạn đã biết

Nêu trong UI, báo cáo và slide. Nêu trước thì được điểm trung thực; bị phát hiện thì mất điểm.

1. Merge không bao giờ conflict — hệ quả trực tiếp của việc không mô hình hóa nội dung file.
2. Không có staging area, do đó không có `add`, `restore`, `status`.
3. Không có remote, do đó không có `push`, `pull`, `fetch`, `clone`.
4. Commit rỗng và đặt tên tuần tự; không có hash nội dung.
5. Đối chiếu với một phiên bản Git duy nhất đã ghim; parity không đảm bảo cho phiên bản khác.
6. Vét cạn chỉ đến độ sâu 3–4; các bug chỉ xuất hiện ở chuỗi dài hơn có thể bị bỏ sót dù random testing đến độ sâu 20 giảm bớt rủi ro này.
7. Đánh giá người dùng n = 6 — quan sát định tính, không có ý nghĩa thống kê.

---

## 13. Tham chiếu

- McKeeman, W. M. (1998). *Differential Testing for Software.* Digital Technical Journal, 10(1). — nền tảng phương pháp của §4.2.
- learnGitBranching — `https://learngitbranching.js.org`, repo `https://github.com/pcottle/learnGitBranching`. Nguồn cảm hứng. Cần xác minh trực tiếp trong repo trước khi trích dẫn bất kỳ claim nào về giới hạn của nó (cụ thể: rằng nó mô hình hóa commit DAG nhưng không có working tree/staging area — quan sát này có độ tin cậy cao nhưng **chưa được nhóm kiểm chứng bằng mã nguồn**). Giao Dev 6 xác minh trong tuần 1.
- Git release notes 2.23 — bối cảnh việc tách `checkout` thành `switch` và `restore`. Dùng cho phần dẫn nhập của slide.
