# Phân công nhiệm vụ nhóm 4 thành viên

**Đề tài:** Hệ thống thi trắc nghiệm trực tuyến PTIT ExamPro.

**Căn cứ:** Các chức năng, API và cấu trúc dữ liệu đang có trong mã nguồn dự án. Công nghệ hiện tại: React, Express, MySQL, Context, Zustand, JWT, bcrypt và chatbot Gemini.

**Cách sử dụng:** Thay TV1–TV4 bằng họ tên, mã sinh viên thực tế. Tài liệu phân chia phạm vi phụ trách mã nguồn hiện có, không xác nhận tác giả hoặc đóng góp trong quá khứ.

## 1. Nguyên tắc phân công

- Chia theo chức năng. Mỗi thành viên phụ trách xuyên suốt giao diện React, REST API Express và dữ liệu của chức năng mình.
- Mỗi thành viên phụ trách và giải thích được cả frontend, backend và dữ liệu trong phạm vi được giao.
- Mỗi người tự kiểm tra, viết tài liệu và chuẩn bị demo cho phần mình. Trưởng nhóm tổng hợp tài liệu và tích hợp mã nguồn.
- Phạm vi chỉ gồm chức năng và mã nguồn hiện có; giữ nguyên cấu trúc file và công nghệ hiện tại.

## 2. Bảng phân công tổng quát

| Thành viên | Vai trò và phạm vi | Thao tác hiện có | Dữ liệu phụ trách |
| --- | --- | --- | --- |
| TV1 – [Họ tên, MSSV] | Trưởng nhóm; tài khoản, xác thực, phân quyền và quản lý môn học | Đăng ký, đăng nhập; thêm/xem/sửa/xóa môn học | `users`, `subjects` |
| TV2 – [Họ tên, MSSV] | Ngân hàng câu hỏi và trợ lý học tập Gemini | Thêm/xem/sửa/xóa câu hỏi; hỏi đáp chatbot | `questions` |
| TV3 – [Họ tên, MSSV] | Quản lý đề thi; danh sách, tìm kiếm và chi tiết đề | Thêm/xem/sửa/xóa, công bố đề | `exams`, `exam_questions` |
| TV4 – [Họ tên, MSSV] | Làm bài, chấm điểm, lịch sử và quản lý kết quả | Chọn/đổi đáp án trong phiên; nộp, xem và xóa bài nộp theo quyền | `submissions`; phiên làm bài trong `sessionStorage` |

## 3. TV1 – Tài khoản, phân quyền và quản lý môn học

### 3.1. Nhiệm vụ frontend

- Phụ trách trang đăng ký, đăng nhập, hiển thị người dùng và đăng xuất.
- Kiểm tra đầu vào; hiển thị lỗi email trùng, sai mật khẩu, thiếu thông tin.
- Quản lý trạng thái tài khoản bằng `AuthContext`; khôi phục thông tin khi tải lại trang và xóa trạng thái khi đăng xuất.
- Phụ trách `ProtectedRoute`, điều hướng và hiển thị menu theo vai trò.
- Phụ trách danh sách môn học, form thêm/sửa, xác nhận xóa; các trường mã môn, tên môn và mô tả.
- Hiển thị thông báo khi mã môn bị trùng hoặc môn còn dữ liệu phụ thuộc.

### 3.2. Nhiệm vụ backend và dữ liệu

- Phụ trách các API đăng ký, đăng nhập và lấy thông tin tài khoản hiện tại.
- Băm mật khẩu bằng bcrypt, cấp và kiểm tra JWT, kiểm tra quyền sinh viên/giảng viên.
- Đăng ký công khai chỉ tạo tài khoản sinh viên; không cho người dùng tự nâng quyền.
- Phụ trách CRUD môn học và kiểm tra dữ liệu tại server.
- Quản lý dữ liệu `users`, `subjects`; ràng buộc email, mã môn duy nhất và quan hệ người tạo môn.
- Phụ trách quy tắc chặn xóa môn khi môn còn câu hỏi hoặc đề thi.

### 3.3. API phụ trách

| Method | Đường dẫn | Chức năng |
| --- | --- | --- |
| POST | `/api/auth/register` | Đăng ký sinh viên |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/me` | Lấy thông tin tài khoản hiện tại |
| GET | `/api/subjects` | Xem danh sách môn |
| POST | `/api/subjects` | Thêm môn |
| PUT | `/api/subjects/:id` | Sửa môn |
| DELETE | `/api/subjects/:id` | Xóa môn |

### 3.4. Mã nguồn phụ trách

- `frontend/src/pages/auth/LoginPage.jsx`
- `frontend/src/pages/auth/RegisterPage.jsx`
- `frontend/src/context/AuthContext.jsx`
- `frontend/src/router/ProtectedRoute.jsx`
- Phần tài khoản, menu trong `frontend/src/components/MainLayout.jsx`.
- Phần quản lý môn trong `frontend/src/pages/teacher/QuestionBankPage.jsx`.
- `backend/src/controllers/authController.js`
- `backend/src/middlewares/authMiddleware.js`
- Các hàm môn học trong `backend/src/controllers/questionController.js`.

### 3.5. Công việc trưởng nhóm và bàn giao

- Phụ trách cấu hình môi trường, kết nối MySQL và hướng dẫn khởi chạy hiện có.
- Phụ trách phần dùng chung: khởi tạo ứng dụng, điều hướng, Axios client và middleware xử lý lỗi; phối hợp các thành viên khi kiểm tra luồng tổng thể.
- Phụ trách tài liệu README và script khởi chạy `start-project.bat` hiện có.
- Bàn giao phần báo cáo về xác thực, phân quyền và môn học.

### 3.6. Tiêu chí hoàn thành

- [ ] Đăng ký, đăng nhập, đăng xuất và tải lại trang hoạt động đúng.
- [ ] Sinh viên bị chặn gọi API quản trị dù gửi request trực tiếp.
- [ ] Demo được thêm, sửa, xóa một môn chưa có dữ liệu phụ thuộc.
- [ ] Email/mã môn trùng và dữ liệu không hợp lệ có thông báo phù hợp.
- [ ] Giải thích được JWT, bcrypt, Context và dữ liệu người dùng–môn học.

## 4. TV2 – Ngân hàng câu hỏi và trợ lý học tập Gemini

### 4.1. Nhiệm vụ frontend

- Phụ trách danh sách câu hỏi, form thêm/sửa và xác nhận xóa.
- Nhập nội dung, bốn phương án A–D, đáp án đúng, độ khó, lời giải và môn học.
- Phụ trách tìm kiếm theo nội dung và lọc theo môn trên giao diện; API hỗ trợ lọc theo môn, độ khó và từ khóa.
- Hiển thị trạng thái đang tải, đang lưu, danh sách rỗng và lỗi API.
- Phụ trách trang chatbot: nhập câu hỏi, câu hỏi gợi ý, lịch sử trong phiên, tạo cuộc trò chuyện mới.
- Hiển thị trạng thái đang trả lời; giữ câu hỏi khi gửi thất bại và cho phép thử lại.

### 4.2. Nhiệm vụ backend và dữ liệu

- Phụ trách CRUD câu hỏi và bộ lọc phía API.
- Kiểm tra môn tồn tại, nội dung/phương án không rỗng, đáp án thuộc A–D và độ khó hợp lệ.
- Duy trì quy tắc chặn sửa/xóa câu hỏi đã thuộc đề thi.
- Quản lý `questions`, quan hệ với môn học và người tạo.
- Phụ trách backend gọi Gemini; kiểm tra dữ liệu hội thoại và giới hạn đầu vào.
- Giữ API key tại backend; xử lý thiếu cấu hình, lỗi dịch vụ, quá thời gian và hạn mức.
- Hội thoại hiện không lưu CSDL; không mô tả chức năng này là đã có lưu trữ lâu dài.

### 4.3. API phụ trách

| Method | Đường dẫn | Chức năng |
| --- | --- | --- |
| GET | `/api/questions` | Danh sách, tìm kiếm và lọc câu hỏi |
| POST | `/api/questions` | Thêm câu hỏi |
| PUT | `/api/questions/:id` | Sửa câu hỏi |
| DELETE | `/api/questions/:id` | Xóa câu hỏi |
| POST | `/api/chat` | Gửi hội thoại đến trợ lý Gemini |

### 4.4. Mã nguồn phụ trách

- Phần câu hỏi trong `frontend/src/pages/teacher/QuestionBankPage.jsx`.
- Các hàm câu hỏi trong `backend/src/controllers/questionController.js`.
- `frontend/src/pages/ChatbotPage.jsx`
- `frontend/src/utils/chatMessages.js`
- `frontend/src/styles/chatbot.css`
- `backend/src/controllers/chatController.js`
- `backend/test/chat.test.js`, `frontend/test/chatMessages.test.js`.
- `docs/CHATBOT.md`

### 4.5. Tiêu chí hoàn thành và bàn giao

- [ ] Demo được thêm, sửa, xóa câu hỏi chưa sử dụng trong đề.
- [ ] Tìm kiếm và lọc cho kết quả đúng.
- [ ] Backend từ chối dữ liệu sai, không chỉ kiểm tra tại frontend.
- [ ] Câu hỏi đang thuộc đề được bảo vệ đúng quy tắc.
- [ ] Chatbot trả lời hoặc hiển thị lỗi rõ ràng; API key không xuất hiện trong frontend.
- [ ] Bàn giao tài liệu API, dữ liệu demo và phần báo cáo về câu hỏi/chatbot.
- [ ] Giải thích được quan hệ môn–câu hỏi và luồng gọi Gemini qua backend.

## 5. TV3 – Quản lý đề thi và tìm kiếm đề

### 5.1. Nhiệm vụ frontend

- Phụ trách tab quản lý đề: danh sách, tạo, sửa, xóa.
- Form đề gồm tên, mô tả, môn, thời lượng, điểm đạt và trạng thái công bố.
- Phụ trách chọn/bỏ chọn từng câu hỏi, chọn tất cả câu hỏi của môn; backend lưu thứ tự theo danh sách đã chọn.
- Xử lý thay đổi môn để tránh giữ câu hỏi của môn cũ trong form.
- Phụ trách trang chủ sinh viên, danh sách đề, tìm kiếm theo từ khóa và lọc theo môn.
- Phụ trách trang chi tiết đề trước khi bắt đầu: mô tả, số câu, thời gian và điểm đạt.
- Phụ trách state tìm kiếm/lọc đề; phối hợp TV4 khi chuyển sang phòng thi.

### 5.2. Nhiệm vụ backend và dữ liệu

- Phụ trách CRUD đề thi, danh sách và chi tiết đề.
- Kiểm tra thời lượng, điểm đạt, trạng thái công bố và danh sách câu hỏi hợp lệ.
- Bảo đảm tất cả câu hỏi được chọn tồn tại và thuộc môn của đề.
- Sinh viên chỉ xem đề đã công bố; dữ liệu đề trả cho sinh viên không chứa đáp án đúng và lời giải.
- Duy trì quy tắc không sửa/xóa đề đã có bài nộp.
- Quản lý `exams`, `exam_questions`, thứ tự câu hỏi và quan hệ người tạo.
- Bảo đảm thao tác lưu đề và danh sách câu hỏi nhất quán khi có lỗi.

### 5.3. API phụ trách

| Method | Đường dẫn | Chức năng |
| --- | --- | --- |
| GET | `/api/exams` | Danh sách, tìm kiếm và lọc đề |
| GET | `/api/exams/:id` | Chi tiết đề, dữ liệu bắt đầu làm bài |
| POST | `/api/exams` | Tạo đề |
| PUT | `/api/exams/:id` | Sửa đề, cập nhật trạng thái công bố theo ràng buộc |
| DELETE | `/api/exams/:id` | Xóa đề chưa có bài nộp |

### 5.4. Mã nguồn phụ trách

- Tab đề thi trong `frontend/src/pages/teacher/ExamManagerPage.jsx`.
- `frontend/src/pages/student/HomePage.jsx`
- `frontend/src/pages/student/ExamDetailPage.jsx`
- `backend/src/controllers/examController.js`
- Phần state tìm kiếm/lọc hiện nằm trong `frontend/src/store/useExamStore.js`.

### 5.5. Tiêu chí hoàn thành và bàn giao

- [ ] Demo tạo đề từ ngân hàng câu hỏi, sửa và xóa đề thử chưa có bài nộp.
- [ ] Không thêm được câu hỏi khác môn hoặc câu hỏi không tồn tại.
- [ ] Sinh viên không thấy hoặc truy cập được đề chưa công bố.
- [ ] API lấy đề cho sinh viên không trả đáp án đúng/lời giải.
- [ ] Đề có bài nộp bị chặn sửa/xóa.
- [ ] Bàn giao cấu trúc dữ liệu đề cho TV4, tài liệu API và phần báo cáo đề thi.
- [ ] Giải thích được quan hệ đề–câu hỏi và cách xử lý khi lưu thất bại.

## 6. TV4 – Làm bài, chấm điểm và quản lý kết quả

### 6.1. Nhiệm vụ frontend

- Phụ trách phòng thi: hiển thị câu hỏi, chọn/đổi đáp án, chuyển câu và đánh dấu câu cần xem lại.
- Hiển thị câu đã trả lời, câu chưa trả lời, số câu hoàn thành và thời gian còn lại.
- Quản lý trạng thái làm bài bằng Zustand: chủ sở hữu phiên, đề, đáp án, vị trí câu, đánh dấu và hạn kết thúc.
- Khôi phục phiên khi F5, không làm tăng thời gian; xử lý hết giờ và xác nhận nộp bài.
- Khóa thao tác gửi lặp trong giao diện và hiển thị lỗi nộp bài để người dùng thử lại.
- Phụ trách lịch sử thi, điểm, trạng thái đạt/trượt và chi tiết từng câu sau khi nộp.
- Phụ trách tab kết quả giảng viên: danh sách bài nộp, liên kết xem chi tiết và xóa; API danh sách hỗ trợ lọc theo `examId`.

### 6.2. Nhiệm vụ backend và dữ liệu

- Phụ trách nộp bài, đọc lịch sử, đọc chi tiết và xóa bài nộp.
- Server tự lấy đáp án đúng để chấm; không tin điểm hoặc danh tính sinh viên do client gửi.
- Kiểm tra đáp án chỉ thuộc câu hỏi trong đề, lựa chọn hợp lệ và đề được phép làm.
- Phụ trách kiểm tra quyền xem chi tiết bài nộp: sinh viên chỉ xem bài của mình; giảng viên có quyền xem và xóa bài nộp.
- Quản lý `submissions`, quan hệ với người làm và đề.

### 6.3. API hiện có phụ trách

| Method | Đường dẫn | Chức năng |
| --- | --- | --- |
| POST | `/api/submissions` | Nộp và chấm bài |
| GET | `/api/submissions/my-history` | Lịch sử của người đăng nhập |
| GET | `/api/submissions/:id` | Chi tiết bài nộp |
| GET | `/api/submissions` | Danh sách bài nộp cho giảng viên |
| DELETE | `/api/submissions/:id` | Giảng viên xóa bài nộp |

### 6.4. Mã nguồn phụ trách

- `frontend/src/pages/student/ExamRoomPage.jsx`
- `frontend/src/pages/student/MyResultsPage.jsx`
- `frontend/src/pages/student/SubmissionDetailPage.jsx`
- Phần phiên làm bài trong `frontend/src/store/useExamStore.js`.
- Tab kết quả trong `frontend/src/pages/teacher/ExamManagerPage.jsx`.
- `backend/src/controllers/submissionController.js`
- `frontend/test/examStore.test.js`

### 6.5. Tiêu chí hoàn thành và bàn giao

- [ ] Giải thích và demo cơ chế khôi phục phiên khi F5 bằng Zustand/`sessionStorage`, tính thời gian còn lại theo hạn kết thúc phía trình duyệt.
- [ ] Server chấm đúng với câu trả lời đúng, sai và bỏ trống.
- [ ] Sinh viên không xem được bài nộp của sinh viên khác.
- [ ] Lịch sử, chi tiết và danh sách kết quả giảng viên hiển thị đúng.
- [ ] Bàn giao tài liệu API, dữ liệu demo và phần báo cáo về Zustand, làm bài, chấm điểm.

## 7. Phạm vi trong các file dùng chung

Giữ nguyên cấu trúc mã nguồn. Các file dùng chung được phân công theo phần chức năng dưới đây.

| File/phần chung | Phân công theo mã nguồn hiện tại |
| --- | --- |
| `frontend/src/pages/teacher/QuestionBankPage.jsx` | TV1: tab môn học, `sForm`, các hàm lưu/sửa/xóa môn. TV2: tab câu hỏi, `qForm`, các hàm lưu/sửa/xóa và lọc câu hỏi |
| `backend/src/controllers/questionController.js` | TV1: `getSubjects`, `createSubject`, `updateSubject`, `deleteSubject`. TV2: các hàm CRUD câu hỏi |
| `frontend/src/pages/teacher/ExamManagerPage.jsx` | TV3: tab đề, form đề và các hàm lưu/sửa/xóa đề. TV4: tab kết quả, dữ liệu bài nộp và `handleDeleteSubmission` |
| `frontend/src/store/useExamStore.js` | TV3: `selectedSubjectId`, `searchQuery` và các hàm cập nhật bộ lọc. TV4: phiên thi, đáp án, đánh dấu, chuyển câu, đếm giờ, lưu/khôi phục và xóa trạng thái phiên |
| `backend/src/routes/apiRoutes.js` | Mỗi người phụ trách các route của chức năng mình theo bảng API ở trên |
| `backend/src/config/db.js`, `backend/database.sql` | TV1: kết nối, `users`, `subjects`. TV2: `questions`. TV3: `exams`, `exam_questions`. TV4: `submissions`; mỗi người nắm phần dữ liệu mẫu tương ứng |
| `backend/src/utils/validation.js` | TV1: kiểm tra đầu vào tài khoản/môn theo chỗ sử dụng. TV2: câu hỏi. TV3: đề thi. TV4: bài nộp |
| `frontend/src/styles/global.css` | Mỗi người phụ trách kiểu hiển thị của màn hình mình; TV1 phối hợp phần layout dùng chung |
| `backend/test/api.test.js` | Mỗi người phụ trách các tình huống kiểm thử API thuộc chức năng mình |

### Mã nguồn dùng chung do TV1 phụ trách

- `backend/src/server.js`
- `backend/src/config/db.js`: phần kết nối, khởi tạo CSDL chung.
- `backend/src/middlewares/errorMiddleware.js`
- `frontend/src/main.jsx`, `frontend/src/App.jsx`
- `frontend/src/router/AppRouter.jsx`
- `frontend/src/api/axiosClient.js`
- `frontend/src/components/MainLayout.jsx`
- `README.md`, `start-project.bat`.

## 8. Luồng demo theo phân công

| Thứ tự | Nội dung demo từ chức năng hiện có | Thành viên |
| --- | --- | --- |
| 1 | Đăng ký/đăng nhập, phân quyền; thêm, sửa, xóa môn thử và tạo môn dùng cho đề | TV1 |
| 2 | Thêm, sửa, xóa câu hỏi thử; tìm kiếm/lọc câu hỏi; hỏi đáp với chatbot | TV2 |
| 3 | Tạo đề từ câu hỏi, sửa/xóa đề thử chưa có bài nộp, công bố đề; tìm kiếm và xem chi tiết đề | TV3 |
| 4 | Bắt đầu làm bài, đổi đáp án, đánh dấu, chuyển câu, khôi phục khi F5, nộp bài và xem điểm | TV4 |
| 5 | Xem lịch sử, chi tiết đáp án và kết quả giảng viên; xóa bài nộp thử bằng tài khoản giảng viên | TV4 |

## 9. Nội dung mỗi thành viên cần nắm

1. Luồng thao tác trên các màn hình được giao.
2. Method, URL, đầu vào, phản hồi và quyền truy cập của API tương ứng.
3. Các bảng MySQL, quan hệ và truy vấn đang được sử dụng.
4. Quản lý state và cách frontend gọi backend.
5. Kiểm tra dữ liệu, thông báo lỗi và ràng buộc nghiệp vụ đã có trong code.
6. Kịch bản demo và các tình huống kiểm thử hiện có của phần mình.

**Phạm vi TV4:** Đổi đáp án là cập nhật state phiên làm bài ở trình duyệt. API bài nộp hiện có tạo, đọc và xóa; không có API sửa bài nộp hoặc sửa điểm. Phân công này giữ đúng phạm vi đó.
