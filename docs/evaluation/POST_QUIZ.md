# GitScope post-quiz — Form B

- **Mã phiên:** __________
- **Thời gian:** 4 phút

**Hướng dẫn:** Chọn **một** đáp án cho mỗi câu. Không dùng GitScope, tài liệu hoặc tìm kiếm. Commit ID chỉ là nhãn; mũi tên `A → B` nghĩa là B là commit con của A. Các tình huống kiểm tra cùng khái niệm với quiz trước nhưng dùng graph và cách hỏi khác.

## Câu 1

Graph có `D1 → D2`; branch `develop` trỏ `D2`, HEAD attached vào `develop`. Người dùng tạo branch bằng `git branch review`. Phát biểu nào đúng?

- A. HEAD attached vào `review`, còn `develop` lùi về `D1`.
- B. Một commit mới được tạo và `review` trỏ vào nó.
- C. `review` và `develop` cùng trỏ `D2`; HEAD vẫn attached vào `develop`.
- D. `review` trỏ `D1`, còn HEAD và `develop` ở `D2`.

**Trả lời:** ____

## Câu 2

Branch `release` trỏ `R4`, HEAD attached vào `release`; `R2` là commit cũ hơn. Sau `git switch --detach R2`, trạng thái nào đúng?

- A. HEAD detached tại `R2`; `release` vẫn trỏ `R4`.
- B. HEAD attached vào branch mới tên `R2`.
- C. `release` lùi về `R2`; HEAD vẫn attached vào `release`.
- D. HEAD detached tại `R4`; một branch mới trỏ `R2`.

**Trả lời:** ____

## Câu 3

HEAD detached tại `K1`; branch `stable` trỏ `K3`. Một commit mới được tạo. Mô tả nào đúng?

- A. `stable` tự động chuyển tới commit mới, còn HEAD ở `K1`.
- B. Commit mới luôn có parent là `K3` vì đó là branch gần nhất.
- C. HEAD tự động attached vào `stable` rồi commit.
- D. Commit mới có parent `K1`; detached HEAD chuyển tới commit mới; `stable` vẫn ở `K3`.

**Trả lời:** ____

## Câu 4

HEAD detached tại `T1`; branch `release` trỏ `T4`. Cần attached HEAD vào `release` mà không thay đổi graph. Lệnh nào phù hợp?

- A. `git branch release`
- B. `git checkout release`
- C. `git merge release`
- D. `git checkout T1`

**Trả lời:** ____

## Câu 5

`trunk` trỏ `A`; `topic` trỏ `B`, và `B` là hậu duệ trực tiếp duy nhất của `A`. HEAD attached vào `trunk`. Điều gì xảy ra khi merge `topic`?

- A. `trunk` fast-forward tới `B`, không có commit mới.
- B. Một merge commit hai parent luôn được tạo.
- C. `topic` bị xóa sau merge.
- D. `topic` lùi về `A` để khớp `trunk`.

**Trả lời:** ____

## Câu 6

Từ commit `A`, `trunk` đi tới `B` còn `topic` đi tới `C`. HEAD attached vào `trunk`. Kết quả phù hợp nhất của `git merge topic` là gì?

- A. Chỉ đổi HEAD sang `topic`; hai branch không đổi.
- B. Fast-forward `trunk` tới `C` vì `C` mới hơn.
- C. Di chuyển cả `trunk` và `topic` về `A` trước khi merge.
- D. Tạo commit mới có hai parent `B` và `C`; `trunk` chuyển tới commit đó, `topic` vẫn ở `C`.

**Trả lời:** ____
