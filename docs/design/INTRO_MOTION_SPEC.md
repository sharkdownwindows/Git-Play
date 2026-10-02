# INTRO_MOTION_SPEC — GitScope (reference corrected)

Cập nhật 2026-09-30 theo bản chạy thật.

- Nguồn chạy: artifact `https://claude.ai/artifact/Cry7y2Qh2bWr34yhvfENsG` (version `1790776685-4dca`). Đây là bundle tự chứa. Nó gồm dc-runtime (`support.js`), `gitscope-engine.js`, Rive 2.21.6, React 18.3.1 và `usth-logo.png`.
- Asset bổ sung: `27239-51435-messy-files.riv`, đặt tên lại thành `assets/messy-files.riv`. Artboard `Main Comp` 960×540, state machine `State Machine 1`.
- Bản tham chiếu chính thức là **reference corrected** (`reference-corrected/index.html`). Mọi screenshot và video trong thư mục này lấy từ bản corrected. Riêng ảnh trong `screenshots/raw-comparison/` lấy từ bản raw, chỉ để đối chiếu.
- Toàn bộ khác biệt ở mức mã nguồn nằm trong `reference-corrected/CORRECTIONS.diff`.

## 0. Môi trường render

| Mục | Giá trị |
|---|---|
| Trình duyệt | Chromium 141.0.7390.37 headless (Playwright), `deviceScaleFactor: 1` |
| Font | Stack gốc giữ nguyên. Máy render ánh xạ `system-ui`/`sans-serif` sang **Noto Sans** (có tên trong stack) và `ui-monospace`/`monospace` sang **Liberation Mono** (có tên trong stack mono). Trên macOS/Windows/Ubuntu, `system-ui` sẽ ra font hệ thống khác, nên chiều rộng chữ có thể lệch vài px. |
| CDN | React, ReactDOM, Rive JS/WASM được phục vụ từ bản local giống hệt bản CDN (cùng byte, SRI khớp). |
| Đo thời gian | Dùng `performance.now()` trong trang. Mốc t=0 là `startTime` của animation splash đầu tiên (thời điểm splash mount và bắt đầu paint). |
| Still theo mốc ms | Mọi CSS animation bị pause bằng `Animation.currentTime = t`. Riêng Rive chạy theo đồng hồ riêng, không pause được, nên với ảnh 0/500/1300 ms file `.riv` được giữ ở trạng thái đang tải. Vì vậy slot hiển thị poster (xem mục 6). |

## 1. Bốn sửa đổi (raw và corrected)

### 1.1 Rive slot

| | Raw `.dc.html` | Reference corrected |
|---|---|---|
| Slot A (`gsLogo`, `min(360px,72vw)` × aspect 360/150, `overflow:hidden`) | div rỗng, nằm trong `sc-if riveOk` | chứa logo USTH (xem 1.3); luôn render |
| Slot B (`gsFade .8s .5s`, `min(440px,86vw)` × aspect 16/10) | div rỗng | `position:relative`; có hai lớp chồng nhau: poster `assets/messy-files-poster.png` và `<canvas ref={{ riveRef }}>` |
| `riveRef` | không gắn vào phần tử nào, nên `startRive` luôn hết 60 lượt thử (≈6.1 s), đặt `riveOk=false` và gỡ cả hai slot | gắn vào canvas; Rive nạp `assets/messy-files.riv`, `Fit.Contain`, `Alignment.Center`, chạy `State Machine 1` |
| Trước khi `.riv` tải xong | — | poster hiển thị (`rivePoster = !riveOk \|\| !riveReady`) |
| Khi `onLoad` | — | `riveReady=true`, poster gỡ, canvas hiện frame live |
| Khi lỗi (`onLoadError`, exception, hoặc không có `window.rive` sau 60×100 ms) | cả hai slot biến mất | `riveOk=false`: canvas gỡ, **poster giữ vĩnh viễn**, bố cục không đổi |

Poster là frame của chính `messy-files.riv`, chụp ở 1.2 s sau `onLoad`, kích thước 880×550 (2× của 440×275), `object-fit:contain`.

### 1.2 Splash positioning

- Raw: `position:fixed; inset:0; …; left:-53px; top:-41px`. Dialog đo được `[-53,-41,1493,941]` ở 1440×900 và `[-53,-41,443,885]` ở 390×844. Nội dung lệch khỏi tâm viewport khoảng 26.5 px sang trái và 20.5 px lên trên.
- Corrected: bỏ `left`/`top`. Dialog đo được `[0,0,1440,900]` và `[0,0,390,844]`. Cột nội dung căn giữa theo cả hai trục.

### 1.3 USTH logo

| | Raw | Corrected |
|---|---|---|
| Vị trí DOM | anh em sau slot B, `margin-top:-29%` (tính theo chiều rộng dialog, nên −419 px ở 1440) | nằm trong slot A |
| Kích thước | `width:566px; height:514px` cố định. PNG gốc 554×554, nên hình bị kéo giãn ngang 10% | `display:block; width:100%; max-width:100%; height:auto; margin-top:-29%`. Tỉ lệ vuông đúng |
| 1440×900 | box `[411,94,566,514]` | box img `[540,31,360,360]`, hiển thị trong slot `[540,136,360,150]` |
| 390×844 | box `[-114,186,566,514]`: tràn ra ngoài viewport 114 px mỗi bên, bị cắt | box img `[55,75,281,281]`, slot `[55,157,281,117]`, không tràn |

Lý do đặt logo vào slot A:

- `-29%` chính là độ lệch cần để căn phần nét logo vào khung 360:150. Nét logo nằm ở y 191–363 của ảnh 554 px. Khi rộng 360 px, nét nằm ở y 20–132 bên trong khung cao 150 px.
- `overflow:hidden` của slot chỉ cắt phần nền trắng của PNG. Phần nét logo (x 106–450, y 191–363) không bị cắt ở mọi viewport.
- Nếu để logo làm phần tử anh em với margin âm, nền trắng đục của PNG sẽ phủ lên canvas Rive.
- Hệ quả thấy được: logo cùng chạy `gsLogo` (0–1000 ms), nên ở t=0 splash trắng hoàn toàn. Ở raw, logo hiện ngay từ t=0.
- Nét logo trên desktop rộng khoảng 224 px (raw khoảng 350 px).

### 1.4 CTA focus

| | Raw | Corrected |
|---|---|---|
| Selector | `style-focus` → runtime sinh `.scpN:focus` | `style-focus-visible` → `.scpN:focus-visible` |
| Thời điểm tự focus | `setTimeout(50)` sau mount. Đo được ≈0 ms, khi CTA còn opacity 0 | chờ `animation.finished` của `gsFade` trên CTA, sau đó mới focus. Đo được **1717–1718 ms** |
| Vòng focus khi tự focus | hiện (Chromium coi focus bằng script lúc chưa có tương tác là focus-visible) | ẩn: CTA mang `data-gs-autofocus`; rule `button[data-gs-autofocus]:focus-visible{outline:none!important}` |
| Khi dùng bàn phím | hiện | thuộc tính `data-gs-autofocus` bị gỡ ở `keydown` đầu tiên (capture) hoặc khi `blur`, nên vòng hiện lại: `outline:2px solid #273896; outline-offset:3px` |
| Click chuột | vòng hiện (`:focus`) | vòng không hiện |

`focus({focusVisible:false})` không có tác dụng trên Chromium 141, nên phải dùng thuộc tính trên.

Chỉ CTA được đổi. Các `style-focus` khác (tab navbar, input, nút Undo/Redo…) giữ nguyên `:focus` như raw.

### 1.5 Khác biệt phụ (hệ quả hoặc dọn dẹp)

- Badge "Made with Claude Design" do bundle export chèn vào (`#__claude_design_branding`) bị gỡ. Nó không thuộc thiết kế. Ảnh raw-comparison cũng đã ẩn badge này.
- Raw ở 390×844: cột splash cao hơn viewport, nên CTA bị flex co lại còn **15 px** chiều cao (`BUTTON[71,812,196,15]`). Corrected: CTA giữ 48 px (`[97,609,196,48]`).
- Không đổi: navbar navy `#273896`, gạch đỏ active `#ed1c24`, layout app, typography, copy, keyframes, duration, delay, easing, thứ tự các khối chữ và nút.

## 2. Phần tử splash (corrected)

| # | Phần tử | Kích thước / style | Animation |
|---|---|---|---|
| S | `div[role=dialog][aria-modal=true]` | `position:fixed; inset:0; z-index:100`; nền `#fff`; flex column center; `gap:14px; padding:24px; overflow:hidden` | `none`; khi thoát: `gsOut 450ms cubic-bezier(.4,0,1,1) forwards` |
| A | Slot logo + `assets/usth-logo.png` | `min(360px,72vw)` × 360/150 | `gsLogo 1s cubic-bezier(.2,.8,.2,1) both` |
| B | Slot Rive: poster + canvas | `min(440px,86vw)` × 16/10 | `gsFade .8s .5s both` |
| D | "GitScope" 700 28/34 `#273896` + mô tả 15/22 `#6b7280`, max 40ch | auto | `gsFade .7s .8s both` |
| E | CTA "Nhấn để bắt đầu →", 48 px, radius 999, `#c9151c` (hover `#a91118`) | — | `gsFade .6s 1.1s both, gsPulse 2.4s 2s infinite` |
| F | "hoặc nhấn Enter" 12/16 `#6b7280` | — | `gsFade .6s 1.3s both` |

Vị trí đo ở 1440×900 (corrected): A `[540,136,360,150]`, B `[500,300,440,275]`, D `[548,589,343,84]`, E `[622,687,196,48]`, F `[674,749,93,16]`.

Vị trí đo ở 390×844: A `[55,157,281,117]`, B `[27,288,335,210]`, D `[24,511,342,84]`, E `[97,609,196,48]`, F `[149,671,93,16]`.

Keyframes:

- `gsLogo`: opacity 0 → 1, `translateY(18px) scale(.96)` → none.
- `gsFade`: opacity 0 → 1, `translateY(8px)` → none. Easing mặc định là `ease`.
- `gsPulse`: `box-shadow` 0 0 0 0 `rgba(237,28,36,.35)` → 50%: 0 0 0 12px `rgba(237,28,36,0)` → quay về; `ease`.
- `gsOut`: → opacity 0, `translateY(-28px)`.

Giá trị runtime đọc từ `getAnimations()` trùng khớp duration/delay ở trên: 1000/0, 800/500, 700/800, 600/1100, 2400/2000 (∞), 600/1300.

## 3. Timeline vào (corrected, t=0 = splash bắt đầu paint)

| t (ms) | Sự kiện | Thấy trên màn hình | Still |
|---|---|---|---|
| 0 | A bắt đầu `gsLogo`. B, D, E, F đang delay (opacity 0). `startRive` chạy. Poster được mount (vẫn trong suốt vì B đang opacity 0). | Nền trắng hoàn toàn | `intro-0000ms-1440x900.png` |
| 0–1000 | A: opacity 0→1, translateY 18→0, scale .96→1 | Logo nổi lên | — |
| 500 | A đạt ≈95% tiến trình (opacity ≈.95, cubic-bezier(.2,.8,.2,1) ở x=.5). B bắt đầu. | Logo gần đủ đậm | `intro-0500ms-1440x900.png` |
| 500–1300 | B: opacity 0→1, translateY 8→0 | Poster/Rive hiện dần | — |
| 800–1500 | D: fade + 8 px | Tiêu đề và mô tả | — |
| 1100–1700 | E: fade + 8 px | CTA | — |
| 1300 | B xong. D ở 5/7. E ở 1/3. F bắt đầu. | CTA hồng nhạt (opacity thấp) | `intro-1300ms-1440x900.png` |
| 1300–1900 | F: fade + 8 px | Gợi ý Enter | — |
| ≈1160–1710 | Rive `onLoad`: poster gỡ, canvas live. Đo local (file 20 MB); qua mạng sẽ muộn hơn. | Frame live có thể khác poster (state machine bắt đầu từ opening) | — |
| 1717 | `gsFade` của CTA kết thúc, CTA nhận focus (không có vòng) | — | — |
| 1900 | Mọi fade vào hoàn tất | Trạng thái tĩnh đầy đủ | `intro-cta-ready-1440x900.png`, `intro-cta-ready-390x844.png` |
| 2000 + n·2400 | Chu kỳ `gsPulse` bắt đầu. Đỉnh lan 12 px ở 3200, 5600, … | Quầng đỏ quanh CTA | — |

Ảnh keyboard focus: `intro-cta-keyboard-focus-1440x900.png` (Shift+Tab rồi Tab, vòng `#273896` 2 px, offset 3 px).

Ảnh `intro-cta-ready` được chụp khi animation pause ở 2000 ms (pulse ở đầu chu kỳ, spread 0). Rive ở frame live.

## 4. Trigger thoát

- Click bất kỳ đâu trên S, kể cả CTA và canvas Rive (canvas không chặn click).
- `Enter` hoặc `Space` ở listener `keydown` của `window` khi `splash==='show'`; có `preventDefault()`.
- Không có Escape, không auto-dismiss. Có thể thoát trước khi fade vào xong.

## 5. Timeline thoát (T = keydown/click)

| t | Sự kiện |
|---|---|
| T | `splash:'leaving'`. S chạy `gsOut 450ms cubic-bezier(.4,0,1,1) forwards`, `pointer-events:none`. Animation con vẫn chạy. |
| T → T+450 | S: opacity 1→0, translateY 0→−28 px. App (đã render sẵn phía sau) lộ ra. |
| T+460 (đo được 467–487) | S unmount, `rive.cleanup()`, focus vào `input[aria-label="Git command"]` của Practice (đo được T+461–481). |

Video `videos/video-intro-load-to-app-1440x900.mp4` quay từ lúc điều hướng đến app. Mốc trong video: splash mount ≈0.56 s, Rive live ≈2.47 s, Enter ≈5.47 s, unmount ≈6.34 s. Hai mốc sau gồm cả độ trễ của harness.

## 6. Focus sau khi intro đóng

- `startTab` mặc định `practice`, nên focus vào input terminal Practice. Style: viền `#8fa0ff` + `box-shadow 0 0 0 3px rgba(143,160,255,.28)`. Screenshot `practice-*.png` giữ nguyên trạng thái này.
- `startTab='levels'` thì focus vào input Levels. `reference`/`verification` không có input, nên focus rơi về `body`.

## 7. Reduced motion (`prefers-reduced-motion: reduce`)

- CSS toàn cục ép mọi animation về 0.01 ms, delay 0, 1 lần lặp; transition 0.01 ms. Toàn bộ A–F ở trạng thái cuối ngay khi mount. Pulse không nhìn thấy.
- CTA focus ở ≈37 ms (`animation.finished` resolve gần như tức thì). Vòng focus vẫn bị ẩn.
- Thoát: `gsOut` 0.01 ms, timer JS 0 ms, unmount và focus input sau ≈25–33 ms.
- Still: `intro-reduced-motion-1440x900.png`.
- Chưa xử lý (ngoài phạm vi 4 sửa đổi): Rive vẫn autoplay dưới reduced motion. `this.reduced` chỉ đọc một lần khi khởi tạo.

## 8. Fallback khi asset lỗi

| Lỗi | Hành vi corrected | Evidence |
|---|---|---|
| `rive.js` không tải được | sau ≈6.1 s (60 lượt × 100 ms) `riveOk=false`; poster giữ nguyên, bố cục không đổi | `intro-rive-fallback-1440x900.png` (chặn `rive.js`, chụp ở 7 s) |
| `.riv` lỗi hoặc `onLoadError` | `riveOk=false` ngay; poster giữ nguyên | — |
| `.riv` tải chậm | poster hiển thị tới `onLoad` | still 0/500/1300 ms |
| `usth-logo.png` lỗi | không có xử lý riêng: alt text hiện trong slot A, slot giữ kích thước | — |
| `messy-files-poster.png` lỗi | slot B trống cho tới khi Rive load (và vĩnh viễn nếu Rive cũng lỗi) | — |

## 9. Vấn đề còn tồn tại (ghi nhận, không sửa vì ngoài phạm vi)

1. **`componentDidUpdate(pp, ps)` luôn ném lỗi.** Runtime chỉ truyền `prevProps`, nên `ps` là `undefined` (`TypeError: Cannot read properties of undefined (reading 'p')` mỗi lần update). Hệ quả thấy được:
   - log terminal không tự cuộn xuống cuối;
   - sau khi hoàn thành level, focus **không** chuyển vào nút "Next: …" mà ở lại input. Đã xác nhận trong bản chạy và trong `video-level-complete-transition`.
2. Dialog `aria-modal` không có focus trap. Shift+Tab từ CTA đưa focus vào app phía sau splash.
3. Listener `Space` và `Enter` gắn toàn cục trên `window` khi splash đang mở.
4. Rive là file tương tác ("click here!"). Click vào canvas cũng kích hoạt `enter()`.
5. `.riv` nặng 20.4 MB; poster che khoảng trống khi tải. Khi Rive load xong, frame chuyển từ poster sang frame live có thể nhảy nhẹ.

## 10. Motion liên quan (hai video còn lại)

**Tạo commit** — `videos/video-commit-graph-animation-1440x900.mp4`. Lệnh chạy lần lượt: `commit ×2`, `switch -c feature`, `commit`, `switch main`, `merge feature` (fast-forward).

- Node mới: `gsIn 300ms ease-out both` (opacity 0→1, translateY −12→0).
- Halo `r=23`, stroke `#ed1c24` 2 px: `gsHalo 1.4s ease-out both` (0 → .85 ở 15% → 0).
- Node cũ đổi chỗ: `transition: transform 300ms cubic-bezier(.2,.8,.2,1)`.
- Practice khoá input 300 ms sau mỗi lệnh thay đổi repo: viền input dashed, hint "Updating graph…". Reduced motion: không khoá.

**Hoàn thành level** — `videos/video-level-complete-transition-1440x900.mp4`. Tab Levels, level 01, gõ `git commit -m "first"`, rồi bấm Next.

- Banner `role=status` nền `#e7f5ec`, viền `#a7d8b8`: `gsFade .25s ease-out both`.
- Tức thì (không transition): eyebrow thành "Level 01 · Complete", badge `1/8`, progress bar 12.5%, icon sidebar ✓ `#15803d`, chip "✓ Matches target".
- Focus vào nút Next: không xảy ra, xem 9.1.
- Tiến độ lưu vào `localStorage['gitscope-proto-progress']`.

## 11. Danh mục file

```
artifacts/prototype-handoff/
  INTRO_MOTION_SPEC.md
  screenshots/
    intro-0000ms-1440x900.png, intro-0500ms-1440x900.png, intro-1300ms-1440x900.png
    intro-cta-ready-1440x900.png, intro-cta-ready-390x844.png
    intro-cta-keyboard-focus-1440x900.png, intro-reduced-motion-1440x900.png
    intro-rive-fallback-1440x900.png
    practice-1440x900.png, practice-390x844.png
    levels-1440x900.png, levels-390x844.png, levels-completed-1024x768.png
    reference-1440x900.png
    verification-1440x900.png, verification-390x844.png (+ -fullpage)
    raw-comparison/raw-intro-{2s,7s-after-rive-timeout}-{1440x900,390x844}.png
  videos/
    video-intro-load-to-app-1440x900.mp4
    video-commit-graph-animation-1440x900.mp4
    video-level-complete-transition-1440x900.mp4
  reference-corrected/
    index.html, support.js, gitscope-engine.js, CORRECTIONS.diff
    assets/usth-logo.png, assets/messy-files-poster.png, assets/messy-files.riv
  capture-scripts/   (Playwright harness dùng để render, đo và quay)
```

Ghi chú cho các screenshot app:

- Mỗi screenshot app bắt đầu từ localStorage trống, vào app bằng Enter. Với tab khác Practice, focus trên nút tab được bỏ (`blur`) để ảnh không có vòng focus của navbar.
- `levels-completed-1024x768.png` chụp sau khi hoàn thành level 01, cuộn về đầu trang.
