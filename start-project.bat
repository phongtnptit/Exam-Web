@echo off
title PTIT ExamPro Launcher
cls

echo ========================================================
echo   KHOI DONG HE THONG THI TRAC NGHIEM PTIT EXAMPRO
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Dang khoi dong Backend Express (Port 5000)...
start "PTIT-ExamPro-Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

ping 127.0.0.1 -n 3 >nul

echo [2/2] Dang khoi dong Frontend React (Port 5173)...
start "PTIT-ExamPro-Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo   DA KHOI DONG THANH CONG!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:5000/api
echo.
echo   TAI KHOAN DEMO:
echo   - Giang vien: teacher@ptit.edu.vn / 123456
echo   - Sinh vien:  student@ptit.edu.vn / 123456
echo ========================================================
echo.
pause
