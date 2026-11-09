import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isTeacher = user?.role === "TEACHER";

  return (
    <div className="app-wrapper">
      {/* THANH ĐIỀU HƯỚNG TRÊN CÙNG (GLASSMORPHISM NAVBAR) */}
      <header className="top-navbar">
        <div className="navbar-inner container">
          {/* Logo thương hiệu */}
          <NavLink to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-badge">PTIT</div>
            <div className="brand-titles">
              <span className="brand-name">ExamPro</span>
              <span className="brand-sub">Hệ thống Thi trực tuyến</span>
            </div>
          </NavLink>

          {/* Nút mở menu trên Mobile */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

          {/* Danh sách link điều hướng */}
          <nav className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>📚</span> Danh sách đề thi
            </NavLink>

            <NavLink
              to="/my-results"
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>📊</span> Lịch sử làm bài
            </NavLink>

            {isTeacher && (
              <>
                <NavLink
                  to="/teacher/questions"
                  className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>🗂️</span> Ngân hàng câu hỏi
                </NavLink>

                <NavLink
                  to="/teacher/exams"
                  className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>⚙️</span> Quản lý đề & Điểm thi
                </NavLink>
              </>
            )}
          </nav>

          {/* Thông tin tài khoản & Đăng xuất */}
          <div className="user-controls">
            <div className="user-profile-pill">
              <div className="user-avatar">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-meta">
                <span className="user-fullname">{user?.fullName}</span>
                <span className={`role-tag ${isTeacher ? "teacher" : "student"}`}>
                  {isTeacher ? "Giảng viên" : `SV • ${user?.studentCode || "PTIT"}`}
                </span>
              </div>
            </div>

            <button type="button" className="btn-logout" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* VÙNG HIỂN THỊ CÁC MÀN HÌNH CON (<Outlet /> CỦA REACT ROUTER) */}
      <main className="main-content container">
        <Outlet />
      </main>

      {/* CHÂN TRANG (FOOTER) */}
      <footer className="app-footer">
        <div className="container footer-inner">
          <div>
            <strong>HỌC VIỆN CÔNG NGHỆ BƯU CHÍNH VIỄN THÔNG (PTIT)</strong>
            <p>Bài tập lớn Cuối kỳ — Hệ thống Thi Trắc nghiệm Trực tuyến Fullstack (React + Express + MySQL)</p>
          </div>
          <div className="footer-tech-badges">
            <span>React Router v6</span>
            <span>Zustand + Context</span>
            <span>Express REST API</span>
            <span>MySQL 8.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
