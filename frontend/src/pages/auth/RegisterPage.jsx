import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    studentCode: "",
    role: "STUDENT",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Mật khẩu phải có tối thiểu 6 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Đăng ký thất bại. Email có thể đã tồn tại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      {/* CỘT TRÁI: BANNER */}
      <div className="auth-hero">
        <div className="auth-hero-overlay" />
        <div className="auth-hero-content">
          <div className="hero-institute-tag">
            <span>HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</span>
          </div>
          <h1>
            Khởi đầu hành trình <br />
            <span className="text-gradient">Chinh phục kỳ thi</span>
          </h1>
          <p className="hero-desc">
            Tạo tài khoản miễn phí để tham gia các kỳ thi trắc nghiệm trực tuyến
            hoặc biên soạn ngân hàng đề thi cho lớp học phần.
          </p>
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG KÝ */}
      <div className="auth-form-wrapper">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="section-badge">THÀNH VIÊN MỚI</span>
            <h2>Đăng ký tài khoản</h2>
            <p>Điền đầy đủ thông tin cá nhân bên dưới</p>
          </div>

          {error && <div className="alert-box alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="fullName">Họ và tên *</label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn An"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-field">
                <label htmlFor="studentCode">Mã SV / Mã GV</label>
                <input
                  id="studentCode"
                  name="studentCode"
                  type="text"
                  placeholder="VD: B22DCCN123"
                  value={form.studentCode}
                  onChange={handleChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="role">Vai trò *</label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="STUDENT">🎓 Sinh viên</option>
                  <option value="TEACHER">👨‍🏫 Giảng viên</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="email">Địa chỉ Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tenban@ptit.edu.vn"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="password">Mật khẩu (tối thiểu 6 ký tự) *</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={submitting}>
              {submitting ? "Đang tạo tài khoản..." : "Hoàn tất đăng ký →"}
            </button>
          </form>

          <div className="auth-card-footer">
            Đã có tài khoản?{" "}
            <Link to="/login" className="link-highlight">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
