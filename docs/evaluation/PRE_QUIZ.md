# GitScope pre-quiz — Form A

- **Mã phiên:** __________
- **Thời gian:** 4 phút

**Hướng dẫn:** Chọn **một** đáp án cho mỗi câu. Không dùng GitScope, tài liệu hoặc tìm kiếm. Commit ID chỉ là nhãn; mũi tên `A → B` nghĩa là B là commit con của A. Nếu không chắc, vẫn chọn phương án bạn cho là hợp lý nhất.

## Câu 1

Graph có `C1 → C2`; branch `main` trỏ vào `C2`, và HEAD đang attached vào `main`. Sau `git branch feature`, trạng thái nào đúng?

- A. HEAD chuyển sang `feature`; `main` và `feature` cùng trỏ `C2`.
- B. `feature` trỏ `C2`; HEAD vẫn attached vào `main` tại `C2`.
- C. Một commit mới được tạo cho `feature`; HEAD vẫn ở `main`.
- D. `feature` trỏ `C2`, còn `main` lùi về `C1`.

**Trả lời:** ____

## Câu 2

Graph có `C1 → C2 → C3`; `main` trỏ `C3`, HEAD attached vào `main`. Sau `git checkout C1`, điều gì xảy ra?

- A. `main` lùi về `C1` và HEAD vẫn attached vào `main`.
- B. Một branch tên `C1` được tạo.
- C. HEAD detached tại `C1`, còn `main` vẫn trỏ `C3`.
- D. HEAD detached tại `C3`, còn `main` trỏ `C1`.

**Trả lời:** ____

## Câu 3

HEAD đang detached tại `C2`; `main` vẫn trỏ vào `C4`. Người dùng chạy `git commit -m "experiment"`. Kết quả nào đúng?

- A. Commit mới là con của `C2`; detached HEAD chuyển tới commit mới; `main` vẫn ở `C4`.
- B. Commit mới là con của `C4`; `main` và HEAD cùng chuyển tới commit mới.
- C. Commit mới là con của `C2`; `main` chuyển tới commit mới và HEAD attached lại.
- D. Lệnh luôn bị từ chối vì không thể commit khi HEAD detached.

**Trả lời:** ____

## Câu 4

HEAD đang detached tại `C1`; branch `main` trỏ `C3`. Mục tiêu là attached HEAD lại vào `main` mà không đổi commit hoặc vị trí branch. Lệnh nào phù hợp?

- A. `git merge main`
- B. `git branch main`
- C. `git checkout C1`
- D. `git switch main`

**Trả lời:** ____

## Câu 5

`main` trỏ `C1`; `feature` trỏ `C2`, trong đó `C2` là con trực tiếp của `C1`. HEAD attached vào `main`. Sau `git merge feature`, kết quả nào đúng?

- A. Tạo merge commit hai parent và cả hai branch cùng chuyển tới nó.
- B. Fast-forward `main` tới `C2`; không tạo commit mới; `feature` vẫn ở `C2`.
- C. `feature` lùi về `C1`; `main` không đổi.
- D. Merge bị từ chối vì hai branch không ở cùng commit.

**Trả lời:** ____

## Câu 6

Từ `C1`, `main` đã có commit `C2` và `feature` đã có commit `C3` riêng. HEAD attached vào `main`. Sau `git merge feature`, cấu trúc nào thể hiện kết quả?

- A. `main` chuyển thẳng tới `C3`; không có commit mới.
- B. `feature` chuyển tới `C2`; không có commit mới.
- C. Tạo commit mới có hai parent `C2` và `C3`; `main` trỏ commit mới, `feature` vẫn trỏ `C3`.
- D. Tạo hai commit mới, mỗi branch nhận một commit.

**Trả lời:** ____
