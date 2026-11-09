import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

function formatDuration(sec) {
  const mins = Math.floor((Number(sec) || 0) / 60);
  const rem = (Number(sec) || 0) % 60;
  return `${mins}p ${rem}s`;
}

export default function MyResultsPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosClient
      .get("/submissions/my-history")
      .then((res) => {
        setSubmissions(res.data.data || []);
      })
      .catch((err) => {
        console.error("Lỗi tải lịch sử thi:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalTaken = submissions.length;
  const passedCount = submissions.filter(
    (s) => Number(s.score) >= Number(s.pass_score || 5)
  ).length;
  const avgScore =
    totalTaken > 0
      ? (
          submissions.reduce((sum, item) => sum + Number(item.score), 0) /
          totalTaken
        ).toFixed(2)
      : "0.00";

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <span className="section-badge">KẾT QUẢ HỌC TẬP CÁ NHÂN</span>
          <h1>Lịch sử làm bài thi của bạn</h1>
          <p>Theo dõi tiến độ điểm số và xem lại đáp án chi tiết của từng lượt thi.</p>
        </div>
        <Link to="/" className="btn-primary">
          + Làm bài thi mới
        </Link>
      </div>

      {/* THỐNG KÊ TỔNG QUAN CÁ NHÂN */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-icon indigo">📝</div>
          <div>
            <span className="stat-label">Tổng lượt đã thi</span>
            <strong className="stat-value">{totalTaken} bài</strong>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon emerald">🏆</div>
          <div>
            <span className="stat-label">Số bài Đạt chuẩn</span>
            <strong className="stat-value">{passedCount} bài</strong>
          </div>
        </div>

        <div className="stat-box">
          <div className="stat-icon amber">⭐</div>
          <div>
            <span className="stat-label">Điểm trung bình</span>
            <strong className="stat-value">{avgScore} / 10</strong>
          </div>
        </div>
      </div>

      {/* BẢNG LỊCH SỬ NỘP BÀI */}
      <div className="panel-card">
        <div className="panel-header">
          <h2>Danh sách các bài thi đã hoàn thành</h2>
        </div>

        {loading ? (
          <div className="loading-box">Đang tải lịch sử bài thi...</div>
        ) : submissions.length === 0 ? (
          <div className="empty-box">
            <div className="empty-emoji">📄</div>
            <h3>Bạn chưa nộp bài thi nào</h3>
            <p>Hãy chọn một đề thi ở Trang chủ để bắt đầu kiểm tra kiến thức nhé!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã môn</th>
                  <th>Tên đề thi</th>
                  <th>Số câu đúng</th>
                  <th>Thời gian làm</th>
                  <th>Điểm số</th>
                  <th>Đánh giá</th>
                  <th>Ngày nộp</th>
                  <th style={{ textAlign: "right" }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => {
                  const score = Number(item.score);
                  const passed = score >= Number(item.pass_score || 5);
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="code-badge">{item.subject_code}</span>
                      </td>
                      <td>
                        <strong>{item.exam_title}</strong>
                        <div className="sub-text">{item.subject_name}</div>
                      </td>
                      <td>
                        <strong>
                          {item.correct_count} / {item.total_questions}
                        </strong>{" "}
                        câu
                      </td>
                      <td>{formatDuration(item.time_spent_seconds)}</td>
                      <td>
                        <span
                          className={`score-pill ${
                            score >= 8 ? "high" : score >= 5 ? "medium" : "low"
                          }`}
                        >
                          {score.toFixed(2)} đ
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag ${passed ? "pass" : "fail"}`}>
                          {passed ? "ĐẠT" : "CHƯA ĐẠT"}
                        </span>
                      </td>
                      <td>
                        {new Date(item.submitted_at).toLocaleString("vi-VN")}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          to={`/results/${item.id}`}
                          className="btn-table-action"
                        >
                          Xem đáp án →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
