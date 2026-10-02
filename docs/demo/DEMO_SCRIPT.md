# Kịch bản demo GitScope — 6 phút 15 giây

Kịch bản này bám theo build hiện tại của repository và issue #65. Tổng thời
lượng mục tiêu là **6:15**, nằm trong khung 5–7 phút. Không chạy harness hoặc
benchmark trực tiếp trong lúc thuyết trình; tab `Verification` trình bày report
đã được CI sinh ra.

> **Trạng thái cần nói trung thực:** user evaluation hiện có `n = 0`. File
> `docs/evaluation/raw-results.csv` mới chỉ có header, nên chưa có completion
> rate, thời gian, điểm pre/post hay finding usability. Không đổi `N/A` thành
> `0%` và không gọi mục tiêu tuyển 6–8 người là kết quả.

## Mốc thời gian

| Phần | Mốc | Thời lượng |
|---|---:|---:|
| Vấn đề học Git | 0:00–0:30 | 30 giây |
| Giải pháp và phạm vi | 0:30–1:15 | 45 giây |
| Chạy Level 08 với terminal và graph | 1:15–3:15 | 2 phút |
| Undo/redo và progress | 3:15–4:00 | 45 giây |
| Verification, differential testing và benchmark | 4:00–5:15 | 75 giây |
| Kết quả user evaluation hiện có | 5:15–5:45 | 30 giây |
| Giới hạn và kết luận | 5:45–6:15 | 30 giây |

Sai số cho phép khi tập: ±10 giây ở các mốc giữa và tổng thời lượng
**5:45–6:35**. Nếu chậm hơn 10 giây, bỏ thao tác chuyển benchmark sang `Table`,
không cắt phần giới hạn hoặc tình trạng evaluation.

## Dữ liệu cố định dùng trong demo

### Luồng level chính

- Tab: `Levels`
- Level: `08 · When fast-forward is impossible`
- Trạng thái ban đầu: `main` ở commit gốc; `feature` ở một commit con; `HEAD`
  attached vào `main`.
- Lệnh 1:

  ```text
  git commit -m "main work"
  ```

- Lệnh 2:

  ```text
  git merge feature
  ```

- Kết quả cần diễn giải: sau lệnh 1, hai branch đã phân kỳ; sau lệnh 2, engine
  tạo merge commit mới có hai parent, `main` và `HEAD` cùng đi tới commit mới,
  còn `feature` vẫn ở tip cũ.

### Luồng undo/redo

- Tab: `Practice`
- Lệnh:

  ```text
  git commit -m "undo demo"
  ```

- Nút dùng: `Undo`, sau đó `Redo`.

### Report Verification hiện tại

Các số dưới đây phải khớp `public/verification.json` tại thời điểm viết:

- Generated: `2026-09-30T08:07:30.216Z`
- Commit: `4448efb8aaecea310266c3ab002b6928362db466`
- Oracle: Git `2.43.0`; Node `v24.21.0`
- Differential test: `6,160 / 6,160` case pass; `0` hard divergence;
  `19,806` soft output warnings; exhaustive depth `3`; `5,000` random case,
  seed `42`.
- Layout tại `n = 100,000`: median `224.27 ms`, p95 `228.90 ms`.
- SVG render tại `n = 1,000`: median `146.80 ms`, p95 `206.30 ms`; đây là
  kích thước đầu tiên trong report vượt ngưỡng p95 100 ms.
- Animation tại `n = 200`: median và p95 đều hiển thị xấp xỉ `16.70 ms`.

Nếu CI đã sinh report mới, **đọc số đang hiển thị trên UI** và cập nhật phần
này trước khi demo; không đọc thuộc lòng số cũ.

## Kịch bản thao tác và lời nói

### 0:00–0:30 — Vấn đề học Git

| Thời gian | Thao tác | Lời nói | Expected UI result | Fallback |
|---|---|---|---|---|
| 0:00–0:12 | Để màn hình intro mở, không rê chuột. | “Khi mới học Git, sinh viên thường chỉ thấy câu lệnh và một dòng output. Phần khó là hình dung commit nào nối với commit nào, branch đang trỏ ở đâu và HEAD đang ở trạng thái nào.” | Intro hiện wordmark hiện tại `GitPlay`, tagline và graph minh họa. | Nếu intro không hiện vì trang đã mở: nói tiếp trên tab `Practice`; không refresh chỉ để lấy animation. |
| 0:12–0:30 | Trỏ ngắn vào graph trên intro. | “Vì trạng thái đó vô hình, người học dễ học thuộc lệnh nhưng vẫn nhầm fast-forward với merge commit, hoặc không hiểu detached HEAD.” | Không đổi trang; người xem tập trung vào commit/branch/merge trên intro. | Nếu animation giật: không chờ; chuyển thẳng sang câu tiếp theo và bấm `Explore levels`. |

### 0:30–1:15 — Giải pháp và phạm vi

| Thời gian | Thao tác | Lời nói | Expected UI result | Fallback |
|---|---|---|---|---|
| 0:30–0:55 | Vẫn ở intro. | “GitScope là web app giáo dục chạy hoàn toàn ở phía client. Người học gõ lệnh trong terminal, engine cập nhật repository state, và graph cho thấy ngay commit, branch và HEAD.” | Intro vẫn ổn định; hai CTA `Start practicing` và `Explore levels` khả dụng. | Nếu browser mất focus, click một vùng trống rồi tiếp tục; không restart. |
| 0:55–1:08 | Bấm `Explore levels`. | “Phạm vi hiện tại là năm lệnh: commit, branch, switch, checkout và merge; tám level có goal checking tự động, cùng Reference và Verification.” | Tab `Levels` mở, level 01 được chọn mặc định, terminal được focus. | Nếu bấm nhầm `Start practicing`, bấm tab `Levels` ở thanh điều hướng. |
| 1:08–1:15 | Trỏ nhanh vào bốn tab trên header. | “Đây là sản phẩm Tier 1-only, không có staging hay `git add`, không có conflict nội dung, remote Git, account, server, sync hoặc Tier 2.” | Header hiển thị `Practice`, `Levels`, `Reference`, `Verification`. | Nếu thiếu thời gian, nói câu phạm vi khi đang chọn Level 08; không được bỏ câu này. |

### 1:15–3:15 — Chạy một level có terminal và graph

| Thời gian | Thao tác | Lời nói | Expected UI result | Fallback |
|---|---|---|---|---|
| 1:15–1:28 | Chọn `08 · When fast-forward is impossible` ở sidebar; trên màn hình hẹp dùng select level. | “Tôi chọn Level 08. Mục tiêu là tạo một commit trên main rồi merge feature. Khi hai tip đã phân kỳ, fast-forward không còn khả thi.” | Brief hiện `LEVEL 08`, goal, `Allowed: git commit` và `git merge`; graph Current có root, feature tip, `HEAD → main`. | Nếu chọn nhầm level, chọn lại 08. Nếu terminal còn lịch sử cũ, bấm `Reset level` trước khi nói tiếp. |
| 1:28–1:45 | Bấm `Target`, trỏ vào node nét đứt và nhãn parent; sau đó bấm lại `Current`. | “Người học có thể xem Target trước. Nét đứt là commit chưa tạo; target cho thấy merge cuối cùng phải có hai parent. Checker so cấu trúc DAG, vị trí branch và HEAD, không phụ thuộc tên commit.” | Target graph hiện hai commit cần tạo dưới dạng ghost/dashed; quay lại Current trả về state ban đầu. | Nếu toggle không phản hồi, bỏ qua thao tác và mô tả goal đang viết trong brief. |
| 1:45–2:05 | Nhập `git commit -m "main work"`, nhấn Enter, đợi graph cập nhật. | “Lệnh đầu tiên tạo một commit trên main.” | Terminal in output dạng `[main c3] main work`; graph thêm commit mới, `main` và `HEAD` chuyển tới đó; `feature` giữ nguyên. `Commands used` thành 1. | Nếu gõ sai: nhấn `↑`, sửa đúng lệnh rồi Enter. Lỗi parse không đổi graph. Nếu nhập đúng nhưng graph không đổi, bấm `Reset level` và chạy lại lệnh. |
| 2:05–2:32 | Trỏ lần lượt vào `main`, `feature` và hai đường đi từ root. | “Bây giờ main và feature đều đi ra từ cùng một tổ tiên nhưng nằm ở hai tip khác nhau. Đây là trạng thái phân kỳ; chỉ di chuyển con trỏ main sẽ làm mất thông tin về cả hai nhánh.” | Graph hiện rõ hai lineage từ root; HEAD vẫn attached vào main. | Nếu label bị khuất, dùng vùng scroll của graph; không zoom cả browser giữa demo. |
| 2:32–2:48 | Nhập `git merge feature`, nhấn Enter. | “Khi merge feature, engine tìm tổ tiên chung và tạo một merge commit thay vì fast-forward.” | Terminal in `Merge made by the 'ort' strategy.` và dòng commit merge; graph thêm node mới có hai cạnh parent; `main` và HEAD chuyển tới node đó. | Nếu nhập sai: `↑`, sửa và Enter. Nếu nhận `pathspec` error, kiểm tra đang ở Level 08 rồi `Reset level` và chạy lại đúng hai lệnh. |
| 2:48–3:15 | Trỏ vào hai cạnh của merge node và banner hoàn thành. | “Hai cạnh này là hai parent theo đúng thứ tự. Goal checker nhận ra graph đẳng cấu với target, nên level hoàn thành tự động sau hai command—không cần nút Submit.” | Hiện `✓ Matches target` và banner `Level complete · 2 commands`; progress lưu level 08. | Nếu banner chưa hiện sau 2 giây, bấm `Current`, kiểm tra đúng hai lệnh. Không tiếp tục bằng một state đáng ngờ; dùng screenshot hoàn thành đã chuẩn bị và nói “đây là expected state”. |

### 3:15–4:00 — Undo/redo và progress

| Thời gian | Thao tác | Lời nói | Expected UI result | Fallback |
|---|---|---|---|---|
| 3:15–3:27 | Bấm tab `Practice`, nhập `git commit -m "undo demo"`, Enter. | “Trong Practice, mỗi lệnh thành công tạo một snapshot của RepoState.” | Graph có một commit; `Undo` được bật. | Nếu animation đang khóa input, đợi dòng `Updating graph…` biến mất. |
| 3:27–3:42 | Bấm `Undo`, rồi `Redo`. | “Undo và redo là chức năng của simulator, không phải lệnh Git thật. Undo đưa graph về repo rỗng; redo phục hồi đúng commit vừa tạo.” | Sau Undo: `No commits yet`, Redo bật. Sau Redo: commit và `HEAD → main` trở lại. | Nếu bấm quá nhanh, chờ khoảng 300 ms giữa các thao tác. Nếu lỡ bấm hai lần, dùng nút còn lại để đưa về state một commit. |
| 3:42–4:00 | Bấm tab `Levels`, trỏ vào progress ở header/sidebar. | “Tiến độ level được lưu duy nhất trong localStorage. Với profile sạch, Level 08 vừa chuyển tổng thành 1 trên 8; reload vẫn giữ marker, nhưng không có tài khoản hay đồng bộ thiết bị.” | Profile sạch hiện `1/8` ở tab và `1 of 8 complete` ở rail; Level 08 có dấu check. Nếu đã diễn tập trong cùng profile, số có thể lớn hơn nhưng không giảm. | Nếu số chưa cập nhật, đợi một nhịp rồi chuyển tab lại. Không khẳng định `1/8` nếu UI hiển thị số khác; nói “marker của Level 08 đã được lưu local”. |

### 4:00–5:15 — Verification, differential testing và benchmark

| Thời gian | Thao tác | Lời nói | Expected UI result | Fallback |
|---|---|---|---|---|
| 4:00–4:20 | Bấm tab `Verification`; trỏ vào headline và provenance. | “Độ đúng không chỉ dựa vào unit test. CI chạy cùng chuỗi lệnh trên GitScope và Git thật trong thư mục tạm, chuẩn hóa hash rồi so DAG, branch, HEAD và lớp lỗi.” | Headline hiện engine match real Git; bên dưới có thời gian sinh report, short SHA, Git và Node version. | Nếu loading quá 3 giây, bấm tab khác rồi quay lại. Nếu báo `Report unavailable`, dùng tab dự phòng mở sẵn `public/verification.json`. |
| 4:20–4:40 | Trỏ vào bốn stat card. | “Report hiện tại ghi nhận 6.160 trên 6.160 case pass và 0 hard divergence. Run gồm vét cạn đến depth 3 và 5.000 case random có seed 42.” | Cards hiện `Cases passed 6,160 / 6,160`, `Hard divergences 0`, `Soft output warnings 19,806` và thông tin run. | Nếu report đã đổi, đọc đúng số mới trên card; không dùng số trong kịch bản cũ. |
| 4:40–4:55 | Trỏ vào định nghĩa soft warning hoặc card warning. | “19.806 warning được đếm theo từng bước và chỉ là khác text output—ví dụ simulator dùng `c1` thay vì hash Git thật. Chúng không phải 19.806 state failure.” | Definition phân biệt hard divergence với soft warning; hard là mismatch commit/branch/HEAD, soft là text. | Nếu không thấy definition vì viewport, chỉ vào card và nói nguyên câu; không cuộn ngược. |
| 4:55–5:15 | Cuộn tới `Performance at scale`; nếu đủ giờ, bấm `Table`. | “Benchmark tách layout khỏi SVG render. Layout ở 100 nghìn commit có median khoảng 224 ms; SVG đã vượt p95 100 ms từ 1 nghìn commit. Animation ở 200 commit đo khoảng 16,70 ms p95. Đây là phép đo để tìm giới hạn; workload học tập thực tế nhỏ hơn nhiều.” | Chart hoặc table có ba series `layout()`, `SVG render`, `animation frame`; số khớp report hiện tại. | Nếu đang chậm mốc, không bấm `Table`; nói ba kết luận từ chart. Nếu chart lỗi, mở JSON dự phòng và chỉ vào `scaling`. |

### 5:15–5:45 — Kết quả user evaluation hiện có

| Thời gian | Thao tác | Lời nói | Expected UI result | Fallback |
|---|---|---|---|---|
| 5:15–5:45 | Giữ tab Verification hoặc chuyển sang slide “User evaluation”; không giả lập dữ liệu trong app. | “Bộ evaluation đã có protocol, task và quiz trước/sau, nhưng dữ liệu hiện tại chưa có participant: raw file chỉ có header, nên n bằng 0. Vì vậy completion rate, mức tăng pre/post và finding usability đều là N/A, không phải 0%. Đây là blocker còn lại; chúng tôi chưa đưa ra claim về hiệu quả học tập cho đến khi có 6–8 phiên hợp lệ.” | Không cần UI thay đổi. Nếu có slide, slide phải ghi `n = 0 · no user-outcome claim`; không được có biểu đồ cột 0% gây hiểu nhầm. | Nếu trước ngày demo đã thu dữ liệu thật, dừng dùng đoạn này và cập nhật kịch bản từ `docs/evaluation/RESULTS.md`; không ứng biến số liệu chưa kiểm tra. |

### 5:45–6:15 — Giới hạn và kết luận

| Thời gian | Thao tác | Lời nói | Expected UI result | Fallback |
|---|---|---|---|---|
| 5:45–6:05 | Trỏ lại headline Verification hoặc graph trong slide kết. | “Giới hạn của phiên bản này chỉ là mô hình commit DAG, branch và HEAD: không có staging, `git add`, nội dung file hay conflict nội dung; không có remote Git như push, pull, fetch, clone; và không có Tier 2.” | Màn hình giữ ổn định; không thực hiện thêm lệnh. | Nếu bị thiếu thời gian, nói nguyên câu giới hạn này trước, rồi rút câu kết còn một câu. |
| 6:05–6:15 | Dừng thao tác, nhìn khán giả. | “Trong phạm vi đó, GitScope biến state Git vô hình thành một graph có thể thao tác, tự kiểm tra bài làm, và kèm bằng chứng đối chiếu với Git thật. Cảm ơn thầy cô.” | Kết thúc ở khoảng 6:15. | Nếu bị hỏi ngay, chuyển sang Q&A; không mở thêm feature ngoài kịch bản. |

## Fallback vận hành

### Nhập sai command

1. Không reload ngay: parse/engine error giữ nguyên repository state.
2. Nhấn `↑` để gọi lại command gần nhất, sửa đúng rồi Enter.
3. Nếu không chắc state của Level 08, bấm `Reset level` và chạy lại đúng hai lệnh
   theo thứ tự đã ghi.
4. Không dùng command ngoài scope để “chữa cháy”; đặc biệt không nhập
   `git add`, `git status`, `git log` hoặc `git merge --no-ff`.

### Browser hoặc deployment lỗi

Chuẩn bị ba lớp trước khi vào phòng:

1. **Primary:** URL deployment tĩnh, đã mở đúng viewport và đã tải một lần.
2. **Local fallback:** production preview đã build sẵn bằng `npm run build`, sau
   đó chạy `npm run preview -- --host 127.0.0.1`; bookmark URL Vite in ra.
3. **No-browser fallback:** một screenshot Level 08 hoàn thành, một screenshot
   Verification và file `public/verification.json` mở sẵn trong editor.

Nếu primary lỗi, chuyển local preview trong tối đa 10 giây. Nếu cả hai browser
đều lỗi, dùng screenshot và JSON, tiếp tục lời nói theo timestamp; nói rõ đây là
bản dự phòng chụp từ cùng build, không nói rằng thao tác đang chạy live.

### Verification report lỗi hoặc cũ

- Nếu UI báo `Report unavailable`, bấm `Retry` đúng một lần. Sau đó chuyển sang
  `public/verification.json` đã mở sẵn; không mất thời gian sửa server tại bục.
- Trước demo, `generatedAt` nên cách thời điểm demo dưới 48 giờ theo issue #70
  và SHA phải là commit định trình bày.
- Nếu chưa có report mới, nói đúng timestamp/SHA đang hiển thị và gọi đó là
  “report gần nhất”, không gọi là kết quả của build hiện tại.

## Checklist trước demo

### Trước 24 giờ

- [ ] Chốt đúng commit/build sẽ demo; không đổi tính năng sau tổng duyệt.
- [ ] Chạy `npm run typecheck`.
- [ ] Chạy `npm test`.
- [ ] Chạy `npm run build`.
- [ ] Chạy `npm run lint:imports`.
- [ ] CI đầy đủ xanh; `public/verification.json` có `generatedAt` dưới 48 giờ và
      `commitSha` đúng build demo.
- [ ] Đối chiếu lại mọi số trong mục “Report Verification hiện tại”.
- [ ] Đọc `docs/evaluation/RESULTS.md`; nếu vẫn `n = 0`, giữ nguyên lời nói N/A.
      Nếu đã có dữ liệu thật, cập nhật và review toàn bộ đoạn evaluation.
- [ ] Tạo browser profile riêng cho demo để không xóa tiến độ cá nhân. Trong
      profile này, xác nhận trạng thái bắt đầu mong muốn là `0/8`.
- [ ] Chụp screenshot dự phòng từ đúng build: Level 08 ban đầu, Level 08 hoàn
      thành, Verification headline và Performance table.
- [ ] Build local fallback và thử URL preview khi tắt mạng.

### Trước 15 phút

- [ ] Cắm sạc; tắt notification, auto-update, password manager popup và browser
      translation.
- [ ] Đặt browser zoom 100%, viewport tối thiểu khoảng 1280×800; đóng DevTools.
- [ ] Mở primary URL ở intro; mở local fallback ở cửa sổ/tab riêng nhưng không
      để phát audio hoặc chiếm focus.
- [ ] Mở sẵn `public/verification.json` và các screenshot dự phòng.
- [ ] Kiểm tra bàn phím gõ được dấu `"` trong command; tắt bộ gõ nếu nó sửa dấu
      nháy hoặc khoảng trắng.
- [ ] Dán hai command Level 08 và command Practice vào plain-text notes để có
      thể copy khi bàn phím trục trặc.
- [ ] Xác nhận Level 08 có `Reset level`, graph có `Current/Target`, Practice có
      `Undo/Redo`, Verification load không lỗi.
- [ ] Bật timer riêng; người giữ giờ có tín hiệu tại 3:15 và 5:15.

## Tiêu chí hai lần chạy liên tiếp không lỗi

Chạy tổng duyệt **hai lần liên tiếp trên cùng build**, mỗi lần từ đầu đến cuối.
Dùng browser profile demo; trước mỗi lần, mở tab mới hoặc reload để intro xuất
hiện, chọn Level 08 và bấm `Reset level`. Nếu cần kết quả chính xác `1/8` trong
cả hai lần, dùng hai profile sạch riêng; không xóa localStorage cá nhân.

Cả hai lần chỉ được tính là đạt khi đồng thời thỏa các điều kiện sau:

- [ ] Tổng thời lượng mỗi lần nằm trong **5:45–6:35**, không vượt 7 phút.
- [ ] Không có uncaught error, màn hình trắng, request lỗi làm hỏng UI hoặc thao
      tác cần restart app.
- [ ] Hai command của Level 08 chạy đúng thứ tự; banner báo complete sau đúng 2
      command; merge node có hai parent và `main`/HEAD ở merge commit.
- [ ] `Undo` đưa Practice về repo rỗng và `Redo` phục hồi commit trong cả hai lần.
- [ ] Marker Level 08 còn sau khi đổi tab. Nếu chạy lần hai trên cùng profile,
      tổng completed không tăng thêm vì progress được khóa theo `levelId`.
- [ ] Verification load report thật; timestamp, SHA, Git version và các số đọc
      thành tiếng khớp UI/JSON.
- [ ] Người trình bày phân biệt đúng `0 hard divergence` với `19,806 soft output
      warnings`, không gọi warning là case fail.
- [ ] Benchmark được mô tả là phép đo giới hạn; không tuyên bố SVG scale tốt tới
      100.000 node và không làm tròn 16,70 ms thành “dưới 16,7 ms”.
- [ ] Evaluation được nói đúng trạng thái dữ liệu hiện tại (`n = 0`, các metric
      là N/A) hoặc đã được cập nhật từ dữ liệu thật đã kiểm tra.
- [ ] Có câu giới hạn đầy đủ: không staging/`add`, không nội dung file/conflict
      nội dung, không remote Git và không Tier 2.
- [ ] Không hứa authentication, backend, sync, level 09–12 hoặc bất kỳ chức năng
      nào không có trong build.

Nếu một lần không đạt, ghi lại mốc thời gian và nguyên nhân, sửa kịch bản hoặc
bug tương ứng rồi chạy lại từ đầu. Hai lần đạt phải là **hai lần cuối liên tiếp**,
không phải hai lần đạt xen giữa các lần lỗi.
