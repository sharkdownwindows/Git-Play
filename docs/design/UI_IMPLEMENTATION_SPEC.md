# GitScope — UI Implementation Spec

Trạng thái: **khóa để triển khai**. Ngày: 2026-09-30.

Loại tài liệu: design handoff. Tài liệu này không sửa code và không redesign. Nó mô tả chính xác cách đưa corrected prototype vào codebase React + Tailwind v4 hiện có.

Người đọc: coding agent hoặc thành viên nhóm triển khai UI. Đọc mục 1, 2 và 10 trước khi mở bất kỳ file TSX nào.

Quy ước trong tài liệu:

- **LOCKED**: quyết định đã khóa, không tự đổi.
- **TO_VERIFY**: chưa đo được hoặc chưa có quyết định. Không tự bịa giá trị; hỏi hoặc giữ phương án mặc định ghi kèm.
- **UNKNOWN**: không đo được từ nguồn hiện có.
- Mọi hex, kích thước và thời gian lấy từ markup/CSS/logic của corrected prototype (`docs/design/reference/GitScope-Prototype-Corrected.html`) hoặc từ số đo trong `docs/design/INTRO_MOTION_SPEC.md`, trừ khi ghi nguồn khác.

---

## 1. Source hierarchy

### 1.1 Các nguồn

| # | Nguồn | Đường dẫn | Quyết định điều gì | Không quyết định điều gì |
|---|---|---|---|---|
| A | Application requirements | `AGENTS.md`, `docs/PRD.md`, `docs/TECHNICAL_OVERVIEW.md`, `docs/ISSUES.md`, `docs/STATUS.md`, contract trong `src/core/types.ts`, `src/verification/report.ts`, `src/progress/types.ts` | Hành vi Git engine, `RepoState`, level check, tiến độ localStorage, schema `verification.json`, scope Tier 1, không backend/CDN, English-only UI | Màu, kích thước, bố cục |
| B | Tài liệu này | `docs/design/UI_IMPLEMENTATION_SPEC.md` | Responsive behavior, accessibility, component state, cách ánh xạ prototype vào code, các ngoại lệ đã khóa | Hành vi engine |
| C | Corrected screenshots và videos | `docs/design/screenshots/*.png`, `docs/design/motion/*.mp4` | Hình ảnh cuối cùng (màu, bố cục, khoảng cách, typography) và chuyển động (timing, easing) | Dữ liệu hiển thị (commit, số liệu, SHA) |
| D | Corrected prototype | `docs/design/reference/GitScope-Prototype-Corrected.html`, `CORRECTIONS.diff`, `INTRO_MOTION_SPEC.md` | Giá trị CSS chính xác khi screenshot không đủ độ phân giải để đo | Code production. Runtime của nó có lỗi (mục 1.4) |
| E | Raw prototype | `GitScope Prototype.dc.html` (project Claude), `artifacts/prototype-handoff/screenshots/raw-comparison/` | Không quyết định gì. Chỉ dùng để hiểu lịch sử sửa | — |
| F | `docs/UI_POLISH_SPEC.md` | — | Chỉ còn giá trị ở những điểm tài liệu này dẫn chiếu rõ (ví dụ contrast rules, acceptance tablist). Phần còn lại bị thay thế bởi tài liệu này | Màu header, màu chip branch, màu nút chính (đều đã bị prototype thay) |

### 1.2 Quy tắc giải quyết xung đột (LOCKED)

1. **A thắng mọi nguồn về hành vi và dữ liệu.**
   - Không đổi engine, parser, layout algorithm, checker, progress store, report schema.
   - Không thay dữ liệu thật bằng sample data của prototype. Ví dụ: report thật có 19,377 divergence entries; prototype hiện "All 19,806", tức số warnings. UI phải hiển thị số từ report thật.
2. **B thắng C/D về responsive, accessibility và state.** Mọi chỗ tài liệu này lệch khỏi screenshot đều được liệt kê ở mục 1.3 kèm lý do.
3. **C thắng D về hình ảnh.** Chỉ dùng D để đọc giá trị số mà screenshot không thể hiện được.
4. **D thắng F về hình ảnh.** Ví dụ header navy, gạch đỏ active, chip branch navy, nút hành động đỏ.
5. **E không bao giờ thắng.**
6. **Khi A và C mâu thuẫn về copy** (câu chữ hiển thị): giữ copy của C nếu đó là copy tĩnh của UI. Dùng dữ liệu của A nếu đó là số liệu hoặc nội dung nghiệp vụ.
7. **Khi không nguồn nào trả lời được:** ghi TO_VERIFY, dùng phương án mặc định trong tài liệu này, không tự thiết kế thêm.

### 1.3 Ngoại lệ đã khóa (tài liệu này cố ý lệch khỏi screenshot)

| ID | Chỗ lệch | Screenshot/prototype | Quy định trong app | Lý do |
|---|---|---|---|---|
| X-1 | Header < 768px | 1 hàng 48px, tab cuộn ngang, "Reference" bị cắt | 2 hàng: wordmark 44px + tablist 4 cột bằng nhau 44px; "Verification" rút thành "Verify" (aria-label giữ tên đầy đủ). Màu theo navy của prototype | Tab bị cắt, hit target < 44px. Code hiện tại đã có cấu trúc 2 hàng |
| X-2 | Input terminal < 768px | 14px | 16px | Tránh iOS tự zoom khi focus |
| X-3 | Commit node focus | `outline:none`, không có dấu focus | Vòng r=21 stroke `#273896` 2px khi `:focus-visible` | WCAG 2.4.7 |
| X-4 | Click trên vùng intro ngoài CTA | Đóng intro | Không đóng. Chỉ CTA, Enter, Space (khi CTA focus) đóng intro | Defect đã ghi trong `SOURCE_OF_TRUTH.md` |
| X-5 | Focus sau khi hoàn thành level | Không chuyển được (runtime lỗi) | Chuyển vào nút Next sau 60ms | Hành vi prototype định làm nhưng runtime hỏng |
| X-6 | Tự cuộn log terminal | Không cuộn (runtime lỗi) | Cuộn xuống entry mới trừ khi người dùng đã cuộn lên > 40px | Như trên; ngưỡng 40px lấy từ UI_POLISH_SPEC T3 |
| X-7 | Copy thất bại (clipboard bị chặn) | Vẫn hiện "✓ Copied" | Giữ nhãn "Copy", không báo thành công giả | Trung thực trạng thái |
| X-8 | Divergence list | 3 dòng sample, footer "prototype sample" | Dữ liệu thật, 50 dòng mỗi trang, nút "Show 50 more" | Report thật có 19,377 dòng |
| X-9 | Rive `.riv` 20 MB + CDN | Tải Rive từ unpkg | Video local `/assets/intro/*.webm|mp4` + poster PNG | Không CDN, không file 20 MB (mục 6) |
| X-10 | Reduced motion trên media intro | Rive vẫn chạy | Chỉ poster, không phát video | Defect đã ghi |
| X-11 | Dialog intro | Không có focus trap | Focus trap + app phía sau `inert` | Defect đã ghi |

### 1.4 Defect của prototype không được tái tạo

Lặp lại từ `docs/design/SOURCE_OF_TRUTH.md`, không mở rộng:

- `componentDidUpdate` đọc `prevState` không tồn tại;
- focus không chuyển vào Next;
- log không tự cuộn;
- splash không giữ focus;
- Rive chạy khi reduced motion;
- click vùng animation đóng intro;
- `left:-53px; top:-41px`;
- logo quá khổ / bị cắt;
- tải Rive từ CDN.

---

## 2. Design tokens

Tất cả token khai báo trong `:root` của `src/app/layout.css` và wiring qua `@theme inline`. Phần lớn đã có trong code (xem `git diff src/app/layout.css`). Bảng dưới là danh sách **đầy đủ** mà UI được dùng. Không dùng hex rời trong TSX; SVG dùng `var(--…)`.

### 2.1 Màu

**Bộ gốc (đã có, không đổi giá trị):**

| Token | Hex | Dùng ở prototype |
|---|---|---|
| `--color-primary` | `#273896` | Nền header, tiêu đề, commit stroke, HEAD commit fill, chip branch text, segmented selected, progress fill, coverage bar |
| `--color-primary-dark` | `#1d2b78` | Tab selected bg, link hover, Target label text |
| `--color-primary-light` | `#e9ecf8` | Chip branch bg, item selected bg (rail), coverage track, Target label bg |
| `--color-accent` | `#ed1c24` | Gạch dưới tab active, chấm wordmark, halo commit mới, edge/ring "changed", viền dashed detached/unborn, đường p95, pulse CTA |
| `--color-accent-dark` | `#c9151c` | **Nút hành động** (CTA intro, Run, Next), chip HEAD attached, badge tab Levels, eyebrow đỏ, text detached/unborn, số level đang chọn, tên lệnh đang chọn |
| `--color-accent-light` | `#fde8e9` | Nền chip detached, nền node detached, nền chip "changes" |
| `--color-background` | `#ffffff` | Nền trang, panel graph, intro |
| `--color-surface` | `#f7f8fc` | Rail, brief, card neutral |
| `--color-text` | `#1f2937` | Chữ thường |
| `--color-text-muted` | `#6b7280` | Chữ phụ |
| `--color-border` | `#e5e7eb` | Divider, viền panel |

**Bộ mở rộng (đã có trong layout.css):**

| Token | Hex | Dùng ở |
|---|---|---|
| `--color-border-strong` | `#858c99` | Viền nút secondary, segmented, select, chip allowed, empty node dashed |
| `--color-surface-hover` | `#eef0f7` | Hover item/nút secondary |
| `--color-success` | `#15803d` | Vòng ✓ level, số stat success |
| `--color-success-light` | `#e7f5ec` | Banner complete, chip "Matches target", stat card success |
| `--color-success-border` | `#a7d8b8` | Viền các phần tử trên |
| `--color-warning` | `#b45309` | Số soft warnings, chấm "!" Gotcha, chấm soft |
| `--color-warning-light` | `#fdf3e2` | Card Gotcha, stat warning, chip soft |
| `--color-warning-border` | `#f1cf97` | Viền các phần tử trên |
| `--color-terminal-bg` | `#141a3f` | Nền terminal, nền input, khối syntax Reference |
| `--color-terminal-dock` | `#1a2150` | Dock input, nút Copy trong khối syntax |
| `--color-terminal-line` | `#2a3268` | Divider trong terminal |
| `--color-terminal-text` | `#f1f3fb` | Lệnh, text input |
| `--color-terminal-muted` | `#a9b1d6` | Output, eyebrow TERMINAL, hint |
| `--color-terminal-prompt` | `#8fa0ff` | Ký tự `$`, viền input focus |
| `--color-terminal-error` | `#ff8a8f` | Output lỗi, viền input khi lỗi |
| `--color-terminal-latest` | `#1f2757` | Nền entry mới nhất, hover example chip |
| `--color-edge` | `#9aa1b5` | Edge graph |

**Cần thêm (LOCKED; chưa có trong layout.css):**

| Token mới | Hex | Dùng ở |
|---|---|---|
| `--color-accent-hover` | `#a91118` | Hover nút đỏ (CTA, Run, Next) |
| `--color-nav-text` | `#dfe3f5` | Chữ tab không chọn trên header navy |
| `--color-branch-border` | `#b8c1e6` | Viền chip branch, viền legend chip |
| `--color-terminal-control` | `#3a448a` | Viền input terminal default, viền kbd, viền nút Copy syntax |
| `--color-terminal-chip` | `#5c6aa8` | Viền dashed của example chip |
| `--color-disabled-text` | `#9ca3af` | Chữ nút disabled (Undo/Redo) |
| `--color-success-strong` | `#14532d` | Tiêu đề banner complete |
| `--color-success-text` | `#166534` | Mô tả banner, nhãn stat success, chip Matches |
| `--color-warning-strong` | `#92400e` | Tiêu đề Gotcha, nhãn stat warning, chip soft |

**Ánh xạ ngữ nghĩa (LOCKED, thay bảng 3.2 của UI_POLISH_SPEC):**

| Ý nghĩa | Màu |
|---|---|
| Chrome, vị trí hiện tại, commit, branch | `primary` / `primary-light` |
| Hành động chính (1 nút/ngữ cảnh), HEAD, cần chú ý | `accent-dark` (nền), `accent` (viền, halo, gạch) |
| Thành công | `success*` |
| Cảnh báo mềm | `warning*` |

**Kiểm contrast (TO_VERIFY bằng axe-core khi triển khai):**

| Cặp | Ước lượng |
|---|---|
| Chữ trắng trên `#c9151c` | ≈ 5.6:1 |
| `#dfe3f5` trên `#273896` | ≈ 8:1 |
| `#c9151c` trên `#e9ecf8` (số level chọn) | ≈ 4.9:1 |
| `#6b7280` trên `#f7f8fc` | ≈ 4.6:1 |

Không dùng `#ed1c24` cho chữ < 18.66px bold (quy tắc G5 của UI_POLISH_SPEC vẫn áp dụng).

### 2.2 Typography

```css
--font-sans: system-ui, "Segoe UI", "Noto Sans", Ubuntu, sans-serif;   /* đã có */
--font-mono: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace; /* đã có */
```

Không tải webfont. Screenshot tham chiếu được render bằng Noto Sans + Liberation Mono (INTRO_MOTION_SPEC §0). Trên máy khác, độ rộng chữ lệch vài px là chấp nhận được (mục 7.3).

| Vai trò | Font | Size / line-height | Weight | Ghi chú |
|---|---|---|---|---|
| Wordmark | sans | 15 / 1 | 650 | letter-spacing −.01em |
| Tab | sans | 13 / 1 | 600 selected, 500 khác | |
| Badge tab Levels | mono | 11 / 1 | 700 | pill |
| Eyebrow | sans | 12 / 1 | 600 | uppercase, letter-spacing .06em |
| Body | sans | 14 / 21 | 400 | mặc định trang |
| Small / meta | sans | 12 / 16 hoặc 13 / 18 | 400–500 | |
| Level title | sans | 20 / 28 | 600 | màu primary |
| Goal / mô tả lớn | sans | 15 / 22 | 400 | max-width 68ch, `text-wrap: pretty` |
| Reference command title | mono | 26 / 32 | 600 | màu primary |
| Verification headline | sans | 28 / 34 | 600 | màu primary |
| Section heading (h2) | sans | 17 / 24 | 600 | màu primary |
| Stat number | mono | 28 / 1 | 600 | `tabular-nums` |
| Terminal log | mono | 13 / 20 | 400 | |
| Terminal input | mono | 14 / 20 (16 ở < 768, X-2) | 400 | |
| Graph label, chip | mono | 11 / 1 (10 nếu id > 3 ký tự) | 500 node, 700 HEAD node, 600 chip branch, 700 chip HEAD | |
| Intro title | sans | 28 / 34 | 700 | |
| Intro sub | sans | 15 / 22 | 400 | |
| Intro CTA | sans | 15 / 1 | 600 | |
| Intro hint | sans | 12 / 16 | 400 | |

### 2.3 Spacing

Base 4px (`--space-1…10` đã có). Prototype còn dùng các giá trị lẻ; giữ nguyên theo từng component ở mục 4: 2, 3, 5, 6, 7, 9, 10, 14, 18, 28, 36, 56 px.

### 2.4 Radius

| Giá trị | Dùng |
|---|---|
| 4px | Chip, kbd, badge sha |
| 5px | Nút Run bên trong input |
| 6px | Nút, input, list item, segmented, example chip |
| 8px | Khối syntax Reference |
| 10px | Panel, card, banner, figure |
| 999px | CTA intro, badge tab |

### 2.5 Border

Mặc định 1px.

- `--color-border`: panel, divider.
- `--color-border-strong`: control.
- `--color-terminal-line`: divider trong terminal.
- `--color-terminal-control`: control trong terminal.

Kiểu dashed dùng cho: empty node, chip unborn/detached, example chip, Target label, input đang khóa.

Chỉ báo selected trong rail dùng `box-shadow: inset 3px 0 0 var(--color-accent)`. Tab selected dùng `border-bottom: 3px solid var(--color-accent)`. (Cả hai là 3px đỏ, **không** phải 2px primary như UI_POLISH_SPEC.)

### 2.6 Shadow

Không có shadow cho panel. Chỉ có:

- focus halo input: `0 0 0 3px rgb(143 160 255 / .28)`;
- pulse CTA (keyframe `gsPulse`);
- inset rail ở trên.

### 2.7 Breakpoint

| Tên | Điều kiện | Ảnh hưởng |
|---|---|---|
| `mobile` | < 768px | Header 2 hàng (X-1), hit target ≥ 44px, input 16px |
| `narrow` | < 900px | Levels: rail thành `<select>`. Reference: rail rộng 100% và xếp trên detail |
| Flex-wrap tự nhiên | Theo flex-basis | Practice: terminal `5 1 380px` + graph `7 1 440px`. Levels workspace: terminal `5 1 340px` + graph `6 1 400px`. Hàng tự xuống dòng khi không đủ chỗ. `wrap-reverse` đưa graph lên trên |

Không có breakpoint 1280 trong prototype. Ở 1024×768, Levels workspace đã xếp dọc; điều này **đúng** theo `levels-completed-1024x768.png`.

### 2.8 Motion

Keyframes (tên CSS trong code có thể khác, giá trị phải khớp):

| Keyframe | from / mốc | to |
|---|---|---|
| `logo-in` | opacity 0, `translateY(18px) scale(.96)` | opacity 1, none |
| `fade-in` | opacity 0, `translateY(8px)` | opacity 1, none |
| `intro-out` | — | opacity 0, `translateY(-28px)` |
| `node-in` | opacity 0, `translateY(-12px)` | opacity 1, none |
| `halo` | 0%: opacity 0; 15%: .85 | 100%: 0 |
| `pulse` | 0%, 100%: `box-shadow 0 0 0 0 rgba(237,28,36,.35)` | 50%: `0 0 0 12px rgba(237,28,36,0)` |

Token thời gian:

| Token | Giá trị | Dùng |
|---|---|---|
| `--dur-graph` | 300ms | Node enter (`ease-out`), node move (`cubic-bezier(.2,.8,.2,1)`), khóa input. `GRAPH_ANIMATION_MS = 300`, không đổi |
| `--dur-halo` | 1400ms `ease-out` | Halo commit mới |
| `--dur-banner` | 250ms `ease-out` | Banner complete (`fade-in`) |
| Intro | xem INTRO_MOTION_SPEC | 1000/800/700/600/600ms, delay 0/500/800/1100/1300, pulse 2400ms delay 2000 ∞, exit 450ms `cubic-bezier(.4,0,1,1)` + unmount 460ms |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)` | Đã có |

Reduced motion:

- Mọi animation/transition ≈ 0.
- Không khóa input.
- Không phát video intro.
- Halo hiện tĩnh 2s rồi ẩn (UI_POLISH_SPEC 3.9, giữ).

Không có thông tin nào chỉ truyền qua chuyển động.

### 2.9 Z-index

| Token | Giá trị | Dùng |
|---|---|---|
| `--z-header` | 10 | Header `position: sticky; top: 0` |
| `--z-skip` | 50 | Skip link |
| `--z-intro` | 100 | Intro dialog. Code hiện dùng 1000; hạ về 100 theo prototype, hoặc giữ 1000. Điều kiện bắt buộc: lớn hơn mọi lớp khác |

---

## 3. App shell

### 3.1 Cấu trúc

```
body
├─ Intro (dialog, chỉ khi introState = visible)            mục 5.5
└─ .app-shell [inert khi intro hiện]
   ├─ a.skip-link  "Skip to terminal" | "Skip to main content"
   ├─ header.app-header  (sticky, navy)
   │   ├─ wordmark "GitScope" + chấm đỏ
   │   └─ nav[aria-label="Primary navigation"] > [role=tablist] > 4 × button[role=tab]
   └─ main#main-content > div[role=tabpanel]#<tab>-panel
```

Tab id giữ nguyên: `practice`, `levels`, `reference`, `verification`. Không thêm router. Không có URL route; "route" trong mục 7 nghĩa là tab đang chọn.

### 3.2 Header (≥ 768px)

- `min-height: 48px`, `padding: 0 20px`, `gap: 24px`.
- Nền `--color-primary`, chữ trắng.
- `position: sticky; top: 0; z-index: var(--z-header)`.
- Không có border-bottom.
- Wordmark:
  - "GitScope" 650 15/1, letter-spacing −.01em.
  - Chấm 6×6 tròn `--color-accent`, `margin-left: 3px`, `transform: translateY(-5px)`.
- Tablist: `display:flex; gap:4px; overflow-x:auto`.
- Tab: cao 48px (bằng header), `padding: 0 12px`, `gap: 6px`, font 13/1, `border-bottom: 3px solid transparent`.

| State | Style |
|---|---|
| default | nền transparent, chữ `--color-nav-text`, weight 500 |
| hover | TO_VERIFY. Prototype không định nghĩa. Mặc định: chữ trắng, nền transparent |
| focus-visible | `outline: 2px solid #fff; outline-offset: -4px` |
| selected | nền `--color-primary-dark`, chữ trắng, weight 600, `border-bottom-color: --color-accent` |
| disabled | Không có |

- Badge Levels: `"{completed}/8"`, mono 700 11/1, chữ trắng, nền `--color-accent-dark`, radius 999, `padding: 3px 6px`. Hiện trên cả tab selected và không selected. Số lấy từ `countCompletedLevels(progressStore)`, không hardcode.
- Accessible name tab Levels: `"Levels, {n} of 8 complete"` (code hiện có, giữ).
- Keyboard:
  - roving tabindex;
  - ←/→ vòng quanh, Home/End;
  - Enter/Space kích hoạt (code hiện có trong `tabNavigation.ts`, giữ; không auto-activate khi di chuyển focus).

### 3.3 Header (< 768px, X-1)

- 2 hàng, tổng 88px, cùng nền navy.
- Hàng 1: wordmark cao 44px, `padding-inline: 12px`.
- Hàng 2: tablist grid 4 cột bằng nhau, mỗi tab cao 44px.
- Nhãn mobile: Practice / Levels / Reference / Verify.
- Gạch đỏ 3px ở tab selected.
- `--app-header-h` = 88px (dùng cho các phép tính `100dvh − header`).

### 3.4 Main

| Tab | Main |
|---|---|
| Practice | Chiều cao `calc(100dvh − var(--app-header-h))`, không cuộn trang ở ≥ 868px rộng. Panel tự cuộn |
| Levels | `min-height: calc(100dvh − header)`, **trang được cuộn** (workspace `min-height: 560px`). Đúng theo screenshot 1024×768 |
| Reference | `min-height: calc(100dvh − header)`, trang cuộn khi nội dung dài |
| Verification | Tài liệu: `max-width: 1160px`, căn giữa, `padding: 36px 24px 56px`, trang cuộn |

Skip link: code hiện có, giữ. Nó phải nhìn thấy được khi focus, nằm trên header (z 50).

### 3.5 Acceptance — shell

- **SH-1** Header nền `#273896` ở mọi viewport. Tab selected có nền `#1d2b78` và gạch dưới 3px `#ed1c24`. Đo bằng `getComputedStyle`.
- **SH-2** Badge Levels hiển thị `n/8` với n = số record trong localStorage. Hoàn thành 1 level thì badge thành `1/8` mà không reload.
- **SH-3** Test hiện có trong `App.test.ts` vẫn pass (aria-controls, aria-labelledby, roving tabindex, skip link).
- **SH-4** Ở 390×844: header cao 88px, 4 tab hiện đủ nhãn, không cuộn ngang trang, mỗi tab ≥ 44×44.
- **SH-5** Cuộn trang Verification thì header vẫn dính trên cùng.

---

## 4. Screens

Thành phần dùng chung được định nghĩa một lần ở 4.0 và tham chiếu ở từng screen.

### 4.0 Thành phần dùng chung

#### 4.0.1 TerminalPanel (Practice, Levels)

**Khung:**

- `section[aria-label="Git terminal"]`, radius 10, nền `--color-terminal-bg`, chữ `--color-terminal-text`, `overflow:hidden`.
- Flex column. Practice: `min-height: 320px`. Levels: `min-height: 300px`.

**Header** (cao 40, `padding: 0 14px`, `gap: 10px`, border-bottom `--color-terminal-line`):

- Eyebrow "TERMINAL" màu `--color-terminal-muted`.
- Chỉ ở Practice: bên phải có hai kbd "↑" "↓" + chữ "history". Kbd: mono 500 11/1, viền `--color-terminal-control`, `border-bottom-width: 2px`, radius 4, `padding: 3px 5px`. Chữ 12/1 `--color-terminal-muted`.

**Log:**

- `role="log" aria-live="polite" aria-label="Command history"`.
- `flex: 1`, `overflow: auto`, `padding: 16px 0`, `gap: 10px`, mono 13/20.

**Empty state** (khi log rỗng), `padding: 0 16px`, `gap: 10px`:

- Câu hướng dẫn sans 14/21 `--color-terminal-muted`:
  - Practice: "Type a Git command below and press Enter. The graph on the right updates after every command. Try one:"
  - Levels: "Only {git a and git b} work{s} in this level. Toggle Target on the graph to see the goal."
- Hàng example chip (`flex-wrap`, `gap: 8px`):
  - Kiểu chip: mono 12/1, nền transparent, viền 1px dashed `--color-terminal-chip`, radius 6, `padding: 8px 10px`. Hover: viền `--color-terminal-prompt`, nền `--color-terminal-latest`.
  - Practice: `git commit -m "first"`, `git branch feature`, `git switch -c feature`.
  - Levels: một chip cho mỗi lệnh trong `level.allowed`, theo bảng EX: commit→`git commit -m "next"`, branch→`git branch feature`, switch→`git switch feature`, checkout→`git checkout <commit>`, merge→`git merge feature`.
  - Click chip: **điền** text vào input (bỏ hậu tố ` <…>` nếu có), **không chạy**, rồi focus input.

**Entry** (một entry cho mỗi lệnh đã submit, theo thứ tự thời gian):

- `padding: 4px 16px`. Entry cuối có nền `--color-terminal-latest`.
- Dòng lệnh: `<span style="color:var(--color-terminal-prompt)">$</span> {command}`, `white-space: pre-wrap; word-break: break-word`.
- Mỗi dòng output: `padding-left: 14px`, flex `gap: 8px`.
  - Màu `--color-terminal-muted` nếu thành công.
  - Màu `--color-terminal-error` nếu lỗi (parse error, engine `ok:false`, "… is not available in this level.").
  - Dòng lỗi đầu tiên có dấu `✕` (`aria-hidden`).
- Output của lệnh N nằm ngay dưới lệnh N (sửa A1 của UI_POLISH_SPEC).

**Dock:**

- `padding: 12px 14px`, border-top `--color-terminal-line`, nền `--color-terminal-dock`.
- Wrapper `position: relative`. Ký tự `$` tuyệt đối tại `left:12px; top:11px`, mono 14/20 prompt color, `aria-hidden`.
- Input `#terminal-input`:
  - `type=text`, `aria-label="Git command"`, `autocomplete=off`, `spellcheck=false`.
  - Kích thước: `width:100%; height:42px; padding: 0 92px 0 30px`.
  - Viền 1px `--color-terminal-control`, radius 6, nền `--color-terminal-bg`, mono 14/20.
  - Placeholder: Practice `git commit -m "first"`. Levels: EX của lệnh allowed đầu tiên, bỏ ` <…>`.
- Nút Run:
  - Tuyệt đối `right:4px; top:4px; height:34px; padding:0 12px`, radius 5, nền `--color-accent-dark`, hover `--color-accent-hover`.
  - Chữ trắng 600 13, "Run ↵". `focus-visible: outline 2px #fff offset 2px`.
  - Click = submit như Enter, rồi focus lại input.
  - Hiện ở **mọi** viewport (prototype có Run ở desktop).
- Hint (`margin-top: 8px`, 12/16, `--color-terminal-muted`):
  - Practice: "Available: commit · branch · switch · checkout · merge". Khi khóa: "Updating graph…" (`role="status"`).
  - Levels: "Allowed here: {allowed.join(' · ')}".

**Trạng thái input:**

| State | Style / hành vi |
|---|---|
| default | viền `--color-terminal-control` |
| focus | viền `--color-terminal-prompt` + halo 3px `rgb(143 160 255/.28)` (đã có trong layout.css) |
| error | Viền `--color-terminal-error`, từ khi lệnh vừa lỗi cho tới khi gõ ký tự tiếp theo |
| locked (Practice, ≤ 300ms sau lệnh làm đổi repo, khi không reduced-motion) | Viền **dashed**. Input vẫn focus được, vẫn gõ được. Enter/Run bị bỏ qua. Hint "Updating graph…". **Không** dùng thuộc tính `disabled` (code hiện tại dùng `disabled`, làm mất focus → phải sửa) |

**Keyboard:**

- Enter: submit.
- ↑/↓: lịch sử (`session.ts` giữ nguyên logic).
- Tab: rời input bình thường.

**Tự cuộn:** khi thêm entry, cuộn log xuống đáy, trừ khi `scrollHeight − scrollTop − clientHeight > 40` trước khi thêm (X-6).

#### 4.0.2 GraphPanel (Practice, Levels)

**Khung:**

- `section[aria-label="Commit graph"]`, viền 1px `--color-border`, radius 10, nền trắng, `overflow:hidden`.
- Flex column. Practice: `min-height: 300px`. Levels: `min-height: 280px`.

**Header** (`min-height: 44px`, `padding: 6px 10px 6px 14px`, flex-wrap, `gap: 8px 12px`, border-bottom):

- Eyebrow "COMMIT GRAPH" `--color-text-muted`. Rồi các phần riêng từng screen.

**Canvas:**

- `flex:1; overflow:auto; display:flex; align-items:center; justify-content:center`.
- Nền trắng + `radial-gradient(var(--color-border) 1px, transparent 1px) 0 0/20px 20px`.
- Padding: Practice 16px. Levels `36px 16px 16px` (chừa chỗ cho nhãn Target).

**Empty state** (khi repo 0 commit), căn giữa, `gap: 10px`:

- Vòng 34px viền 2px dashed `--color-border-strong`.
- "No commits yet" 14/20.
- Chip unborn.
- Chỉ ở Practice: helper 12/18 muted, max 32ch: "Your first commit will appear here as a circle. Branch labels sit to its right."

#### 4.0.3 GraphView SVG (dùng ở Practice, Levels, Reference)

`layout()` **không đổi** (thuật toán, `GRID_SPACING=80`, `PADDING=40`). Mọi khác biệt với prototype xử lý ở bước render.

**Tọa độ render (LOCKED):**

- `x' = 2 · (x − 40) + 40`.
- `y' = y`.

Công thức này khớp đúng `x = lane·160 + 40` của prototype.

**Kích thước SVG:**

- `right` = max qua mọi node của `x' + (chipWidth ? 30 + chipWidth : 24)`.
- `W = max(right + 16, 160)`.
- `H = maxDepth·80 + 80`.
- `viewBox="0 0 W H"`, `width = round(W·s)`, `height = round(H·s)`, style `max-width:100%; height:auto; overflow:visible`.
- `s = 1.35` ở Practice/Levels, `1.2` ở Reference.

**Edge** (vẽ trước node):

- Cùng cột: `M x1 (y1−16) L x2 (y2+16)`.
- Khác cột: `M x1 (y1−16) C x1 (y1−46) x2 (y2+46) x2 (y2+16)`.
- (1 = child, 2 = parent.) `fill:none`, stroke 2, `--color-edge`.
- Stroke `--color-accent` nếu là edge "changed" (Reference After).
- `stroke-dasharray: 4 4` nếu child là node "dashed" (Target).

**Nhãn parent** (Levels và Reference After, chỉ trên edge của merge commit):

- "1st parent" / "2nd parent", sans 10, `--color-text-muted`.
- Cùng cột: `x = x1 − 8`, `text-anchor: end`. Khác cột: `x = trung điểm + 8`, `text-anchor: start`. `y = trung điểm y + 4`.
- Thứ tự parent lấy từ `commit.parents.indexOf(parentId)`, vì `layout()` không trả index.

**Node** (`g[data-commit-id]` có `transform: translate(x'px, y'px)`, `transition: transform 300ms cubic-bezier(.2,.8,.2,1)`; con là `g` có animation `node-in 300ms ease-out both`):

- `<title>`: `"{id} — {message} · parents {a, b}"` hoặc `"… · root"`.
- Circle r=16, stroke 2:

| Loại | fill | stroke | Chữ |
|---|---|---|---|
| thường | `#fff` | `--color-primary` | `--color-text`, weight 500 |
| HEAD (attached, là commit HEAD) | `--color-primary` | `--color-primary` | trắng, weight 700 |
| HEAD detached | `--color-accent-light` | `--color-accent-dark` | `--color-accent-dark`, weight 700 |
| dashed (Target, chưa có ở Current) | như trên | như trên, `stroke-dasharray: 4 3` | như trên |

- Nhãn: id ≤ 4 ký tự hiện đủ. Dài hơn: 3 ký tự đầu + "…". Mono, cỡ 11 (10 nếu nhãn > 3 ký tự), `y=4`, căn giữa.
- Halo commit mới: circle r=23, fill none, stroke `--color-accent` 2, animation `halo 1.4s ease-out both`. Chỉ trên `newId`.
- Ring "changed" (Reference After): circle r=23, stroke `--color-accent` 2, opacity .5, tĩnh.
- Focus (X-3): node `tabIndex=0`, `aria-label="commit {id}[, HEAD attached to X][, branch Y][, HEAD detached]"`. Khi `:focus-visible`, hiện circle r=21 stroke `--color-primary` 2.

**Chip ref** (bên phải node, `x0 = 30`, cao 20, radius 4; nhiều chip xếp dọc bước 24, cụm căn giữa theo tâm node: `y0 = −(n·24 − 4)/2`):

- Độ rộng text `tw(s) = s.length·6.8 + 14`.
- Thứ tự: chip HEAD-ghép trước, rồi các branch còn lại theo tên, rồi chip detached.

| Kind | Hình |
|---|---|
| HEAD attached | Rect 42×20 nền `--color-accent-dark`, "HEAD" trắng 700 11. Ngay sau (x+43) là chip branch |
| branch | Nền `--color-primary-light`, viền 1 `--color-branch-border`, chữ `--color-primary` 600 11 |
| HEAD detached | Nền `--color-accent-light`, viền `--color-accent` dashed `3 2`, chữ `--color-accent-dark` 700 11: "HEAD · detached" |

`RefLabel.tsx` hiện đặt chip dưới node, dùng màu success/primary: **thay toàn bộ**.

#### 4.0.4 HeadChip (header graph Practice)

Cao 24, `padding: 0 8px`, radius 4, mono 700 12/1.

| Trạng thái repo | Text | Style |
|---|---|---|
| attached, có commit | `HEAD → {ref} @ {id}` | nền `--color-accent-dark`, chữ trắng, viền cùng màu |
| attached, unborn | `HEAD → {ref} (unborn)` | nền trắng, chữ `--color-accent-dark`, viền 1 dashed `--color-accent` |
| detached | `HEAD detached @ {id}` | nền `--color-accent-light`, chữ `--color-accent-dark`, viền dashed `--color-accent` |

Chip unborn trong empty state dùng cùng style, mono 700 11, `padding: 4px 6px`.

#### 4.0.5 Legend (Practice)

- Footer: `padding: 9px 14px`, border-top, flex-wrap, `gap: 8px 16px`, 12/1 muted. Mỗi mục `gap: 6px`.
- 6 mục:
  1. vòng 12px viền 2 primary — "commit";
  2. chấm đặc 12 primary — "HEAD commit";
  3. chip "main" — "branch";
  4. chip "HEAD" đỏ — "attached";
  5. chip "HEAD · detached" — "detached";
  6. vòng 14 viền 2 `--color-accent` — "just created".
- Hiện ở mọi viewport (prototype hiện cả ở 390).

#### 4.0.6 Button

| Variant | Kích thước | Style | hover | focus-visible | disabled |
|---|---|---|---|---|---|
| Action (đỏ) | Run 34h; Next 40h; CTA 48h | nền `--color-accent-dark`, chữ trắng 600 | `--color-accent-hover` | Run: outline 2px trắng offset 2. Next: outline 2px primary offset 2 | — |
| Secondary | 30h (Undo/Redo/Reset graph), 32h (Reset level), 30h (Copy trên nền tối) | nền trắng, viền `--color-border-strong`, radius 6, chữ `--color-text` 500 12–13, `padding: 0 10–12px` | nền `--color-surface-hover` | outline 2px primary offset 2 | viền `--color-border`, chữ `--color-disabled-text`, `cursor:default` |
| Segmented | container viền `--color-border-strong`, radius 6, padding 2; option `padding: 6px 10px`, radius 4, 600 12 | option chọn: nền `--color-primary`, chữ trắng. Chưa chọn: transparent, chữ muted | — | outline 2px primary offset 1 | — |

Ở < 768px, mọi nút có vùng chạm ≥ 44×44 (code đã có `min-height: 44px`).

---

### 4.1 Practice

**Reference:** `practice-1440x900.png`, `practice-390x844.png`, `motion/video-commit-graph-animation-1440x900.mp4`.

**Layout:**

- `main[role=tabpanel]`: `height: calc(100dvh − header)`, `box-sizing: border-box`, `padding: 16px`, `gap: 16px`, `display:flex; flex-wrap: wrap-reverse; align-content: stretch`.
- Con 1 TerminalPanel: `flex: 5 1 380px; min-width:0; min-height:320px`.
- Con 2 GraphPanel: `flex: 7 1 440px; min-width:0; min-height:300px`.
- Khi rộng khả dụng < 836px (380 + 440 + 16), hai panel xếp dọc: **graph trên, terminal dưới** (do `wrap-reverse`).

**Graph header Practice** (thứ tự trái → phải):

1. "COMMIT GRAPH".
2. Meta 12/1 muted: `"{n} commit(s) · {m} branch(es)"` (số ít khi = 1).
3. Spacer.
4. HeadChip.
5. Divider 1×20 `--color-border`.
6. Nhóm nút `gap: 6px`: Undo, Redo, Reset.

**Component:** TerminalPanel (Practice), GraphPanel, GraphView (s=1.35, `newId`), HeadChip, Legend, Button.

**Interaction:**

| Hành động | Kết quả |
|---|---|
| Enter/Run với lệnh hợp lệ làm đổi repo | Entry mới + output. Graph cập nhật. Node mới có `node-in` + halo. Node cũ trượt 300ms. Input khóa 300ms (không reduced-motion) |
| Lệnh parse lỗi / engine lỗi | Entry với output đỏ + ✕. Repo không đổi. Viền input đỏ tới khi gõ tiếp |
| Undo | `dispatch({type:"undo"})`. Log **không** đổi. `newId = null`. Disabled khi `past` rỗng |
| Redo | `dispatch({type:"redo"})`. Log không đổi. `newId = null`. Disabled khi `future` rỗng |
| Reset | `dispatch({type:"reset"})`. Xóa log, lịch sử lệnh, undo/redo (remount Terminal bằng `key`). Focus input |
| Click example chip | Điền input, focus input |

**`newId`:** id duy nhất có trong `repo` mới mà không có trong `repo` trước lệnh `run`. Tính ở UI, không đổi engine. Nếu không có id mới, `newId = null`.

**Responsive:**

| Viewport | Hình |
|---|---|
| 1440×900 | Hai cột 5:7 |
| 1024×768 | Hai cột (rộng khả dụng 992px ≥ 836px). TO_VERIFY: chưa có screenshot Practice 1024 |
| 390×844 | Graph trên (header wrap 2–3 hàng), terminal dưới, cả hai trong chiều cao `100dvh − 88` |

**States:**

| State | Hành vi |
|---|---|
| loading | Không áp dụng (đồng bộ) |
| empty | Terminal empty + Graph empty (4.0.1, 4.0.2) |
| error | Lỗi lệnh (như trên). Lỗi render GraphView: không có error boundary hiện tại. TO_VERIFY có cần thêm không; mặc định không thêm |
| offline | Hoạt động đầy đủ (không có request) |

**Keyboard/focus:**

- Sau khi đóng intro, focus vào `#terminal-input` (code hiện có).
- Thứ tự Tab: skip link → tabs → example chips → input → Run → Undo → Redo → Reset → các node graph.
- Reset trả focus về input.

**Acceptance:**

- **P-1** Ở 1440×900, tỉ lệ rộng terminal:graph ≈ 5:7 (±2%). Panel không vượt đáy viewport. Trang không cuộn.
- **P-2** Chạy `git commit -m "a"`, `git bad`, `git commit -m "b"`: DOM log có 3 entry theo thứ tự; entry 2 chứa output lỗi màu `#ff8a8f` + ✕; entry 3 có nền `#1f2757`.
- **P-3** Sau commit đầu: node `c1` fill `#273896`, chữ trắng; chip "HEAD" đỏ + "main" navy ở bên phải; HeadChip "HEAD → main @ c1"; meta "1 commit · 1 branch".
- **P-4** Trong 300ms sau lệnh (không reduced-motion): viền input dashed, hint "Updating graph…", Enter không tạo entry. Sau 300ms hết khóa. `document.activeElement` vẫn là input.
- **P-5** Undo sau 2 commit: graph còn 1 node, log vẫn 2 entry, Redo enabled.
- **P-6** Reset: log rỗng, hiện empty state, ↑ không trả lịch sử cũ.
- **P-7** Ở 390×844: graph panel nằm trên terminal. Không cuộn ngang. Nút Run ≥ 44px vùng chạm.
- **P-8** Reduced motion: không có animation `node-in`/transition. Input không khóa.

---

### 4.2 Levels

**Reference:** `levels-1440x900.png`, `levels-390x844.png`, `levels-completed-1024x768.png`, `motion/video-level-complete-transition-1440x900.mp4`.

**Layout ≥ 900px:**

- `main`: `display:flex; min-height: calc(100dvh − header)`.
- **Rail** `aside`:
  - `flex: 0 0 272px`, border-right, nền `--color-surface`, `padding: 20px 12px`, `gap: 16px`.
  - Đầu rail (`padding: 0 8px`, `gap: 8px`): hàng "LEVELS" (eyebrow, màu primary) + "{n} of 8 complete" (12/1 muted, căn phải baseline). Dưới là progress bar cao 4, radius 2, track `--color-border`, fill `--color-primary`, rộng `n/8`.
  - `nav[aria-label="Levels"] > ol` (gap 2) > `li > button`:
    - Nút: full width, flex `gap:10px`, `padding: 8px`, radius 6, 13/18, chữ `--color-text`. Hover nền `--color-surface-hover`. Focus outline 2px primary offset −2.
    - Icon tròn 20px: done = nền + viền 1 `--color-success`, "✓" trắng 700 11. Selected (chưa done) = viền 2 `--color-primary`. Còn lại = viền 1 dashed `--color-border-strong`.
    - Số `01…08` mono 12/1: selected `--color-accent-dark`, khác muted.
    - Tên level.
    - Selected: nền `--color-primary-light`, `box-shadow: inset 3px 0 0 var(--color-accent)`, weight 600, `aria-current="step"`.
    - `aria-label = "Level 0X, {title}, {completed|current|not started}"`.
- **Content** (`flex:1; min-width:0; padding:16px; gap:16px`, flex column):
  1. LevelBrief;
  2. CompletionBanner (điều kiện);
  3. Workspace.

**Layout < 900px:**

Không có rail. Đầu content là khối (`gap: 8px`):

- `label` eyebrow primary "LEVEL · {n} OF 8 COMPLETE" bọc `<select>` native:
  - Cao 44, viền strong, radius 6, 500 14, không uppercase.
  - Option: `"0X · {title}"`, thêm `"  ✓"` nếu done.
- Progress bar 4px như rail.

**LevelBrief** (`section[aria-label="Level brief"]`, `padding: 18px 20px`, viền, radius 10, nền surface, flex-wrap, `gap: 16px 24px`):

- Cột trái (`flex: 1 1 360px`, `gap: 8px`):
  - Eyebrow `--color-accent-dark`: "Level 0X · In progress" | "Level 0X · Complete" (khi đang hiện banner) | "Level 0X · Completed before · replaying" (level đã có trong progress, chưa hoàn thành lại lần này).
  - `h1` 600 20/28 primary: title.
  - `p` 15/22, max 68ch: goal.
  - Hàng "Allowed" 12/1 muted + chip `git {cmd}` (mono 600 12, primary, nền trắng, viền strong, radius 4, `padding: 5px 7px`), `gap: 8px`.
- Cột phải (căn phải, `gap: 12px`):
  - "Commands used" 12/1 muted + số mono 600 14 = `commandCount`.
  - Nút secondary "Reset level" (32h).

**CompletionBanner** (khi `latestCompletion !== null`):

- `section[role=status]`, `padding: 14px 16px`, viền `--color-success-border`, radius 10, nền `--color-success-light`, animation `fade-in .25s ease-out both`, flex-wrap `gap: 14px`.
- Vòng 32 nền `--color-success` "✓" trắng 700 16.
- Tiêu đề 600 16/22 `--color-success-strong`: "Level complete · {n} command(s)".
- Mô tả 14/20 `--color-success-text`: "Your graph matches the target." Level cuối: "Your graph matches the target — all 8 levels done."
- Nút Action "Next: 0Y {title} →" (40h, 600 14). Ẩn ở level 8.
- **LOCKED:** banner hiện đúng khi `latestCompletion !== null` theo reducer hiện có. Reducer trả `latestCompletion = null` ở lệnh kế tiếp không hoàn thành. Prototype giữ banner tới khi đổi level. Không sửa reducer (không đổi behavior đúng); chấp nhận lệch này. TO_VERIFY với nhóm nếu muốn giữ banner.

**Workspace:**

- `flex:1; min-height:560px; display:flex; flex-wrap:wrap-reverse; gap:16px`.
- TerminalPanel (Levels) `flex: 5 1 340px`, GraphPanel `flex: 6 1 400px`.
- Graph header Levels: "COMMIT GRAPH" + spacer + (khi `check(repo, target)`) chip "✓ Matches target" (cao 24, `padding: 0 8px`, radius 4, nền `--color-success-light`, viền `--color-success-border`, 600 12 `--color-success-text`) + Segmented `[role=tablist][aria-label="Graph view"]` Current / Target.
- View Target:
  - Render `repoFromShape(level.target)` qua cùng GraphView, `parentLabels`.
  - Node và edge nào có "chữ ký cấu trúc" chưa xuất hiện ở Current thì dashed. Chữ ký = chuỗi đệ quy parent. Hàm check hiện có ở `levels/check.ts`; tái dùng nếu export được, nếu không thì hàm thuần mới trong `viz/` hoặc `levels/`, **không** đổi `check()`.
  - Nhãn tuyệt đối `top:10px; left:12px`: "Target — what your graph should look like · dashed = not created yet", 12/16, chữ `--color-primary-dark`, nền `--color-primary-light`, viền 1 dashed primary, radius 4, `padding: 3px 7px`.
- `level.target === null` (schema cho phép): ẩn segmented. TO_VERIFY: hiện không level nào có `target null`.
- View Current: GraphView với `newId`, `parentLabels`.

**Interaction:**

| Hành động | Kết quả |
|---|---|
| Chọn level (rail/select/Next) | `dispatch({type:"select"})`: repo = initial, log rỗng, count 0, view Current. Focus `#terminal-input` sau ~30ms |
| Reset level | Như chọn lại cùng level. Focus input |
| Chạy lệnh | `dispatch({type:"run"})` như hiện tại. View tự về Current. Nếu hoàn thành: banner, eyebrow "Complete", badge/rail/select cập nhật, focus nút Next sau 60ms (X-5), nếu có Next |
| Lệnh không cho phép | Entry lỗi "{kind} is not available in this level." (copy từ reducer, không đổi) |
| Current/Target | Đổi view; không đổi repo |

Levels không có Undo/Redo (prototype không có; không thêm).

**Responsive:**

| Viewport | Hình |
|---|---|
| 1440×900 | Rail 272 + brief + workspace 2 cột |
| 1024×768 | Rail 272. Workspace xếp dọc (graph trên). Trang cuộn. Theo screenshot |
| 390×844 | Select + progress + brief (cột phải xuống dòng) + graph + terminal, trang cuộn |

**States:**

| State | Hành vi |
|---|---|
| loading | Progress chưa load: icon theo "not started"/"current". Badge `0/8`. Tự cập nhật khi `progressLoaded` |
| empty | Level 01 repo rỗng: Graph empty (không helper), Terminal empty Levels |
| error | Như Practice. localStorage hỏng/không ghi được: store nuốt lỗi, UI vẫn hiện hoàn thành trong phiên. Không thêm thông báo mới |
| offline | Hoạt động đầy đủ |

**Acceptance:**

- **L-1** Ở 1440×900: rail rộng 272px, item 01 selected có inset đỏ 3px và nền `#e9ecf8`; "0 of 8 complete"; bar 0%.
- **L-2** Level 01, gõ `git commit -m "first"`: banner hiện với "Level complete · 1 command", nút "Next: 02 Create a branch →" nhận focus trong ≤ 100ms; chip "✓ Matches target"; icon 01 thành ✓ xanh; badge tab `1/8`; rail "1 of 8 complete".
- **L-3** Click Next: level 02 được chọn, log rỗng, focus ở input.
- **L-4** Toggle Target ở level 07: hiện merge commit dashed với nhãn "1st parent"/"2nd parent"; gõ lệnh bất kỳ thì view về Current.
- **L-5** Ở 899px rộng: không có rail, có `<select>` cao 44 liệt kê 8 level. Ở 900px: có rail.
- **L-6** Ở 1024×768: terminal nằm dưới graph (khớp screenshot).
- **L-7** Gõ `git branch x` ở level 01: entry lỗi, "Commands used" không tăng (reducer hiện tại), repo không đổi.
- **L-8** Level đã hoàn thành trước đó (có trong localStorage): eyebrow "Completed before · replaying".

---

### 4.3 Reference

**Reference:** `reference-1440x900.png`. Không có screenshot mobile (TO_VERIFY).

**Layout:**

- `main`: `display:flex; flex-wrap:wrap; min-height: calc(100dvh − header)`.
- **Rail** `aside`:
  - `flex: 1 1 260px; max-width: 300px` (< 900px: `max-width: 100%`), border-right, nền surface, `padding: 20px 12px`, `gap: 12px`.
  - Đầu (`padding: 0 8px`, `gap: 6px`): eyebrow primary "COMMAND REFERENCE" + 13/18 muted "How each command changes commits, branches and HEAD."
  - `nav[aria-label="Commands"]` (gap 2) > 5 button. Button: `padding:10px`, radius 6, flex column `gap:2px`, text-left.
    - `"git {key}"` mono 600 14/20. Selected màu `--color-accent-dark`, khác `--color-text`.
    - Description 12/17 muted.
    - Selected: nền primary-light + inset 3px đỏ, `aria-current="true"`.
    - Hover `--color-surface-hover`. Focus outline 2px primary offset −2.
- **Detail** (`flex: 999 1 520px; min-width:0; padding: 28px 32px; gap: 20px`):
  1. `h1` mono 600 26/32 primary "git {key}" + `p` 15/22 description.
  2. Khối syntax:
     - Radius 8, nền terminal-bg, `padding: 10px 10px 10px 14px`, mono 14/20, `gap: 12px`.
     - Nội dung: `$` prompt + syntax (`flex:1`, `user-select: all`) + nút Copy.
     - Nút Copy: 30h, `padding: 0 12px`, viền `--color-terminal-control`, nền `--color-terminal-dock`, chữ terminal-text 500 12. Hover `--color-terminal-latest`. Focus outline 2px prompt.
     - Nhãn: "Copy" → "✓ Copied" trong 1.5s khi `navigator.clipboard.writeText` thành công (X-7).
  3. Grid `repeat(auto-fit, minmax(260px,1fr))`, `gap:16`:
     - Card "What changes": `padding: 14px 16px`, viền, radius 8, surface. Eyebrow primary, 14/21 effect.
     - Card "Gotcha": viền `--color-warning-border`, nền `--color-warning-light`. Eyebrow `--color-warning-strong` + vòng 16 nền warning "!" trắng 700 11. Text 14/21 gotcha.
  4. Grid `repeat(auto-fit, minmax(300px,1fr))`, `gap:16`, hai `figure` (viền, radius 10, trắng):
     - figcaption 38h eyebrow muted "BEFORE" / "AFTER".
     - AFTER có thêm chip thay đổi: mono 600 11, chữ `--color-accent-dark`, nền `--color-accent-light`, radius 4, `padding: 4px 6px`, không uppercase.
     - Thân `min-height: 280px`, dot-grid, căn giữa, GraphView s=1.2.
     - AFTER dùng `changed` (commit mới), `changedEdges`, `parentLabels`.

**Dữ liệu (không đổi):**

- Nội dung từ `commands-ref/data.ts`.
- After từ `referenceAfter(entry)` (engine thật).
- Chip thay đổi tính thuần từ before/after:
  - `+ commit {id}` cho mỗi commit mới;
  - `+ branch {b}` cho branch mới;
  - `{b} → {id}` khi branch đổi đích;
  - `HEAD → {ref}` hoặc `HEAD detached @ {id}` khi HEAD đổi.
- `referenceAfter` trả `null`: figure After hiện "Example unavailable." (copy hiện có), không chip.

**Interaction:**

- Click/Enter trên item rail: đổi lệnh, reset nhãn Copy.
- Không có ←/→ trong rail (prototype không có). Đây là danh sách nút, không phải tablist.

**Responsive:**

- < 900px: rail full width ở trên, detail ở dưới (flex-wrap).
- Hai figure tự xếp dọc khi detail < 616px.
- TO_VERIFY: chưa có screenshot 390. UI_POLISH_SPEC đề xuất accordion; **không** dùng accordion (không có trong prototype).

**States:**

| State | Hành vi |
|---|---|
| loading/empty | Không áp dụng (dữ liệu tĩnh) |
| error | "Example unavailable."; clipboard lỗi (X-7) |
| offline | Đầy đủ |

**Acceptance:**

- **R-1** Mở tab: chọn sẵn `commit`. Tiêu đề "git commit" mono 26px `#273896`; item rail có inset đỏ.
- **R-2** Hiện đủ syntax, description, effect, gotcha từ `data.ts` (so khớp chuỗi).
- **R-3** After của `commit` có chip `+ commit c…` và ring đỏ r=23 quanh commit mới, edge mới màu `#ed1c24`.
- **R-4** After của `merge` có nhãn "1st parent"/"2nd parent".
- **R-5** Copy khi clipboard khả dụng: nhãn "✓ Copied" rồi về "Copy" sau 1.5s ± 0.1s. Khi clipboard reject: nhãn giữ "Copy".
- **R-6** Ở 1440×900, bố cục khớp `reference-1440x900.png` theo mục 7.

---

### 4.4 Verification

**Reference:** `verification-1440x900.png`, `verification-1440x900-fullpage.png`, `verification-390x844.png`, `verification-390x844-fullpage.png`.

Screenshot dùng sample data trùng một phần với report thật. Mọi số phải tính từ `public/verification.json` qua `loadVerificationReport()`.

**Layout** (`main`: `max-width:1160px; margin:0 auto; padding: 36px 24px 56px; gap: 28px`):

1. **Kết luận** (`gap:10`):
   - Eyebrow `--color-accent-dark` "VERIFICATION REPORT".
   - `h1` 600 28/34 primary, `text-wrap: pretty`:
     - `failed === 0`: "The engine matched real Git on all {totalCases} test cases."
     - Ngược lại: "The engine diverged from real Git in {failed} of {totalCases} cases." (copy của UI_POLISH_SPEC 5.5).
   - Hàng provenance 13/18 muted, flex-wrap `gap: 8px 18px`:
     - "Generated **{dd Mon yyyy, HH:mm} UTC**" (500 text);
     - "Commit `{sha7}`" + nút secondary nhỏ "Copy full SHA" (500 11, `padding: 4px 6px`, radius 4) → "✓ Copied" 1.5s;
     - "Compared against `git {gitVersion bỏ tiền tố 'git version '}`";
     - "Node `{nodeVersion}`".
2. **Stat cards** — grid `repeat(auto-fit, minmax(200px,1fr))`, `gap:12`. Card: `padding:16`, radius 10, `gap:6`, flex column; nhãn 13/1; số mono 600 28/1; sub 12/16.

   | Card | Style | Số | Sub |
   |---|---|---|---|
   | Cases passed | success nếu `failed === 0`, accent nếu > 0 | `{passed}` + `" / {totalCases}"` (16px) | "Repository state identical to git" (chỉ khi failed = 0; khi > 0: TO_VERIFY copy, mặc định ẩn sub) |
   | Hard divergences | success nếu 0, accent nếu > 0 | `{failed}` | "No commit, branch or HEAD mismatch" (khi 0; > 0: TO_VERIFY) |
   | Soft output warnings | warning | `{warnings}` | "Message text differs; counted per step" |
   | Run | neutral (surface, viền border, số primary) | `formatDuration(durationMs)` → "18m 42s" | "Depth {exhaustiveDepth} exhaustive + {randomCases} random · seed {seed}" |

3. **Định nghĩa**:
   - Grid `repeat(auto-fit, minmax(240px,1fr))`, `gap:1px`, nền `--color-border` (tạo đường kẻ), viền, radius 10. Ô nền trắng, `padding: 16px 18px`.
   - Tiêu đề 600 14/20 primary. Text 13/20 muted.
   - Ô: "Differential test"; "Hard divergence" (chấm 8px `--color-accent`); "Soft warning" (chấm warning).
   - Copy lấy nguyên văn prototype.
4. **Command coverage**:
   - `h2` "Command coverage" + 13/1 muted "Cases that use each command, of {totalCases}".
   - Grid `84px minmax(0,1fr) 56px`, `gap: 10px 14px`, mono 13/1.
   - 5 hàng theo thứ tự commit, branch, switch, checkout, merge.
   - Bar: cao 10, radius 3, track `--color-primary-light`, fill primary, rộng `coverage[k] / totalCases`.
   - Số căn phải, định dạng dấu phẩy nghìn.
5. **Performance at scale**:
   - `h2` + "Log–log · solid = median · dashed = p95" + spacer + Segmented Chart/Table.
   - Chart: grid `repeat(auto-fit, minmax(260px,1fr))`, `gap:12`, mỗi series một `figure` (`padding:14px 16px`, viền, radius 10, `gap:10`).
     - figcaption: nhãn series mono 600 14 + caption 12 muted (TO_VERIFY, xem dưới).
     - Series ≥ 2 điểm: SVG `viewBox 0 0 300 150`, trục `#858c99`, median `--color-primary` 2px liền, p95 `--color-accent` 2px `dasharray 5 4`, nhãn trục 10px muted (10², 10³ …, min/max ms). Giữ `<title>`/`<desc>`, `role="img"` + aria-label mô tả min–max.
     - Series 1 điểm: số mono 600 30 primary "{medianMs} ms" + mô tả 13/18 muted.
   - Table: `font-variant-numeric: tabular-nums`, cột Series / Commits (n) / Median (ms) / p95 (ms) / Iterations, số căn phải, head nền surface chữ primary, hàng viền trên.
   - Mặc định Chart.
6. **Divergences**:
   - `h2` + spacer + Segmented `[aria-label="Filter by severity"]`:
     - "All {N}" với N = `divergences.length` (19,377 hiện tại, **không phải** warnings);
     - "Hard {h}";
     - "Soft {s}".
     - Mặc định **Soft** (theo prototype). TO_VERIFY: nếu `h > 0` thì mặc định Hard.
   - Bảng (viền, radius 10). Mỗi dòng grid `repeat(auto-fit, minmax(200px,1fr))`, `gap: 8px 16px`, `padding: 12px 16px`, border-bottom, mono 13/19:
     - id muted + chip severity ("soft · output": warning-light/warning-border/warning-strong; hard: accent-light/accent/accent-dark, text "hard · {kind}");
     - "Commands" (nhãn 600 11/16 muted sans) + `commands.join(" → ")`;
     - "Real git" + expected;
     - "GitScope" + actual.
     - Text > 2 dòng thu gọn kèm "+{n} more lines" (UI_POLISH X5; report có expected tới 18 dòng).
   - Hard luôn trước soft.
   - Footer (`padding: 12px 16px`, nền surface, 13/1 muted): "Showing 1–{k} of {N}" + nút "Show 50 more" khi còn.
   - Filter Hard rỗng: dòng "✓ No hard divergences recorded — every case ends in the same commits, branches and HEAD as real git." (chip ✓ success).

**Định dạng (hàm thuần mới, có unit test):**

- `formatInt`: `en-US` dấu phẩy.
- `formatDuration(ms)`: làm tròn giây, `"{m}m {s}s"`, ≥ 1h thì `"{h}h {m}m"` (TO_VERIFY; report hiện 18m42s).
- `formatUtc(iso)`: `"30 Sep 2026, 08:07 UTC"`.
- `shortSha`: 7 ký tự.
- Caption chart: TO_VERIFY. Prototype ghi "12.5 ms @ 10⁴" cho layout (không phải điểm lớn nhất) và "32 ms @ 10²" cho SVG; quy tắc không suy ra được. Mặc định: hiện median tại n lớn nhất, dạng "{ms} ms @ 10^k".

**States:**

| State | Hành vi |
|---|---|
| loading | `role="status"` "Loading verification report…" (copy hiện có), cùng khung `max-width:1160`. Skeleton: TO_VERIFY; mặc định chỉ text |
| error (file thiếu / HTTP / JSON sai / schema sai) | Eyebrow + `h1` "Verification" + callout lỗi (nền accent-light, viền accent, tiêu đề 600 accent-dark "Report unavailable") chứa message nguyên văn từ `loadVerificationReport()` + nút secondary "Retry" gọi lại loader. Không hiện số liệu nào |
| evidence incomplete | Callout warning ngay dưới headline, copy hiện có "Verification evidence incomplete: …" |
| empty (0 divergences) | "No divergences recorded." (copy hiện có) |
| offline | fetch lỗi ⇒ error state với "Verification report could not be fetched." + Retry |

**Keyboard/focus:**

- Segmented dùng `role=tablist` + `aria-selected`.
- "Show 50 more" giữ focus trên chính nó sau khi thêm dòng.

**Acceptance:**

- **V-1** Với `public/verification.json` hiện tại: headline "The engine matched real Git on all 6,160 test cases."; "Generated 30 Sep 2026, 08:07 UTC"; "Commit 4448efb"; "Compared against git 2.43.0"; "Node v24.21.0"; Run "18m 42s".
- **V-2** Filter "All 19,377"; stat Soft "19,806". Không có chỗ nào hiện "All 19,806".
- **V-3** Lần đầu render tối đa 50 dòng divergence (đếm DOM). Main thread không block > 200ms khi mở tab (TO_VERIFY đo bằng Performance panel).
- **V-4** Xóa/đổi tên `verification.json`: hiện callout "Report unavailable" + "Verification report file is missing." + Retry, không crash, không số liệu.
- **V-5** Chart/Table toggle giữ `<title>` và `<desc>` cho mỗi SVG.
- **V-6** Ở 390×844: stat cards 1 cột, định nghĩa 1 cột, coverage 3 cột giữ nguyên, không cuộn ngang.

---

### 4.5 Intro splash

**Reference:**

- Chuyển động và timing: `docs/design/INTRO_MOTION_SPEC.md` (chuẩn). Mục này chỉ bổ sung phần ánh xạ vào app.
- Screenshot `intro-*.png`.
- `motion/video-intro-load-to-app-1440x900.mp4`.
- Media: `artifacts/prototype-handoff/production-assets/REPORT.md`.

Code hiện tại (`src/app/Intro.tsx`, `introBehavior.ts`, `layout.css`, chưa commit) đã triển khai phần lớn. Slice S1 (mục 8) chỉ đối chiếu và sửa chênh lệch.

**Layout:**

- `div.intro[role=dialog][aria-modal=true][aria-labelledby="intro-title"]`, `position:fixed; inset:0` (**không** left/top âm), `z-index: var(--z-intro)`, nền `#fff`, flex column center, `gap:14px`, `padding:24px`, `overflow:hidden`.
- Thứ tự con:
  1. Slot logo `min(360px,72vw)` × 360/150, `overflow:hidden`, chứa `usth-logo.png` (`width:100%; height:auto; margin-top:-29%`), alt "USTH — Vietnam France University".
  2. Slot media `min(440px,86vw)` × 16/10: poster + video chồng nhau, `object-fit: contain`.
  3. `h1#intro-title` "GitScope" 700 28/34 primary + `p` 15/22 muted max 40ch.
  4. CTA.
  5. Hint "or press Enter" 12/16 muted.

**Copy (LOCKED theo quyết định English-only):**

- "Learn Git by typing commands and watching the commit graph change."
- "Click to begin →"
- "or press Enter"

Các đoạn này dùng ngôn ngữ mặc định tiếng Anh của tài liệu (`lang="en"` nếu cần khai báo cục bộ). Bản tiếng Việt trong screenshot prototype chỉ là visual placeholder; giữ nguyên vai trò, số dòng và hierarchy khi dùng copy tiếng Anh.

**Timing:** xem INTRO_MOTION_SPEC §3, §5. Giá trị trong `layout.css` hiện khớp:

| Phần tử | Animation |
|---|---|
| logo | 1s `cubic-bezier(.2,.8,.2,1)` |
| media | 800ms, delay 500 |
| copy | 700ms, delay 800 |
| CTA | 600ms, delay 1100 + pulse 2.4s, delay 2s ∞ |
| hint | 600ms, delay 1300 |
| exit | 450ms `cubic-bezier(.4,0,1,1)` |
| unmount | 460ms (reduced: 10ms) |

**Media (LOCKED):**

- Poster: `/assets/intro/intro-messy-files-poster.png` (880×550, 47 KB, frame 0 của video). Luôn render.
- Video: `<video muted playsinline preload="auto" autoplay aria-hidden tabindex=-1>` với `<source webm>` trước, `<source mp4>` sau, từ `/assets/intro/`.
- Poster ẩn (opacity 0) khi video `playing`.
- `ended`: `currentTime = 1.0667` rồi `play()` (chỉ lặp đoạn idle; REPORT.md §3).
- Không dùng thuộc tính `loop`.

**Trigger thoát:**

- Click CTA.
- Enter (listener ở `window` trong suốt thời gian intro hiện, kể cả khi CTA chưa nhận focus — hint hứa "nhấn Enter").
- Space khi CTA đang focus (hành vi native của button).
- Không thoát khi click ngoài CTA (X-4). Không Escape (INTRO_MOTION_SPEC §4).
- TO_VERIFY: Escape có nên đóng không; mặc định không.

**Focus:**

- CTA nhận focus khi `animationend` của `intro-fade-in` (≈1700ms), không có vòng focus (`data-intro-autofocus`).
- Vòng hiện lại sau keydown đầu tiên hoặc blur.
- Tab/Shift+Tab bị giữ trong dialog; app phía sau `inert`.
- Sau khi đóng: focus `#terminal-input` của tab hiện tại, nếu không có thì `body` (code hiện có).

**Reduced motion:**

- Animation ≈ 0.
- Không render/không phát video; chỉ poster.
- Exit 10ms.
- Nghe `change` của media query (code hiện có).

**Media failure:**

| Tình huống | Hành vi |
|---|---|
| `error` của video, hoặc `play()` reject | `mediaState = failed`, bỏ video, poster giữ nguyên, bố cục không đổi |
| Poster lỗi | Slot giữ kích thước, trống. Không có alt hiển thị vì poster `alt=""` |
| Logo lỗi | Alt text trong slot |
| Offline lần tải đầu | Không áp dụng (app không tải được). Offline sau khi tải: video/poster đã cache của trình duyệt thì chạy; không cache thì như lỗi |

**Không bao giờ:**

- Tải Rive, `@rive-app/*`, unpkg hay bất kỳ CDN nào.
- Đưa `messy-files.riv` vào `public/`, `src/` hoặc `docs/`.
- Persist trạng thái "đã xem intro" (không có yêu cầu). TO_VERIFY: intro hiện mỗi lần tải trang; mặc định vậy.

**Acceptance:**

- **I-1** 0 request ra ngoài origin khi tải trang (Network panel). Không có request `.riv`.
- **I-2** Ở 1440×900, khi animation pause tại 0/500/1300ms và CTA ready, ảnh khớp `intro-*-1440x900.png` theo mục 7 (vùng media so với poster, xem 7.3).
- **I-3** Dialog `getBoundingClientRect()` = `[0,0,vw,vh]` ở 1440×900 và 390×844.
- **I-4** Ở 390×844, logo slot `[55,157,281,117]` ±2px, CTA cao 48, không phần tử nào tràn ngang.
- **I-5** CTA nhận focus ở 1700 ± 50ms; `outline-style` là `none` khi tự focus, và `solid` màu `#273896` sau Shift+Tab, Tab.
- **I-6** Enter ở t=500ms (trước khi CTA focus) đóng intro. Unmount ở 460–500ms. Focus vào `#terminal-input`.
- **I-7** Click vào slot media không đóng intro.
- **I-8** Reduced motion: không có phần tử `<video>`; mọi phần tử ở trạng thái cuối ngay; Enter đóng trong ≤ 50ms.
- **I-9** Chặn `/assets/intro/*.webm` và `*.mp4`: poster vẫn hiển thị; không lỗi console chưa bắt.
- **I-10** Tab/Shift+Tab không đưa focus ra ngoài dialog.

---

## 5. Component inventory

Ký hiệu: **K** = giữ nguyên; **S** = sửa (chỉ trình bày); **N** = tạo mới. "Không đổi" = không chạm logic nghiệp vụ.

| Component / file | Trạng thái | Việc cần làm | Props / state |
|---|---|---|---|
| `src/app/layout.css` | S | Thêm token 2.1 (mới), `--z-*`, `--app-header-h`, `--dur-halo`, `--dur-banner`. Header navy (3.2). Keyframes `node-in`, `halo`, `fade-in`, `pulse` (đã có một phần) | — |
| `src/app/App.tsx` | S | Chỉ style header/tab/badge. Logic tab, intro, focus giữ | — |
| `src/app/tabNavigation.ts` | K | — | — |
| `src/app/Intro.tsx` + `introBehavior.ts` | S (nhỏ) | Enter ở `window` khi intro hiện; bỏ click dismiss (nếu có); giữ copy English-only; z-index token | Hiện có: `mediaState`, `leaving`, `keyboardUsed`, `reducedMotion` |
| `src/app/store.ts` | S (tối thiểu) | `run()` trả thêm kết quả để Terminal gắn output vào entry: `{ accepted: boolean; ok: boolean; output: string[] }`. Reducer và `AppState` không đổi hành vi | Undo/Redo đọc `state.past.length` / `state.future.length` (đã có trong `HistoryState`) |
| `src/app/levelStore.ts` | S (tối thiểu) | Cần một cách đồng bộ để lấy output của lệnh vừa chạy (ví dụ dispatch qua ref như `useRepo`, hoặc Terminal đọc phần `output` mới thêm). **Không** đổi `levelReducer` | — |
| `src/app/Practice.tsx` | S | Bố cục 4.1, graph header, Undo/Redo/Reset, `newId`, khóa input không dùng `disabled` | local: `newId`, `terminalKey` |
| `src/terminal/Terminal.tsx` | S | Unified log, empty state, examples, dock, Run, hint, trạng thái error/locked, autoscroll | props: `onCommand(cmd) → {accepted, ok, output} \| false`, `locked`, `variant: "practice" \| "level"`, `examples: string[]`, `placeholder`, `hint`, `emptyText`, `showHistoryHint` |
| `src/terminal/session.ts` | S (tối thiểu) | `TerminalEntry` thêm `output: string[]` và `isError: boolean`. Logic lịch sử ↑↓ không đổi | — |
| `src/terminal/parse.ts` | K | — | — |
| `src/viz/layout.ts` | K | Không đổi | — |
| `src/viz/GraphView.tsx` | S | Render 4.0.3: scale x, edge cubic, node r16, nhãn cắt, halo, dashed, changed, parentLabels, focus ring, kích thước SVG theo `s` | props: `state`, `scale?` (1.35), `newId?`, `dashed?: Set<id>`, `changed?: Set<id>`, `changedEdges?: Set<"from>to">`, `parentLabels?: boolean`, `label?` |
| `src/viz/CommitNode.tsx` (rỗng) | N | Tách node khỏi GraphView | `id`, `x`, `y`, `kind: normal\|head\|detached`, `dashed`, `isNew`, `changed`, `title`, `ariaLabel` |
| `src/viz/edges.tsx` (rỗng) | N | Path thẳng/cubic + parent label | `from`, `to`, `index`, `changed`, `dashed`, `showLabel` |
| `src/viz/RefLabel.tsx` | S (thay toàn bộ phần vẽ) | Chip bên phải node theo 4.0.3 | `kind: "headAttached"\|"branch"\|"detached"`, `name?`, `x`, `y` |
| `src/viz/MiniGraph.tsx` | S | Truyền `scale=1.2` và prop changed | — |
| `GraphPanel`, `HeadChip`, `Legend`, `GraphEmpty` | N (`src/viz/` hoặc `src/app/`) | 4.0.2, 4.0.4, 4.0.5 | `GraphPanel`: `header: ReactNode`, `padding`, `children` |
| `Button`, `SegmentedControl` | N (`src/app/ui/` hoặc cùng file) | 4.0.6. Không thêm thư viện | `SegmentedControl`: `options: {value,label}[]`, `value`, `onChange`, `ariaLabel` |
| `src/levels/Levels.tsx` | S | Bố cục 4.2, breakpoint 900 (hook `matchMedia`), focus input/Next, view Current/Target | local: `view`, `narrow` |
| `src/levels/LevelList.tsx` | S | Rail item 4.2 | thêm `completedCount` |
| `LevelPicker` (select < 900) | N | 4.2 | `levels`, `progress`, `selectedId`, `onSelect` |
| `src/levels/LevelPanel.tsx` | S | Tách thành `LevelBrief` + `CompletionBanner` + workspace | — |
| `LevelBrief`, `CompletionBanner` | N | 4.2 | `level`, `commandCount`, `status: "progress"\|"complete"\|"replay"`, `onReset`; banner: `count`, `next?: Level`, `onNext`, `nextRef` |
| Hàm `structuralSignatures` / `missingInCurrent(current, target)` | N (thuần) | Tính node dashed cho view Target. **Không** đổi `check()` | trả `Set<id>` |
| `src/levels/check.ts`, `schema.ts`, `state.ts`, `data/*.json` | K | — | — |
| `src/commands-ref/CommandRefPanel.tsx` | S | Master–detail 4.3 | local: `selected`, `copied` |
| `src/commands-ref/MiniDiagram.tsx` | S | Hai figure + chip thay đổi | — |
| `refChanges(before, after)` | N (thuần) | Chip "+ commit …" v.v. | trả `string[]`, cùng `changed`/`changedEdges` |
| `src/commands-ref/data.ts`, `referenceAfter.ts` | K | — | — |
| `src/verification/VerificationTab.tsx` | S | Bố cục 4.4, error + Retry. `loadVerificationReport` giữ nguyên (chỉ thêm gọi lại) | local: `filter`, `view`, `visible` (50·k), `shaCopied` |
| `src/verification/DiffTestSummary.tsx` | S | Thành StatCards + Coverage | — |
| `src/verification/ScalingChart.tsx` | S | Small multiples 300×150 + Table | `series`, `view` |
| `Definitions`, `DivergenceList`, `format.ts` (`formatInt`, `formatDuration`, `formatUtc`, `shortSha`, `gitVersionLabel`) | N | 4.4 | — |
| `src/verification/report.ts` | K | — | — |
| `src/core/**`, `src/progress/**`, `harness/**` | K | Không chạm | — |

Dependency: **không thêm**. Clipboard dùng `navigator.clipboard`. Media query dùng `window.matchMedia`. Không thêm Playwright vào `package.json` (mục 7.4).

---

## 6. Intro animation — ràng buộc media

- Nguồn chuẩn cho chuyển động: `docs/design/INTRO_MOTION_SPEC.md`.
- Asset production (đã có trong `public/assets/intro/`, chưa commit):

  | File | Kích thước | Ghi chú |
  |---|---|---|
  | `intro-messy-files.webm` | 278,445 B | VP9, alpha, 880×550, 30 fps, 2.4 s |
  | `intro-messy-files.mp4` | 310,334 B | H.264 High, nền `#fff` |
  | `intro-messy-files-poster.png` | 48,046 B | |
  | `usth-logo.png` | 25,889 B | |

  Checksum và số đo: `artifacts/prototype-handoff/production-assets/REPORT.md`.
- Fallback theo thứ tự:
  1. WebM (alpha) → MP4 (Safari, nền trắng trùng nền intro).
  2. Poster PNG luôn nằm dưới.
  3. Khi lỗi, chỉ poster.
- Reduced motion: chỉ poster (X-10).
- Không CDN, không backend, không `.riv` trong production (X-9). Kiểm bằng `grep -r "unpkg\|rive\|\.riv" src public dist` phải rỗng (trừ tên file `intro-messy-files*`).
- Tổng dung lượng media intro ≈ 663 KB.
  - Webm/mp4 chỉ tải một trong hai.
  - TO_VERIFY: ảnh hưởng tới mục tiêu "Tải lần đầu < 2 s" (TECHNICAL_OVERVIEW §9.2). Nếu vượt, cân nhắc `preload="metadata"`.
- Poster production (frame 0, collage) khác poster của prototype (frame idle). Đây là quyết định đã khóa ở bước export (REPORT.md §5.2).
  - Ảnh `intro-0000/0500/1300` và `intro-rive-fallback` chụp poster cũ, nên vùng media sẽ khác. Mục 7.3 loại trừ vùng này khỏi so sánh pixel.

---

## 7. Visual verification matrix

### 7.1 Môi trường chụp (LOCKED)

- Chromium (Playwright) headless, `deviceScaleFactor: 1`.
- Font map: `system-ui`/`sans-serif` → Noto Sans; `monospace`/`ui-monospace` → Liberation Mono. Đây là môi trường đã chụp reference.
- localStorage rỗng. Vào app bằng Enter trên intro.
- Tab khác Practice: blur focus của nút tab sau khi click.
- Animation chờ tĩnh (≥ 1.6 s sau thao tác).

### 7.2 Ma trận

| # | Route (tab) | Viewport | Reference | Trạng thái cần dựng | So sánh |
|---|---|---|---|---|---|
| 1 | intro | 1440×900 | `intro-0000ms-1440x900.png` | Pause animation tại 0ms | Toàn trắng |
| 2 | intro | 1440×900 | `intro-0500ms-1440x900.png` | 500ms | Logo slot vị trí/opacity; media/copy/CTA vô hình |
| 3 | intro | 1440×900 | `intro-1300ms-1440x900.png` | 1300ms | Vị trí slot, title, CTA đang fade |
| 4 | intro | 1440×900 | `intro-cta-ready-1440x900.png` | ≥ 1900ms, pause pulse tại 2000 | Toàn bộ trừ nội dung slot media |
| 5 | intro | 1440×900 | `intro-cta-keyboard-focus-1440x900.png` | Như 4 + Shift+Tab, Tab | Vòng focus CTA 2px `#273896` offset 3 |
| 6 | intro | 390×844 | `intro-cta-ready-390x844.png` | Như 4 | Logo không tràn, CTA 48h |
| 7 | intro | 1440×900 | `intro-reduced-motion-1440x900.png` | `reducedMotion: reduce` | Trạng thái cuối ngay; slot media = poster |
| 8 | intro | 1440×900 | `intro-rive-fallback-1440x900.png` | Chặn webm/mp4 | Poster giữ, bố cục không đổi |
| 9 | practice | 1440×900 | `practice-1440x900.png` | Mặc định (log rỗng) | Header, panel, terminal empty, graph empty, legend, focus input |
| 10 | practice | 390×844 | `practice-390x844.png` | Mặc định | Graph trên terminal. **Header lệch có chủ đích (X-1)** |
| 11 | levels | 1440×900 | `levels-1440x900.png` | Level 01, chưa chạy lệnh | Rail, brief, workspace |
| 12 | levels | 1024×768 | `levels-completed-1024x768.png` | Level 01 + `git commit -m "first"`, cuộn về đầu | Banner, chip Matches, rail ✓, badge 1/8. Focus ở Next (X-5; reference không có vòng focus) |
| 13 | levels | 390×844 | `levels-390x844.png` | Level 01 | Select, brief, graph. Header X-1 |
| 14 | reference | 1440×900 | `reference-1440x900.png` | `commit` chọn | Rail, detail, Before/After |
| 15 | verification | 1440×900 | `verification-1440x900.png` (+ fullpage) | Report thật | Bố cục, card, bars. **Số và copy divergence khác sample (X-8)** |
| 16 | verification | 390×844 | `verification-390x844.png` (+ fullpage) | Report thật | Card 1 cột, không cuộn ngang |
| 17 | Commit motion | 1440×900 | `motion/video-commit-graph-animation-1440x900.mp4` | 6 lệnh như video | Node-in 300ms, halo 1.4s, slide 300ms, khóa input |
| 18 | Level complete motion | 1440×900 | `motion/video-level-complete-transition-1440x900.mp4` | Level 01 → Next | Banner fade 250ms, badge/rail cập nhật tức thì |
| 19 | Intro motion | 1440×900 | `motion/video-intro-load-to-app-1440x900.mp4` | Tải trang → Enter | Timeline INTRO_MOTION_SPEC |

### 7.3 Tolerance

| Thuộc tính | Mức chấp nhận |
|---|---|
| Màu vùng phẳng (nền header, panel, chip, nút) | Khớp chính xác hex token (`getComputedStyle`) |
| Vị trí/kích thước khối (panel, rail, header, card, slot intro) | ±2 px ở cùng môi trường 7.1 |
| Chữ (baseline, độ rộng) | Không so pixel. So nội dung chuỗi, font-size, weight, màu bằng DOM |
| Pixel diff toàn trang | Chỉ dùng tham khảo. Mask: vùng graph SVG, slot media intro, vùng số liệu Verification, header ở 390 (X-1). Ngưỡng: ≤ 1% pixel lệch > 16/255 sau mask. TO_VERIFY: ngưỡng này chưa được hiệu chỉnh trên implementation thật |
| Graph | So bằng DOM: bán kính 16, màu fill/stroke, vị trí chip `x+30`, bước 24, cubic giữa lane, tọa độ `x' = 2(x−40)+40` |
| Timing motion | ±1 frame (16.7 ms) cho delay/duration CSS (đo bằng `getAnimations()`). Focus CTA ±50ms. Unmount intro 460–500ms |
| Media intro | So với poster/video production, không so với Rive của screenshot |

### 7.4 Công cụ

- Không thêm dependency vào `package.json`.
- Capture scripts tham chiếu ở `artifacts/prototype-handoff/capture-scripts/` (dùng Playwright cài global, ngoài repo). Chạy chúng trỏ vào `npm run build && vite preview` để lấy ảnh so sánh.
- TO_VERIFY: nếu nhóm muốn visual test trong CI, phải quyết định thêm `@playwright/test` (dependency mới) bằng một issue riêng.
- Kiểm tra DOM/logic (focus, class, aria, định dạng số) viết bằng Vitest hiện có (`renderToStaticMarkup` như `App.test.ts`) và hàm thuần.

---

## 8. Implementation slices

Mỗi slice là 1 PR nhỏ. Thứ tự theo phụ thuộc.

Mỗi PR chạy: `npm run typecheck`, `npm test`, `npm run build`, `npm run lint:imports`. Không PR nào chạm `src/core/**`, `src/progress/**`, `src/viz/layout.ts`, `harness/**`, `public/verification.json`.

| Slice | Phạm vi | File dự kiến | Acceptance | Validation thêm |
|---|---|---|---|---|
| **S0 — Tokens & shell** (không phụ thuộc) | Token mới 2.1; `--z-*`, `--app-header-h`; header navy + tab + badge; sticky | `src/app/layout.css`, `src/app/App.tsx`, `src/app/App.test.ts` | SH-1…SH-5 | Ma trận #9 (chỉ header), #10 (header X-1) |
| **S1 — Intro alignment** (sau S0) | Đối chiếu code intro hiện có với 4.5; Enter ở window; không click-dismiss; giữ copy English-only; z-index; không CDN | `src/app/Intro.tsx`, `introBehavior.ts`, `Intro.test.ts`, `layout.css`, `public/assets/intro/*` (commit asset) | I-1…I-10 | Ma trận #1–8, #19; `grep` CDN/.riv rỗng |
| **S2 — Graph primitives** (sau S0) | GraphView/CommitNode/edges/RefLabel/MiniGraph theo 4.0.3; props mới; focus node | `src/viz/GraphView.tsx`, `CommitNode.tsx`, `edges.tsx`, `RefLabel.tsx`, `MiniGraph.tsx`, `GraphView.test.ts`, `animation.test.ts` | Test: `x' = 2(x−40)+40`; chip `x=30`, bước 24; id > 4 ký tự bị cắt; `<title>` đầy đủ; halo chỉ trên `newId`; `layout.test.ts` + `npm run bench` không đổi | `npm run bench` so số với report hiện tại (không kỳ vọng thay đổi) |
| **S3 — Terminal unified log** (sau S0) | Entry có output; empty/examples; dock + Run + hint; error/locked không `disabled`; autoscroll | `src/terminal/Terminal.tsx`, `session.ts`, `Terminal.test.ts`, `src/app/store.ts` (`run` trả kết quả), `store.test.ts` | P-2, P-4 (phần terminal), T7 giữ nguyên | Test thứ tự DOM entry; ↑↓ vẫn pass |
| **S4 — Practice screen** (sau S2, S3) | Bố cục 4.1; GraphPanel/HeadChip/Legend/GraphEmpty; Undo/Redo/Reset; `newId`; Button/Segmented dùng chung | `src/app/Practice.tsx`, `Practice.test.ts`, thành phần mới trong `src/viz/` hoặc `src/app/ui/` | P-1…P-8 | Ma trận #9, #10, #17 |
| **S5 — Levels screen** (sau S4) | Rail/select (900), brief, banner, workspace, Current/Target + dashed, Matches chip, focus input/Next | `src/levels/Levels.tsx`, `LevelList.tsx`, `LevelPanel.tsx`, `LevelBrief.tsx`, `CompletionBanner.tsx`, `LevelPicker.tsx`, `src/app/levelStore.ts` (chỉ cách lấy output đồng bộ), hàm `missingInCurrent`, test tương ứng | L-1…L-8; `levelStore.test.ts` + `check.test.ts` không sửa assertion | Ma trận #11–13, #18 |
| **S6 — Reference screen** (sau S2) | Master–detail, syntax + Copy, cards, figures + chip thay đổi | `src/commands-ref/CommandRefPanel.tsx`, `MiniDiagram.tsx`, `refChanges.ts` (+ test), `CommandRefPanel.test.tsx` | R-1…R-6 | Ma trận #14 |
| **S7 — Verification screen** (sau S0) | Kết luận, provenance, cards, định nghĩa, coverage, perf chart/table, divergences filter + phân trang, error + Retry | `src/verification/VerificationTab.tsx`, `DiffTestSummary.tsx`, `ScalingChart.tsx`, `format.ts` (+ test), `DivergenceList.tsx`, test hiện có | V-1…V-6; `VerificationTab.test.ts` + `report.test.ts` giữ pass | Ma trận #15, #16; thử xóa `verification.json` |
| **S8 — Cross-cutting QA** (cuối) | axe-core thủ công 4 tab + intro; reduced motion; offline (tắt mạng sau tải, làm hết level 01); so sánh ma trận 7.2 đầy đủ; cập nhật `docs/STATUS.md` nếu cần | Chỉ tài liệu/báo cáo, không code mới | 0 vi phạm contrast AA; không request ngoài origin; mọi mục ma trận đạt 7.3 hoặc được ghi lệch | `npm run build` + `vite preview` + capture scripts |

S2, S3, S6, S7 có thể làm song song sau S0. S4 cần S2 + S3. S5 cần S4.

---

## 9. Ngoài phạm vi

- Không làm: `add`, authentication, server, sync, level mới, lệnh mới, autocomplete, zoom/kéo graph, dark mode, router, onboarding tour, lưu trạng thái intro.
- Không đổi: engine, parser, output/error text của engine, `layout()`, level JSON, checker, progress format, report schema, `GRAPH_ANIMATION_MS`, tab id.
- Không copy sample data của prototype. Bao gồm: commit trong ví dụ, divergence d1–d3, "prototype sample", perf numbers, sha/timestamp hardcode, `gitscope-engine.js` levels.
- Không dùng `docs/design/reference/*.js` làm code production.

---

## 10. Tóm tắt các giá trị UNKNOWN / TO_VERIFY

| # | Mục | Mặc định nếu chưa quyết |
|---|---|---|
| 1 | Hover tab trên header navy (3.2) | Chữ trắng, không đổi nền |
| 2 | Copy intro tiếng Việt vs English-only (4.5) | Đã chốt English-only; bản tiếng Việt chỉ là visual placeholder |
| 3 | Banner complete biến mất sau lệnh tiếp theo (4.2) | Theo reducer hiện có |
| 4 | Practice 1024×768, Reference 390×844: không có screenshot | Theo flex-wrap của prototype |
| 5 | Caption chart Verification (4.4) | Median tại n lớn nhất |
| 6 | Copy sub-card khi `failed > 0` (4.4) | Ẩn sub |
| 7 | Mặc định filter divergence khi có hard (4.4) | Soft; đề xuất Hard nếu h > 0 |
| 8 | `formatDuration` ≥ 1h | `"{h}h {m}m"` |
| 9 | Skeleton loading Verification | Chỉ text status |
| 10 | Contrast các cặp mới (2.1) | Phải đo bằng axe trước khi merge S0 |
| 11 | Ngưỡng pixel diff (7.3) | 1% sau mask, chỉ tham khảo |
| 12 | Escape đóng intro; intro mỗi lần tải | Không; có |
| 13 | Error boundary cho GraphView | Không thêm |
| 14 | Ảnh hưởng 663 KB media tới mục tiêu tải < 2 s | Đo ở S8 |
| 15 | Visual test tự động trong CI (dependency mới) | Không; thủ công bằng capture scripts |
| 16 | Lý do divergences.length (19,377) ≠ warnings (19,806) | Hiển thị cả hai đúng nguồn; không giải thích bằng suy đoán |
