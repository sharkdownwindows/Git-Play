 # GitScope — UI Polish Spec

> Design-only. Đây là tài liệu cho coding agent triển khai UI polish trên codebase React + Tailwind CSS v4 hiện có.
> Nguồn đã đọc: `src/app`, `src/terminal`, `src/viz`, `src/levels`, `src/commands-ref`, `src/verification`, `public/verification.json`.
> Mockup tham chiếu bố cục: `GitScope Mockups.dc.html` (turn 2). Mockup đang dùng palette tối cũ. **Bố cục, kích thước và hành vi vẫn áp dụng; màu sắc lấy theo file này.**

---

## 0. Tóm tắt

| | |
|---|---|
| Sản phẩm | Git simulator giáo dục cho sinh viên, gồm 4 tab: Practice, Levels, Reference, Verification |
| Ràng buộc | Chạy offline, demo 5–7 phút, không có account/server/sync/Tier 2, không đổi Git engine hay nội dung nghiệp vụ |
| Mục tiêu | Trông như một developer learning tool hoàn chỉnh. Terminal và graph là trọng tâm. Người mới hiểu ngay phải gõ ở đâu và graph thay đổi thế nào |
| Chất lượng | WCAG 2.2 AA, focus rõ, hỗ trợ reduced motion; responsive ở 1440×900, 1024×768, 390×844; không thêm thư viện UI |

---

## 1. UX audit hiện trạng

**P0** chặn mục tiêu demo/học hoặc vi phạm AA. **P1** làm giảm rõ chất lượng. **P2** là polish.

### P0

| # | Vấn đề | Bằng chứng | Hướng sửa |
|---|---|---|---|
| A1 | Output của engine không nằm dưới lệnh đã sinh ra nó. Lịch sử lệnh và output là hai log tách rời | `Terminal.tsx` render `session.entries` trước, sau đó render `output` trong một `role="log"` thứ hai | Gộp thành một log theo thời gian: mỗi entry gồm lệnh + output/lỗi của chính nó. Chỉ đổi UI state, không đổi engine |
| A2 | Không có focus hiển thị trên ô nhập lệnh, tab và level button | Input dùng `outline-none`; button không có `focus-visible` → vi phạm WCAG 2.4.7 | Focus ring toàn cục (mục 3.7); input có viền primary + halo |
| A3 | Người mới không biết gõ ở đâu và gõ gì. Terminal cao khoảng 133px, chỉ có `$` | Ảnh chụp Practice/Levels; label chỉ chứa `$` | Input cố định ở đáy panel, cao 42px, có placeholder; dưới input liệt kê lệnh khả dụng; log trống thì hiện hướng dẫn |
| A4 | Hoàn thành level gần như không có phản hồi | `LevelList.tsx` chỉ có chữ "Completed" màu xanh; `LevelPanel.tsx` không đọc trạng thái hoàn thành | Banner thành công `role="status"`, nút "Next level", chip "Matches target" |
| A5 | Verification render cùng lúc 19.806 divergence, số liệu hiển thị thô | JSON khoảng 418k dòng; `durationMs: 1121581.631335`; số warning (19.806) lớn hơn tổng case (6.160) mà không giải thích | Đặt kết luận ở đầu trang, thêm định nghĩa Hard/Soft, phân trang 50 mục, lọc theo severity, format số. Ghi rõ warning được đếm theo từng bước (`harness/diff/run.ts`) |

### P1

| # | Vấn đề | Bằng chứng | Hướng sửa |
|---|---|---|---|
| B1 | Workspace bị bó trong `max-w-5xl` (1024px): ở màn 1440 mỗi panel chỉ khoảng 476×133 | `App.tsx` | Practice/Levels/Reference full-bleed, cao bằng `100dvh − header` |
| B2 | ID commit dài (`mainTip`, `featureTip`) tràn khỏi vòng tròn r=14 | `levels/state.ts` giữ nguyên id; `GraphView.tsx` dùng fontSize 10 | Node r=16; id ≤4 ký tự hiện đủ, dài hơn thì hiện 3 ký tự + "…"; id đầy đủ đặt trong `<title>` |
| B3 | Ref label xếp chồng dưới node, đè lên commit con khi có ≥2 ref | Label bước 20px trên lưới 80px | Đặt chip bên phải node; HEAD ghép với chip branch; nhân tọa độ x ×2 khi render |
| B4 | Store đã có undo/redo/reset nhưng không có UI | `store.ts` | Toolbar của graph: Undo · Redo · Reset; Levels có "Reset level" |
| B5 | Level thiếu ngữ cảnh: `commandCount` bị ẩn, `level.target` không xem được, lệnh cho phép chỉ là chữ 12px | `LevelPanel.tsx`, `levelStore.ts` | Level brief + segmented control Current/Target |
| B6 | Tablist thiếu điều hướng bằng phím mũi tên, thiếu `aria-controls`/`aria-labelledby` | `App.tsx` | Dùng roving tabindex theo pattern tablist của APG |
| B7 | Trang Reference mở ra là 5 accordion đóng, trông trống | `CommandRefPanel.tsx` | Dùng master–detail ở ≥768px |
| B8 | Input bị khóa 300ms mà không có tín hiệu nào | `Practice.tsx` `inputLocked` | Thêm trạng thái loading cho input |

### P2

| # | Vấn đề | Hướng sửa |
|---|---|---|
| C1 | Mọi heading đều `text-lg`, không có phân cấp | Dùng thang chữ ở mục 3.3 |
| C2 | Ref label nền đặc trông như badge cảnh báo | Chip nền nhạt, chữ đậm màu (mục 4.6) |
| C3 | Graph không có legend; HEAD không thể hiện trên chính node; edge thẳng cắt chéo nhau | Node HEAD tô đặc, edge khác lane dùng cubic curve, thêm legend |
| C4 | Bảng scaling không căn phải số; timestamp ISO và SHA 40 ký tự hiển thị thô | `tabular-nums`, format ngày UTC, SHA 7 ký tự + nút Copy |
| C5 | Trên mobile, terminal xếp phía trên graph nên graph bị đẩy khỏi màn hình | Mobile: graph ở trên, terminal ở dưới, input dính đáy |

---

## 2. Visual direction — "Lab notebook"

**Nền sáng, yên tĩnh; hai "thiết bị" terminal và graph là tâm điểm.**

1. **Chrome sáng, lùi về sau.** Nền `--color-background` trắng; sidebar, brief và toolbar dùng `--color-surface`. Navigation chỉ gồm chữ và underline, không dùng nền khối.
2. **Terminal là khối tối duy nhất trên trang.** Terminal dùng nền navy sâu, suy ra từ `--color-primary-dark`. Trên nền sáng, đây là điểm tương phản mạnh nhất, nên mắt người mới tự tìm tới chỗ gõ lệnh. Người học cũng đã quen terminal tối.
3. **Graph là mặt phẳng làm việc.** Nền trắng có dot-grid mờ, commit màu primary. Đây là vùng giàu màu nhất ngoài terminal.
4. **Primary (navy `#273896`) đại diện cho "bạn đang ở đây" và mọi thứ tương tác được:** tab active, focus, nút primary, commit, HEAD.
5. **Accent (đỏ `#ed1c24`) đại diện cho "cần chú ý", dùng rất tiết kiệm:** lỗi, detached HEAD, hard divergence, hành động phá hủy. Ngoài ra chỉ có một điểm thương hiệu là chấm đỏ trong wordmark. Đỏ không bao giờ dùng để trang trí.
6. **Monospace mang dữ liệu, sans mang giải thích.** Lệnh, id, branch và số liệu luôn dùng mono.
7. **Không trang trí:** không gradient, không card lồng card, không icon minh họa, không shadow cho panel.

**Thứ bậc thị giác:** ① input lệnh → ② commit mới và HEAD trên graph → ③ log terminal, level goal → ④ toolbar, legend, nav.

---

## 3. Design tokens

### 3.1 Màu — bộ token gốc (bắt buộc, không đổi giá trị)

```css
:root {
  --color-primary: #273896;
  --color-primary-dark: #1d2b78;
  --color-primary-light: #e9ecf8;

  --color-accent: #ed1c24;
  --color-accent-dark: #c9151c;
  --color-accent-light: #fde8e9;

  --color-background: #ffffff;
  --color-surface: #f7f8fc;
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
}
```

### 3.2 Màu — token mở rộng (suy ra từ bộ gốc; cần cho ngữ nghĩa Git và cho AA)

Bộ gốc không có màu cho branch, thành công hay cảnh báo, và không có viền đủ tương phản cho input. Các token dưới đây bổ sung những chỗ còn thiếu đó.

```css
:root {
  /* Viền cho control (WCAG 1.4.11 ≥ 3:1). --color-border chỉ dùng cho divider */
  --color-border-strong: #858c99;      /* 3.4:1 trên trắng */
  --color-surface-hover: #eef0f7;      /* hover cho item/nút ghost */

  /* Semantic */
  --color-success: #15803d;            /* 5.0:1 trên trắng — branch, pass */
  --color-success-light: #e7f5ec;
  --color-success-border: #a7d8b8;
  --color-warning: #b45309;            /* 5.0:1 trên trắng — soft warning, gotcha */
  --color-warning-light: #fdf3e2;
  --color-warning-border: #f1cf97;
  --color-danger: var(--color-accent-dark);        /* chữ lỗi: 5.8:1 */
  --color-danger-light: var(--color-accent-light);
  --color-focus: var(--color-primary);

  /* Terminal (khối tối duy nhất) */
  --color-terminal-bg: #141a3f;        /* từ primary-dark, đậm hơn */
  --color-terminal-dock: #1a2150;      /* vùng input */
  --color-terminal-line: #2a3268;      /* viền/divider trong terminal */
  --color-terminal-text: #f1f3fb;      /* 16:1 */
  --color-terminal-muted: #a9b1d6;     /* output — 8.0:1 */
  --color-terminal-prompt: #8fa0ff;    /* ký tự $ — 6.6:1 */
  --color-terminal-error: #ff8a8f;     /* lỗi — 7.5:1 */
  --color-terminal-latest: #1f2757;    /* nền entry mới nhất */

  /* Graph */
  --color-graph-bg: var(--color-background);
  --color-graph-dot: var(--color-border);
  --color-edge: #9aa1b5;
  --color-edge-changed: var(--color-primary);
  --color-node: var(--color-primary);
}
```

**Ánh xạ ngữ nghĩa (giữ ổn định trên cả 4 tab):**

| Ý nghĩa | Token | Dùng ở |
|---|---|---|
| Tương tác / "bạn đang ở đây" | `primary` | Tab active, focus, nút primary, commit, **HEAD** |
| Branch / thành công | `success` | Chip branch, level hoàn thành, case pass |
| Cảnh báo mềm | `warning` | Soft divergence, callout Gotcha |
| Cần chú ý / lỗi | `accent` / `accent-dark` | Lỗi lệnh, **detached HEAD**, hard divergence, nút phá hủy |

> Hiện tại HEAD màu hổ phách (`RefLabel.tsx`). Theo spec này HEAD chuyển sang primary để thống nhất ý "vị trí hiện tại". Detached vẫn màu đỏ như code hiện có.

**Quy tắc tương phản (bắt buộc):**

| Kết hợp | Tỉ lệ | Quy định |
|---|---|---|
| `text` trên `background` | 14.7:1 | ✓ |
| `text-muted` trên `background` | 4.8:1 | ✓ chữ thường |
| `text-muted` trên `surface` | 4.6:1 | ✓ chữ thường (sát ngưỡng, không làm nhạt thêm) |
| `text-muted` trên `primary-light` | 4.1:1 | ✗ **cấm**. Dùng `text` hoặc `primary-dark` |
| `primary` trên `background` | 10.1:1 | ✓ |
| trắng trên `primary` | 10.1:1 | ✓ |
| `accent` (#ed1c24) trên trắng | 4.4:1 | ✗ cho chữ < 18.66px bold / 24px. **Chỉ dùng cho icon, viền, chấm, chữ lớn** |
| trắng trên `accent` | 4.4:1 | ✗ cho chữ thường. **Nút đỏ dùng nền `accent-dark`** (5.8:1) |
| `accent-dark` trên `accent-light` | 5.0:1 | ✓ chip/callout lỗi |
| `border` (#e5e7eb) trên trắng | 1.2:1 | Chỉ dùng cho divider/trang trí, **không** làm viền duy nhất của control |

### 3.3 Typography

```css
:root {
  --font-sans: system-ui, "Segoe UI", "Noto Sans", Ubuntu, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
}
```
Không tải webfont, để giữ chạy offline và nhanh.

| Token | Size / line-height | Weight | Dùng |
|---|---|---|---|
| `display` | 28 / 34 | 600 | Headline Verification |
| `title` | 20 / 28 | 600 | Tên level, tên lệnh Reference (mono 26/32) |
| `heading` | 17 / 24 | 600 | Section |
| `body-lg` | 15 / 22 | 400 | Goal, mô tả |
| `body` | 14 / 21 | 400 | Mặc định |
| `small` | 13 / 18 | 400–500 | Nav, meta, nút |
| `eyebrow` | 12 / 16, `letter-spacing: .06em`, uppercase | 600 | Nhãn panel |
| `mono-term` | 13 / 20 | 400 | Log terminal |
| `mono-input` | 14 / 20 (16 trên mobile, tránh iOS zoom) | 400 | Input lệnh |
| `mono-graph` | 11 / 1 | 600 | Id commit, chip ref |

- Số liệu dùng `font-variant-numeric: tabular-nums`.
- Không có chữ nào dưới 11px; chữ UI tối thiểu 12px.
- Đoạn văn dùng `text-wrap: pretty`, goal giới hạn `max-width: 68ch`.

### 3.4 Spacing (4px base)

```css
:root {
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
}
```
Gutter của workspace: 16px (≥1280), 12px (768–1279), 0 (<768, panel chạm mép).

### 3.5 Radius

```css
:root { --radius-sm: 4px; --radius-md: 6px; --radius-lg: 10px; --radius-full: 999px; }
```
- `sm`: chip, kbd
- `md`: button, input, list item, segmented
- `lg`: panel, card, figure

### 3.6 Border

- Mọi viền mặc định dày 1px.
- `--color-border` dùng cho divider giữa các vùng và viền panel/card (panel còn được nhận diện nhờ nền khác nhau).
- `--color-border-strong` dùng cho viền của input, segmented control và nút secondary.
- Độ dày 2px chỉ dành cho: underline của tab active, inset trái của item active (`box-shadow: inset 2px 0 0 var(--color-primary)`), edge graph và stroke node.

### 3.7 Focus

```css
:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.terminal :focus-visible { outline-color: var(--color-terminal-prompt); }
```
Input terminal khi focus: `border-color: var(--color-terminal-prompt); box-shadow: 0 0 0 3px rgb(143 160 255 / .28)`.

### 3.8 Elevation

| Level | Định nghĩa | Dùng |
|---|---|---|
| e0 | Phẳng, nền `background` | Trang, graph canvas |
| e1 | Nền `surface` + viền `border` | Panel, brief, card, sidebar |
| e2 | Nền `background` + viền `border-strong` + `0 8px 24px rgb(31 41 55 / .12)` | Chỉ popover (level picker) và tooltip của node |

Panel không dùng shadow.

### 3.9 Motion

```css
:root {
  --dur-fast: 120ms;    /* hover, đổi màu */
  --dur-base: 200ms;    /* banner, segmented */
  --dur-graph: 300ms;   /* = GRAPH_ANIMATION_MS, KHÔNG đổi */
  --ease-out: cubic-bezier(.2, .8, .2, 1);
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0ms !important; animation-duration: 0ms !important; }
}
```
- Commit mới có vòng halo r=23 (`primary`, opacity .3) mờ dần trong 1.2s.
- Khi reduced motion bật: halo hiện tĩnh 2s rồi biến mất; node không trượt.
- Không có thông tin nào chỉ được truyền đạt bằng chuyển động.

### 3.10 Tailwind v4 wiring (`src/app/layout.css`)

```css
@import "tailwindcss";
/* :root { ...3.1 + 3.2 + 3.4–3.9... } */
@theme inline {
  --color-primary: var(--color-primary);
  --color-primary-dark: var(--color-primary-dark);
  --color-primary-light: var(--color-primary-light);
  --color-accent: var(--color-accent);
  --color-accent-dark: var(--color-accent-dark);
  --color-accent-light: var(--color-accent-light);
  --color-bg: var(--color-background);
  --color-surface: var(--color-surface);
  --color-surface-hover: var(--color-surface-hover);
  --color-fg: var(--color-text);
  --color-fg-muted: var(--color-text-muted);
  --color-line: var(--color-border);
  --color-line-strong: var(--color-border-strong);
  --color-success: var(--color-success);   --color-success-light: var(--color-success-light);
  --color-warning: var(--color-warning);   --color-warning-light: var(--color-warning-light);
  --color-term: var(--color-terminal-bg);  --color-term-dock: var(--color-terminal-dock);
  --color-term-line: var(--color-terminal-line);
  --color-term-fg: var(--color-terminal-text); --color-term-muted: var(--color-terminal-muted);
  --color-term-prompt: var(--color-terminal-prompt); --color-term-error: var(--color-terminal-error);
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --radius-sm: var(--radius-sm); --radius-md: var(--radius-md); --radius-lg: var(--radius-lg);
}
```
Sau khi wiring xong, component chỉ dùng các utility như `bg-surface`, `text-fg-muted`, `border-line-strong`, `bg-term`… Không còn `neutral-*`, `sky-*` hay hex rải rác trong TSX. Riêng hex trong SVG (`GraphView`, `RefLabel`, `ScalingChart`) đổi sang `fill="var(--color-…)"`.

---

## 4. Component inventory & states

Ký hiệu: — = không áp dụng.

### 4.1 AppHeader + AppTab

- Header cao 48px, nền `background`, `border-bottom: 1px solid var(--color-border)`.
- Wordmark "GitScope" dùng 15/600 `text`, kèm một chấm tròn 6px `accent` (điểm thương hiệu duy nhất).
- Tab cao 48px, padding-x 12. Tab Levels có thêm `n/8` mono 11 `text-muted`.

| State | Style |
|---|---|
| default | `text-muted` |
| hover | `text`, nền `surface-hover` |
| focus | outline 2px `primary`, offset −4px |
| selected | `primary-dark` 600, `border-bottom: 2px solid var(--color-primary)`, `aria-selected="true"` |
| disabled / success / empty / error / loading | — |

### 4.2 Button

| Variant | default | hover | focus | disabled | loading | success |
|---|---|---|---|---|---|---|
| **Primary** | nền `primary`, chữ trắng 600 | nền `primary-dark` | ring 2px `primary`, offset 2 | nền `border`, chữ `text-muted` | label "…ing", `aria-busy` | — |
| **Secondary** | nền `background`, viền `border-strong`, chữ `text` 500 | nền `surface-hover` | ring | viền `border`, chữ `text-muted`, `disabled` | label "…ing" | "✓ Copied" chữ `success`, viền `success-border`, trong 1.5s |
| **Danger** (Reset trong menu mobile) | nền `accent-dark`, chữ trắng | nền `#a91118` | ring `accent-dark` | như secondary disabled | — | — |
| **Ghost** (toolbar graph) | trong suốt, chữ `text` | nền `surface-hover` | ring | chữ `text-muted` | — | — |

- Cao 32px (desktop), 36px cho primary, 44px ở <768.
- Mỗi màn có tối đa 1 nút primary.

### 4.3 SegmentedControl (Current/Target · Chart/Table · All/Hard/Soft)

- Container: viền `border-strong`, `radius-md`, padding 2, `role="tablist"` hoặc `radiogroup`.

| State | Style |
|---|---|
| default | chữ `text-muted` |
| hover | chữ `text` |
| focus | ring |
| selected | nền `primary-light`, chữ `primary-dark` 600 |
| disabled | Không dùng; option có count 0 vẫn chọn được |

### 4.4 TerminalInput (trong khối tối)

| State | Style |
|---|---|
| default | nền `terminal-bg`, viền `terminal-line`, `$` màu `terminal-prompt`, placeholder `terminal-muted` |
| hover | viền `#3a448a` |
| focus | viền `terminal-prompt` + halo 3px |
| loading (`inputLocked` ≤300ms) | viền dashed; giữ focus và nội dung; Enter bị bỏ qua; SR đọc "Updating graph…" |
| error (vừa có lỗi) | viền `terminal-error` cho đến khi gõ tiếp; nội dung lỗi nằm trong log |
| disabled | Tùy chọn, sau khi hoàn thành level (mặc định **không** bật) |
| empty | placeholder `git commit -m "first"` |

### 4.5 TerminalLog / Entry

| State | Style |
|---|---|
| default | lệnh: `$` `terminal-prompt` + chữ `terminal-text`; output: `terminal-muted`, thụt 14px |
| selected (latest) | nền `terminal-latest`, full-bleed |
| success | output thường |
| error | chữ `terminal-error` + ✕ `aria-hidden`; áp dụng cho lỗi parse, lỗi engine và "not available in this level" |
| empty | sans 13, chữ `terminal-muted`: "Type a Git command below and press Enter. Try `git commit -m "first"`." |

Log dùng `role="log"` + `aria-live="polite"`, tự cuộn xuống đáy trừ khi người dùng đã cuộn lên quá 40px.

### 4.6 CommitNode & RefChip (SVG)

**CommitNode** (r=16)

| State | Style |
|---|---|
| default | fill `background`, stroke 2px `primary`, id mono 11 `text` |
| hover | fill `primary-light`, kèm tooltip e2 (id đầy đủ, message, parents) |
| focus | vòng ngoài r=21 stroke `primary`, kèm tooltip |
| selected (HEAD) | fill `primary`, id chữ trắng 700 |
| new | halo r=23 (mục 3.9) |
| target-only (view Target) | stroke dashed `4 3` |
| detached HEAD | fill `accent-light`, stroke `accent-dark` |

Node có `tabindex="0"` và `aria-label="commit c4, parents c2 c3, branches main, HEAD"`.

**RefChip** (cao 20, `radius-sm`, mono 11/600)

| Kind | Style |
|---|---|
| branch | nền `success-light`, viền `success-border`, chữ `success` |
| HEAD attached | chip ghép: `[HEAD]` nền `primary` chữ trắng + `[main]` branch chip, hai phần sát nhau |
| HEAD detached | nền `accent-light`, viền `accent`, chữ `accent-dark`: "HEAD · detached" |
| unborn (empty) | viền dashed `border-strong`, chữ `primary-dark`: "HEAD → main (unborn)" |

Chip đặt bên phải node (x+30); nhiều branch trên cùng node xếp dọc, bước 24px.

### 4.7 GraphPanel

- Header 40px: eyebrow "COMMIT GRAPH", meta "n commits · m branches", chip HEAD "HEAD → main @ c4", toolbar.
- Canvas: nền `graph-bg`, dot-grid `radial-gradient(var(--color-graph-dot) 1px, transparent 1px) 0 0/20px 20px`.
- Footer legend 36px.

| State | Style |
|---|---|
| default | Graph căn giữa, scale-to-fit (1×–1.6×); lớn hơn thì cuộn trong panel |
| empty | Vòng tròn dashed 32px + "No commits yet" + chip unborn |
| loading | Node đang animate 300ms |
| success (Levels) | chip "✓ Matches target" (`success-light`/`success`) ở header |
| selected | View Target: nhãn "Target state — what your graph should look like" góc trên trái |

### 4.8 LevelListItem

| State | Style |
|---|---|
| default (not started) | vòng dashed `border-strong` 20px, số mono `text-muted`, tên `text` |
| hover | nền `surface-hover` |
| focus | ring inset |
| selected | nền `primary-light`, inset trái 2px `primary`, chữ `primary-dark` 600, vòng đặc viền `primary`, `aria-current="step"` |
| success (completed) | vòng `success-light` + ✓ `success` |
| loading (progress chưa load) | Không hiện icon trạng thái |

Không có trạng thái "locked" (không thêm cơ chế khóa level). aria-label có dạng: "Level 06, Fast-forward merge, completed".

### 4.9 LevelBrief

- In progress: nền `surface`, viền `border`. Eyebrow `primary` "LEVEL 07 · IN PROGRESS", title, goal, chip lệnh cho phép (mono, nền `background`, viền `border-strong`), "Commands used n", nút secondary "Reset level".
- Success: nền `success-light`, viền `success-border`, vòng ✓ `success` 32px, "Level complete · n commands" + mô tả, nút primary "Next: 0X Title →" (ẩn ở level 8). Dùng `role="status"`; focus chuyển vào nút Next.

### 4.10 CommandRefItem (Reference rail)

| State | Style |
|---|---|
| default | mono 14/600 `text` + description 12 `text-muted` |
| hover | nền `surface-hover` |
| focus | ring |
| selected | như LevelListItem selected |
| error | Giữ nguyên "Example unavailable." khi `referenceAfter` trả về null |

### 4.11 Callout

- **Gotcha / warning:** nền `warning-light`, viền `warning-border`, chấm ! `warning`, chữ `text`.
- **Error:** nền `accent-light`, viền `accent`, tiêu đề `accent-dark`.
- **Info:** nền `primary-light`, viền `primary`, chữ `primary-dark`.
- Không dùng viền trái dày.

### 4.12 StatCard (Verification)

| State | Style |
|---|---|
| neutral | nền `surface`, viền `border` |
| success | nền `success-light`, viền `success-border`, số `success` |
| warning | nền `warning-light`, số `warning` |
| error (failed > 0) | nền `accent-light`, viền `accent`, số `accent-dark` |
| loading | Skeleton tĩnh, khối `border` |
| empty | "—" |

Số hiển thị mono 28/600 `tabular-nums`.

### 4.13 DivergenceRow

| State | Style |
|---|---|
| default | Grid gồm id, severity chip, commands, "Real git", "GitScope"; token khác nhau được highlight bằng nền `warning-light` |
| hover | nền `surface` |
| focus | ring trên "Show full" |
| selected (expanded) | Hiện toàn văn |
| empty | "No divergences recorded." + chip ✓ |
| error (hard) | chip `accent-light`/`accent-dark` "hard · state" |
| loading | Nút "Show 50 more" có `aria-busy` |

### 4.14 Verification page states

- **Loading:** skeleton tĩnh + `role="status"` "Loading verification report…".
- **Error:** callout error "Report unavailable" + message nguyên văn từ `loadVerificationReport()` + nút Retry.
- **Evidence incomplete:** callout warning ngay dưới headline.

---

## 5. Layout spec

### 5.1 App shell
- `body`: `min-height: 100dvh`, grid rows `48px 1fr`.
- Practice/Levels/Reference: main `overflow: hidden`, các panel tự cuộn.
- Verification: cuộn cả trang, nội dung `max-width: 1160px` căn giữa, padding 36/32.
- Phần tử focus đầu tiên là skip link "Skip to terminal".

### 5.2 Practice
- Grid `minmax(0,5fr) minmax(0,7fr)`, gap 16, padding 16, cao `100dvh − 48px`.
- **Terminal (trái, khối tối, `radius-lg`):** header 40 (eyebrow "TERMINAL" `terminal-muted`, kbd ↑↓ history) · log `flex:1` cuộn · dock (nền `terminal-dock`, padding 12/14) chứa input 42px + dòng "commit · branch · switch · checkout · merge".
- **Graph (phải, e1):** header 40 · canvas · legend 36 (commit, HEAD commit, branch, HEAD attached, HEAD detached, "Root on top · newer commits below").
- Thứ tự đọc: gõ → xem.

### 5.3 Levels
- ≥1280: grid `272px 1fr`.
  - Rail (nền `surface`, `border-right`): eyebrow "LEVELS" + "x of 8 complete" + progress bar 4px (`success` trên `border`) + list.
  - Main (padding 16, gap 16): LevelBrief → workspace `minmax(0,5fr) minmax(0,6fr)` gồm terminal | graph. Header graph có segmented Current/Target.
- Target render `repoFromShape(level.target)` qua cùng `GraphView`. Node chưa có ở Current vẽ dashed; edge merge được ghi nhãn "1st parent / 2nd parent".

### 5.4 Reference
- Grid `300px 1fr`. Rail nền `surface` gồm 5 lệnh; mặc định chọn `commit`.
- Detail (padding 28/32, gap 20):
  - Tên lệnh mono 26 + description.
  - Khối syntax: dùng khối terminal tối thu nhỏ, cao 44, kèm nút Copy.
  - Grid 2 cột: card "What changes" (e1) + callout Gotcha.
  - Before → After: hai figure bằng nhau, có mũi tên ở giữa. Figure After tô `edge-changed` cho node/edge mới.

### 5.5 Verification
Thứ tự nội dung đi theo câu hỏi của giám khảo:
1. **Kết luận:** eyebrow "VERIFICATION REPORT" + headline tự sinh: `failed === 0` → "The engine matched real Git on all N test cases."; nếu không → "The engine diverged from real Git in F of N cases."
2. **Nguồn gốc:** "Generated 30 Sep 2026, 08:07 UTC · Commit `4448efb` [Copy full SHA] · Compared against git 2.43.0 · Node v24.21.0".
3. **4 StatCard:** Cases passed (success) · Hard divergences (success nếu 0, error nếu >0) · Soft output warnings (warning, "counted per step") · Run "18m 42s" (neutral, "Depth 3 exhaustive + 5,000 random · seed 42").
4. **Định nghĩa**, 3 cột: Differential test / Hard divergence / Soft warning.
5. **Command coverage:** bar ngang, mẫu số = `totalCases`, fill `primary` trên `primary-light`.
6. **Performance at scale:** 3 small multiples có toggle Chart/Table, ghi chú "Log–log · solid = median · dashed = p95". Median dùng `primary`, p95 dùng `warning` dashed. Series chỉ có 1 điểm hiện dạng số lớn.
7. **Divergences:** segmented All/Hard/Soft kèm count; bảng 5 cột; text dài hơn 2 dòng thu gọn thành "+n more lines"; hiện 50 dòng, có nút "Show 50 more".

---

## 6. Responsive behavior

| Khu vực | ≥1280 (1440×900) | 768–1279 (1024×768) | <768 (390×844) |
|---|---|---|---|
| Shell | Header 48, tab inline | Tab padding 10 | Hàng 1: wordmark 44px. Hàng 2: 4 tab chia đều 44px; "Verification" rút thành "Verify" (aria-label giữ tên đầy đủ) |
| Practice | Terminal 5fr \| Graph 7fr | 1fr \| 1fr, gap 12; legend còn 3 mục | Graph ở trên cao 300px (min 36vh), terminal ở dưới `flex:1`; input dính đáy, cao 48, font 16, có nút Run; Reset chuyển vào menu "…"; legend ẩn |
| Levels | Rail 272 + brief + 2 cột | Rail thành picker "06 / 08 Title ▾" (popover e2, listbox) + 8 vạch tiến độ; workspace 1fr \| 1fr | Picker full-width 44 + nút Reset 44; progress bar; goal; chip allowed + Commands; graph 230; terminal `flex:1`; banner hoàn thành thay brief; nút Next full-width |
| Reference | Rail 300 + detail; Before/After nằm ngang | Rail 240; Before/After xếp dọc khi detail < 720px (container query) | Accordion (mở 1 mục, mục đầu mở sẵn); Before/After xếp dọc, mũi tên ↓ |
| Verification | Stat 4 cột, định nghĩa 3, perf 3, bảng 5 cột | Stat 4, perf 3; Real/GitScope gộp 1 cột 2 dòng | Stat 2×2; định nghĩa thành disclosure; perf xếp dọc; divergence thành card |

- Không có chiều cao cố định cho khối chứa text.
- Graph dùng `viewBox` + scale-to-fit và không thu nhỏ dưới 1×, để chữ 11px vẫn đọc được.

---

## 7. Wireframe (ASCII, tham chiếu nhanh)

**Practice 1440**
```
┌ GitScope• │ Practice̲  Levels 6/8  Reference  Verification ─────────────────────────┐
├──────────────────────────────┬────────────────────────────────────────────────────┤
│▓ TERMINAL         ↑↓ history▓│ COMMIT GRAPH  4 commits·2 branches [HEAD→main@c4] │
│▓ $ git commit -m "first"    ▓│                            Undo Redo Reset         │
│▓   [main (root-commit) c1]  ▓│        (c1)                                        │
│▓ $ git switch -c feature    ▓│         │ ╲                                        │
│▓   Switched to a new branch ▓│        (c2)   (c3) [feature]                       │
│▓ $ git merge feature        ▓│         │   ╱                                      │
│▓   Merge made by 'ort'      ▓│        (●c4) [HEAD|main]                           │
│▓┌─────────────────────────┐ ▓│                                                    │
│▓│ $ git █          Enter ↵│ ▓│ ○ commit ● HEAD [main] branch [HEAD] [detached]    │
│▓└─────────────────────────┘ ▓│                                                    │
└──────────────────────────────┴────────────────────────────────────────────────────┘
```

**Levels 390**
```
┌ GitScope•                ┐
│Practice Levels̲ Ref Verify│
├──────────────────────────┤
│[07/08 Merge two… ▾][Reset]│
│▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░        │
│Merge feature into main…  │
│Allowed [git merge]  Cmd 1│
├──────────────────────────┤
│GRAPH   [Current|Target]  │
│  (root)                  │
│  (●mai…)[HEAD|main] (fea…)│
├──────────────────────────┤
│▓ $ git commit -m "x"     ▓│
│▓   ✕ commit is not avail.▓│
│▓┌──────────────────[Run]┐▓│
└──────────────────────────┘
```
Mockup độ trung thực cao: `GitScope Mockups.dc.html` #2a–#2h.

---

## 8. Acceptance criteria

Kiểm ở 1440×900, 1024×768 và 390×844.

### Global
- **G1** Tokens ở mục 3.1–3.9 được khai báo trong `:root` và wiring qua `@theme inline`. Không còn `neutral-*`, `sky-*`, `green-*`, `amber-*`, `red-*` hay hex rải rác trong TSX/SVG.
- **G2** Giá trị của 11 token gốc (mục 3.1) giữ chính xác như đã cho.
- **G3** Mọi phần tử tương tác có focus-visible ring 2px, nhìn thấy được trên cả nền sáng lẫn khối terminal.
- **G4** axe-core báo 0 vi phạm contrast AA trên 4 tab, ở các trạng thái: mặc định, level hoàn thành, lỗi lệnh, Verification error.
- **G5** Không có chữ < 18.66px bold / 24px nào dùng `--color-accent` (#ed1c24) làm màu chữ trên nền sáng. Không có chữ trắng nào nằm trên nền `--color-accent`.
- **G6** Không có chữ `text-muted` nào nằm trên nền `primary-light`.
- **G7** Khi `prefers-reduced-motion: reduce`: không transform/animation nào chạy, state vẫn cập nhật đúng.
- **G8** Không thêm dependency vào `package.json`; không có request mạng nào ngoài `/verification.json`.
- **G9** Không có scroll ngang ở 390px; hit target ≥ 44×44 ở <768px.

### App shell
- **S1** Header 48px full-bleed. Tab active có underline 2px `primary` và `aria-selected="true"`.
- **S2** Tablist: ←/→ chuyển focus, Home/End nhảy đầu/cuối, Enter/Space kích hoạt. Có `aria-controls` / `aria-labelledby`.
- **S3** Tab Levels hiển thị `n/8` lấy từ progress store.
- **S4** Skip link đưa focus vào terminal input.
- **S5** Practice/Levels/Reference lấp đầy `100dvh − 48px` và không cuộn trang ở 1440×900 và 1024×768.

### Terminal
- **T1** Output/lỗi của lệnh N nằm ngay dưới lệnh N trong DOM. Test: chạy 3 lệnh liên tiếp rồi kiểm thứ tự.
- **T2** Output dùng `terminal-muted`; lỗi (parse, engine, "not available in this level") dùng `terminal-error` + ✕ `aria-hidden`.
- **T3** Entry mới nhất có nền `terminal-latest`. Log tự cuộn xuống đáy trừ khi người dùng đã cuộn lên quá 40px.
- **T4** Input cố định ở đáy panel, cao 42px (48px ở mobile), có placeholder và trạng thái focus như mục 4.4.
- **T5** Khi `inputLocked`: input giữ focus và nội dung, viền dashed, Enter bị bỏ qua, SR đọc "Updating graph…". Lock hết sau đúng `GRAPH_ANIMATION_MS`.
- **T6** Log trống thì hiện hướng dẫn. Dưới input liệt kê lệnh khả dụng (Practice: 5 lệnh; Levels: `level.allowed`).
- **T7** ↑/↓ duyệt lịch sử như hiện tại, logic `session.ts` không đổi.
- **T8** Trên mobile có nút Run, tương đương Enter.

### Graph
- **V1** `layout()` không đổi. GraphView nhân x ×2 khi render, y giữ nguyên. Test layout/bench hiện có vẫn pass.
- **V2** Node r=16; id ≤4 ký tự hiện đủ, dài hơn hiện 3 ký tự + "…"; id đầy đủ nằm trong `<title>`.
- **V3** Node HEAD tô đặc `primary`. Commit vừa tạo có halo (tĩnh nếu reduced motion).
- **V4** Chip branch màu `success`. HEAD attached là chip ghép `[HEAD]` primary + `[branch]`. Detached là chip "HEAD · detached" `accent-light`/`accent-dark`. Trong 8 level và 5 ví dụ Reference không có chip nào đè lên node khác.
- **V5** Edge cùng lane là đường thẳng, khác lane là cubic curve, màu `--color-edge`.
- **V6** Header graph hiển thị "n commits · m branches" và chip HEAD.
- **V7** Undo/Redo/Reset dispatch các action có sẵn; Undo/Redo disabled khi stack rỗng.
- **V8** Trạng thái empty như mục 4.7.
- **V9** Node focusable bằng Tab; aria-label nêu id, parents và refs.

### Levels
- **L1** Rail có progress "x of 8 complete" + bar. Item có icon trạng thái kèm aria-label.
- **L2** Brief có: order 2 chữ số, title, goal 15px, chip lệnh cho phép `git <cmd>`, "Commands used" = `commandCount`.
- **L3** "Reset level" dispatch `select` với cùng id: khôi phục `level.initial` và xóa log.
- **L4** Current/Target: Target render `repoFromShape(level.target)`. Gõ lệnh khi đang ở Target thì tự chuyển về Current.
- **L5** Khi `latestCompletion` ≠ null: brief chuyển sang success, `role="status"` đọc "Level complete in n commands", graph hiện chip "Matches target", focus chuyển vào "Next" (không có ở level 8).
- **L6** Ở 768–1279, picker popover là listbox: điều hướng bằng phím mũi tên, Esc đóng, focus trả về nút mở.
- **L7** Sau khi hoàn thành, input vẫn nhận lệnh như hiện tại; reducer không đổi.

### Reference
- **R1** Ở ≥768 dùng master–detail, mặc định chọn `commit`. Ở <768 dùng accordion, mục đầu mở sẵn.
- **R2** Hiển thị đủ syntax/description/effect/gotcha/Before/After từ `data.ts`. Copy ghi syntax vào clipboard và hiện "Copied" 1.5s.
- **R3** Figure After tô `edge-changed` cho phần mới; merge có nhãn "1st"/"2nd parent".

### Verification
- **X1** Headline tự sinh theo `failed`. 4 StatCard đúng như mục 5.5. Số có dấu phẩy nghìn và `tabular-nums`.
- **X2** Duration hiển thị `18m 42s`; ngày "30 Sep 2026, 08:07 UTC"; SHA 7 ký tự + Copy full SHA.
- **X3** Có khối định nghĩa Differential / Hard / Soft.
- **X4** Divergences: lọc All/Hard/Soft kèm count; tối đa 50 dòng + "Show 50 more"; hard luôn đứng trước soft.
- **X5** Expected/Actual đặt cạnh nhau, nhãn "Real git" / "GitScope"; nội dung dài hơn 2 dòng thu gọn.
- **X6** Scaling có toggle Chart/Table; bảng căn phải số; giữ `<title>`/`<desc>` của SVG.
- **X7** Loading là skeleton tĩnh; Error hiện message nguyên văn + nút Retry.
- **X8** Nội dung đầu tiên hiển thị trong < 1s sau khi JSON tải xong; không render 19.806 dòng cùng lúc.

---

## 9. Không thay đổi (chống scope creep)

**Giữ nguyên code và dữ liệu**
- `src/core/**`: engine, commands, errors, history.
- `src/viz/layout.ts`: thuật toán, `GRID_SPACING`, `PADDING` (đã benchmark; chỉ scale khi render).
- `src/terminal/parse.ts` và nội dung mọi thông báo output/lỗi.
- Level JSON (goal, initial, target, allowed), `levels/check.ts`, thứ tự 8 level.
- Văn bản trong `commands-ref/data.ts`.
- `harness/**`, schema của `verification.json`, validator `report.ts`.
- `progress/**` và định dạng localStorage.
- `GRAPH_ANIMATION_MS = 300` và cơ chế `inputLocked`.
- ID các tab (`practice`, `levels`, `reference`, `verification`); không thêm router.
- 11 giá trị màu gốc ở mục 3.1.

**Không thêm**
- Backend, authentication, sync, social, leaderboard.
- Lệnh hoặc flag Git mới, level mới, gợi ý/đáp án tự động, khóa level.
- Thư viện UI, icon font, webfont tải từ mạng, thư viện chart/animation.
- Dark theme toggle, onboarding tour, command palette, phím tắt toàn cục mới (ngoài phím chuẩn của tablist/listbox).
- Autocomplete lệnh trong terminal; kéo/zoom graph bằng chuột.
- Nút "Try in Practice" từ Reference (cần chia sẻ state giữa các tab; để sau).
