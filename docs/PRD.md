# GitScope — PRD

`BRIEF.md` hiện là placeholder. Phạm vi dưới đây dựa trên `ISSUES.md`, `TECHNICAL_OVERVIEW.md` và ba contract đã chấp nhận trong source. Các mục dự kiến chưa được coi là đã hoàn thành.

## 1. Mục tiêu

Xây dựng web app giáo dục giúp người học thấy tác động của lệnh Git lên commit DAG, branch và HEAD. Tier 1 chạy trên static hosting; độ đúng của engine được đánh giá bằng unit test và harness so với `git` thật. Dự án dành cho nhóm sáu người trong ba tuần, demo 5–7 phút.

## 2. Phạm vi

### Tier 1 — bắt buộc

- Engine mô phỏng `commit`, `branch`, `switch`, `checkout`, `merge` trên DAG không có nội dung file.
- Terminal nhập lệnh, parser cú pháp và hiển thị output/lỗi; graph hiển thị commit, cạnh, branch và HEAD.
- Level có trạng thái đầu, mục tiêu được kiểm tra tự động, Command Reference cho năm lệnh, undo/redo và tiến độ lưu local.
- Harness Node so engine với `git` thật, benchmark layout, report `verification.json` và tab Verification đọc report.
- Ứng dụng chạy trên static hosting và tiếp tục dùng được offline sau khi tải.
- localStorage là nguồn lưu tiến độ duy nhất; không có dịch vụ phía server.

### Phạm vi đã loại

M5 chính thức chốt GitScope là sản phẩm Tier 1-only. Không triển khai `add`, authentication, server hoặc đồng bộ tiến độ. Tài khoản và đồng bộ từng được cân nhắc sau cổng M4 nhưng đã bị cắt; xem `STATUS.md`.

## 3. Functional requirements

### 3.1 Lệnh và trạng thái repository

| ID | Yêu cầu |
|---|---|
| FR-1 | `commit` tạo commit và dịch branch hiện tại hoặc detached HEAD theo trạng thái. |
| FR-2 | `branch` tạo named ref; lệnh và trạng thái không hợp lệ trả lỗi. |
| FR-3 | `switch` chuyển branch, hỗ trợ `-c` và `--detach` theo `Command` hiện tại. |
| FR-4 | `checkout` chuyển branch/commit, hỗ trợ `-b` theo `Command` hiện tại. |
| FR-5 | `merge` phân biệt fast-forward với merge commit hai parent; v1 không có conflict nội dung. |
| FR-14 | `RepoState` theo `src/core/types.ts`, JSON-serializable. Commit có `id`, `message`, `parents` có thứ tự, `timestamp`; `head` phân biệt attached/detached. `snapshot`, `workingTree`, `index`, `conflicts` luôn `null` ở v1. |

Parser chỉ xác nhận cú pháp và trả `Command | ParseError`; engine xác nhận trạng thái repository và trả `Result` mà không throw. `switch` và `checkout` đều có cờ `create`. Khi lỗi, `Result` giữ state cũ và mang `errorClass`.

### 3.2 Học và giao diện

| ID | Yêu cầu |
|---|---|
| FR-20 | Terminal nhận lệnh, có lịch sử nhập và hiển thị kết quả. |
| FR-21 | Graph hiển thị DAG, branch ref và HEAD; layout tất định và không sửa `RepoState`. |
| FR-29 | Checker so DAG đẳng cấu, bỏ qua commit ID/message nhưng giữ cấu trúc, vị trí branch và HEAD; sandbox không tự hoàn thành. |
| FR-30 | Undo/redo bằng snapshot của `RepoState`; lệnh mới xóa redo stack. |
| FR-31 | Tiến độ level chỉ lưu trong localStorage. Đây là nguồn tiến độ duy nhất. `LevelRecord` và `ProgressSet` theo `src/progress/types.ts`: `levelId`, `completedAt`, `commandCount`; khóa record là `levelId`. |
| FR-37 | Command Reference nêu cú pháp/tác động của năm lệnh và dùng engine/layout cho sơ đồ mini. |

### 3.3 Kiểm chứng

| ID | Yêu cầu |
|---|---|
| FR-41 | Tab Verification hiển thị `generatedAt` và `commitSha` để truy nguồn kết quả. |
| FR-42 | Harness so DAG, refs, HEAD và lớp lỗi với `git` thật; `errorClass` là hard gate, khác câu chữ `output` là cảnh báo. |
| FR-43 | Frontend chỉ đọc `public/verification.json` theo `src/verification/report.ts`, gồm `schemaVersion`, metadata, `diffTest`, `coverage`, `scaling`, `divergences`. |
| FR-44 | Report thiếu hoặc sai schema phải có empty state rõ ràng; không trình bày dữ liệu giả như kết quả thật. |
| FR-45 | Bốn seam staging trong `RepoState` có mặt và luôn `null` ở v1; staging và `add` không thuộc phạm vi sản phẩm. |

## 4. Non-functional requirements

| ID | Yêu cầu / cách kiểm |
|---|---|
| NFR-1 | Tier 1 chạy offline sau khi tải; kiểm bằng việc tắt mạng và hoàn thành một level. |
| NFR-2 | Core không import React, DOM hay UI; harness có thể import trực tiếp trong Node. |
| NFR-3 | Layout tất định, không mutate state; đo scaling trên DAG tổng hợp. |
| NFR-4 | Engine và các bộ sinh test có kết quả tái lập được với cùng input/seed. |
| NFR-5 | Typecheck, unit test, build và kiểm tra luật import chạy trong validation/CI. |
| NFR-8 | Cấu trúc đủ rõ để cả sáu thành viên giải thích được trong hai phút. |

Các mục tiêu định lượng cho diff-test, frame time, bundle và CI nằm ở `TECHNICAL_OVERVIEW.md` §9 và cổng tương ứng trong `ISSUES.md`; đó là mục tiêu cần đo, chưa phải kết quả.

## 5. Non-goals

- Không mô phỏng working tree, staging, nội dung file hay conflict nội dung ở v1.
- Không có remote Git (`push`, `pull`, `fetch`, `clone`) và không mở rộng ngoài năm lệnh bắt buộc trước cổng scope.
- Không triển khai `add`, authentication, server, đồng bộ, remote Git, ML/LLM, dataset ngoài, force-directed layout hoặc monorepo.
- Undo/redo là chức năng của simulator, không được mô tả là lệnh Git thật.

## 6. Success criteria

| ID | Điều kiện đạt |
|---|---|
| SC-1 | Năm lệnh hoạt động đúng phạm vi §3.1. |
| SC-2 | Differential test đạt 100% trên vét cạn độ sâu ≤ 3; random có seed được báo cáo riêng. |
| SC-3 | Tab Verification hiển thị report từ một CI run thật cùng timestamp và SHA. |
| SC-4 | Tier 1 hoàn thành được level khi offline. |
| SC-5 | Có level dạy detached HEAD và phân biệt fast-forward/merge commit. |
| SC-6 | Cả sáu thành viên giải thích được kiến trúc trong hai phút. |
| SC-7 | Feature freeze ngày 15 theo `ISSUES.md`. |

Trạng thái từng mốc và bằng chứng hiện có nằm ở `STATUS.md`; tiêu chí tương lai ở đây không xác nhận mốc đã đạt.
