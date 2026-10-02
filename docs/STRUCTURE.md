# GitScope — Cấu trúc dự án

Version 1.0 · Đi kèm `BRIEF.md`, `PRD.md`, `TECHNICAL_OVERVIEW.md`

---

## 1. Nguyên tắc thiết kế cấu trúc

Cấu trúc này tối ưu cho **một** thứ: 6 người làm song song 3 tuần mà không chặn nhau và không đụng độ merge.

Ba quy tắc dẫn tới mọi quyết định bên dưới:

1. **Mỗi thư mục có đúng một chủ.** Nếu hai người cùng sửa một file mỗi ngày, file đó đặt sai chỗ.
2. **`core/` không phụ thuộc gì cả.** Không React, không DOM. Đây là điều kiện bắt buộc để harness Node import trực tiếp engine.
3. **Không dùng monorepo.** Một repo, một `package.json`. pnpm workspace / Turborepo là over-engineering cho 3 tuần và tạo thêm một thứ để hỏng.

---

## 2. Cây thư mục

```
gitscope/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # PR: typecheck, unit test, diff-test depth ≤3
│       └── nightly.yml             # diff-test depth 4 + benchmark → verification.json
│
├── public/
│   └── verification.json           # CONTRACT 2 — do CI sinh, commit vào repo
│
├── src/
│   ├── core/                       # ██ Dev 1 — engine thuần, zero dependency
│   │   ├── types.ts                # CONTRACT 1 — ĐÓNG BĂNG NGÀY 1
│   │   ├── engine.ts               # execute(state, command) → Result
│   │   ├── graph.ts                # ancestor, LCA, topo depth
│   │   ├── errors.ts               # chuỗi lỗi Git, khớp nguyên văn Git thật
│   │   ├── history.ts              # undo/redo snapshot stack
│   │   └── commands/
│   │       ├── commit.ts
│   │       ├── branch.ts
│   │       ├── switch.ts
│   │       ├── checkout.ts
│   │       └── merge.ts
│   │
│   ├── viz/                        # ██ Dev 2 — visualizer
│   │   ├── layout.ts               # thuần, không React (harness bench import file này)
│   │   ├── GraphView.tsx
│   │   ├── CommitNode.tsx
│   │   ├── RefLabel.tsx            # nhãn branch + HEAD
│   │   └── edges.tsx
│   │
│   ├── terminal/                   # ██ Dev 3
│   │   ├── parse.ts                # string → Command | ParseError
│   │   ├── format.ts               # Result → dòng output
│   │   └── Terminal.tsx
│   │
│   ├── levels/                     # ██ Dev 4
│   │   ├── schema.ts
│   │   ├── check.ts                # so khớp cấu trúc, bỏ qua tên commit (FR-29)
│   │   ├── LevelPanel.tsx
│   │   └── data/
│   │       ├── 01-first-commit.json
│   │       ├── 02-branching.json
│   │       ├── 03-switch-vs-checkout.json
│   │       ├── 04-detached-head.json
│   │       ├── 05-recover-detached.json
│   │       ├── 06-fast-forward.json
│   │       ├── 07-merge-commit.json
│   │       └── sandbox.json
│   │
│   ├── progress/                   # ██ Dev 4 — tiến độ local
│   │   ├── types.ts                # CONTRACT 3 — ĐÓNG BĂNG NGÀY 1
│   │   ├── store.ts
│   │   └── merge.ts
│   │
│   ├── verification/               # ██ Dev 6
│   │   ├── report.ts               # CONTRACT 2 types — ĐÓNG BĂNG NGÀY 1
│   │   ├── VerificationTab.tsx
│   │   ├── ScalingChart.tsx        # SVG viết tay, ~40 dòng
│   │   └── DiffTestSummary.tsx
│   │
│   ├── commands-ref/               # ██ Dev 4 — Command Reference
│   │   ├── data.ts                 # 5 lệnh: cú pháp, mô tả, tác động, state mẫu
│   │   ├── CommandRefPanel.tsx
│   │   └── MiniDiagram.tsx         # dùng viz/layout.ts — ngoại lệ, xem §3
│   │
│   ├── app/                        # shell — ĐÓNG BĂNG NGÀY 1, hiếm khi sửa
│   │   ├── App.tsx                 # tab routing, 4 tab stub sẵn
│   │   ├── store.ts                # useReducer bọc engine + history
│   │   └── layout.css
│   │
│   └── main.tsx
│
├── harness/                        # ██ Dev 5 — Node only, không vào bundle
│   ├── diff/
│   │   ├── generate.ts             # vét cạn + random có seed
│   │   ├── runReal.ts              # spawn git thật trong tmpdir
│   │   ├── normalize.ts            # RepoState | git log → dạng chuẩn
│   │   └── run.ts                  # entry: chạy, so sánh, xuất kết quả
│   ├── bench/
│   │   ├── synth.ts                # sinh DAG n = 10²…10⁵
│   │   └── layout.ts               # đo src/viz/layout.ts
│   └── writeReport.ts              # gộp → public/verification.json
│
├── docs/
│   ├── BRIEF.md
│   ├── PRD.md
│   ├── TECHNICAL_OVERVIEW.md
│   ├── STRUCTURE.md                # file này
│   ├── ISSUES.md
│   ├── STATUS.md
│   └── slides/
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Unit test đặt **cạnh source**: `commit.ts` ↔ `commit.test.ts`. Không có thư mục `tests/` dùng chung — thư mục dùng chung là thư mục ai cũng sửa, tức là thư mục hay conflict.

---

## 3. Quy tắc phụ thuộc

| Module | Được import | Cấm import |
|---|---|---|
| `core/` | chỉ `core/` | React, DOM, mọi module UI |
| `viz/layout.ts` | `core/types` | React (để harness dùng được) |
| `viz/*.tsx`, `terminal/`, `levels/`, `verification/` | `core/` | lẫn nhau |
| `commands-ref/` | `core/`, `viz/` | `terminal/`, `levels/`, `verification/` |
| `app/` | tất cả | — |
| `harness/` | `core/`, `viz/layout.ts` | mọi file `.tsx` |

**Hai ràng buộc đáng chú ý:**

Các module UI không import lẫn nhau — chúng giao tiếp qua `app/store.ts`. Nhờ vậy Dev 2, 3, 4, 6 không bao giờ phải đợi nhau.

**Ngoại lệ duy nhất:** `commands-ref/` được import `viz/` để vẽ sơ đồ mini before→after (FR-37). Đây là ngoại lệ có chủ đích — mục đích của sơ đồ là cho thấy *chính xác* engine làm gì, nên nó phải dùng `layout.ts` thật chứ không phải bản vẽ tay song song. Đổi lại, Dev 4 phụ thuộc vào Dev 2: `viz/` phải export một component `MiniGraph` nhận `RepoState`. Chốt interface này trong buổi kickoff.

---

## 4. Điểm dễ conflict và cách xử lý

Bốn chỗ mà 6 người sẽ đụng nhau nếu không xử lý trước:

| Chỗ | Vấn đề | Giải pháp |
|---|---|---|
| `viz/` ↔ `commands-ref/` | Dev 4 chờ component `MiniGraph` của Dev 2 | Dev 2 export `MiniGraph` stub ngay ngày 1 |
| `App.tsx` | Ai thêm tab cũng phải sửa | Stub sẵn cả 4 tab ngày 1, sau đó gần như không sửa |
| `types.ts` | Trung tâm của mọi thứ | Đóng băng ngày 1; đổi phải cả nhóm đồng ý |
| `package.json` | Ai thêm thư viện cũng sửa | Cài hết dependency trong buổi kickoff |

Điểm cuối cùng có nghĩa cụ thể: **cài đủ mọi thứ ngay hôm nay** (`react`, `vite`, `typescript`, `tailwindcss`, `vitest`, `tsx`), kể cả những thứ chưa dùng tới. Chi phí bằng không, tránh được một lớp conflict kéo dài cả dự án.

---

## 5. Ba contract

### `src/core/types.ts` — đóng băng ngày 1

Nội dung đầy đủ ở `src/core/types.ts`; `TECHNICAL_OVERVIEW.md` §3.3 tóm tắt contract. Bốn trường seam (`snapshot`, `workingTree`, `index`, `conflicts`) có mặt trong `RepoState` và luôn `null` ở v1. Kiểu `DetectConflicts` trả `null` ở v1.

Thêm trong file này:

```ts
type Command =
  | { kind: "commit"; message?: string }
  | { kind: "branch"; name?: string }
  | { kind: "switch"; target: string; detach: boolean; create: boolean }
  | { kind: "checkout"; target: string; create: boolean }
  | { kind: "merge"; branch: string };

interface ParseError {
  ok: false;
  output: string[];
  errorClass: ErrorClass;
}

interface Result {
  state: RepoState;      // state cũ nếu lỗi — engine không bao giờ throw
  output: string[];      // tiếng Anh
  ok: boolean;
  errorClass?: ErrorClass;
}
```

Engine **không throw**. Lỗi trả về qua `ok: false` + `output` + `errorClass`; parser trả `ParseError` khi cú pháp sai, không có `state`. Harness dùng `errorClass` làm hard gate và câu chữ `output` làm soft check.

### `src/verification/report.ts` — đóng băng ngày 1

Nội dung đầy đủ ở `src/verification/report.ts`; `TECHNICAL_OVERVIEW.md` §3.4 tóm tắt contract.

Đây là file gỡ chặn cho Dev 6 trong suốt tuần 1: có nó, Dev 6 dựng được tab trên `verification.json` giả mà không cần chờ harness của Dev 5.

### `src/progress/types.ts` — đóng băng ngày 1

`LevelRecord` gồm `levelId`, `completedAt` (ISO 8601) và `commandCount`. `ProgressSet = Record<string, LevelRecord>`, khóa trùng `levelId`. Tiến độ chỉ được lưu trong localStorage.

---

## 6. Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run",
    "diff:quick": "tsx harness/diff/run.ts --exhaustive 3 --random 5000",
    "diff:deep": "tsx harness/diff/run.ts --exhaustive 4 --workers 8",
    "bench": "tsx harness/bench/layout.ts",
    "report": "tsx harness/writeReport.ts"
  }
}
```

`diff:quick` chạy mỗi PR. `diff:deep` chạy nightly. `report` gộp kết quả và ghi `public/verification.json`.

---

## 7. Checklist ngày 1

Kết thúc buổi kickoff phải có trên `main`:

- [ ] `npm create vite` + TS + Tailwind, chạy được
- [ ] `src/core/types.ts` — Contract 1 đầy đủ
- [ ] `src/verification/report.ts` — Contract 2 đầy đủ
- [ ] `src/core/engine.ts` — stub: 5 lệnh trả về state hardcoded, đúng kiểu
- [ ] `src/app/App.tsx` — 4 tab rỗng: Terminal · Graph · Levels · Verification
- [ ] `public/verification.json` — dữ liệu giả đúng schema
- [ ] `.github/workflows/ci.yml` — typecheck + test, chạy xanh
- [ ] Toàn bộ dependency đã cài
- [ ] 6 thư mục đã tồn tại, mỗi thư mục có ít nhất 1 file

Mục quan trọng nhất là **stub engine**. Có nó, 5 người còn lại bắt đầu code từ ngày 2 thay vì chờ Dev 1 xong logic thật.

Khi checklist này xanh, ai cũng chạy được `npm run dev` và thấy app khởi động — đó là điều kiện để quy tắc "không demo được nghĩa là chưa xong" có hiệu lực từ buổi họp đầu tiên.

---

## 8. Những gì cố tình không có

| Không dùng | Lý do |
|---|---|
| Monorepo / workspaces | Một repo là đủ; thêm tầng là thêm chỗ hỏng |
| Redux / Zustand | `useReducer` bọc engine là đủ; engine đã là single source of truth |
| Thư mục `components/` dùng chung | Mời gọi trừu tượng hóa sớm; component thuộc về module của nó |
| Thư mục `utils/` | Trở thành bãi rác trong mọi dự án; hàm đặt cạnh nơi dùng |
| Barrel file `index.ts` mỗi thư mục | Che mất đồ thị phụ thuộc, dễ tạo vòng |
| Thư viện chart, `xterm.js`, D3 | Lý do chi tiết ở `TECHNICAL_OVERVIEW.md` §7 |

Bảng này không phải để trang trí. Câu "tại sao không dùng X" gần như chắc chắn xuất hiện trong Q&A, và luật random 1–2 người nghĩa là bất kỳ ai cũng có thể phải trả lời nó.
