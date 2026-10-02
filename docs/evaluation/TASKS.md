# GitScope evaluation tasks

## Hướng dẫn chung cho người tham gia

Hãy hoàn thành các level theo thứ tự bằng terminal trong GitScope. Bạn có thể đọc mọi nội dung trong ứng dụng và chuyển giữa `Current`/`Target` hoặc mở `Reference`. Hãy nói ngắn gọn bạn đang muốn thay đổi gì trên graph. Không cần biết trước lời giải; sản phẩm đang được đánh giá, không phải bạn.

Facilitator không đọc phần “Ghi cho observer” thành tiếng.

## Task A — Nền tảng branch và HEAD

**Timebox: 4 phút · Level 01–03**

Sub-timebox: level 01 tối đa 60 giây; level 02 tối đa 90 giây; level 03 dùng phần thời gian còn lại.

1. Hoàn thành level 01, tạo commit đầu tiên trên `main`.
2. Hoàn thành level 02, tạo `feature` tại commit hiện tại nhưng giữ HEAD trên `main`.
3. Hoàn thành level 03, attached HEAD vào `feature` mà không di chuyển branch nào.

**Ghi cho observer:** Bấm giờ riêng từng level. Ghi việc người tham gia có phân biệt “tạo branch” với “chuyển branch” hay không; không giải thích sự khác nhau.

## Task B — Detached HEAD và phục hồi

**Timebox: 4 phút · Level 04–05**

Sub-timebox: level 04 cùng checkpoint tối đa 150 giây; level 05 dùng phần thời gian còn lại.

1. Hoàn thành level 04: đưa HEAD tới commit đầu tiên ở trạng thái detached, trong khi `main` vẫn ở commit thứ hai.
2. Khi banner hoàn thành xuất hiện, facilitator hỏi: **“HEAD và `main` đang trỏ/đứng ở đâu, và chúng có còn gắn với nhau không?”** Ghi câu trả lời, không sửa.
3. Hoàn thành level 05: attached HEAD trở lại `main` mà không di chuyển `main` hoặc thay đổi commit.

**Ghi cho observer:** Level 04 là phép đo chính cho metric detached HEAD trong tài liệu kỹ thuật; level 05 kiểm tra khả năng phục hồi. Ghi riêng trạng thái hoàn thành và gợi ý của từng level.

## Task C — Fast-forward và merge commit

**Timebox: 8 phút · Level 06–08**

Sub-timebox: level 06 cùng checkpoint tối đa 120 giây; level 07 cùng checkpoint tối đa 150 giây; level 08 dùng phần thời gian còn lại.

1. Hoàn thành level 06: merge `feature` vào `main` khi `main` có thể fast-forward, không tạo commit mới.
2. Facilitator hỏi: **“Sau merge này, graph có thêm commit không? Điều gì đã di chuyển?”** Ghi câu trả lời, không sửa.
3. Hoàn thành level 07: merge hai branch đã phân kỳ để tạo một commit có hai parent.
4. Facilitator hỏi: **“Điểm nào trên graph khiến lần merge này khác lần trước?”** Ghi câu trả lời, không sửa.
5. Hoàn thành level 08: tạo commit trên `main` trước, rồi merge `feature`; sự phân kỳ phải dẫn tới merge commit hai parent mà không cần cờ `--no-ff`.

**Ghi cho observer:** Không nói trước từ “phân kỳ” nếu người tham gia chưa dùng nó. Ghi xem họ dự đoán fast-forward hay merge commit trước khi chạy merge, số parent họ nhận ra sau merge, và mọi lần thử cờ không được hỗ trợ.

## Khi hết timebox

- Ghi level hiện tại là `not_completed` nếu target chưa đạt.
- Ghi thời gian thực tế đã dùng, lệnh sai, episode bị kẹt và gợi ý đã cấp.
- Chọn level kế tiếp trong danh sách để bảo đảm mọi người được thử cả 8 level. Việc facilitator chỉ điều hướng tới level tiếp theo không phải gợi ý và không tính là hoàn thành; mọi can thiệp vào lệnh hoặc graph phải ghi là protocol deviation.
