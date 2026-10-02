# GitScope — ngân hàng câu hỏi Q&A cho demo

Tài liệu này dùng cho phần hỏi đáp sau demo. Mỗi câu trả lời chính được viết để nói trong khoảng **20–40 giây** ở tốc độ bình thường. Không cần học thuộc từng chữ; cần giữ đúng ý và không biến mục tiêu thành kết quả.

## Trạng thái bằng chứng cần nhớ

- Phạm vi chính thức là **Tier 1-only**: năm lệnh `commit`, `branch`, `switch`, `checkout`, `merge`; không có `add`, authentication, server hay đồng bộ.
- Report CI ngày 30/09/2026, source SHA `4448efb8aaecea310266c3ab002b6928362db466`, ghi nhận **6.160/6.160 case qua hard gate**, **0 hard failure** và **19.806 cảnh báo output mềm**.
- Nhật ký divergence hiện ghi **không có hard divergence được quan sát** và **không có lỗi hard do harness phát hiện đã được xác nhận bằng commit sửa**.
- User evaluation hiện chưa có dữ liệu người tham gia: `n = 0`. Bộ protocol đã sẵn sàng nhưng không được trình bày mục tiêu 6–8 người như kết quả.
- Kiểm tra offline của issue #64 chưa được ghi nhận hoàn tất. Repo hiện không có service worker; không được tuyên bố reload offline đã được bảo đảm.

## Câu hỏi và câu trả lời

### 1. GitScope giải quyết vấn đề gì?

**Trả lời — khoảng 25–30 giây:** GitScope giúp người mới nhìn thấy tác động của lệnh Git lên commit DAG, branch và HEAD, thay vì chỉ ghi nhớ câu lệnh. Người học gõ lệnh trong terminal, xem graph đổi, rồi làm tám level có kiểm tra mục tiêu tự động. Phạm vi cố ý nhỏ: năm lệnh cốt lõi, không mô phỏng file. Giá trị kỹ thuật chính là engine thuần được đối chiếu với Git thật bằng differential testing.

### 2. Tại sao sản phẩm chỉ hỗ trợ năm lệnh?

**Trả lời — khoảng 25–30 giây:** Nhóm có sáu người và ba tuần, nên ưu tiên một lát cắt nhỏ nhưng có thể kiểm chứng. Năm lệnh đã đủ để dạy commit DAG, branch pointer, attached và detached HEAD, fast-forward và merge commit. Thêm remote, rebase hay staging sẽ làm tăng mạnh số trạng thái và số nhánh kiểm thử. Nhóm chọn độ đúng, khả năng giải thích và bằng chứng kiểm chứng thay vì đếm số lệnh.

### 3. Tại sao không triển khai `git add` và staging area?

**Trả lời — khoảng 30–35 giây:** `add` chỉ có ý nghĩa khi mô hình hóa working tree, nội dung file và index. Nếu thêm đúng, nhóm còn phải xử lý snapshot file, trạng thái staged/unstaged và conflict nội dung; harness cũng phải đọc thêm trạng thái working tree. Điều đó vượt ngân sách ba tuần và làm loãng mục tiêu dạy commit graph. Vì vậy v1 tập trung vào DAG, branch và HEAD; `add`, `status`, `restore` và conflict nội dung đều nằm ngoài phạm vi.

### 4. Nếu không làm staging, tại sao `RepoState` vẫn có các trường liên quan?

**Trả lời — khoảng 25–30 giây:** Contract ngày đầu giữ bốn seam là `snapshot`, `workingTree`, `index` và `conflicts` để các module dùng chung một kiểu ổn định. Trong v1, bốn trường này luôn là `null`; chúng không phải tính năng ẩn hay lời hứa roadmap. Cách làm này tránh đổi contract giữa sáu người, nhưng vẫn thể hiện rõ ranh giới nếu sau này nghiên cứu staging. Hiện tại không có `git add` trong parser hay engine.

### 5. Tại sao nhóm cắt Tier 2 dù cổng M4 đã đạt?

**Trả lời — khoảng 30–35 giây:** Tier 2 từng gồm server, authentication và đồng bộ tiến độ, nhưng M5 chốt cắt toàn bộ. Các phần đó không làm mô hình Git chính xác hơn và sẽ kéo theo API, database, bảo mật, triển khai và xử lý xung đột đồng bộ. Nhóm dành quỹ thời gian còn lại cho UI polish, user evaluation, stability và demo. Đây là quyết định quản lý phạm vi: bảo vệ chất lượng Tier 1 thay vì mở rộng một tầng phụ chưa cần thiết.

### 6. Tại sao GitScope cần differential testing khi đã có unit test?

**Trả lời — khoảng 30–35 giây:** Unit test kiểm tra những tình huống nhóm nghĩ ra và thường dùng chính hiểu biết của nhóm làm kỳ vọng, nên đặc tả sai có thể khiến cả code lẫn test cùng sai. Differential testing chạy cùng chuỗi lệnh trên engine GitScope và Git thật, chuẩn hóa hai trạng thái rồi so sánh. Nó bổ sung một oracle độc lập, đặc biệt hữu ích cho tổ hợp branch, detached HEAD và merge mà kiểm thử viết tay dễ bỏ sót.

### 7. Harness differential testing hoạt động như thế nào?

**Trả lời — khoảng 30–35 giây:** Harness chạy ngoài browser bằng Node. Nó sinh chuỗi lệnh vét cạn hoặc random có seed, chạy một nhánh qua engine và một nhánh qua Git 2.43 trong thư mục tạm. Với Git thật, commit dùng `--allow-empty`; locale và global config được kiểm soát. Sau đó harness chuẩn hóa commit theo cấu trúc và thông điệp, không theo hash, rồi so DAG, refs, HEAD, lớp lỗi và output.

### 8. Harness có thể phát hiện những loại lỗi nào?

**Trả lời — khoảng 25–35 giây:** Nó phát hiện sai cấu trúc DAG, sai thứ tự parent của merge commit, branch trỏ sai commit, HEAD attached hay detached sai, và lớp lỗi khác Git thật. Nó cũng ghi lại khác biệt câu chữ output. Nhờ sinh nhiều chuỗi, harness có thể lộ lỗi chỉ xuất hiện sau một lịch sử lệnh cụ thể, không chỉ lỗi của từng lệnh đứng riêng. Nó không kiểm tra nội dung file vì v1 không mô hình hóa phần đó.

### 9. Harness đã thực sự tìm thấy gì trong lần chạy hiện tại?

**Trả lời — khoảng 30–35 giây:** Report hiện tại ghi 6.160 case qua hard gate và không có hard failure. Harness ghi 19.806 cảnh báo output mềm, tập trung ở `branch`, `checkout`, `commit`, `merge` và `switch`: ví dụ GitScope dùng ID `c1` thay hash Git, hoặc rút gọn lời báo detached HEAD. Nhật ký chưa có hard divergence được xác nhận kèm commit sửa, nên nhóm không được nói rằng harness đã bắt và sửa một lỗi logic thật.

### 10. Soft divergence và hard divergence khác nhau thế nào?

**Trả lời — khoảng 25–30 giây:** Hard divergence là khác biệt làm sai ngữ nghĩa: DAG, refs, HEAD hoặc `ErrorClass` không khớp; đây là hard gate và phải làm pipeline thất bại. Soft divergence là câu chữ output khác trong khi trạng thái và loại lỗi vẫn đúng; nó được ghi thành cảnh báo để xem xét nhưng không chặn build. Phân tách này tránh đánh đồng một dấu cách hay hash hiển thị khác với lỗi hành vi Git.

### 11. Tại sao không yêu cầu output phải giống Git từng ký tự?

**Trả lời — khoảng 25–30 giây:** Text lỗi và lời khuyên của Git không phải API ổn định; chúng có thể thay đổi theo phiên bản, locale và cấu hình. GitScope cũng dùng commit ID giáo dục như `c1`, nên không thể trùng hash thật. Vì vậy harness ghim Git 2.43 và `LC_ALL=C`, nhưng chỉ dùng state và `ErrorClass` làm hard gate. Output vẫn được so sánh để phát hiện chênh lệch UX, chỉ không được coi mọi khác biệt chữ là lỗi logic.

### 12. Tại sao layout graph phải deterministic?

**Trả lời — khoảng 25–35 giây:** Cùng một `RepoState` phải luôn tạo cùng tọa độ để người học xây được mô hình tinh thần ổn định và để ảnh, animation, test không nhảy ngẫu nhiên. Determinism cũng giúp tái lập bug và benchmark công bằng. Layout là hàm thuần, không sửa `RepoState`; trục dọc theo độ sâu topo và trục ngang theo lineage cùng cột trống nhỏ nhất. Vì vậy engine, checker và lịch sử không bị visualizer tác động ngược.

### 13. Thuật toán layout xử lý merge như thế nào?

**Trả lời — khoảng 25–30 giây:** Tọa độ dọc của commit là một cộng với độ sâu lớn nhất trong các parent. Dùng `max`, không dùng `min`, bảo đảm mọi parent đều nằm phía trên child kể cả commit merge có hai parent ở độ sâu khác nhau. Tọa độ ngang ưu tiên kế thừa cột của first parent nếu hàng đó còn trống; nếu không, chọn cột trống nhỏ nhất. Cách này tất định và có độ phức tạp mục tiêu O(V+E).

### 14. Benchmark đo những gì?

**Trả lời — khoảng 30–35 giây:** Nhóm tách ba chi phí. Benchmark headless đo riêng hàm `layout()` trên DAG tổng hợp từ 100 đến 100.000 node, báo median và p95. Browser benchmark đo thời gian mount SVG ở 100, 1.000 và 10.000 node, rồi đo khoảng frame animation tại 200 commit bằng timestamp `requestAnimationFrame`. Mục đích là tìm giới hạn thiết kế, không khẳng định công cụ dạy học thực tế cần graph 100.000 node.

### 15. Kết quả benchmark hiện tại nói lên điều gì?

**Trả lời — khoảng 30–40 giây:** Ở report hiện tại, `layout()` có median khoảng 0,25 ms tại 100 node và 224,27 ms tại 100.000 node. SVG render có p95 khoảng 32,3 ms tại 100 node và vượt ngưỡng bão hòa 100 ms đầu tiên ở 1.000 node. Animation tại 200 commit có p95 xấp xỉ 16,7 ms, nhưng issue #47 vẫn mở vì giá trị thô hơi vượt ngưỡng nghiêm ngặt; nhóm chưa quy nguyên nhân hay tuyên bố đã tối ưu.

### 16. Tại sao không dùng D3?

**Trả lời — khoảng 25–30 giây:** GitScope không cần hệ sinh thái D3; nhu cầu chính chỉ là đặt node theo quy tắc Git dễ giải thích. Force-directed layout có thể cho vị trí khác giữa các lần chạy và không thể hiện lineage ổn định như người học mong đợi. Layout hiện tại là hàm thuần nhỏ, tất định và benchmark được trực tiếp; phần hiển thị dùng SVG inline. Thêm D3 sẽ tăng dependency và độ trừu tượng mà không giải quyết yêu cầu cốt lõi.

### 17. Tại sao không dùng ORM?

**Trả lời — khoảng 20–25 giây:** ORM chỉ hữu ích khi có database hoặc tầng persistence phía server. GitScope là static app, không có backend; trạng thái bài tập sống trong bộ nhớ và tiến độ level là một `ProgressSet` nhỏ lưu ở localStorage. Thêm ORM sẽ buộc nhóm tạo database, schema migration và tầng mapping không phục vụ mục tiêu học Git. Sau khi Tier 2 bị cắt, ORM không còn bài toán nào để giải quyết.

### 18. Tại sao không dùng LLM để gợi ý khi người học bị kẹt?

**Trả lời — khoảng 25–30 giây:** Gợi ý bằng LLM cần mạng hoặc một model cục bộ lớn, làm phức tạp yêu cầu offline và khó tái lập. Cùng một trạng thái có thể nhận câu trả lời khác nhau, trong khi GitScope ưu tiên hành vi tất định và kiểm chứng được. Differential testing cũng không thể dùng Git thật để xác nhận chất lượng một lời gợi ý tự do. Vì vậy nội dung level và Command Reference được viết, kiểm tra và chạy hoàn toàn cục bộ.

### 19. Ứng dụng chạy offline như thế nào, và hiện đã xác minh đến đâu?

**Trả lời — khoảng 30–40 giây:** Về kiến trúc, production build là file tĩnh; engine, parser, levels và layout chạy trong browser, còn tiến độ lưu localStorage nên không cần server lúc thao tác. Tuy nhiên trạng thái hiện tại phải nói rõ: issue kiểm tra offline #64 chưa được ghi hoàn tất và repo chưa có service worker. Phiên đã tải có thể tiếp tục dùng phần lõi, nhưng reload offline còn phụ thuộc cache trình duyệt; tab Verification còn fetch `/verification.json` và có thể hiện lỗi. Chưa được tuyên bố offline hoàn toàn đã đạt.

### 20. Tại sao dùng localStorage thay vì tài khoản và đồng bộ?

**Trả lời — khoảng 25–30 giây:** Tiến độ chỉ gồm `levelId`, thời điểm hoàn thành và số lệnh, nên localStorage đủ cho phạm vi một thiết bị. Nó giữ app tĩnh, không cần thu thập danh tính, API, database, đăng nhập hay chiến lược giải quyết xung đột sync. Đổi lại, tiến độ không đi theo người dùng sang máy hoặc browser khác và có thể mất khi xóa dữ liệu trình duyệt. Đây là trade-off đã chấp nhận khi cắt Tier 2.

### 21. Tại sao parser và engine được tách riêng?

**Trả lời — khoảng 25–30 giây:** Parser chỉ trả lời câu lệnh có đúng cú pháp để tạo `Command` hay không; engine mới biết trạng thái repository và quyết định branch có tồn tại, HEAD đang ở đâu hay merge có hợp lệ. Tách hai trách nhiệm làm lỗi rõ hơn, test tập trung hơn và giữ core độc lập với terminal. Harness cũng có thể gọi engine trực tiếp bằng command có cấu trúc mà không cần giả lập nhập liệu giao diện.

### 22. Tại sao core engine không được phụ thuộc React hoặc DOM?

**Trả lời — khoảng 25–30 giây:** Engine là nguồn sự thật của hành vi Git, nên phải chạy giống nhau trong browser, unit test và Node harness. Nếu core import React, DOM hay browser API, differential harness sẽ khó gọi trực tiếp và logic nghiệp vụ bị trộn với hiển thị. Quy tắc import được kiểm tra tự động. UI chỉ gửi `Command` vào engine và nhận `RepoState` cùng output; visualizer đọc state nhưng không được sửa nó.

### 23. Tại sao không so sánh commit hash giữa GitScope và Git thật?

**Trả lời — khoảng 25–30 giây:** Hash Git phụ thuộc vào nội dung commit, parent, author, timestamp và metadata; GitScope cố ý dùng ID tuần tự như `c1` và không mô hình hóa file. So hash sẽ luôn báo khác dù graph đúng. Harness vì thế chuẩn hóa commit theo thông điệp test và cấu trúc parent, rồi so quan hệ DAG, vị trí branch và trạng thái HEAD. Đây cũng là lý do checker level bỏ qua ID và message nhưng giữ cấu trúc.

### 24. Merge trong GitScope giống và khác Git thật ở đâu?

**Trả lời — khoảng 25–35 giây:** GitScope mô hình hóa phần graph: nếu tip bên kia là hậu duệ phù hợp thì fast-forward, còn hai tip phân kỳ tạo merge commit có hai parent theo thứ tự. Nhưng v1 không có nội dung file, working tree hay index, nên không thể phát hiện hoặc giải quyết merge conflict nội dung. Vì vậy graph semantics nằm trong phạm vi kiểm chứng; conflict thực và chiến lược merge file phải được nêu là giới hạn, không phải tính năng.

### 25. Hạn chế của user evaluation với 6–8 người là gì?

**Trả lời — khoảng 30–35 giây:** Sáu đến tám người là mẫu nhỏ, có thể là convenience sample và không đại diện cho toàn bộ người học Git. Kết quả chỉ phù hợp để mô tả chỗ bị kẹt, tỷ lệ hoàn thành trong nhóm và thay đổi pre/post của chính những người đó; không đủ để suy rộng hay tuyên bố hiệu quả có ý nghĩa thống kê. Think-aloud, giới hạn 30 phút, practice effect và hai quiz chưa hiệu chuẩn cũng có thể ảnh hưởng quan sát.

### 26. Nhóm đã có kết quả user evaluation chưa?

**Trả lời — khoảng 20–25 giây:** Chưa. `raw-results.csv` hiện chỉ có header, tương đương `n = 0`, nên completion rate, thời gian, điểm pre/post và finding usability đều là `N/A`, không phải 0%. Nhóm mới có protocol, quiz, task, observation template và schema kiểm tra dữ liệu. Khi trình bày, phải phân biệt rõ kế hoạch tuyển 6–8 người với dữ liệu thực tế chưa được thu thập.

### 27. Tab Verification có tác dụng gì nếu harness chạy ngoài browser?

**Trả lời — khoảng 25–30 giây:** Differential test và benchmark chạy trong CI nên nếu chỉ để trong log, giám khảo không nhìn thấy phần kỹ thuật quan trọng nhất. CI gộp kết quả vào `public/verification.json`; tab Verification chỉ validate rồi render file đó. Tab hiển thị thời điểm sinh, commit SHA, phiên bản Git và Node để truy nguồn. Nếu file thiếu hoặc sai schema, UI hiện trạng thái lỗi thay vì thay bằng số liệu giả.

### 28. Tại sao undo/redo dùng snapshot thay vì lệnh đảo ngược?

**Trả lời — khoảng 25–30 giây:** Với state nhỏ vài chục commit, snapshot toàn bộ `RepoState` trước mỗi lệnh đơn giản và ít rủi ro. Viết inverse riêng cho branch, detached HEAD và đặc biệt merge dễ tạo thêm lỗi nghiệp vụ. Hai stack snapshot cũng làm hành vi rõ: undo lùi state, redo tiến lại, còn lệnh mới xóa redo stack. Đây là tính năng của simulator, không được mô tả như một lệnh Git thật.

### 29. Random testing có phải là AI hay machine learning không?

**Trả lời — khoảng 20–25 giây:** Không. Fuzzer dùng bộ sinh thủ tục với seed cố định để chọn chuỗi lệnh; cùng seed và input sẽ tái lập cùng ca kiểm thử. Nó không học từ dữ liệu, không huấn luyện model và không có metric accuracy hay F1. Random testing chỉ bổ sung cho vét cạn độ sâu ba bằng cách thăm dò các chuỗi dài hơn trong ngân sách thời gian.

### 30. GitScope khác nguồn cảm hứng learnGitBranching ở điểm nào?

**Trả lời — khoảng 25–30 giây:** learnGitBranching là nguồn cảm hứng về việc học Git qua graph tương tác. Với GitScope, claim nhóm bảo vệ là phạm vi và phương pháp của chính sản phẩm: năm lệnh, level checker, engine thuần, differential harness với Git thật và report truy nguồn trong app. Nhóm chưa xác minh mã nguồn learnGitBranching để khẳng định chi tiết nó thiếu tính năng nào, vì vậy không nên tạo so sánh tiêu cực không có bằng chứng trong Q&A.

### 31. Nếu được yêu cầu tóm tắt architecture, nên trả lời thế nào?

**Trả lời — khoảng 30–35 giây:** Luồng chính là terminal parse text thành `Command`, application store gửi command vào engine thuần, engine trả `RepoState`, rồi graph và level checker cùng đọc state đó. Undo/redo lưu snapshot; progress lưu localStorage. Ngoài browser, Node harness chạy cùng engine và Git thật, benchmark layout, rồi CI sinh `verification.json` cho tab Verification. Các biên quan trọng là core không phụ thuộc UI, parser chỉ kiểm cú pháp và layout không mutate state.

## Kịch bản architecture 2 phút — cả sáu thành viên đều phải nói được

Phần này dài hơn câu trả lời Q&A thông thường. Mỗi thành viên tập nói độc lập trong **1 phút 45 giây đến 2 phút**, không chỉ học phần mình code.

> GitScope có kiến trúc cố ý phẳng, gồm một luồng runtime trong browser và một luồng kiểm chứng ngoài browser. Ở runtime, người dùng nhập lệnh vào Terminal. Parser chỉ kiểm cú pháp và chuyển text thành một `Command` có kiểu; nó chưa quyết định branch hay commit có tồn tại. Application store nhận command và gọi Git engine. Engine là TypeScript thuần, không phụ thuộc React, DOM hay browser API. Nó kiểm tra trạng thái repository và trả về `Result` gồm `RepoState`, output, trạng thái thành công và lớp lỗi nếu có; engine không throw cho lỗi Git thông thường.
>
> `RepoState` là contract chung giữa các phần. Visualizer đọc state để tính layout tất định rồi render SVG, nhưng không sửa state. Level checker cũng đọc cùng state và so DAG theo cấu trúc, branch và HEAD, không phụ thuộc commit ID. Undo/redo lưu snapshot của `RepoState`. Tiến độ level là dữ liệu riêng, chỉ lưu trong localStorage; không có account, server hay sync.
>
> Luồng thứ hai là verification. Node harness import trực tiếp engine, sinh chuỗi lệnh có seed và chạy cùng đầu vào trên GitScope lẫn Git thật trong thư mục tạm. Vì hash hai bên khác nhau, harness chuẩn hóa theo cấu trúc parent rồi so DAG, refs, HEAD và `ErrorClass`; khác output chỉ là cảnh báo mềm. Benchmark gọi cùng hàm layout và đo riêng SVG cùng animation trong browser. CI gộp kết quả thành `public/verification.json`; tab Verification validate và hiển thị report cùng timestamp và commit SHA, chứ không tự tạo số liệu.
>
> Ba ranh giới cần nhớ là: parser kiểm cú pháp còn engine kiểm repository; core không phụ thuộc UI để chạy được trong Node; layout chỉ biến state thành tọa độ và không mutate state. Nhờ đó sáu người có thể làm song song trên contract ổn định, và hành vi chính vừa dễ giải thích vừa kiểm chứng được.

### Checklist chấm phần architecture của từng thành viên

Mỗi người đạt khi nói đủ các ý sau trong hai phút:

1. Luồng `Terminal → parser → store → engine → RepoState → graph/checker`.
2. `RepoState` là contract chung; engine thuần và không phụ thuộc React/DOM.
3. Layout deterministic, không mutate state; undo/redo dùng snapshot.
4. Progress chỉ ở localStorage, không backend hay sync.
5. Harness Node so engine với Git thật; hard gate khác soft warning.
6. CI sinh `verification.json`; Verification tab chỉ validate và render bằng chứng có provenance.

## Những câu tuyệt đối không nói

- Không nói “GitScope hỗ trợ Git đầy đủ”, “có staging” hoặc “có merge conflict nội dung”.
- Không nói “harness đã tìm và sửa bug logic” khi nhật ký hiện chưa có hard divergence kèm commit sửa.
- Không gọi 19.806 warning là 19.806 test thất bại; đó là khác biệt output mềm.
- Không nói “evaluation chứng minh người dùng học tốt hơn”; hiện chưa có participant.
- Không nói “offline đã pass” hoặc “reload offline luôn hoạt động”; issue #64 chưa hoàn tất và chưa có service worker.
- Không nói p95 animation đã đạt chắc chắn; issue #47 vẫn mở.
- Không mô tả undo/redo là lệnh Git thật hoặc random fuzzer là AI.
