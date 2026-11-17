# Cấu hình chatbot Gemini

## API key

1. Tạo API key trong Google AI Studio: https://aistudio.google.com/api-keys.
2. Mở `backend/.env` và điền:

```dotenv
GEMINI_API_KEY=api_key_cua_ban
GEMINI_MODEL=gemini-3.5-flash-lite
```

3. Lưu file và khởi động lại backend bằng `npm run dev`.
4. Đăng nhập ứng dụng, mở **Trợ lý học tập** và gửi câu hỏi.

API key chỉ đặt ở backend, không đặt trong frontend hoặc file được chia sẻ. Không thay cấu hình MySQL và JWT khi cấu hình chatbot.

## Sử dụng

Nhập câu hỏi hoặc chọn gợi ý có sẵn. Câu hỏi tối đa 2.000 ký tự. Chọn **Cuộc trò chuyện mới** để bắt đầu lại. Hội thoại không được lưu vào cơ sở dữ liệu và mất khi rời trang hoặc tải lại. Cần đối chiếu câu trả lời với tài liệu học.

## Khắc phục lỗi

| Thông báo | Cách xử lý |
| --- | --- |
| Chưa được cấu hình | Điền GEMINI_API_KEY và khởi động lại backend. |
| API key không hợp lệ | Kiểm tra key còn hiệu lực, đúng tài khoản và không thừa ký tự. |
| Chưa có quyền | Kiểm tra quyền API và giới hạn của key/project. |
| Model chưa khả dụng | Điền đúng ID model hỗ trợ generateContent mà tài khoản truy cập được, không thêm tiền tố models/. |
| Chạm hạn mức | Kiểm tra hạn mức trong tài khoản dịch vụ; chờ rồi thử lại nếu là giới hạn tạm thời. |
| Quá tải hoặc hết thời gian | Thử lại với câu hỏi ngắn hơn sau ít phút. |

Câu hỏi được giữ lại khi gửi thất bại. Chatbot cần Internet; khả năng sử dụng và hạn mức phụ thuộc dịch vụ Gemini.
