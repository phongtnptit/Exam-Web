import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../context/AuthContext";

export default function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(true);

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get(`/exams/${id}?mode=take`)
      .then((res) => {
        setExam(res.data.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Không thể tải thông tin đề thi.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="loading-box">Đang tải thông tin đề thi...</div>;
  }

  if (error || !exam) {
    return (
      <div className="page-container">
        <div className="alert-box alert-error">{error || "Đề thi không tồn tại."}</div>
        <Link to="/" className="btn-secondary">
          ← Quay lại danh sách đề thi
        </Link>
      </div>
    );
  }

  const questionCount = exam.questions?.length || 0;

  return (
    <div className="page-container">
      <div className="exam-intro-wrapper">
        <Link to="/" className="back-link">
          ← Quay lại Danh sách đề thi
        </Link>

        <div className="exam-intro-card">
          <div className="exam-intro-header">
            <span className="subject-badge">
              {exam.subject_code} • {exam.subject_name}
            </span>
            <h1>{exam.title}</h1>
            <p className="intro-subtitle">
              {exam.description ||
                "Đề thi trắc nghiệm trực tuyến đánh giá kiến thức học phần."}
            </p>
          </div>

          {/* THÔNG SỐ KỸ THUẬT CỦA ĐỀ THI */}
          <div className="intro-metrics-grid">
            <div className="intro-metric-item">
              <div className="metric-icon">⏱️</div>
              <div>
                <span>Thời gian làm bài</span>
                <strong>{exam.duration_minutes} Phút</strong>
              </div>
            </div>

            <div className="intro-metric-item">
              <div className="metric-icon">📝</div>
              <div>
                <span>Tổng số câu hỏi</span>
                <strong>{questionCount} Câu trắc nghiệm</strong>
              </div>
            </div>

            <div className="intro-metric-item">
              <div className="metric-icon">🎯</div>
              <div>
                <span>Điểm chuẩn đạt</span>
                <strong>{exam.pass_score} / 10 điểm</strong>
              </div>
            </div>

            <div className="intro-metric-item">
              <div className="metric-icon">👤</div>
              <div>
                <span>Thí sinh dự thi</span>
                <strong>{user?.fullName}</strong>
              </div>
            </div>
          </div>

          {/* QUY CHẾ PHÒNG THI */}
          <div className="exam-rules-box">
            <h3>📌 Quy chế & Hướng dẫn làm bài thi trực tuyến:</h3>
            <ul>
              <li>
                Đồng hồ đếm ngược <strong>{exam.duration_minutes} phút</strong> sẽ
                bắt đầu chạy ngay khi bạn nhấn nút <strong>"Bắt đầu làm bài"</strong>.
              </li>
              <li>
                Mỗi câu hỏi có 4 phương án <strong>A, B, C, D</strong> và chỉ có duy
                nhất 1 đáp án đúng.
              </li>
              <li>
                Bạn có thể gắn <strong>Cờ đánh dấu (🚩)</strong> cho những câu hỏi
                đang phân vân để dễ dàng quay lại kiểm tra trước khi nộp.
              </li>
              <li>
                Khi hết thời gian quy định, hệ thống sẽ{" "}
                <strong>tự động thu bài</strong> và chấm điểm dựa trên các phương án
                bạn đã chọn.
              </li>
            </ul>
          </div>

          <label className="agree-checkbox">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              Tôi đã đọc kỹ quy chế thi và sẵn sàng bắt đầu làm bài thi trực tuyến.
            </span>
          </label>

          <div className="intro-action-row">
            <button
              type="button"
              className="btn-start-exam"
              disabled={!agreed || questionCount === 0}
              onClick={() => navigate(`/exam-room/${exam.id}`)}
            >
              🚀 Bắt đầu làm bài ngay ({exam.duration_minutes} phút)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
