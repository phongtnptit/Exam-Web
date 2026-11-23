import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage() {
  const { verifyEmail, resendCode, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    location.state?.email
      ? "Mã xác minh 6 số đã được gửi về email của bạn, mã có hiệu lực trong 15 phút."
      : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!/^\d{6}$/.test(code.trim())) {
      setError("Vui lòng nhập đúng mã xác minh 6 số.");
      return;
    }

    setSubmitting(true);
    try {
      await verifyEmail(email.trim().toLowerCase(), code.trim());
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Xác minh thất bại. Vui lòng kiểm tra lại mã."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Vui lòng nhập email đã đăng ký để gửi lại mã.");
      return;
    }
    setResending(true);
    try {
      await resendCode(email.trim().toLowerCase());
      setInfo("Đã gửi lại mã xác minh 6 số về email của bạn.");
      setCountdown(RESEND_COOLDOWN);
    } catch (err) {
      setError(
        err.response?.data?.message || "Không gửi lại được mã. Vui lòng thử lại sau."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-hero">
        <div className="auth-hero-overlay" />
        <div className="auth-hero-content">
          <div className="hero-institute-tag">
            <span>HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG</span>
          </div>
          <h1>
            Xác minh <br />
            <span className="text-gradient">địa chỉ email</span>
          </h1>
          <p className="hero-desc">
            Nhập mã 6 số đã gửi về email của bạn để kích hoạt tài khoản
            và bắt đầu tham gia các kỳ thi.
          </p>
        </div>
      </div>

      <div className="auth-form-wrapper">
        <div className="auth-card">
          <div className="auth-card-header">
            <span className="section-badge">XÁC MINH EMAIL</span>
            <h2>Nhập mã xác minh</h2>
            <p>Kiểm tra hộp thư (cả mục Spam/Quảng cáo) để lấy mã 6 số.</p>
          </div>

          {error && <div className="alert-box alert-error">⚠️ {error}</div>}
          {info && <div className="alert-box alert-success">✅ {info}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-field">
              <label htmlFor="email">Địa chỉ Email *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="tenban@ptit.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="code">Mã xác minh 6 số *</label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={submitting}>
              {submitting ? "Đang xác minh..." : "Xác minh và đăng nhập →"}
            </button>
          </form>

          <div className="auth-card-footer">
            Chưa nhận được mã?{" "}
            <button
              type="button"
              className="link-highlight"
              onClick={handleResend}
              disabled={resending || countdown > 0}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : "Gửi lại mã"}
            </button>
          </div>

          <div className="auth-card-footer">
            <Link to="/login" className="link-highlight">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
