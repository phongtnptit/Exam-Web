import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../components/MainLayout";

// Màn hình 1 & 2: Đăng nhập & Đăng ký (Public)
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

// Màn hình 3, 4, 5, 6, 7: Các màn hình làm bài & xem kết quả
import HomePage from "../pages/student/HomePage";
import ExamDetailPage from "../pages/student/ExamDetailPage";
import ExamRoomPage from "../pages/student/ExamRoomPage";
import MyResultsPage from "../pages/student/MyResultsPage";
import SubmissionDetailPage from "../pages/student/SubmissionDetailPage";

// Màn hình 8 & 9: Quản trị dành riêng cho Giảng viên (TEACHER)
import QuestionBankPage from "../pages/teacher/QuestionBankPage";
import ExamManagerPage from "../pages/teacher/ExamManagerPage";

/**
 * ============================================================================
 * CẤU HÌNH ĐỊNH TUYẾN TOÀN ỨNG DỤNG (AppRouter.jsx)
 * ============================================================================
 * Thiết kế theo 4 nhánh rõ ràng giúp dễ dàng trình bày khi bảo vệ đồ án:
 * 
 * 1. PUBLIC ROUTES (/login, /register): Ai cũng vào được.
 * 2. PROTECTED ROUTES (<ProtectedRoute />): Bắt buộc phải đăng nhập.
 *    - Dùng <MainLayout /> (chứa Navbar + <Outlet />) để giữ nguyên thanh menu khi chuyển trang.
 * 3. TEACHER ROUTES (<ProtectedRoute allowedRole="TEACHER" />): Chỉ Giảng viên mới vào được.
 * 4. FALLBACK ROUTE (*): Mọi đường dẫn không tồn tại tự động quay về "/".
 * ============================================================================
 */
export default function AppRouter() {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES: Màn hình Đăng nhập & Đăng ký */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 2. PROTECTED ROUTES: Yêu cầu đã đăng nhập */}
      <Route element={<ProtectedRoute />}>
        {/* Phòng thi trực tuyến đặt độc lập (toàn màn hình tập trung làm bài) */}
        <Route path="/exam-room/:id" element={<ExamRoomPage />} />

        {/* Các màn hình có chung thanh điều hướng MainLayout (Navbar + Footer) */}
        <Route element={<MainLayout />}>
          {/* Màn hình chung cho cả Sinh viên & Giảng viên */}
          <Route path="/" element={<HomePage />} />
          <Route path="/exams/:id" element={<ExamDetailPage />} />
          <Route path="/my-results" element={<MyResultsPage />} />
          <Route path="/results/:id" element={<SubmissionDetailPage />} />

          {/* 3. TEACHER ROUTES: Phân quyền chỉ cho phép Giảng viên (role === "TEACHER") */}
          <Route element={<ProtectedRoute allowedRole="TEACHER" />}>
            <Route path="/teacher/questions" element={<QuestionBankPage />} />
            <Route path="/teacher/exams" element={<ExamManagerPage />} />
          </Route>
        </Route>
      </Route>

      {/* 4. FALLBACK ROUTE: Đường dẫn sai tự chuyển về Trang chủ */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
