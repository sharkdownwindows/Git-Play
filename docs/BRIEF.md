# GitScope — Project Brief

*Tên "GitScope" là placeholder, nhóm có thể đổi.*
Môn học: Lập trình Web · Nhóm 6 người · 3 tuần · Loại project: Others (đã được giảng viên chấp nhận)

## Vấn đề

Sinh viên học Git bằng cách gõ lệnh và hy vọng. Trạng thái repository là vô hình: không ai thấy được commit graph, và đặc biệt không ai thấy được HEAD đang trỏ vào đâu. Hậu quả phổ biến nhất là **detached HEAD** — người dùng commit lên một HEAD không gắn branch, chuyển branch, và mất commit.

LearnGitBranching (LGB) đã giải quyết một phần vấn đề này, nhưng nó là hệ thống đóng: không thể kiểm chứng độc lập rằng hành vi mô phỏng khớp với Git thật.

## Giải pháp

Một web app mô phỏng 5 lệnh Git trên commit graph: `commit`, `branch`, `switch`, `checkout`, `merge`.

GitScope là ứng dụng Tier 1-only chạy hoàn toàn trong trình duyệt và có thể dùng offline sau khi tải. Tiến độ level chỉ được lưu trong localStorage.

Người dùng gõ lệnh vào terminal, thấy graph thay đổi kèm animation, làm các level có kiểm tra mục tiêu tự động, undo/redo tự do.

Cạnh khung graph là **Command Reference**: tóm tắt 5 lệnh kèm sơ đồ mini before→after, hiển thị **trước khi** người dùng gõ. Khi đang gõ, panel tự mở rộng đúng lệnh đang nhập. Người học không phải đoán lệnh làm gì rồi mới thử.

## Điểm khác biệt

Không phải visualizer — visualizer là thứ đã có. Điểm khác biệt là **phương pháp kiểm chứng**:

**Differential testing với Git thật.** Một harness Node sinh chuỗi lệnh, chạy song song trên engine của chúng tôi và trên `git` thật, chuẩn hóa hai trạng thái rồi so sánh. Vì không gian lệnh nhỏ (5 lệnh), chúng tôi **vét cạn được mọi chuỗi đến độ sâu 3** và random có seed đến độ sâu 20. Đây là claim kiểm chứng được, không phải "chúng em có viết test".

**Tab Verification.** Kết quả diff-test và biểu đồ scaling của thuật toán layout được hiển thị ngay trong app, đọc từ file JSON do CI sinh ra. Người dùng nhìn thấy bằng chứng, không phải lời hứa.

## Phạm vi

**Phạm vi cam kết:** 5 lệnh trên commit DAG · visualizer + animation · Command Reference · terminal + thông báo lỗi giống Git · 8 level · undo/redo · differential testing · benchmark · tab Verification. Không triển khai `add`, authentication, server hoặc đồng bộ.

**Ngôn ngữ giao diện: chỉ tiếng Anh.** Không song ngữ.

**Ngoài phạm vi (v1):** `add` / `restore` và staging area · working directory · nội dung file · merge conflict · remote (`push`/`pull`/`fetch`) · rebase · OAuth, phân quyền, leaderboard, khôi phục mật khẩu.

Các seam trong contract được giữ tương thích với kiểu dữ liệu v1; staging và `add` không thuộc phạm vi sản phẩm.

## Thành công trông như thế nào

| Tiêu chí | Ngưỡng |
|---|---|
| Parity với Git thật | 100% pass trên vét cạn độ sâu ≤ 3 |
| Bằng chứng harness có giá trị | ≥ 1 lỗi engine thật do diff-testing phát hiện, có log |
| Hoàn thành level | ≥ 5/6 người dùng thử hoàn thành được level detached HEAD |
| Hiệu năng | p95 frame time < 16.7 ms tại n = 200 commit |
| Rubric | 5 main features + 2 advanced (diff-testing, benchmark) |

Hàng thứ hai quan trọng nhất. Một harness chưa từng bắt được lỗi nào thì chưa chứng minh được giá trị của nó — đó là điểm yếu duy nhất mà giám khảo có thể tấn công.

## Rủi ro lớn nhất

Không phải kỹ thuật mà là tổ chức. Git engine là critical path; 5 workstream khác đều phụ thuộc vào schema trạng thái của nó. **Hai schema phải được đóng băng trong 2 ngày đầu**: `RepoState` (engine ↔ UI) và `verification.json` (CI ↔ frontend). Nếu không, 6 người sẽ chặn nhau và việc tích hợp bị dồn sang tuần 3.

Cổng kiểm tra ngày 10, feature freeze ngày 15, không thương lượng.

## Thuyết trình

5–7 phút, 1–2 người được gọi ngẫu nhiên → **mọi thành viên phải hiểu toàn hệ thống**. Đây là ràng buộc thiết kế: mỗi tầng trừu tượng thêm vào làm giảm xác suất người được gọi trả lời được câu hỏi. Kiến trúc cố tình phẳng.

Câu mở đầu: *"Sinh viên làm hỏng repo ở detached HEAD vì không nhìn thấy HEAD đang ở đâu. Chúng tôi làm nó hiện ra — và chứng minh mô phỏng của mình khớp với Git thật."*
