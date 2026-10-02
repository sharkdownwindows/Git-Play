# GitScope — Visual Fidelity Review

- Ngày review: 2026-10-01.
- Loại: fidelity review. Không redesign, không đề xuất feature hay phong cách mới.
- Đối chiếu với:
  - Reference: `docs/design/screenshots/*.png` (corrected prototype).
  - Spec: `docs/design/UI_IMPLEMENTATION_SPEC.md` (gọi tắt "spec").
- Implementation: 16 screenshot do người dùng gửi trong cuộc trò chuyện ngày 2026-10-01. Các ảnh này **không** được lưu trong repo. Cột "Ảnh implementation" ở dưới mô tả từng ảnh để truy lại.

Tài liệu này chuyển nguyên kết quả review; không review lại.

---

## 1. Phương pháp và giới hạn

- **Cách so sánh:**
  - Ghép từng cặp ảnh reference / implementation cạnh nhau.
  - Lấy màu pixel tại các điểm cố định.
  - Đo khung bao nội dung bằng ngưỡng khác nền trắng (> 30/765).
- **Font:** ảnh implementation render bằng font Ubuntu (máy người dùng), reference render bằng Noto Sans + Liberation Mono (spec §7.1). Lệch chữ 1–5px vì font **không tính** là lỗi (spec §7.3).
- **JPEG:** ảnh implementation là JPEG. Màu vùng phẳng có thể lệch vài đơn vị. CTA intro trong cùng bộ ảnh đo ra `#c9161c` (đúng `#c9151c`), nên các độ lệch lớn hơn mức đó được coi là thật.
- **Viewport mobile:** ba ảnh mobile của implementation là 375×812, không phải 390×844 như ma trận spec §7.2. Các ảnh đó không so 1:1 được với reference 390×844.
- **Không kiểm được từ ảnh tĩnh** (xem mục 6):
  - timeline intro 0/500/1300 ms;
  - thời điểm CTA nhận focus;
  - unmount intro;
  - animation tạo commit;
  - khóa input 300ms;
  - trạng thái loading Verification;
  - offline.

Thang mức độ:

- **P0**: sai layout, sai source data, interaction hỏng, lỗi offline hoặc accessibility.
- **P1**: màu, spacing, typography hoặc animation khác rõ.
- **P2**: sai lệch nhỏ, không ảnh hưởng demo.

---

## 2. Viewport và ảnh đã kiểm tra

| Screen | Viewport | Ảnh implementation (mô tả) | Ảnh reference | Kết quả |
|---|---|---|---|---|
| Intro | 1440×900 | Intro CTA ready, copy tiếng Anh | `intro-cta-ready-1440x900.png` | **Pass** hình học (≤ 3px); **Fail** copy (F-14) |
| Intro | 1024×768 | Intro CTA ready | Không có reference 1024 | Không so pixel; cùng cấu trúc với 1440 |
| Intro | 390×844 | Intro CTA ready | `intro-cta-ready-390x844.png` | **Pass** hình học (≤ 2px, title lệch 5px do font); **Fail** copy (F-14) |
| Practice | 1440×900 | Mặc định, log rỗng (2 ảnh trùng nhau) | `practice-1440x900.png` | **Pass** layout/màu; **Fail** focus (F-3, F-4) |
| Practice | 1440×900 | Có tên branch dài | Không có state tương ứng | Quan sát responsive header graph (F-20) |
| Practice | 1024×768 | Có tên branch dài | Không có reference 1024 | Quan sát (F-19, F-20) |
| Practice | 390×844 | Có tên branch dài | `practice-390x844.png` (state khác) | **Fail** khả năng đọc graph (F-19); P2 header (F-20) |
| Levels | 1440×900 | Level 01 đã hoàn thành | `levels-1440x900.png` (state mặc định) | Layout cột lệch (F-2); màu nút Next (F-8) |
| Levels | 1024×768 | Level 01 đã hoàn thành | `levels-completed-1024x768.png` | **Fail** layout workspace (F-1); màu Next (F-8) |
| Levels | 375×812 | Level 01 đã hoàn thành, cuộn | `levels-390x844.png` (viewport/state khác) | **Pass** banner/focus Next; màu Next (F-8); viewport sai (F-21) |
| Reference | 1440×900 | `git commit` chọn | `reference-1440x900.png` | **Fail** mũi tên và chiều cao figure (F-10, F-12) |
| Reference | 1024×768 | `git commit` chọn | Không có reference 1024 | **Fail** so với spec (F-10, F-11, F-13) |
| Reference | 375×812 | Accordion | Không có reference 390 | **Fail** so với spec (F-9); viewport sai (F-21) |
| Verification | 1440×900 (ảnh 1425×891) | Report thật | `verification-1440x900.png` | **Fail** thứ tự section (F-5), version (F-6); P2 chart/copy (F-17, F-18) |
| Verification | 1024×768 (ảnh 1009×757) | Report thật | Không có reference 1024 | **Fail** so với spec (F-7), version (F-6) |
| Verification | 375×812 | Report thật | `verification-390x844.png` | **Pass** bố cục; version (F-6); viewport sai (F-21) |
| Verification error | 390×844 | Schema sai | Không có reference | **Pass** theo spec §4.4 (F-22) |
| Verification error | 390×844 | File thiếu | Không có reference | **Pass** theo spec §4.4 (F-22) |

---

## 3. Bảng phát hiện

| ID | Screen | Element | Expected | Actual | Difference (pixel/token/timing) | Sev | Exact correction | Ảnh reference |
|---|---|---|---|---|---|---|---|---|
| F-1 | Levels 1024 | Workspace | Graph trên, terminal dưới (`flex-wrap: wrap-reverse`) | Terminal trái 347px, graph phải, 2 cột | Sai cấu trúc layout ở viewport có reference | **P0** | `flex: 5 1 340px` (terminal), `flex: 6 1 400px` (graph), container `display:flex; flex-wrap:wrap-reverse; gap:16px`. Ở 1024 rộng khả dụng 720 < 756 nên phải xuống dòng. Không dùng grid hay basis cố định | `levels-completed-1024x768.png` |
| F-2 | Levels 1440 | Tỉ lệ terminal : graph | ≈ 513 : 607px (0.84) | 536 : 584px (0.92) | Terminal rộng hơn 23px; cùng nguyên nhân F-1 | P1 | Như F-1 | `levels-1440x900.png` |
| F-3 | Practice 1440 | Focus sau khi đóng intro | `#terminal-input` focus, viền `#8fa0ff` + halo | Tab "Practice" có khung focus trắng; input không có halo | Focus sai đích (spec §4.5, I-6) | **P0** (cần xác nhận) | Kiểm `document.activeElement` sau khi bấm Enter đóng intro. Nếu là tab: chạy `findIntroReturnFocusTarget` sau khi intro unmount (`useEffect` theo `introVisible === false`) và `.focus()` vào `#practice-panel #terminal-input` | `practice-1440x900.png` |
| F-4 | Tab bar (Practice, Reference, Verification; mọi viewport) | Vòng focus tab | Chỉ hiện khi focus bằng bàn phím (`:focus-visible`) | Khung trắng quanh tab chọn trên nhiều ảnh | Nếu ảnh chụp sau click chuột thì đang dùng `:focus` | P1 (TO_VERIFY) | `.app-tab:focus-visible { outline: 2px solid #fff; outline-offset: -4px }`, không dùng `:focus`. Nếu ảnh chụp sau điều hướng bằng bàn phím thì bỏ qua | `practice-1440x900.png`, `reference-1440x900.png`, `verification-1440x900.png` |
| F-5 | Verification 1440 | Thứ tự section | Kết luận → stat cards → **Definitions** → **Coverage** → Performance | Stat cards → Coverage → Definitions → Performance | Đảo hai section | **P0** | Đặt khối Definitions (3 ô) ngay sau stat cards, trước "Command coverage" | `verification-1440x900.png` |
| F-6 | Verification (mọi viewport) | Phiên bản Git | `Compared against git 2.43.0` | `Compared against 2.43.0` | Thiếu "git". Spec tự mâu thuẫn: §4.4 bảo bỏ tiền tố `git version `, còn V-1 ghi "git 2.43.0" | P1 | Hiển thị `"git " + gitVersion.replace(/^git version /, "")`; sửa câu §4.4 của spec cho khớp V-1 | `verification-1440x900.png`, `verification-390x844.png` |
| F-7 | Verification 1024 | Stat cards | `repeat(auto-fit, minmax(200px,1fr))`, rộng 976px nên 4 cột | 2×2 | Sai số cột (lệch spec; không có reference 1024) | P1 | Bỏ breakpoint riêng; chỉ dùng `grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))` | — (spec §4.4) |
| F-8 | Levels 1024 / 1440 / 375 | Nút "Next: 02 …" | Nền `#c9151c` (`--color-accent-dark`) | ≈ `#cf2e33` (đo trên 3 ảnh) | Nhạt hơn rõ, vượt sai số JPEG | P1 | `background: var(--color-accent-dark)`; hover `var(--color-accent-hover)` `#a91118`; không opacity hay filter ở trạng thái focus; vòng focus giữ `outline 2px #273896 offset 2` | `levels-completed-1024x768.png` |
| F-9 | Reference 375 | Bố cục mobile | Không accordion. Rail 5 lệnh rộng 100% ở trên, detail dưới (spec §4.3 đã khóa) | Accordion "git commit ^" có viền trái đỏ | Sai cấu trúc so với spec | **P0** (lệch spec, không có reference ảnh) | Bỏ accordion. < 900px: `aside` `max-width:100%`, flex-wrap đưa detail xuống dưới, chỉ hiện detail của lệnh đang chọn | — (spec §4.3) |
| F-10 | Reference 1440 / 1024 | Mũi tên giữa Before/After | Không có; hai figure trong grid `repeat(auto-fit, minmax(300px,1fr))`, `gap 16px` | Có "→" (1440) và "↓" (1024) chiếm thêm cột/hàng | Phần tử ngoài prototype; khoảng cách ≈ 40px thay vì 16px | P1 | Xóa phần tử mũi tên; `display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:16px` | `reference-1440x900.png` |
| F-11 | Reference 1024 | Before/After | Cạnh nhau (detail 720 ≥ 616) | Xếp dọc | Sai cấu trúc; hệ quả F-10 | P1 | Như F-10 | — (spec §4.3) |
| F-12 | Reference 1440 | Chiều cao figure | Đáy figure ≈ y706 | Đáy figure ≈ y661 | Thấp hơn ≈ 45px | P1 (TO_VERIFY nguyên nhân) | Figcaption `min-height: 38px`, body `min-height: 280px; padding: 16px`, SVG `scale = 1.2`. Kiểm lại sau khi sửa F-10 (cột mũi tên làm figure hẹp) | `reference-1440x900.png` |
| F-13 | Reference 1024 | Rộng rail | `flex: 1 1 260px` nên 260px | 240px | Hẹp hơn 20px | P2 | Bỏ giá trị 240 (từ UI_POLISH); `flex: 1 1 260px; max-width: 300px` | — (spec §4.3) |
| F-14 | Intro (mọi viewport) | Copy | Spec §4.5 tạm khóa tiếng Việt + `lang="vi"` (TO_VERIFY) | "Learn Git by typing commands…", "Click to begin →", "or press Enter" | Copy khác reference; khớp yêu cầu English-only | P1 (cần quyết định) | (a) giữ tiếng Anh và cập nhật spec §4.5 + ghi chú screenshot; hoặc (b) đổi về chuỗi tiếng Việt và thêm `lang="vi"` | `intro-cta-ready-1440x900.png`, `intro-cta-ready-390x844.png` |
| F-15 | Intro 1440 / 390 | Hình học | Khung bao 500,156 → 939,763; media 390: x 27–362, y 298–486 | 499,154 → 940,766; media x 26–362, y 297–487 | ≤ 3px | — | Đạt | `intro-cta-ready-1440x900.png`, `intro-cta-ready-390x844.png` |
| F-16 | Practice 1440 | Layout và màu | Terminal 619, graph 776; header `#273896`; tab chọn `#1d2b78` + gạch `#ed1c24` | 620 / 776; `#283897`; `#1e2b79`; gạch có (`#cb2c31` ở mép JPEG) | ≤ 1px, sai số JPEG | — | Đạt | `practice-1440x900.png` |
| F-17 | Verification 1440 | Đồ thị scaling | Không marker điểm; nhãn y = median lớn nhất (224) | Có chấm tròn mỗi điểm; nhãn y = 228.9 (p95 max) | Thêm marker; nhãn trục khác nguồn | P2 | Bỏ `<circle>` marker; nhãn trục y = min/max median. Caption "224.3 ms @ 10⁵" theo default TO_VERIFY của spec, giữ | `verification-1440x900.png` |
| F-18 | Verification | Copy định nghĩa "Soft warning" | "Only printed text differs, e.g. c1 instead of a real hash. State still matches." | "…for example a simulator ID instead of a real hash…" | Đổi copy | P2 | Dùng nguyên văn prototype | `verification-1440x900.png` |
| F-19 | Practice 390 / 1024 (branch dài) | Graph | Spec: SVG `max-width:100%` tự thu nhỏ | Node/chip co còn chữ ≈ 5–6px, không đọc được ở 390 | Đúng spec nhưng hỏng khả năng đọc (điểm yếu của spec) | P1 | Spec sửa: < 768px không thu SVG dưới 1×, canvas cuộn ngang trong panel (`overflow:auto` đã có). Bỏ `max-width:100%` khi viewport < 768 | `practice-390x844.png` (state khác) |
| F-20 | Practice 390 / 1024 / 1440 (branch dài) | Header graph | HeadChip đầy đủ; divider 1×20 | HeadChip cắt bằng "…" (390); divider lạc ở đầu/cuối hàng khi wrap | Nhỏ | P2 | Giữ cắt chữ, thêm `title` chứa tên đầy đủ; ẩn divider khi header wrap hoặc ở < 768px | — |
| F-21 | Bộ ảnh mobile | Viewport | 390×844 (spec §7.2) | 375×812 ở Levels, Reference, Verification | Không so 1:1 được | P2 (quy trình) | Chụp lại ở 390×844, DSF 1, môi trường font spec §7.1 | `levels-390x844.png`, `verification-390x844.png` |
| F-22 | Verification 390 (error) | Report thiếu / sai schema | Callout lỗi + message nguyên văn + Retry, không hiện số | Đúng | — | — | Đạt | — (spec §4.4) |
| F-23 | Levels 375 / 1024 / 1440 (complete) | Banner, chip Matches, rail ✓, badge 1/8, focus Next | Spec §4.2 | Đúng; Next có vòng focus | — | — | Đạt (trừ màu F-8) | `levels-completed-1024x768.png` |

---

## 4. Accessibility findings

| ID | Finding | Sev | Trạng thái |
|---|---|---|---|
| F-3 | Focus sau khi đóng intro nằm ở tab thay vì `#terminal-input`. Người dùng bàn phím phải Tab thêm mới gõ được | P0 | Cần xác nhận bằng `document.activeElement` |
| F-4 | Vòng focus tab có thể hiện khi click chuột (`:focus` thay vì `:focus-visible`) | P1 | TO_VERIFY |
| F-19 | Chữ trong graph ≈ 5–6px ở 390px khi tên branch dài; không đọc được | P1 | Cần sửa spec + CSS |
| F-8 | Màu nút Next lệch. Chữ trắng trên `#cf2e33` vẫn đạt contrast, nhưng lệch token | P1 | Sửa token |
| F-23 | Focus chuyển vào nút Next khi hoàn thành level | — | Pass |
| F-22 | Error state Verification có message nguyên văn và nút Retry (cao 44px trên mobile) | — | Pass |
| — | Chưa kiểm: contrast bằng axe-core, focus trap intro, reduced motion | — | Mục 6 |

## 5. Responsive findings

| ID | Viewport | Finding | Sev |
|---|---|---|---|
| F-1 | 1024×768 | Levels workspace không xuống dòng | P0 |
| F-2 | 1440×900 | Levels tỉ lệ cột lệch 23px | P1 |
| F-7 | 1024×768 | Verification stat cards 2×2 thay vì 4 cột | P1 |
| F-9 | 375×812 | Reference dùng accordion | P0 |
| F-10, F-11 | 1440, 1024 | Reference có mũi tên; 1024 xếp dọc Before/After | P1 |
| F-13 | 1024×768 | Reference rail 240px thay vì 260px | P2 |
| F-19 | 390, 1024 | Graph co quá nhỏ với tên branch dài | P1 |
| F-20 | 390, 1024, 1440 | Header graph wrap: divider lạc, HeadChip cắt | P2 |
| F-15 | 1440, 390 | Intro không tràn, căn giữa viewport | Pass |
| — | 390 | Header 2 hàng, tab "Verify" đủ 4 tab | Pass (theo X-1 của spec) |

---

## 6. Rủi ro còn lại và mục chưa kiểm

1. **Chuyển động chưa được xác minh:**
   - timeline intro 0/500/1300 ms;
   - CTA nhận focus ở 1717 ms;
   - unmount 460 ms;
   - halo / `node-in` / khóa input 300 ms;
   - banner fade 250 ms.

   Cần video hoặc đo `getAnimations()` theo ma trận spec §7.2 dòng #17–19.
2. **Loading state Verification:** chưa có ảnh.
3. **Offline:** chưa kiểm. Repo không có service worker; tab Verification và video intro phụ thuộc cache trình duyệt.
4. **Accessibility tự động:** chưa chạy axe-core trên 4 tab + intro.
5. **Font:** ảnh implementation dùng Ubuntu, reference dùng Noto Sans. Không thể so pixel chữ cho tới khi chụp cùng môi trường (spec §7.1).
6. **Mobile 390×844:** chưa có ảnh đúng viewport (F-21).
7. **Quyết định chờ:**
   - F-14: copy intro tiếng Anh hay tiếng Việt.
   - F-19: sửa quy tắc thu nhỏ graph trong spec.
   - F-6: sửa câu tự mâu thuẫn trong spec §4.4.
8. **Không có reference ảnh** cho Practice 1024, Reference 1024/390, Verification 1024. Các finding ở đó so với spec, không so với ảnh.

## 7. Thứ tự sửa đề xuất

1. **P0:** F-1, F-3, F-5, F-9. Cả bốn đều là sửa CSS hoặc markup.
2. **P1:** F-8, F-6, F-7, F-10, F-11, F-12, F-19. F-4 sau khi xác nhận.
3. **Quyết định:** F-14.
4. **P2:** F-13, F-17, F-18, F-20, F-21.
