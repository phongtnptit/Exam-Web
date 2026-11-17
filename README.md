# PTIT ExamPro — Hướng dẫn cài đặt và sử dụng

Ứng dụng thi trắc nghiệm trực tuyến sử dụng React, Express và MySQL. Sinh viên có thể làm bài, xem điểm và lịch sử; giảng viên quản lý môn học, câu hỏi, đề thi và kết quả. Chatbot Gemini hỗ trợ hỏi đáp kiến thức trong mục Trợ lý học tập.

## 1. Chuẩn bị

- Node.js 22 và npm.
- MySQL 8 đang chạy; tài khoản MySQL có quyền tạo cơ sở dữ liệu và bảng.
- Kết nối Internet và API key Gemini nếu sử dụng chatbot.

## 2. Cấu hình lần đầu

Mở PowerShell tại thư mục dự án. Chỉ sao chép file mẫu nếu chưa có file `.env`:

```powershell
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
```

Điền cấu hình trong `backend/.env`:

```dotenv
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=mat_khau_mysql_cua_ban
DB_NAME=ptit_online_exam
JWT_SECRET=thay_bang_chuoi_bi_mat_dai_va_kho_doan
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
GEMINI_API_KEY=api_key_gemini_cua_ban
GEMINI_MODEL=gemini-3.5-flash-lite
```

Thay mật khẩu MySQL, JWT_SECRET và API key bằng giá trị riêng. Model phải khả dụng với tài khoản Gemini của bạn. Hướng dẫn chatbot nằm trong [docs/CHATBOT.md](docs/CHATBOT.md).

Cấu hình `frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

## 3. Chạy trên localhost

Terminal thứ nhất, từ thư mục dự án:

```powershell
cd backend
npm install
npm run dev
```

Terminal thứ hai, từ thư mục dự án:

```powershell
cd frontend
npm install
npm run dev
```

Mở [http://localhost:5173](http://localhost:5173). Kiểm tra backend tại [http://localhost:5000/api/health](http://localhost:5000/api/health).

Backend tự tạo cơ sở dữ liệu, bảng và thêm dữ liệu mẫu khi bảng người dùng chưa có tài khoản. Không cần import `backend/database.sql` để chạy lần đầu.

Sau khi cài đặt và cấu hình xong, có thể chạy `start-project.bat` trên Windows để mở hai server. Dùng Ctrl+C trong từng terminal để dừng.

## 4. Tài khoản mẫu và sử dụng

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Giảng viên | teacher@ptit.edu.vn | 123456 |
| Sinh viên | student@ptit.edu.vn | 123456 |

Các tài khoản này được tạo khi khởi tạo dữ liệu mẫu. Nếu đã đổi hoặc xoá tài khoản trong cơ sở dữ liệu thì sử dụng thông tin đăng nhập hiện tại.

- Sinh viên: đăng nhập, chọn đề, làm bài và nộp để xem điểm, đáp án, lịch sử.
- Giảng viên: tạo môn, thêm câu hỏi, tạo đề và mở đề cho sinh viên; xem kết quả tại trang quản lý.
- Đăng ký mới chỉ tạo tài khoản sinh viên. Các giảng viên dùng chung ngân hàng câu hỏi và đề thi.
- Trợ lý học tập: đăng nhập rồi mở mục tương ứng trên thanh điều hướng.

## 5. LƯU Ý

- Giữ MySQL, backend và frontend chạy trong suốt quá trình sử dụng.
- Khởi động lại server tương ứng sau khi thay đổi `.env`.
- Không đưa `.env`, mật khẩu thật hoặc API key vào bản nộp/chia sẻ. Bản chạy trên máy này tiếp tục dùng cấu hình hiện có; máy khác cấu hình theo `.env.example`.
- Không cần nộp `node_modules` hoặc `frontend/dist`; có thể tạo lại bằng `npm install` và `npm run build`.
- Chatbot cần Internet và API key hợp lệ. Hạn mức phụ thuộc tài khoản dịch vụ. Thiếu key chỉ ảnh hưởng chatbot, các chức năng thi vẫn dùng được.
- Hội thoại chatbot không lưu vào cơ sở dữ liệu; rời trang hoặc tải lại sẽ mất nội dung.
- Đề đã có bài nộp không được sửa/xoá; câu hỏi đang thuộc đề không được sửa/xoá. Tạo đề hoặc câu hỏi mới khi cần thay đổi nội dung.
- Bài đang làm lưu tạm trong phiên trình duyệt và có thể khôi phục khi F5. Đóng tab, xoá dữ liệu trình duyệt hoặc đổi thiết bị sẽ không khôi phục được lượt cũ.
- Mất mạng thì chưa thể nộp bài; giữ nguyên trang và thử nộp lại khi có kết nối. Không sửa đề trong lúc có người làm bài.

## 6. Xử lý lỗi thường gặp

| Hiện tượng | Cách kiểm tra |
| --- | --- |
| Backend không kết nối MySQL | Kiểm tra dịch vụ MySQL, DB_HOST, DB_PORT, tài khoản, mật khẩu và quyền tạo cơ sở dữ liệu. |
| Backend yêu cầu JWT_SECRET | Điền chuỗi bí mật riêng, không dùng giá trị mẫu. |
| Giao diện không tải dữ liệu | Kiểm tra backend, VITE_API_URL và FRONTEND_URL; khởi động lại sau khi sửa. |
| Cổng 5000 hoặc 5173 đang được sử dụng | Dừng bản server cũ trước khi chạy lại; nếu đổi cổng cần sửa cấu hình địa chỉ tương ứng. |
| Chatbot báo key/model/hạn mức | Kiểm tra GEMINI_API_KEY, GEMINI_MODEL và tài khoản cung cấp API. |

## 7. Kiểm tra dự án

Từ thư mục dự án, chạy kiểm thử backend:

```powershell
cd backend
npm test
```

Kiểm thử backend tạo và xoá cơ sở dữ liệu tạm có tiền tố `ptit_exam_test_`, không dùng dữ liệu ứng dụng. MySQL phải chạy và tài khoản cần quyền tạo/xoá cơ sở dữ liệu. Kiểm thử chatbot giả lập phản hồi, không gọi Gemini bằng key thật.

Trong terminal khác, từ thư mục dự án:

```powershell
cd frontend
npm test
npm run build
```

Lệnh build tạo thư mục `frontend/dist`. Để sử dụng và kiểm tra trên localhost trong quá trình phát triển, chạy hai server theo mục 3.
