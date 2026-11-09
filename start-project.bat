@echo off
chcp 65001 >nul
echo ============================================================================
echo   KHỞI ĐỘNG HỆ THỐNG THI TRẮC NGHIỆM TRỰC TUYẾN PTIT EXAMPRO
echo   Đường dẫn: D:\My_Project\online-exam-system
echo ============================================================================
echo.

cd /d "%~dp0"

echo [1/2] Đang khởi động Backend Express + MySQL (Port 5000)...
start "PTIT ExamPro - Backend (5000)" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [2/2] Đang khởi động Frontend React Vite (Port 5173)...
start "PTIT ExamPro - Frontend (5173)" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================================
echo   ĐÃ KHỞI ĐỘNG THÀNH CÔNG!
echo   👉 Truy cập trang web tại: http://localhost:5173
echo   👉 API Backend chạy tại:   http://localhost:5000/api
echo.
echo   TÀI KHOẢN MẪU (Hoặc bấm nút Đăng nhập nhanh trên màn hình Login):
echo   - Giảng viên: teacher@ptit.edu.vn / 123456
echo   - Sinh viên:  student@ptit.edu.vn / 123456
echo ============================================================================
echo.
pause
