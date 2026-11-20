# HƯỚNG DẪN CHI TIẾT TỪNG THÀNH VIÊN — PTIT ExamPro

**Căn cứ:** `docs/PHAN_CONG_NHIEM_VU.md` trong repo này (bản phân công theo mã nguồn hiện có).
Thay `TV1–TV4` bằng họ tên + MSSV thật khi bàn giao.

> Lưu ý phạm vi: file này phân công theo code hiện có — TV1 làm tài khoản + môn học
> (không có trang Hồ sơ cá nhân), TV4 làm bài + chấm + xóa bài nộp (không có API sửa
> điểm/sửa bài nộp). Ai làm đúng phần mình thì demo đúng phần đó, đừng nhận thêm
> chức năng ngoài phạm vi vì code chưa có.

**Cách dùng file này:** mỗi người chỉ cần đọc **mục 0, mục 1, mục của mình, mục 6, mục 7**.
Trưởng nhóm (TV1) đọc thêm mục 8.

---

## 0. Chuẩn bị chung — ai cũng phải làm

### 0.1. Máy cần có

- Node.js 22 và npm.
- MySQL 8 đang chạy, tài khoản MySQL có quyền tạo/xóa cơ sở dữ liệu.
- Kết nối Internet (chatbot cần Internet + API key Gemini).

### 0.2. Lấy code về máy (làm 1 lần)

```powershell
git clone https://github.com/phongtnptit/Exam-Web.git
cd Exam-Web
```

### 0.3. Cấu hình Git bằng tài khoản cá nhân (làm 1 lần, bắt buộc)

Mỗi người dùng tài khoản GitHub của mình, tuyệt đối không dùng chung tài khoản để commit.
Kiểm tra trước khi commit:

```powershell
git config --global user.name "Tên của bạn"
git config --global user.email "email-github-cua-ban@example.com"
git config user.name
git config user.email
```

### 0.4. Tạo nhánh riêng của mình (làm 1 lần)

Mỗi người chỉ tạo **nhánh của mình** (1 dòng), không chạy cả 4 dòng. Hai dòng đầu thì
ai cũng chạy giống nhau:

```powershell
git checkout main
git pull origin main
git checkout -b tv1-auth-subjects   # TV1 chạy dòng này
```

TV2 thay dòng cuối bằng `git checkout -b tv2-questions-chatbot`, TV3 là
`git checkout -b tv3-exams`, TV4 là `git checkout -b tv4-submissions`.

Lỡ tay tạo cả 4 nhánh cũng không sao — các nhánh thừa chỉ là nhánh trống trên máy mình,
xóa bằng `git branch -d <tên-nhánh-thừa>` là hết.

Chỉ sửa file thuộc phần mình (xem mục của mình + mục 6). Làm xong thì commit và push
nhánh của mình, mở Pull Request để gộp vào `main` (xem mục 1).

### 0.5. Cấu hình `.env` (làm 1 lần)

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Mở `backend/.env` điền các giá trị thật của mình:

```dotenv
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<mat-khau-mysql-cua-ban>
DB_NAME=ptit_online_exam
JWT_SECRET=<chuoi-bi-mat-rieng>
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=<redacted>
GEMINI_MODEL=gemini-3.5-flash-lite
```

`frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Không đưa `.env`, mật khẩu thật hoặc API key vào bản nộp/chia sẻ.

### 0.6. Chạy dự án

Terminal 1 (backend):

```powershell
cd backend
npm install
npm run dev
```

Terminal 2 (frontend):

```powershell
cd frontend
npm install
npm run dev
```

Mở http://localhost:5173. Kiểm tra backend tại http://localhost:5000/api/health.
Backend tự tạo cơ sở dữ liệu, bảng và dữ liệu mẫu khi bảng người dùng chưa có tài khoản.
Trên Windows có thể chạy `start-project.bat` ở thư mục gốc để mở cả hai server.

### 0.7. Tài khoản mẫu

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Giảng viên | teacher@ptit.edu.vn | 123456 |
| Sinh viên | student@ptit.edu.vn | 123456 |

Đăng ký mới chỉ tạo tài khoản sinh viên. Các giảng viên dùng chung ngân hàng câu hỏi
và đề thi.

---

## 1. Quy trình Git cho cả nhóm

1. **Trưởng nhóm (TV1)** tạo repo, đẩy khung dự án ban đầu, mời 3 thành viên còn lại
   làm Collaborator (GitHub → Settings → Collaborators).
2. **Mỗi người** clone về máy mình, cấu hình Git cá nhân (mục 0.3), tạo nhánh riêng
   (mục 0.4), chỉ sửa file phần mình.
3. **Trước khi push**, lấy code mới nhất về để khỏi xung đột:
   ```powershell
   git checkout main
   git pull origin main
   git checkout tv1-auth-subjects
   git merge main
   ```
4. **Commit** chỉ file phần mình, ghi rõ nội dung:
   ```powershell
   git add backend/src/controllers/authController.js frontend/src/pages/auth/LoginPage.jsx
   git commit -m "TV1: them dang nhap bang JWT"
   git push -u origin tv1-auth-subjects
   ```
5. **Mở Pull Request** từ nhánh của mình vào `main`, nhờ 1 thành viên khác xem qua rồi
   mới merge. Không merge thẳng code chưa chạy thử.
6. **Không commit:** `.env`, `node_modules`, `frontend/dist`. Các thư mục này tạo lại
   được bằng `npm install` và `npm run build`.

---

## 2. TV1 — Trưởng nhóm: Tài khoản, phân quyền và quản lý môn học

### 2.1. Vai trò

Phụ trách đăng ký/đăng nhập, xác thực JWT, phân quyền Student/Teacher, quản lý môn học,
đồng thời giữ phần dùng chung và tổng hợp tài liệu, tích hợp mã nguồn.

### 2.2. File phụ trách

**Frontend:**

- `frontend/src/pages/auth/LoginPage.jsx` — trang đăng nhập.
- `frontend/src/pages/auth/RegisterPage.jsx` — trang đăng ký.
- `frontend/src/context/AuthContext.jsx` — trạng thái tài khoản, khôi phục khi tải lại
  trang, xóa trạng thái khi đăng xuất.
- `frontend/src/router/ProtectedRoute.jsx` — chặn trang theo đăng nhập và theo vai trò.
- `frontend/src/components/MainLayout.jsx` — phần tài khoản, menu theo vai trò.
- `frontend/src/pages/teacher/QuestionBankPage.jsx` — **chỉ tab môn học** (`sForm`,
  các hàm lưu/sửa/xóa môn). Tab câu hỏi là của TV2, đừng sửa phần đó.
- `frontend/src/main.jsx`, `frontend/src/App.jsx`, `frontend/src/router/AppRouter.jsx`,
  `frontend/src/api/axiosClient.js` — phần dùng chung.

**Backend:**

- `backend/src/controllers/authController.js` — `register`, `login`, `getMe`.
- `backend/src/middlewares/authMiddleware.js` — `verifyToken`, `requireRole`.
- `backend/src/controllers/questionController.js` — **chỉ các hàm môn học**:
  `getSubjects`, `createSubject`, `updateSubject`, `deleteSubject`.
- `backend/src/server.js`, `backend/src/config/db.js` (phần kết nối, khởi tạo CSDL chung),
  `backend/src/middlewares/errorMiddleware.js` — phần dùng chung.

**Khác:** `README.md`, `start-project.bat`, dữ liệu `users`, `subjects`.

### 2.3. API phụ trách

| Method | Đường dẫn | Chức năng | Quyền |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Đăng ký sinh viên | Công khai |
| POST | `/api/auth/login` | Đăng nhập | Công khai |
| GET | `/api/auth/me` | Lấy thông tin tài khoản hiện tại | Đã đăng nhập |
| GET | `/api/subjects` | Xem danh sách môn | Đã đăng nhập |
| POST | `/api/subjects` | Thêm môn | Teacher |
| PUT | `/api/subjects/:id` | Sửa môn | Teacher |
| DELETE | `/api/subjects/:id` | Xóa môn | Teacher |

### 2.4. Việc cần làm từng bước

1. Đọc `authController.js`: đăng ký băm mật khẩu bằng bcrypt, cấp JWT; đăng nhập so
   sánh bcrypt rồi cấp JWT; đăng ký công khai chỉ tạo tài khoản sinh viên, không cho
   người dùng tự nâng quyền.
2. Đọc `authMiddleware.js`: `verifyToken` kiểm tra header `Authorization: Bearer <token>`,
   `requireRole("TEACHER")` chặn sinh viên (trả 403).
3. Đọc `AuthContext.jsx`: khi tải lại trang, gọi `GET /api/auth/me` để khôi phục user;
   đăng xuất thì xóa token `ptit_exam_token` trong localStorage và reset phiên thi.
4. Kiểm tra form đăng ký/đăng nhập: báo lỗi email trùng, sai mật khẩu, thiếu thông tin.
5. Kiểm tra tab môn học trong `QuestionBankPage.jsx`: form thêm/sửa có mã môn, tên môn,
   mô tả; xác nhận trước khi xóa; báo khi mã môn trùng hoặc môn còn dữ liệu phụ thuộc.
6. Chạy thử toàn bộ luồng mục 2.5 rồi tick vào tiêu chí mục 2.7.

### 2.5. Cách kiểm tra (tự test trước khi bàn giao)

- [ ] Đăng ký tài khoản mới → vào được trang chủ, vai trò là sinh viên.
- [ ] Đăng ký lại đúng email cũ → báo lỗi 409 "Email này đã được đăng ký".
- [ ] Đăng nhập sai mật khẩu → báo 401, không vào được.
- [ ] Đăng nhập đúng → tải lại trang (F5) vẫn còn đăng nhập; bấm Đăng xuất → quay về
      trang đăng nhập.
- [ ] Đăng nhập bằng tài khoản sinh viên, gọi thẳng `POST /api/subjects` (bằng Postman
      hoặc trình duyệt) → bị chặn 403.
- [ ] Đăng nhập giảng viên: thêm 1 môn mới → sửa tên môn → xóa môn chưa có dữ liệu
      phụ thuộc → thành công.
- [ ] Thêm môn trùng mã môn → báo lỗi 409.
- [ ] Xóa môn đang có câu hỏi hoặc đề thi → bị chặn, môn không bị xóa.

### 2.6. Kịch bản demo (nói và làm theo thứ tự)

1. Mở trang đăng ký, nhập họ tên/email/mật khẩu → đăng ký thành công, vào trang chủ
   với vai trò sinh viên.
2. Đăng xuất, đăng nhập lại bằng `teacher@ptit.edu.vn` / `123456`.
3. Vào trang quản lý, thêm môn mới (mã `CTDL`, tên `Cấu trúc dữ liệu`) → môn hiện
   trong danh sách.
4. Sửa tên môn vừa thêm, rồi xóa môn thử chưa có dữ liệu → danh sách cập nhật đúng.
5. Giải thích ngắn: mật khẩu lưu dạng băm bcrypt (không lưu mật khẩu gốc), đăng nhập
   xong server cấp JWT, frontend lưu token và gửi kèm mỗi request, `ProtectedRoute`
   chặn sinh viên vào trang giảng viên.

### 2.7. Tiêu chí hoàn thành

- [ ] Đăng ký, đăng nhập, đăng xuất và tải lại trang hoạt động đúng.
- [ ] Sinh viên bị chặn gọi API quản trị dù gửi request trực tiếp.
- [ ] Demo được thêm, sửa, xóa một môn chưa có dữ liệu phụ thuộc.
- [ ] Email/mã môn trùng và dữ liệu không hợp lệ có thông báo phù hợp.
- [ ] Giải thích được JWT, bcrypt, Context và dữ liệu người dùng – môn học.

### 2.8. Câu hỏi bảo vệ thường gặp

- **JWT chứa gì, kiểm tra thế nào?** — Token chứa id, email, họ tên, role, mã sinh viên;
  server kiểm tra bằng `JWT_SECRET`, hết hạn thì trả 401.
- **Vì sao mật khẩu không lưu trực tiếp?** — Chỉ lưu băm bcrypt, kể cả lộ cơ sở dữ liệu
  cũng không lộ mật khẩu gốc.
- **Vì sao đăng ký công khai chỉ tạo sinh viên?** — Để người dùng không tự nâng quyền
  thành giảng viên; tài khoản giảng viên do người quản lý tạo sẵn.
- **Quan hệ users – subjects?** — `subjects.created_by` trỏ tới `users.id`, xóa người
  tạo thì để NULL chứ không xóa môn.

---

## 3. TV2 — Ngân hàng câu hỏi và trợ lý học tập Gemini

### 3.1. Vai trò

Phụ trách toàn bộ vòng đời câu hỏi trắc nghiệm (thêm/xem/sửa/xóa, tìm kiếm/lọc) và
trợ lý học tập chatbot gọi Gemini qua backend.

### 3.2. File phụ trách

**Frontend:**

- `frontend/src/pages/teacher/QuestionBankPage.jsx` — **chỉ tab câu hỏi** (`qForm`,
  các hàm lưu/sửa/xóa và lọc câu hỏi). Tab môn học là của TV1.
- `frontend/src/pages/ChatbotPage.jsx` — trang chatbot: nhập câu hỏi, câu hỏi gợi ý,
  lịch sử trong phiên, tạo cuộc trò chuyện mới.
- `frontend/src/utils/chatMessages.js` — xử lý tin nhắn chatbot phía trình duyệt.
- `frontend/src/styles/chatbot.css` — giao diện chatbot.

**Backend:**

- `backend/src/controllers/questionController.js` — **chỉ các hàm câu hỏi**:
  `getQuestions`, `createQuestion`, `updateQuestion`, `deleteQuestion`.
- `backend/src/controllers/chatController.js` — gọi Gemini, kiểm tra hội thoại và
  giới hạn đầu vào, xử lý thiếu cấu hình/lỗi dịch vụ/hạn mức.

**Test và tài liệu:**

- `backend/test/chat.test.js`, `frontend/test/chatMessages.test.js`, `docs/CHATBOT.md`.

**Dữ liệu:** bảng `questions`, quan hệ với môn học (`subject_id`) và người tạo.

### 3.3. API phụ trách

| Method | Đường dẫn | Chức năng | Quyền |
| --- | --- | --- | --- |
| GET | `/api/questions` | Danh sách, tìm kiếm và lọc câu hỏi | Teacher |
| POST | `/api/questions` | Thêm câu hỏi | Teacher |
| PUT | `/api/questions/:id` | Sửa câu hỏi | Teacher |
| DELETE | `/api/questions/:id` | Xóa câu hỏi | Teacher |
| POST | `/api/chat` | Gửi hội thoại đến trợ lý Gemini | Đã đăng nhập |

### 3.4. Việc cần làm từng bước

1. Đọc form câu hỏi: nhập nội dung, bốn phương án A–D, đáp án đúng, độ khó
   (EASY/MEDIUM/HARD), lời giải và môn học.
2. Đọc `questionController.js`: kiểm tra môn tồn tại, nội dung/phương án không rỗng,
   đáp án thuộc A–D, độ khó hợp lệ — kiểm tra ở backend, không chỉ ở frontend.
3. Nhớ quy tắc bảo vệ: câu hỏi đang thuộc đề thi thì **không được sửa/xóa** (server
   trả 409). Muốn thay đổi thì tạo câu hỏi mới.
4. Kiểm tra tìm kiếm theo nội dung và lọc theo môn/độ khó; API hỗ trợ lọc theo
   `subjectId`, `difficulty`, `search`.
5. Đọc `chatController.js` và `ChatbotPage.jsx`: API key Gemini chỉ nằm ở backend
   (`backend/.env`), không bao giờ xuất hiện ở frontend; chatbot báo rõ khi thiếu
   key, key sai, hết hạn mức; hội thoại không lưu cơ sở dữ liệu, rời trang hoặc tải
   lại sẽ mất nội dung.
6. Chạy thử toàn bộ luồng mục 3.5 rồi tick vào tiêu chí mục 3.7.

### 3.5. Cách kiểm tra (tự test trước khi bàn giao)

- [ ] Thêm câu hỏi mới đủ 4 phương án, đáp án đúng, độ khó, lời giải → hiện trong
      danh sách.
- [ ] Thêm câu hỏi thiếu phương án hoặc đáp án ngoài A–D → backend từ chối 400.
- [ ] Sửa nội dung/phương án của câu hỏi chưa dùng trong đề → lưu được.
- [ ] Xóa câu hỏi chưa dùng trong đề → xóa được.
- [ ] Thêm câu hỏi vào 1 đề thi (nhờ TV3 hoặc tự tạo đề thử), rồi sửa/xóa câu hỏi
      đó → bị chặn 409.
- [ ] Tìm kiếm theo từ khóa và lọc theo môn/độ khó → kết quả đúng.
- [ ] Mở chatbot, hỏi 1 câu kiến thức → nhận được trả lời; gửi thất bại thì câu hỏi
      được giữ lại và cho thử lại.
- [ ] Kiểm tra trong code frontend không có chuỗi `GEMINI_API_KEY` hay key thật.

### 3.6. Kịch bản demo (nói và làm theo thứ tự)

1. Đăng nhập giảng viên, vào ngân hàng câu hỏi, thêm 1 câu hỏi mới cho môn vừa tạo.
2. Tìm kiếm câu hỏi theo từ khóa, lọc theo môn → kết quả đúng.
3. Sửa câu hỏi vừa thêm, rồi xóa 1 câu hỏi thử chưa dùng trong đề.
4. Thử xóa 1 câu hỏi đang thuộc đề → hệ thống chặn và báo lý do.
5. Mở Trợ lý học tập, hỏi 1 câu kiến thức → chatbot trả lời; giải thích ngắn: trình
   duyệt chỉ gọi `/api/chat`, key Gemini nằm ở backend nên không lộ.

### 3.7. Tiêu chí hoàn thành

- [ ] Demo được thêm, sửa, xóa câu hỏi chưa sử dụng trong đề.
- [ ] Tìm kiếm và lọc cho kết quả đúng.
- [ ] Backend từ chối dữ liệu sai, không chỉ kiểm tra tại frontend.
- [ ] Câu hỏi đang thuộc đề được bảo vệ đúng quy tắc.
- [ ] Chatbot trả lời hoặc hiển thị lỗi rõ ràng; API key không xuất hiện trong frontend.
- [ ] Giải thích được quan hệ môn – câu hỏi và luồng gọi Gemini qua backend.

### 3.8. Câu hỏi bảo vệ thường gặp

- **Câu hỏi gắn với môn hay với đề?** — Câu hỏi gắn với môn (`subject_id`); đề thi
  chọn câu hỏi từ ngân hàng qua bảng trung gian `exam_questions`, một câu hỏi dùng
  được cho nhiều đề.
- **Vì sao câu hỏi trong đề không được sửa/xóa?** — Để bài thi đã tạo không bị đổi
  nội dung giữa chừng và bài nộp cũ vẫn chấm đúng.
- **Vì sao key Gemini để ở backend?** — Để key không lộ ra trình duyệt; frontend chỉ
  gửi câu hỏi, backend gọi Gemini rồi trả lời về.

---

## 4. TV3 — Quản lý đề thi; danh sách, tìm kiếm và chi tiết đề

### 4.1. Vai trò

Phụ trách tạo/sửa/xóa/công bố đề thi từ ngân hàng câu hỏi, danh sách và tìm kiếm đề
cho sinh viên, trang chi tiết đề trước khi bắt đầu làm bài.

### 4.2. File phụ trách

**Frontend:**

- `frontend/src/pages/teacher/ExamManagerPage.jsx` — **chỉ tab đề thi** (danh sách,
  tạo, sửa, xóa đề; form đề và chọn câu hỏi). Tab kết quả là của TV4.
- `frontend/src/pages/student/HomePage.jsx` — trang chủ sinh viên: danh sách đề,
  tìm kiếm theo từ khóa, lọc theo môn.
- `frontend/src/pages/student/ExamDetailPage.jsx` — chi tiết đề trước khi bắt đầu:
  mô tả, số câu, thời gian, điểm đạt.
- `frontend/src/store/useExamStore.js` — **chỉ phần tìm kiếm/lọc đề**
  (`selectedSubjectId`, `searchQuery` và các hàm cập nhật). Phần phiên thi là của TV4.

**Backend:**

- `backend/src/controllers/examController.js` — `getExams`, `getExamById`,
  `createExam`, `updateExam`, `deleteExam`.

**Dữ liệu:** bảng `exams`, `exam_questions` (thứ tự câu hỏi, quan hệ người tạo).

### 4.3. API phụ trách

| Method | Đường dẫn | Chức năng | Quyền |
| --- | --- | --- | --- |
| GET | `/api/exams` | Danh sách, tìm kiếm và lọc đề | Đã đăng nhập |
| GET | `/api/exams/:id` | Chi tiết đề, dữ liệu bắt đầu làm bài | Đã đăng nhập |
| POST | `/api/exams` | Tạo đề | Teacher |
| PUT | `/api/exams/:id` | Sửa đề, cập nhật trạng thái công bố | Teacher |
| DELETE | `/api/exams/:id` | Xóa đề chưa có bài nộp | Teacher |

### 4.4. Việc cần làm từng bước

1. Đọc form đề: tên, mô tả, môn, thời lượng, điểm đạt, trạng thái công bố
   (`isPublished` — 1 là đang mở, 0 là bản nháp).
2. Đọc cơ chế chọn câu hỏi: chọn/bỏ chọn từng câu, chọn tất cả câu hỏi của môn;
   backend lưu thứ tự theo danh sách đã chọn. Đổi môn trong form thì bỏ các câu hỏi
   của môn cũ đi, tránh giữ câu hỏi lạc môn.
3. Đọc `examController.js`: kiểm tra thời lượng, điểm đạt, trạng thái công bố, danh
   sách câu hỏi hợp lệ; tất cả câu hỏi được chọn phải tồn tại và thuộc môn của đề.
4. Nhớ 2 quy tắc bảo vệ:
   - Sinh viên chỉ xem đề đã công bố; dữ liệu đề trả cho sinh viên **không chứa đáp
     án đúng và lời giải**.
   - Đề đã có bài nộp thì **không sửa/xóa được** (server trả 409).
5. Kiểm tra lưu đề dùng transaction: lưu đề và danh sách câu hỏi nhất quán, lỗi giữa
   chừng thì không lưu dở.
6. Chạy thử toàn bộ luồng mục 4.5 rồi tick vào tiêu chí mục 4.7.

### 4.5. Cách kiểm tra (tự test trước khi bàn giao)

- [ ] Tạo đề mới từ ngân hàng câu hỏi (chọn 2–3 câu) → đề hiện trong danh sách giảng
      viên và trong danh sách sinh viên (nếu đã công bố).
- [ ] Tạo đề ở trạng thái bản nháp → sinh viên không thấy đề trong danh sách, truy
      cập thẳng `/exams/:id` bị chặn 403.
- [ ] Sửa đề chưa có bài nộp (đổi tên, đổi thời lượng, đổi công bố) → lưu được.
- [ ] Tạo 1 đề, cho sinh viên làm và nộp thử, rồi sửa/xóa đề đó → bị chặn 409.
- [ ] Cố tình chọn câu hỏi khác môn hoặc câu hỏi không tồn tại khi tạo đề → backend
      từ chối 400.
- [ ] Gọi `GET /api/exams/:id` bằng tài khoản sinh viên → kết quả không có trường
      `correct_answer` và `explanation`.
- [ ] Tìm kiếm đề theo từ khóa và lọc theo môn ở trang chủ sinh viên → kết quả đúng.
- [ ] Mở trang chi tiết đề → thấy đúng mô tả, số câu, thời gian, điểm đạt.

### 4.6. Kịch bản demo (nói và làm theo thứ tự)

1. Đăng nhập giảng viên, tạo đề mới: chọn môn, nhập tên/thời lượng/điểm đạt, chọn
   câu hỏi từ ngân hàng, để trạng thái công bố.
2. Sửa đề vừa tạo (đổi thời lượng), rồi tạo 1 đề nháp để cho thấy sinh viên không
   thấy đề nháp.
3. Đăng xuất, đăng nhập tài khoản sinh viên: tìm kiếm đề theo từ khóa, lọc theo môn,
   mở trang chi tiết đề xem mô tả/số câu/thời gian/điểm đạt.
4. Giải thích ngắn: đề và câu hỏi nối qua bảng `exam_questions` (quan hệ nhiều –
   nhiều, có thứ tự), sinh viên chỉ nhận đề đã công bố và không bao giờ nhận đáp án.

### 4.7. Tiêu chí hoàn thành

- [ ] Demo tạo đề từ ngân hàng câu hỏi, sửa và xóa đề thử chưa có bài nộp.
- [ ] Không thêm được câu hỏi khác môn hoặc câu hỏi không tồn tại.
- [ ] Sinh viên không thấy hoặc truy cập được đề chưa công bố.
- [ ] API lấy đề cho sinh viên không trả đáp án đúng/lời giải.
- [ ] Đề có bài nộp bị chặn sửa/xóa.
- [ ] Giải thích được quan hệ đề – câu hỏi và cách xử lý khi lưu thất bại.

### 4.8. Câu hỏi bảo vệ thường gặp

- **Đề lấy câu hỏi từ đâu?** — Từ ngân hàng câu hỏi của cùng môn, nối qua bảng
  `exam_questions` kèm `order_index` để giữ thứ tự.
- **Vì sao sinh viên không thấy đáp án?** — `getExamById` lọc bỏ `correct_answer` và
  `explanation` khi người gọi là sinh viên (hoặc ở chế độ làm bài).
- **Lưu đề thất bại giữa chừng thì sao?** — Dùng transaction: lỗi thì rollback, không
  để đề lưu dở (có đề mà thiếu câu hỏi hoặc ngược lại).

---

## 5. TV4 — Làm bài, chấm điểm, lịch sử và quản lý kết quả

### 5.1. Vai trò

Phụ trách phòng thi (làm bài, đếm ngược, nộp bài), chấm điểm tự động, lịch sử làm bài,
chi tiết đáp án đúng/sai và quản lý kết quả cho giảng viên.

### 5.2. File phụ trách

**Frontend:**

- `frontend/src/pages/student/ExamRoomPage.jsx` — phòng thi: hiển thị câu hỏi,
  chọn/đổi đáp án, chuyển câu, đánh dấu câu cần xem lại, đếm ngược, xác nhận nộp bài.
- `frontend/src/pages/student/MyResultsPage.jsx` — lịch sử thi, điểm, trạng thái
  đạt/trượt.
- `frontend/src/pages/student/SubmissionDetailPage.jsx` — chi tiết từng câu sau khi
  nộp: đáp án đã chọn, đáp án đúng, lời giải.
- `frontend/src/store/useExamStore.js` — **chỉ phần phiên thi**: chủ sở hữu phiên, đề,
  đáp án, vị trí câu, đánh dấu, hạn kết thúc, lưu/khôi phục và xóa trạng thái phiên.
- `frontend/src/pages/teacher/ExamManagerPage.jsx` — **chỉ tab kết quả**: danh sách
  bài nộp, liên kết xem chi tiết, `handleDeleteSubmission`. Tab đề thi là của TV3.

**Backend:**

- `backend/src/controllers/submissionController.js` — `submitExam`,
  `getMySubmissions`, `getSubmissionDetail`, `getAllSubmissions`, `deleteSubmission`.

**Test:** `frontend/test/examStore.test.js`.

**Dữ liệu:** bảng `submissions`; phiên làm bài lưu trong `sessionStorage` của trình
duyệt (không lưu cơ sở dữ liệu).

> Phạm vi theo file phân công: đổi đáp án là cập nhật state phiên làm bài ở trình
> duyệt. API bài nộp hiện có tạo, đọc và xóa; **không có API sửa bài nộp hoặc sửa
> điểm** — đừng demo chức năng này.

### 5.3. API phụ trách

| Method | Đường dẫn | Chức năng | Quyền |
| --- | --- | --- | --- |
| POST | `/api/submissions` | Nộp và chấm bài | Đã đăng nhập |
| GET | `/api/submissions/my-history` | Lịch sử của người đăng nhập | Đã đăng nhập |
| GET | `/api/submissions/:id` | Chi tiết bài nộp | Chủ bài hoặc Teacher |
| GET | `/api/submissions` | Danh sách bài nộp cho giảng viên (lọc theo `examId`) | Teacher |
| DELETE | `/api/submissions/:id` | Giảng viên xóa bài nộp | Teacher |

### 5.4. Việc cần làm từng bước

1. Đọc `useExamStore.js`: phiên thi dùng Zustand `persist` với `sessionStorage`;
   khi bắt đầu làm bài, lưu `deadline = thời điểm bắt đầu + thời lượng`; thời gian
   còn lại tính từ deadline nên F5 không làm tăng thời gian.
2. Đọc `ExamRoomPage.jsx`: hiển thị câu đã trả lời/chưa trả lời, số câu hoàn thành,
   thời gian còn lại; hết giờ thì tự nộp; khóa gửi lặp khi đang nộp; nộp lỗi thì
   hiện thông báo để thử lại.
3. Đọc `submitExam` trong `submissionController.js`: server tự lấy đáp án đúng để
   chấm, không tin điểm do client gửi; kiểm tra đáp án chỉ thuộc câu hỏi trong đề,
   lựa chọn hợp lệ (A–D), đề được phép làm (đề đã công bố); điểm = số câu đúng /
   tổng số câu × 10.
4. Đọc quyền xem chi tiết: sinh viên chỉ xem bài của mình (xem bài người khác bị
   403); giảng viên xem và xóa được bài nộp.
5. Chạy thử toàn bộ luồng mục 5.5 rồi tick vào tiêu chí mục 5.7.

### 5.5. Cách kiểm tra (tự test trước khi bàn giao)

- [ ] Đăng nhập sinh viên, mở đề đã công bố, bắt đầu làm bài: chọn đáp án, đổi đáp
      án, đánh dấu câu cần xem lại, chuyển câu → trạng thái cập nhật đúng.
- [ ] Đang làm bài thì bấm F5 → phiên được khôi phục, đáp án còn nguyên, thời gian
      còn lại không tăng thêm.
- [ ] Nộp bài có câu đúng, câu sai, câu bỏ trống → điểm chấm đúng công thức.
- [ ] Hết giờ → bài tự nộp, không làm tiếp được.
- [ ] Xem lịch sử: thấy điểm, trạng thái đạt/trượt, thời gian nộp.
- [ ] Mở chi tiết bài nộp: thấy từng câu, đáp án đã chọn, đáp án đúng, đúng/sai,
      lời giải.
- [ ] Đăng nhập sinh viên khác, mở link chi tiết bài nộp của sinh viên kia → bị
      chặn 403.
- [ ] Đăng nhập giảng viên: xem danh sách bài nộp, lọc theo đề, mở chi tiết, xóa 1
      bài nộp thử → sinh viên đó làm lại được (mất lượt cũ).

### 5.6. Kịch bản demo (nói và làm theo thứ tự)

1. Đăng nhập sinh viên, chọn 1 đề đã công bố, bấm bắt đầu làm bài.
2. Làm vài câu: chọn đáp án, đổi đáp án, đánh dấu 1 câu cần xem lại, chuyển câu.
3. Bấm F5 giữa chừng → phiên khôi phục, đáp án còn nguyên, đồng hồ không chạy lại
   từ đầu.
4. Nộp bài → xem điểm ngay, mở chi tiết xem từng câu đúng/sai.
5. Đăng nhập giảng viên, mở tab kết quả: xem bảng điểm, mở chi tiết 1 bài nộp,
   xóa 1 bài nộp thử để cho sinh viên thi lại.
6. Giải thích ngắn: đáp án lưu ở `sessionStorage` theo deadline nên F5 không gian
   lận được thời gian; điểm do server chấm từ đáp án đúng trong cơ sở dữ liệu, client
   gửi gì server cũng kiểm tra lại.

### 5.7. Tiêu chí hoàn thành

- [ ] Giải thích và demo cơ chế khôi phục phiên khi F5 bằng Zustand/`sessionStorage`,
      tính thời gian còn lại theo hạn kết thúc phía trình duyệt.
- [ ] Server chấm đúng với câu trả lời đúng, sai và bỏ trống.
- [ ] Sinh viên không xem được bài nộp của sinh viên khác.
- [ ] Lịch sử, chi tiết và danh sách kết quả giảng viên hiển thị đúng.
- [ ] Giải thích được Zustand, luồng làm bài và chấm điểm.

### 5.8. Câu hỏi bảo vệ thường gặp

- **F5 có làm tăng thời gian không?** — Không. Hạn kết thúc (`deadline`) lưu trong
  `sessionStorage`, thời gian còn lại = deadline − thời điểm hiện tại nên tải lại
  trang vẫn tính đúng.
- **Sinh viên sửa điểm ở trình duyệt được không?** — Không. Client chỉ gửi đáp án,
  server tự chấm từ đáp án đúng trong cơ sở dữ liệu và không tin điểm client gửi.
- **Đóng tab giữa chừng thì sao?** — Bài đang làm lưu tạm trong phiên trình duyệt,
  F5 khôi phục được; đóng tab, xóa dữ liệu trình duyệt hoặc đổi thiết bị thì không
  khôi phục được lượt cũ.
- **Xóa bài nộp để làm gì?** — Cho phép sinh viên thi lại khi cần; chỉ giảng viên
  được xóa.

---

## 6. File dùng chung — ai được sửa phần nào

| File / phần chung | Phân công |
| --- | --- |
| `frontend/src/pages/teacher/QuestionBankPage.jsx` | TV1: tab môn học, `sForm`, các hàm lưu/sửa/xóa môn. TV2: tab câu hỏi, `qForm`, các hàm lưu/sửa/xóa và lọc câu hỏi |
| `backend/src/controllers/questionController.js` | TV1: `getSubjects`, `createSubject`, `updateSubject`, `deleteSubject`. TV2: các hàm CRUD câu hỏi |
| `frontend/src/pages/teacher/ExamManagerPage.jsx` | TV3: tab đề, form đề và các hàm lưu/sửa/xóa đề. TV4: tab kết quả, dữ liệu bài nộp và `handleDeleteSubmission` |
| `frontend/src/store/useExamStore.js` | TV3: `selectedSubjectId`, `searchQuery` và các hàm cập nhật bộ lọc. TV4: phiên thi, đáp án, đánh dấu, chuyển câu, đếm giờ, lưu/khôi phục và xóa trạng thái phiên |
| `backend/src/routes/apiRoutes.js` | Mỗi người phụ trách các route của chức năng mình theo bảng API ở mục của mình |
| `backend/src/config/db.js`, `backend/database.sql` | TV1: kết nối, `users`, `subjects`. TV2: `questions`. TV3: `exams`, `exam_questions`. TV4: `submissions`; mỗi người nắm phần dữ liệu mẫu tương ứng |
| `backend/src/utils/validation.js` | TV1: kiểm tra đầu vào tài khoản/môn. TV2: câu hỏi. TV3: đề thi. TV4: bài nộp |
| `frontend/src/styles/global.css` | Mỗi người phụ trách kiểu hiển thị của màn hình mình; TV1 phối hợp phần layout dùng chung |
| `backend/test/api.test.js` | Mỗi người phụ trách các tình huống kiểm thử API thuộc chức năng mình |

Quy tắc: sửa file chung thì chỉ sửa đúng phần mình, `git pull` lấy mới nhất trước khi
sửa, commit xong báo cho người cùng giữ file đó biết để khỏi đè nhau.

---

## 7. Thứ tự demo cả nhóm (khi bảo vệ)

| Thứ tự | Nội dung demo | Thành viên |
| --- | --- | --- |
| 1 | Đăng ký/đăng nhập, phân quyền; thêm, sửa, xóa môn thử và tạo môn dùng cho đề | TV1 |
| 2 | Thêm, sửa, xóa câu hỏi thử; tìm kiếm/lọc câu hỏi; hỏi đáp với chatbot | TV2 |
| 3 | Tạo đề từ câu hỏi, sửa/xóa đề thử chưa có bài nộp, công bố đề; tìm kiếm và xem chi tiết đề | TV3 |
| 4 | Bắt đầu làm bài, đổi đáp án, đánh dấu, chuyển câu, khôi phục khi F5, nộp bài và xem điểm | TV4 |
| 5 | Xem lịch sử, chi tiết đáp án và kết quả giảng viên; xóa bài nộp thử bằng tài khoản giảng viên | TV4 |

Mỗi người demo xong phần mình thì nói 1 câu bàn giao cho người tiếp theo (ví dụ TV1:
"Môn học đã tạo xong, TV2 dùng môn này để thêm câu hỏi").

---

## 8. Lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
| --- | --- |
| Backend không kết nối MySQL | Kiểm tra dịch vụ MySQL, `DB_HOST`, `DB_PORT`, tài khoản, mật khẩu và quyền tạo cơ sở dữ liệu |
| Backend yêu cầu `JWT_SECRET` | Điền chuỗi bí mật riêng, không dùng giá trị mẫu |
| Giao diện không tải dữ liệu | Kiểm tra backend, `VITE_API_URL` và `FRONTEND_URL`; khởi động lại sau khi sửa |
| Cổng 5000 hoặc 5173 đang được sử dụng | Dừng bản server cũ trước khi chạy lại; nếu đổi cổng cần sửa cấu hình địa chỉ tương ứng |
| Chatbot báo key/model/hạn mức | Kiểm tra `GEMINI_API_KEY`, `GEMINI_MODEL` và tài khoản cung cấp API |
| Mất mạng thì chưa thể nộp bài | Giữ nguyên trang và thử nộp lại khi có kết nối. Không sửa đề trong lúc có người làm bài |
| Đề đã có bài nộp không sửa/xóa được | Đúng quy tắc, không phải lỗi — tạo đề mới khi cần thay đổi nội dung |
| Câu hỏi đang thuộc đề không sửa/xóa được | Đúng quy tắc, không phải lỗi — tạo câu hỏi mới khi cần thay đổi nội dung |

Kiểm thử tự động:

```powershell
cd backend
npm test
```

```powershell
cd frontend
npm test
npm run build
```

Kiểm thử backend tạo và xóa cơ sở dữ liệu tạm có tiền tố `ptit_exam_test_`, không dùng
dữ liệu ứng dụng. MySQL phải chạy và tài khoản cần quyền tạo/xóa cơ sở dữ liệu.

---

## 9. Mỗi thành viên cần nắm khi bảo vệ

1. Luồng thao tác trên các màn hình được giao.
2. Method, URL, đầu vào, phản hồi và quyền truy cập của API tương ứng.
3. Các bảng MySQL, quan hệ và truy vấn đang được sử dụng.
4. Quản lý state và cách frontend gọi backend.
5. Kiểm tra dữ liệu, thông báo lỗi và ràng buộc nghiệp vụ đã có trong code.
6. Kịch bản demo và các tình huống kiểm thử hiện có của phần mình.
