# GitScope user-evaluation protocol — issue #61

## 1. Mục đích và phạm vi

Protocol này đánh giá khả năng sử dụng và mức thay đổi kiến thức khi sinh viên lần đầu dùng GitScope. Đây là đánh giá nhỏ, mang tính mô tả và định tính; không phải thí nghiệm đủ lực để suy rộng cho toàn bộ sinh viên.

Các câu hỏi đánh giá:

1. Người tham gia có hoàn thành được 8 level hiện có trong thời gian giới hạn không?
2. Họ có hiểu và thao tác được detached HEAD ở level 04–05 không?
3. Họ có phân biệt được fast-forward với merge commit ở level 06–08 không?
4. Những lệnh sai, điểm bị kẹt và nhận xét nào lặp lại giữa các phiên?
5. Điểm quiz sau có thay đổi thế nào so với quiz trước trên cùng sáu khái niệm?

Không đánh giá staging, `git add`, remote, authentication, server hoặc đồng bộ vì các nội dung đó không thuộc phạm vi GitScope Tier 1.

## 2. Người tham gia

- Tuyển **6–8 sinh viên** chưa từng dùng GitScope.
- Có thể nhận người với kinh nghiệm Git khác nhau. Chỉ ghi một trong ba mức tự khai: `none`, `basic`, `regular` theo định nghĩa trong `README.md`.
- Trước khi mời tham gia, chốt tiêu chí đủ điều kiện và kênh/phương thức tuyển. Với mỗi phiên, ghi bản mô tả đã khử nhận diện vào `recruitment_source` và `eligibility_criteria`; không ghi tên lớp, người giới thiệu hoặc thông tin liên hệ.
- Không thu tên, mã sinh viên, email, số điện thoại, tài khoản, địa chỉ IP, giới tính, tuổi chính xác hoặc thông tin cá nhân không cần thiết.
- Gán mã phiên tuần tự `P01`–`P08`. Bảng nối mã với danh tính không được tạo.
- Chỉ ghi dữ liệu sau khi người tham gia đồng ý. Họ có thể bỏ qua câu hỏi hoặc dừng bất kỳ lúc nào mà không cần nêu lý do.

## 3. Vai trò

- **Facilitator:** đọc đúng kịch bản, quản lý thời gian và cấp gợi ý theo quy tắc.
- **Observer/timekeeper:** bấm giờ, ghi lệnh và sự kiện. Nếu chỉ có một người điều phối, dùng quay màn hình chỉ khi đã có đồng ý riêng; nếu không, ưu tiên ghi trực tiếp.
- Không yêu cầu hoặc thu âm/ghi hình khuôn mặt. Không ghi âm giọng nói nếu chưa có cơ chế đồng thuận và lưu trữ phù hợp.

## 4. Chuẩn bị trước mỗi phiên

1. Dùng cùng một production build, trình duyệt và kích thước cửa sổ cho mọi phiên; ghi commit SHA hoặc nhãn build.
2. Ghi nguồn tuyển và tiêu chí đủ điều kiện đã áp dụng vào bản sao `OBSERVATION_TEMPLATE.md`; không suy ra hai trường này từ mức kinh nghiệm Git.
3. Mở GitScope và kiểm tra đủ bốn tab `Practice`, `Levels`, `Reference`, `Verification`.
4. Xóa tiến độ GitScope trong localStorage hoặc dùng một browser profile sạch. Xác nhận `Levels` hiển thị `0 of 8 complete`.
5. Đưa ứng dụng về level 01. Không để lộ quiz sau hoặc đáp án.
6. Chuẩn bị `PRE_QUIZ.md`, `POST_QUIZ.md`, `TASKS.md`, `OBSERVATION_TEMPLATE.md` và hai đồng hồ: đồng hồ phiên, đồng hồ level.
7. Tắt thông báo trên máy. Không đăng nhập tài khoản cá nhân trong cửa sổ dùng để test.
8. Kiểm tra rằng mọi dữ liệu cũ không còn trong bản sao biểu mẫu của phiên mới.

Nếu build hoặc thiết bị thay đổi giữa các phiên, ghi đó là protocol deviation; không âm thầm gộp như cùng điều kiện.

## 5. Lịch 30 phút

| Phút | Hoạt động | Giới hạn |
|---:|---|---:|
| 00:00–02:00 | Giới thiệu, đồng thuận, kinh nghiệm Git theo nhóm | 2 phút |
| 02:00–06:00 | Pre-quiz, không dùng app hoặc tài liệu | 4 phút |
| 06:00–22:00 | Tasks A–C, thử đủ level 01–08 | 16 phút |
| 22:00–26:00 | Post-quiz, không dùng app hoặc tài liệu | 4 phút |
| 26:00–30:00 | Phỏng vấn ngắn và kết thúc | 4 phút |

Kết thúc phiên ở phút 30. Level chưa xong được ghi `not_completed`; không kéo dài để biến một phiên thất bại thành hoàn thành.

## 6. Kịch bản facilitator

Đọc nguyên văn trước khi bắt đầu:

> Cảm ơn bạn đã tham gia. Chúng tôi đang đánh giá GitScope, không đánh giá năng lực của bạn. Phiên kéo dài đúng 30 phút. Bạn sẽ làm một quiz ngắn, thử tám level, làm một quiz tương đương và trả lời vài câu hỏi. Hãy nói ngắn gọn điều bạn đang nghĩ khi thao tác. Bạn có thể dừng hoặc bỏ qua câu hỏi bất kỳ lúc nào. Chúng tôi chỉ dùng mã phiên, không ghi tên hay mã sinh viên. Bạn có đồng ý tiếp tục và cho phép ghi lại thao tác, thời gian cùng nhận xét không?

Sau khi có đồng ý:

> Trong phần task, hãy dùng giao diện theo cách tự nhiên. Nếu chưa rõ, hãy đọc nội dung trên màn hình trước. Tôi có thể đưa gợi ý theo cùng một quy tắc cho mọi người. Lỗi hoặc chỗ khó hiểu của sản phẩm đều hữu ích; bạn không cần xin lỗi khi nhập sai.

Không giải thích Git, detached HEAD, fast-forward hoặc merge commit trước pre-quiz.

## 7. Cách điều phối task

- Đọc prompt trong `TASKS.md`, sau đó để người tham gia tự thao tác.
- Người tham gia được dùng mọi thông tin có sẵn trong GitScope, gồm `Target`, thông báo lỗi và `Reference`.
- Không chỉ tay vào control, không đọc hộ mục tiêu và không đề xuất lệnh trước khi đủ điều kiện gợi ý.
- Dùng sub-timebox trong `TASKS.md` để mọi người đều được thử cả 8 level. Khi một sub-timebox hết, ghi `not_completed`, chọn level kế tiếp qua danh sách level và tiếp tục; thao tác điều hướng này không phải gợi ý. Thời gian dư chỉ được chuyển cho level sau trong cùng task, không quay lại level cũ.
- Chuyển task khi hết timebox tổng, kể cả khi level hiện tại chưa hoàn thành.
- Ở các checkpoint sau level 04, 06 và 07, hỏi câu trung lập ghi trong `TASKS.md`; không sửa câu trả lời.

### Định nghĩa quan sát

- **Thời gian level:** từ lúc level được chọn/hiển thị đến lúc banner hoàn thành xuất hiện. Nếu hết timebox, ghi số giây đã dùng và `not_completed`.
- **Hoàn thành độc lập (`independent`):** đạt target mà chưa nhận gợi ý facilitator cho level đó.
- **Hoàn thành có gợi ý (`with_hint`):** đạt target sau ít nhất một gợi ý facilitator.
- **Không hoàn thành (`not_completed`):** chưa đạt target khi hết sub-timebox, khi chuyển task hoặc hết phút 22.
- **Lệnh sai:** lệnh đã submit và (a) bị parser/engine từ chối, hoặc (b) được chấp nhận nhưng đi ngược target và cần reset/undo/lệnh sửa. Ghi nguyên văn lệnh nhưng loại bỏ mọi chuỗi có thể nhận diện cá nhân.
- **Bị kẹt:** xảy ra khi có ít nhất một dấu hiệu: không có hành động có ý nghĩa trong 30 giây; lặp lại cùng một hành động không hiệu quả hai lần; nói rõ rằng không biết tiếp tục; hoặc yêu cầu trợ giúp. Mỗi episode được ghi riêng, kể cả khi tự thoát được.
- **Nhận xét:** ghi gần nguyên văn khi có thể, nhưng thay tên/ngữ cảnh nhận diện bằng `[redacted]`. Không diễn giải thành kết luận trong phiếu quan sát.

### Quy tắc gợi ý

Sau 60 giây bị kẹt liên tục, dùng tối đa ba mức theo thứ tự và ghi timestamp/nội dung:

1. **H1 — định hướng:** “Hãy đọc lại mục tiêu và so sánh Current với Target.”
2. Sau thêm 45 giây, **H2 — vùng giao diện:** “Bạn có thể xem các lệnh được phép và phần Reference.”
3. Sau thêm 45 giây, **H3 — khái niệm, không cho lệnh:** nêu phần trạng thái cần thay đổi, ví dụ “Hãy chú ý HEAD đang attached hay detached” hoặc “Hãy nhìn số parent của commit đích.”

Không đọc lệnh lời giải. Nếu cần làm thay để tiếp tục phiên, đánh dấu level `not_completed`, ghi can thiệp là deviation rồi chuyển sang level tiếp theo.

## 8. Kết thúc và phỏng vấn

Hỏi lần lượt, không gợi đáp án:

1. “Phần nào giúp bạn hiểu graph rõ nhất?”
2. “Bạn bị kẹt nhất ở đâu, và lúc đó bạn mong giao diện cho biết điều gì?”
3. “Theo cách hiểu của bạn, khi nào merge chỉ di chuyển branch, và khi nào nó tạo commit mới?”
4. “Có chữ, control hoặc phản hồi nào khiến bạn hiểu sai không?”

Sau khi đã thu post-quiz, facilitator có thể giải thích câu hỏi hoặc sửa hiểu nhầm nếu người tham gia muốn. Phần giải thích sau đo không được ghi như dữ liệu task/quiz.

## 9. Kiểm soát dữ liệu và chất lượng

- Hoàn tất phiếu quan sát ngay sau mỗi phiên; nhập CSV trong ngày và đối chiếu lại một lần.
- `raw-results.csv` chỉ chứa dữ liệu đã quan sát. Không thêm hàng mẫu, không điền giá trị suy đoán và không thay ô thiếu bằng 0.
- Ô không áp dụng dùng `NA`; ô đáng lẽ có nhưng bị thiếu dùng `MISSING`. Lý do phải ghi trong `protocol_deviation` hoặc `facilitator_notes`.
- Không sửa câu trả lời quiz sau khi chấm. Lưu lựa chọn A/B/C/D và biến đúng/sai riêng theo hướng dẫn trong `README.md`.
- Giữ dữ liệu trong kho dự án có quyền truy cập phù hợp. Nếu repo công khai, chỉ commit bản đã loại sạch thông tin nhận diện và chỉ khi quy trình môn học cho phép.
- Không kết luận hoặc sửa sản phẩm giữa chừng rồi tiếp tục gộp các phiên. Nếu buộc phải đổi build, ghi rõ ranh giới build và phân tích tách điều kiện.

## 10. Điều kiện hoàn tất thu thập

Thu thập đạt phạm vi issue #61 khi có 6–8 phiên hợp lệ, mỗi phiên tối đa 30 phút, đủ pre/post quiz hoặc lý do thiếu, mỗi người được thử cả 8 level trừ protocol deviation đã ghi, và mọi episode bị kẹt đã được ghi. Việc đạt phạm vi thu thập không đồng nghĩa sản phẩm đạt mục tiêu học tập.
