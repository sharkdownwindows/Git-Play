# GitScope user evaluation — hướng dẫn thực hiện và phân tích

Thư mục này là bộ công cụ cho issue #61. Hiện tại chỉ có protocol, công cụ đo và CSV rỗng; **chưa có dữ liệu người tham gia và chưa có kết luận**.

## Bộ tài liệu

- [`PROTOCOL.md`](PROTOCOL.md): tuyển người, kịch bản, lịch 30 phút, định nghĩa quan sát và quy tắc gợi ý.
- [`PRE_QUIZ.md`](PRE_QUIZ.md): Form A gồm 6 câu trước khi dùng app.
- [`POST_QUIZ.md`](POST_QUIZ.md): Form B tương đương gồm 6 câu sau khi dùng app.
- [`TASKS.md`](TASKS.md): ba task bao phủ đủ level 01–08, gồm detached HEAD và hai kiểu merge.
- [`OBSERVATION_TEMPLATE.md`](OBSERVATION_TEMPLATE.md): phiếu ghi thời gian, completion, lệnh sai, chỗ kẹt, hint và nhận xét.
- [`raw-results.csv`](raw-results.csv): schema dữ liệu thô, hiện chỉ có header.

Các tài liệu nguồn đã đối chiếu: `../PRD.md` (SC-5 và phạm vi Tier 1), `../TECHNICAL_OVERVIEW.md` §4.4/§9.2/§12, `../ISSUES.md` M5 issue #61, và tám định nghĩa level `src/levels/data/01-*` đến `08-*` được export trong `src/levels/data/index.ts`. Level 09–12 không nằm trong đánh giá vì M5 đã chốt chỉ có 8 level.

## Chạy một đợt đánh giá

1. Chọn một build cố định, chốt kênh tuyển cùng tiêu chí đủ điều kiện, rồi tuyển 6–8 sinh viên chưa từng dùng GitScope.
2. Pilot quy trình với một thành viên nhóm chỉ để kiểm tra thời lượng và lỗi biểu mẫu. Không đưa pilot nội bộ vào dữ liệu người dùng.
3. Với mỗi người, tạo một bản sao trống của observation template, gán `P01`–`P08`, reset localStorage và làm đúng lịch 30 phút.
4. Không dạy khái niệm trước pre-quiz. Trong task chỉ dùng các hint chuẩn H1–H3.
5. Sau phiên, chấm quiz bằng key dưới đây, nhập một hàng CSV và đối chiếu lại với phiếu gốc.
6. Chỉ bắt đầu tổng hợp sau khi kết thúc toàn bộ đợt hoặc khi đã ghi rõ lý do dừng tuyển. Không sửa build giữa các phiên; nếu không tránh được, coi đó là hai điều kiện riêng.

## Quiz blueprint và đáp án — chỉ dành cho nhóm đánh giá

Không đưa phần này cho người tham gia trước khi hoàn tất post-quiz.

Hai form đo cùng sáu mục tiêu nhưng đổi branch, commit, câu chữ, vị trí đáp án và cách biểu diễn. Chúng kiểm tra áp dụng kiến thức vào trạng thái mới, không yêu cầu nhớ nguyên văn câu trước.

| Câu | Khái niệm | Pre Form A | Post Form B |
|---:|---|:---:|:---:|
| 1 | Tạo branch tạo con trỏ mới nhưng không chuyển HEAD | B | C |
| 2 | Checkout/switch trực tiếp tới commit làm HEAD detached và không kéo branch | C | A |
| 3 | Commit khi detached di chuyển HEAD, không di chuyển branch | A | D |
| 4 | Attached lại vào branch mà không đổi graph | D | B |
| 5 | Ancestor relation cho phép fast-forward, không tạo commit mới | B | A |
| 6 | Hai tip phân kỳ cần merge commit hai parent | C | D |

Chấm mỗi câu đúng `1`, sai/không trả lời `0`; tổng mỗi form từ 0 đến 6. Không cho điểm một phần. Giữ cả lựa chọn gốc và biến đúng/sai trong CSV.

## Data dictionary

Mỗi hàng của `raw-results.csv` là một người tham gia đã đồng thuận. Không thêm hàng cho người từ chối.

### Metadata

| Cột | Giá trị hợp lệ / cách ghi |
|---|---|
| `participant_code` | `P01`–`P08`, không có bảng nối danh tính |
| `session_date` | `YYYY-MM-DD` |
| `app_version_or_sha` | Commit SHA hoặc nhãn build cố định |
| `git_experience_band` | `none`: chưa dùng Git; `basic`: đã dùng commit/branch trong bài tập; `regular`: dùng Git ít nhất hàng tuần hoặc trong dự án |
| `recruitment_source` | Kênh/phương thức tuyển đã khử nhận diện, ví dụ `campus_convenience` hoặc `student_club_open_call`; không ghi tên lớp, người giới thiệu hay thông tin liên hệ |
| `eligibility_criteria` | Tiêu chí chọn mẫu thực tế đã áp dụng, ví dụ `student; first_time_gitscope`; không suy ra từ `git_experience_band` |
| `consent_obtained` | `yes`; hàng không có đồng thuận không được lưu |
| `session_duration_seconds` | Tổng thời gian thực tế, tối đa 1800 trừ deviation đã ghi |
| `protocol_deviation` | Mô tả ngắn đã khử nhận diện; `NA` nếu không có |

### Quiz

- `*_response`: `A`, `B`, `C`, `D`, `MISSING`.
- `*_correct`: `1`, `0`, `MISSING`.
- `pre_score`, `post_score`: tổng 0–6; dùng `MISSING` nếu form thiếu câu và không tự nội suy.

### Level

- `levelNN_seconds`: số giây từ lúc level hiển thị đến hoàn thành/dừng; không đổi timeout thành dữ liệu hoàn thành.
- `levelNN_completion`: `independent`, `with_hint`, `not_completed`, `MISSING`.
- `levelNN_wrong_count`: số lệnh sai theo định nghĩa protocol.
- `levelNN_wrong_commands`: các lệnh theo thứ tự, ngăn bởi ` | `. Bọc field bằng dấu nháy kép theo chuẩn CSV nếu có dấu phẩy hoặc dấu nháy; thay dữ liệu nhận diện bằng `[redacted]`.
- `levelNN_stuck_count`: số episode bị kẹt, không phải số giây.
- `levelNN_stuck_notes`: mô tả ngắn gồm trigger và hint; chi tiết đầy đủ ở phiếu quan sát.
- `levelNN_comments`: hành vi hoặc lời nói liên quan trực tiếp tới level, đã khử nhận diện.

Các cột checkpoint và nhận xét cuối là văn bản đã khử nhận diện. Dùng `NA` khi không áp dụng, `MISSING` khi đáng lẽ ghi nhưng bị thiếu; không dùng ô trống hoặc số 0 để che dữ liệu thiếu.

## Kế hoạch phân tích đã định trước

Chỉ dùng mô tả; không kiểm định ý nghĩa thống kê và không suy rộng ra quần thể vì `n = 6–8`.

### 1. Kiểm tra chất lượng dữ liệu

- Xác nhận có 6–8 mã duy nhất, đồng thuận `yes`, thời lượng không quá 1800 giây hoặc có deviation.
- Kiểm tra mỗi response khớp `A`–`D`, điểm item khớp answer key và tổng điểm khớp sáu item.
- Kiểm tra completion dùng đúng ba giá trị; tổng lệnh sai/stuck không âm; mọi `MISSING` có lý do.
- Đối chiếu số episode trong CSV với stuck-event log. Không xóa outlier hợp lệ.

### 2. Completion, thời gian và lỗi

Với từng level, báo cáo:

- số `independent`, `with_hint`, `not_completed` trên tổng số người đã thử;
- median và khoảng min–max của thời gian, ghi rõ các quan sát bị chặn bởi timebox;
- median và khoảng của số lệnh sai;
- số người có ít nhất một stuck episode và tổng episode.

Không gộp `independent` với `with_hint` khi báo cáo chính. Có thể thêm “hoàn thành bất kỳ” như số phụ nếu ghi rõ định nghĩa.

### 3. Detached HEAD

- Chỉ số chính theo tài liệu kỹ thuật: completion của level 04, báo cáo `x/N` độc lập và `y/N` có gợi ý.
- Level 05 và câu checkpoint sau level 04 là bằng chứng bổ sung về phục hồi và mô hình tinh thần.
- Mốc thiết kế ban đầu là ít nhất `5/6` hoàn thành level detached HEAD. Nếu có 7–8 người, báo cáo tỷ lệ thực tế và số nguyên cần thiết để đạt ít nhất cùng tỷ lệ (`ceil(5N/6)`), không đổi mẫu số thành 6.

### 4. Fast-forward so với merge commit

- Báo cáo riêng completion của level 06, 07 và 08.
- Mã hóa checkpoint theo ba mức: `correct`, `partial`, `incorrect/MISSING` dựa trên việc người tham gia nêu được (a) fast-forward không tạo commit mới và di chuyển branch hiện tại; (b) hai tip phân kỳ dẫn tới commit mới có hai parent.
- Đối chiếu hiểu biết nói ra với hành vi: dự đoán trước merge, lệnh sai, số parent nhận ra và việc dùng cờ không được hỗ trợ. Không suy ra hiểu biết chỉ từ việc banner hoàn thành.

### 5. Quiz trước/sau

- Tính cho từng người `post_score - pre_score`, giữ ghép cặp theo participant code.
- Báo cáo bảng điểm từng người, median và khoảng của pre, post và chênh lệch.
- Với từng khái niệm/câu, báo cáo số đúng trước và sau trên cùng số người có đủ cặp.
- Không gọi chênh lệch là “hiệu quả” hay “có ý nghĩa” chỉ từ mẫu này. Practice effect, time pressure và độ tương đương chưa được hiệu chuẩn là các giới hạn bắt buộc nêu.

### 6. Phân tích định tính

1. Đọc toàn bộ stuck notes, lệnh sai và nhận xét mà chưa gán nguyên nhân.
2. Gán mã theo nơi phát sinh: `goal-copy`, `terminal-syntax`, `error-feedback`, `current-target-toggle`, `graph-reading`, `head-model`, `merge-model`, `navigation`, `other`.
3. Với mỗi theme, đếm **số participant** gặp theme, không chỉ số lần lặp của một người.
4. Lưu một mô tả quan sát hoặc trích dẫn ngắn đã khử nhận diện làm bằng chứng; tránh chọn chỉ nhận xét thuận lợi.
5. Tách lỗi sản phẩm có thể tái hiện khỏi nhầm lẫn khái niệm. Mọi sửa code phát sinh thuộc issue khác và phải truy dấu riêng.

## Cấu trúc báo cáo sau khi có dữ liệu

1. Mẫu và quy trình thực tế, gồm build, số người, deviation và dữ liệu thiếu.
2. Bảng completion/thời gian/lệnh sai/stuck cho level 01–08.
3. Kết quả riêng cho detached HEAD và fast-forward vs merge commit.
4. Bảng quiz ghép cặp và phân tích theo item.
5. Các theme định tính kèm bằng chứng đã khử nhận diện.
6. Giới hạn: mẫu nhỏ, convenience sample, một build, timebox, think-aloud và hai form chưa hiệu chuẩn.
7. Danh sách vấn đề cần xử lý, tách khỏi kết luận về sản phẩm.

Không viết phần kết quả cho tới khi có dữ liệu thật. Không tạo participant mẫu, không điền số minh họa vào CSV và không mô tả mục tiêu như kết quả đã đạt.

## Checklist đóng issue #61

- [ ] Có 6–8 phiên hợp lệ, mỗi phiên không quá 30 phút.
- [ ] Mỗi người có pre/post quiz 6 câu hoặc lý do thiếu rõ ràng.
- [ ] Mọi người được thử task detached HEAD và fast-forward/merge commit.
- [ ] Có thời gian, completion, lệnh sai, stuck episodes và nhận xét theo level.
- [ ] CSV chỉ chứa dữ liệu thật đã khử nhận diện.
- [ ] Phân tích mô tả đúng giới hạn mẫu nhỏ và không đưa claim thống kê.
