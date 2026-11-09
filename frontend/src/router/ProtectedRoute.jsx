import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ============================================================================
 * COMPONENT BẢO VỆ ROUTE & PHÂN QUYỀN (ProtectedRoute)
 * ============================================================================
 * Cách hoạt động (3 bước cực kỳ dễ hiểu khi giải thích bảo vệ):
 * 
 * - Bước 1: Nếu đang tải thông tin đăng nhập (loading = true) -> Hiện màn hình chờ.
 * - Bước 2: Nếu chưa đăng nhập (!user) -> Tự động chuyển hướng về trang "/login".
 * - Bước 3: Nếu route yêu cầu quyền cụ thể (allowedRole, ví dụ "TEACHER")
 *           mà user không đúng quyền -> Chuyển hướng về trang chủ "/".
 * - Bước 4: Nếu hợp lệ hoàn toàn -> Hiển thị trang con thông qua thẻ <Outlet />.
 * ============================================================================
 */
export default function ProtectedRoute({ allowedRole }) {
  const { user, loading } = useAuth();

  // Bước 1: Đang kiểm tra token trong localStorage
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Đang xác thực phiên đăng nhập...</p>
      </div>
    );
  }

  // Bước 2: Chưa đăng nhập -> Đẩy về trang Đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Bước 3: Kiểm tra phân quyền (Ví dụ: Sinh viên cố tình vào trang Giảng viên)
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  // Bước 4: Đã đăng nhập & Đúng quyền -> Cho phép hiển thị nội dung trang (<Outlet />)
  return <Outlet />;
}
