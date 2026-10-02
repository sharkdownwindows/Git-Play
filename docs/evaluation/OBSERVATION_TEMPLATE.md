# GitScope observation template

Tạo một bản sao cho mỗi phiên. Không ghi tên, mã sinh viên, email hoặc thông tin nhận diện khác. Dùng `NA` cho không áp dụng và `MISSING` cho dữ liệu đáng lẽ có nhưng không ghi được.

## 1. Thông tin phiên

| Trường | Giá trị |
|---|---|
| Participant code (`P01`–`P08`) | |
| Ngày phiên (`YYYY-MM-DD`) | |
| App version / commit SHA | |
| Trình duyệt và viewport | |
| Git experience (`none` / `basic` / `regular`) | |
| Nguồn tuyển đã khử nhận diện (`recruitment_source`) | |
| Tiêu chí đủ điều kiện đã áp dụng (`eligibility_criteria`) | |
| Đồng thuận đã có? (`yes` / `no`) | |
| Giờ bắt đầu | |
| Giờ kết thúc | |
| Tổng thời gian (giây) | |
| Protocol deviation trước phiên | |

Nếu đồng thuận là `no`, dừng phiên và không giữ phiếu này trong dữ liệu phân tích.

## 2. Quiz trước

Ghi lựa chọn trước khi chấm.

| Câu | 1 | 2 | 3 | 4 | 5 | 6 | Tổng đúng (0–6) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Lựa chọn A/B/C/D | | | | | | | |
| Đúng `1`, sai `0` | | | | | | | |

## 3. Level log

`Completion`: `independent`, `with_hint`, hoặc `not_completed`. Thời gian tính từ lúc level hiển thị đến banner hoàn thành hoặc lúc dừng.

| Level | Bắt đầu | Kết thúc | Giây | Completion | Số lệnh sai | Lệnh sai đã submit | Số episode kẹt | Nhận xét/quan sát |
|---|---|---|---:|---|---:|---|---:|---|
| 01 First commit | | | | | | | | |
| 02 Create a branch | | | | | | | | |
| 03 Switch or checkout | | | | | | | | |
| 04 Detached HEAD | | | | | | | | |
| 05 Recover from detached HEAD | | | | | | | | |
| 06 Fast-forward merge | | | | | | | | |
| 07 Merge two branches | | | | | | | | |
| 08 When fast-forward is impossible | | | | | | | | |

## 4. Stuck-event và hint log

Ghi **mọi** episode đáp ứng định nghĩa trong protocol, kể cả khi người tham gia tự thoát được.

| Timestamp phiên | Level | Dấu hiệu quan sát được | Vị trí UI/khái niệm | Hành động/lệnh ngay trước đó | Tự thoát? | Hint (`none`/`H1`/`H2`/`H3`) | Nội dung hint | Kết quả sau hint |
|---:|---:|---|---|---|---|---|---|---|
| | | | | | | | | |

## 5. Checkpoint kiến thức trong task

Ghi gần nguyên văn; không chấm hoặc sửa trong phiên.

| Checkpoint | Câu trả lời/nhận xét |
|---|---|
| Sau level 04: vị trí và quan hệ HEAD/`main` | |
| Sau level 06: có commit mới không, cái gì di chuyển | |
| Sau level 07: graph khác lần fast-forward ở đâu | |
| Level 08: dự đoán trước merge | |
| Level 08: nhận ra số parent sau merge | |

## 6. Quiz sau

Ghi lựa chọn trước khi chấm.

| Câu | 1 | 2 | 3 | 4 | 5 | 6 | Tổng đúng (0–6) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Lựa chọn A/B/C/D | | | | | | | |
| Đúng `1`, sai `0` | | | | | | | |

## 7. Phỏng vấn kết thúc

| Câu hỏi | Câu trả lời/ghi chú đã khử nhận diện |
|---|---|
| Phần giúp hiểu graph rõ nhất | |
| Chỗ bị kẹt nhất và thông tin mong muốn | |
| Khi nào merge di chuyển branch / tạo commit | |
| Chữ, control hoặc phản hồi gây hiểu sai | |

## 8. Tổng kết phiên, chưa kết luận nghiên cứu

| Mục | Ghi chú |
|---|---|
| Lỗi sản phẩm quan sát được | |
| Can thiệp ngoài quy tắc | |
| Dữ liệu thiếu và lý do | |
| Protocol deviation trong phiên | |
| Ghi chú facilitator | |

## 9. Kiểm tra quyền riêng tư và nhập liệu

- [ ] Không có tên, mã sinh viên, email hoặc chi tiết nhận diện.
- [ ] Nguồn tuyển và tiêu chí đủ điều kiện đã được ghi bằng mô tả không nhận diện.
- [ ] Mọi lệnh sai và episode bị kẹt đã được ghi.
- [ ] Thời gian và completion của từng level đã thử được ghi.
- [ ] Lựa chọn quiz được giữ nguyên trước khi chấm.
- [ ] Dữ liệu đã được nhập vào `raw-results.csv` và đối chiếu lại.
- [ ] Không thêm suy đoán hoặc kết luận vào dữ liệu thô.
