import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

export default function SubmissionDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    axiosClient
      .get(`/submissions/${id}`)
      .then((res) => {
        setDetail(res.data.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Không thể tải chi tiết bài làm."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="loading-box">Đang tải chi tiết kết quả bài thi...</div>;
  }

  if (error || !detail) {
    return (
      <div className="page-container">
        <div className="alert-box alert-error">{error || "Không tìm thấy kết quả."}</div>
        <Link to="/my-results" className="btn-secondary">
          ← Quay lại lịch sử làm bài
        </Link>
      </div>
    );
  }

  const score = Number(detail.score);
  const passed = score >= Number(detail.pass_score || 5);
  const accuracy =
    detail.total_questions > 0
      ? Math.round((detail.correct_count / detail.total_questions) * 100)
      : 0;

  return (
    <div className="page-container">
      <div className="top-nav-row">
        <Link to="/my-results" className="back-link">
          ← Quay lại Lịch sử làm bài
        </Link>
        <Link to={`/exams/${detail.exam_id}`} className="btn-secondary">
          🔄 Thi lại đề này
        </Link>
      </div>

      {/* THẺ TỔNG KẾT ĐIỂM SỐ NỔI BẬT */}
      <section className="result-hero-card">
        <div className="result-score-gauge">
          <div className={`gauge-circle ${passed ? "pass" : "fail"}`}>
            <span className="gauge-number">{score.toFixed(2)}</span>
            <span className="gauge-unit">THANG ĐIỂM 10</span>
          </div>
          <span className={`verdict-badge ${passed ? "pass" : "fail"}`}>
            {passed ? "🎉 ĐẠT YÊU CẦU" : "⚠️ CẦN CỐ GẮNG THÊM"}
          </span>
        </div>

        <div className="result-summary-info">
          <span className="subject-badge">
            {detail.subject_code} • {detail.subject_name}
          </span>
          <h1>{detail.exam_title}</h1>
          <p className="student-meta-line">
            Thí sinh: <strong>{detail.student_name}</strong> ({detail.student_code}) •
            Nộp lúc: {new Date(detail.submitted_at).toLocaleString("vi-VN")}
          </p>

          <div className="result-kpi-grid">
            <div className="kpi-item">
              <span>Số câu trả lời đúng</span>
              <strong className="text-emerald">
                {detail.correct_count} / {detail.total_questions} câu
              </strong>
            </div>
            <div className="kpi-item">
              <span>Tỷ lệ chính xác</span>
              <strong>{accuracy}%</strong>
            </div>
            <div className="kpi-item">
              <span>Thời gian hoàn thành</span>
              <strong>
                {Math.floor(detail.time_spent_seconds / 60)} phút{" "}
                {detail.time_spent_seconds % 60} giây
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* DANH SÁCH ĐỐI CHIẾU TỪNG CÂU HỎI & GIẢI THÍCH */}
      <section className="review-questions-section">
        <h2 className="section-title-heading">
          Chi tiết đáp án & Lời giải ({detail.questions?.length || 0} câu)
        </h2>

        <div className="review-list">
          {detail.questions?.map((q, idx) => {
            const isCorrect = q.is_correct;
            const options = [
              { key: "A", text: q.option_a },
              { key: "B", text: q.option_b },
              { key: "C", text: q.option_c },
              { key: "D", text: q.option_d },
            ];

            return (
              <article
                key={q.id}
                className={`review-question-card ${isCorrect ? "correct" : "wrong"}`}
              >
                <div className="review-q-header">
                  <span className="review-q-num">Câu {idx + 1}</span>
                  <span className={`review-status-pill ${isCorrect ? "ok" : "err"}`}>
                    {isCorrect
                      ? "✓ Trả lời chính xác"
                      : q.selected_option
                      ? `✕ Chọn sai (Bạn chọn ${q.selected_option})`
                      : "✕ Chưa chọn đáp án"}
                  </span>
                </div>

                <p className="review-q-content">{q.content}</p>

                <div className="review-options-grid">
                  {options.map((opt) => {
                    const isRightAns = q.correct_answer === opt.key;
                    const isUserSelected = q.selected_option === opt.key;

                    let cls = "review-option-item";
                    if (isRightAns) cls += " right-answer";
                    else if (isUserSelected && !isRightAns) cls += " wrong-selected";

                    return (
                      <div key={opt.key} className={cls}>
                        <span className="opt-badge">{opt.key}</span>
                        <span className="opt-label">{opt.text}</span>
                        {isRightAns && (
                          <span className="opt-tag-right">✓ Đáp án đúng</span>
                        )}
                        {isUserSelected && !isRightAns && (
                          <span className="opt-tag-wrong">✕ Bạn đã chọn</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="explanation-banner">
                    <strong>💡 Giải thích chi tiết:</strong> {q.explanation}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
