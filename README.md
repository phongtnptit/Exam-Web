# PTIT EXAMPRO — HỆ THỐNG THI TRẮC NGHIỆM TRỰC TUYẾN FULLSTACK
> **BÀI TẬP LỚN CUỐI KỲ - HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG (PTIT)**  
> **Đề tài số 10:** Thi trắc nghiệm trực tuyến (Ngân hàng câu hỏi, tạo đề, làm bài có đếm giờ, chấm điểm tự động)  
> **Đường dẫn dự án:** `D:\My_Project\online-exam-system`

---

## 1. TỔNG QUAN CÔNG NGHỆ ĐÁP ỨNG 100% YÊU CẦU

| Hạng mục | Công nghệ sử dụng | Chi tiết thực hiện trong dự án |
| :--- | :--- | :--- |
| **1. Frontend React** | React 18 + Vite + React Router v6 | Thiết kế **9 màn hình** hoàn chỉnh, CSS hiện đại, Responsive trên mọi thiết bị. |
| **2. Quản lý State** | **AuthContext** + **Zustand** | `AuthContext.jsx` quản lý đăng nhập/JWT; `useExamStore.js` (Zustand) quản lý phòng thi đếm ngược, chọn đáp án, cắm cờ câu hỏi & bộ lọc đề thi. |
| **3. Backend Express** | Node.js + Express.js | RESTful API chuẩn method (`GET`, `POST`, `PUT`, `DELETE`) & HTTP status (`200`, `201`, `400`, `401`, `403`, `404`, `500`), Middleware xử lý lỗi tập trung (`errorMiddleware.js`). |
| **4. CSDL MySQL** | **MySQL 8.0** (`mysql2/promise`) | **6 bảng** có khóa ngoại (`FOREIGN KEY ... ON DELETE CASCADE`), quan hệ 1-N và N-N. Tự động tạo DB, bảng và seed dữ liệu mẫu khi khởi động. |
| **5. Git & README** | Git + `.gitignore` + `.env.example` | Không lộ `.env`, cấu trúc thư mục rõ ràng, tài liệu hướng dẫn chi tiết. |
| **6. Nâng cao** | `jsonwebtoken` (JWT) + `bcryptjs` | Mã hóa mật khẩu bằng `bcryptjs`, xác thực Bearer Token và phân quyền Role-based (`TEACHER` và `STUDENT`). |

---

## 2. GIẢI THÍCH CƠ CHẾ HOẠT ĐỘNG CỦA REACT ROUTER (DÙNG KHI BẢO VỆ)

Toàn bộ phần định tuyến được thiết kế gói gọn trong 2 file cực kỳ dễ đọc tại `frontend/src/router/`:
1. [`frontend/src/router/ProtectedRoute.jsx`](./frontend/src/router/ProtectedRoute.jsx)
2. [`frontend/src/router/AppRouter.jsx`](./frontend/src/router/AppRouter.jsx)

### Sơ đồ phân tầng Router trong `AppRouter.jsx`:

```text
<Routes>
  │
  ├── 1. PUBLIC ROUTES (Ai cũng truy cập được)
  │     ├── /login              --> LoginPage (Đăng nhập)
  │     └── /register           --> RegisterPage (Đăng ký)
  │
  ├── 2. PROTECTED ROUTES (<ProtectedRoute /> - Bắt buộc đã đăng nhập)
  │     │
  │     ├── /exam-room/:id      --> ExamRoomPage (Phòng thi toàn màn hình không có thanh menu)
  │     │
  │     └── <MainLayout />      --> Dùng chung Navbar + Footer, render trang con qua <Outlet />
  │           ├── /             --> HomePage (Danh sách đề thi & Bộ lọc)
  │           ├── /exams/:id    --> ExamDetailPage (Thông tin & Quy chế trước khi vào thi)
  │           ├── /my-results   --> MyResultsPage (Lịch sử làm bài cá nhân)
  │           ├── /results/:id  --> SubmissionDetailPage (Xem chi tiết điểm & Giải thích đáp án)
  │           │
  │           └── 3. TEACHER ROUTES (<ProtectedRoute allowedRole="TEACHER" />)
  │                 ├── /teacher/questions --> QuestionBankPage (CRUD Môn học & Ngân hàng câu hỏi)
  │                 └── /teacher/exams     --> ExamManagerPage (CRUD Đề thi & Bảng điểm sinh viên)
  │
  └── 4. FALLBACK ROUTE
        └── *                   --> <Navigate to="/" replace /> (Gõ sai URL tự về Trang chủ)
```

### 3 Câu hỏi thầy cô thường hỏi về Router & Cách trả lời ngắn gọn:
* **Câu hỏi 1: Làm sao chặn người chưa đăng nhập gõ thẳng URL vào trang thi?**  
  $\rightarrow$ *Trả lời:* Trong `ProtectedRoute.jsx`, hệ thống lấy `user` từ `AuthContext`. Nếu `!user` (chưa đăng nhập), component trả về `<Navigate to="/login" replace />` để đẩy người dùng về trang đăng nhập ngay lập tức.
* **Câu hỏi 2: Làm sao chặn Sinh viên truy cập vào trang tạo đề của Giảng viên (`/teacher/exams`)?**  
  $\rightarrow$ *Trả lời:* Nhánh của giảng viên được bọc bởi `<ProtectedRoute allowedRole="TEACHER" />`. Nếu `user.role !== "TEACHER"`, hệ thống tự động chuyển hướng về trang chủ `/`.
* **Câu hỏi 3: Thẻ `<Outlet />` trong `MainLayout.jsx` có tác dụng gì?**  
  $\rightarrow$ *Trả lời:* `<Outlet />` là vị trí giữ chỗ (placeholder) của React Router v6. Khi chuyển qua lại giữa các trang con, thanh `Navbar` và `Footer` của `MainLayout` được giữ nguyên không phải render lại, chỉ có nội dung bên trong `<Outlet />` thay đổi.

---

## 3. BẢNG PHÂN CÔNG NHÓM 4 THÀNH VIÊN (THEO CHIỀU DỌC: UI $\rightarrow$ API $\rightarrow$ CSDL)

| Thành viên | Chức năng phụ trách | Frontend (React) | Backend (Express API) | Database (MySQL) |
| :--- | :--- | :--- | :--- | :--- |
| **TV1 (Nhóm trưởng)** | **Người dùng, Đăng nhập, Phân quyền JWT** | `LoginPage.jsx`, `RegisterPage.jsx`, `AuthContext.jsx`, `ProtectedRoute.jsx` | `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `authMiddleware.js` | Bảng `users` |
| **TV2** | **Quản lý Môn học & Ngân hàng Câu hỏi (CRUD)** | `QuestionBankPage.jsx` (2 tab: CRUD Câu hỏi & CRUD Môn học, lọc câu hỏi) | `/api/subjects` (GET, POST, PUT, DELETE), `/api/questions` (GET, POST, PUT, DELETE) | Bảng `subjects`, `questions` |
| **TV3** | **Quản lý Đề thi & Cấu trúc đề (CRUD)** | `ExamManagerPage.jsx` (Tạo/sửa/xóa đề thi, tích chọn câu hỏi vào đề), `ExamDetailPage.jsx` | `/api/exams` (GET, POST, PUT, DELETE), `/api/exams/:id` | Bảng `exams`, `exam_questions` |
| **TV4** | **Phòng thi đếm giờ, Chấm điểm & Thống kê** | `HomePage.jsx`, `ExamRoomPage.jsx` (Zustand `useExamStore.js`), `MyResultsPage.jsx`, `SubmissionDetailPage.jsx` | `/api/submissions` (POST chấm điểm tự động, GET lịch sử, GET chi tiết, DELETE) | Bảng `submissions` |

---

## 4. HƯỚNG DẪN CHẠY DỰ ÁN NHANH

### Cách 1: Chạy tự động bằng 1 cú nháy đúp chuột
Nháy đúp vào file **`start-project.bat`** trong thư mục `D:\My_Project\online-exam-system`.

### Cách 2: Chạy bằng dòng lệnh Terminal
1. **Khởi động Backend (Cổng 5000):**
   ```bash
   cd D:\My_Project\online-exam-system\backend
   npm install
   npm run dev
   ```
   *(Backend sẽ tự động kết nối MySQL, tạo database `ptit_online_exam`, tạo 6 bảng và nạp sẵn dữ liệu mẫu).*

2. **Khởi động Frontend (Cổng 5173):**
   ```bash
   cd D:\My_Project\online-exam-system\frontend
   npm install
   npm run dev
   ```
   👉 Mở trình duyệt tại: **http://localhost:5173**

### Tài khoản Demo có sẵn (hoặc bấm nút "Đăng nhập nhanh" trên giao diện):
* **Giảng viên:** `teacher@ptit.edu.vn` / Mật khẩu: `123456`
* **Sinh viên:** `student@ptit.edu.vn` / Mật khẩu: `123456`
