import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Đăng nhập mẫu 1 chạm phục vụ demo bảo vệ đồ án
  const handleQuickDemo = async (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError("");
    setSubmitting(true);
    try {
      await login(demoEmail, demoPass);
      navigate("/");
    } catch (err) {
      setError("Không thể kết nối tới Backend. Hãy chắc chắn server đang chạy ở cổng 5000.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* CỘT TRÁI: BANNER GIỚI THIỆU HỆ THỐNG PTIT */}
      <div className="auth-hero">
        <div className="auth-hero-overlay" />
        <div className="auth-hero-content">
          <div className="hero-institute-tag">
            <span>HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</span>
          </div>
          <h1>
            Hệ Thống Thi Trắc Nghiệm <br />
            <span className="text-gradient">Trực Tuyến PTIT ExamPro</span>
          </h1>
          <p className="hero-desc">
            Nền tảng tổ chức thi, quản lý ngân hàng câu hỏi và chấm điểm tự động
            chuẩn hóa theo quy trình đào tạo tín chỉ đại học.
          </p>

          <div className="hero-feature-grid">
            <div className="hero-feature-item">
              <span className="feature-icon">⏱️</span>
              <div>
                <strong>Làm bài đếm ngược thời gian thực</strong>
                <p>Tự động thu bài và chấm điểm ngay khi hết giờ</p>
              </div>
            </div>
            <div className="hero-feature-item">
              <span className="feature-icon">🗂️</span>
              <div>
                <strong>Ngân hàng câu hỏi đa môn học</strong>
                <p>Phân loại theo mức độ Dễ, Trung bình, Khó kèm lời giải</p>
              </div>
            </div>
            <div className="hero-feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <strong>Thống kê & Xem lại đáp án chi tiết</strong>
                <p>Đối chiếu từng câu đúng/sai và phổ điểm trực quan</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
      <div className="auth-form-wrapper">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="section-badge">CHÀO MỪNG TRỞ LẠI</span>
            <h2>Đăng nhập tài khoản</h2>
            <p>Sử dụng tài khoản Giảng viên hoặc Sinh viên để tiếp tục</p>
          </div>

          {error && <div className="alert-box alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="email">Địa chỉ Email</label>
              <input
                id="email"
                type="email"
                placeholder="ví dụ: student@ptit.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={submitting}>
              {submitting ? "Đang xác thực..." : "Đăng nhập vào hệ thống →"}
            </button>
          </form>

          {/* HỘP ĐĂNG NHẬP NHANH DEMO BẢO VỆ */}
          <div className="quick-demo-panel">
            <span className="quick-demo-title">⚡ Đăng nhập nhanh phục vụ Demo Bảo vệ:</span>
            <div className="quick-demo-buttons">
              <button
                type="button"
                className="btn-demo teacher"
                onClick={() => handleQuickDemo("teacher@ptit.edu.vn", "123456")}
              >
                👨‍🏫 Tài khoản Giảng viên
                <small>teacher@ptit.edu.vn</small>
              </button>

              <button
                type="button"
                className="btn-demo student"
                onClick={() => handleQuickDemo("student@ptit.edu.vn", "123456")}
              >
                🎓 Tài khoản Sinh viên
                <small>student@ptit.edu.vn</small>
              </button>
            </div>
          </div>

          <div className="auth-card-footer">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="link-highlight">
              Đăng ký tài khoản mới
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
