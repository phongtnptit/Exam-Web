import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useExamStore } from "../../store/useExamStore";

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ExamRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Lấy state & actions từ Zustand Store (useExamStore)
  const {
    activeExam,
    questions,
    currentIndex,
    answers,
    flaggedQuestions,
    remainingSeconds,
    totalSeconds,
    startExamSession,
    selectAnswer,
    toggleFlagQuestion,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    tickTimer,
    resetExamSession,
  } = useExamStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const submitLockRef = useRef(false);

  // 1. Tải đề thi và khởi tạo Zustand store
  useEffect(() => {
    setLoading(true);
    axiosClient
      .get(`/exams/${id}?mode=take`)
      .then((res) => {
        startExamSession(res.data.data);
      })
      .catch((err) => {
        alert(err.response?.data?.message || "Không thể vào phòng thi.");
        navigate("/");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      resetExamSession();
    };
  }, [id, navigate, startExamSession, resetExamSession]);

  // 2. Hàm nộp bài thi lên Server
  const handleFinalSubmit = useCallback(
    async (isAuto = false) => {
      if (submitLockRef.current) return;
      submitLockRef.current = true;
      setSubmitting(true);
      setShowConfirmModal(false);

      const currentState = useExamStore.getState();
      const timeSpent = Math.max(
        1,
        currentState.totalSeconds - currentState.remainingSeconds
      );

      try {
        const res = await axiosClient.post("/submissions", {
          examId: Number(id),
          answers: currentState.answers,
          timeSpentSeconds: timeSpent,
        });
        const submissionId = res.data.data.submissionId;
        if (isAuto) {
          alert("⏰ Đã hết thời gian làm bài! Hệ thống tự động thu bài của bạn.");
        }
        navigate(`/results/${submissionId}`, { replace: true });
      } catch (err) {
        submitLockRef.current = false;
        setSubmitting(false);
        alert(err.response?.data?.message || "Lỗi khi nộp bài. Vui lòng thử lại.");
      }
    },
    [id, navigate]
  );

  // 3. Bộ đếm ngược thời gian mỗi giây
  useEffect(() => {
    if (loading || !activeExam || questions.length === 0) return;

    const interval = setInterval(() => {
      const currentRem = useExamStore.getState().remainingSeconds;
      if (currentRem <= 1) {
        clearInterval(interval);
        handleFinalSubmit(true);
      } else {
        tickTimer();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, activeExam, questions.length, tickTimer, handleFinalSubmit]);

  if (loading || !activeExam) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Đang chuẩn bị phòng thi trực tuyến...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex] || {};
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
  const isFlagged = flaggedQuestions.includes(currentQuestion.id);
  const isTimeUrgent = remainingSeconds <= 180; // Dưới 3 phút đổi màu đỏ nhấp nháy

  const options = [
    { key: "A", text: currentQuestion.option_a },
    { key: "B", text: currentQuestion.option_b },
    { key: "C", text: currentQuestion.option_c },
    { key: "D", text: currentQuestion.option_d },
  ];

  return (
    <div className="exam-room-shell">
      {/* THANH HEADER CỐ ĐỊNH TRÊN CÙNG PHÒNG THI */}
      <header className="exam-room-header">
        <div className="exam-room-brand">
          <span className="exam-subject-tag">{activeExam.subject_code}</span>
          <div>
            <h1 className="exam-room-title">{activeExam.title}</h1>
            <span className="exam-room-sub">
              Đã trả lời: <strong>{answeredCount}/{totalQ}</strong> câu ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Thanh tiến độ ở giữa */}
        <div className="exam-progress-bar-wrap">
          <div className="exam-progress-track">
            <div
              className="exam-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Đồng hồ đếm ngược & Nút nộp bài */}
        <div className="exam-room-controls">
          <div className={`countdown-badge ${isTimeUrgent ? "urgent" : ""}`}>
            <span className="clock-icon">⏱️</span>
            <span className="clock-time">{formatClock(remainingSeconds)}</span>
          </div>

          <button
            type="button"
            className="btn-submit-exam"
            disabled={submitting}
            onClick={() => setShowConfirmModal(true)}
          >
            {submitting ? "Đang nộp..." : "📤 Nộp bài thi"}
          </button>
        </div>
      </header>

      {/* BỐ CỤC 2 CỘT CỦA PHÒNG THI */}
      <div className="exam-room-body container">
        {/* CỘT TRÁI: NỘI DUNG CÂU HỎI HIỆN TẠI */}
        <section className="question-stage-card">
          <div className="question-stage-top">
            <div className="q-index-badge">
              <span>Câu hỏi số {currentIndex + 1}</span>
              <small> / {totalQ}</small>
              <span className={`diff-tag ${currentQuestion.difficulty?.toLowerCase()}`}>
                {currentQuestion.difficulty === "EASY"
                  ? "Mức Dễ"
                  : currentQuestion.difficulty === "HARD"
                  ? "Mức Khó"
                  : "Trung bình"}
              </span>
            </div>

            <button
              type="button"
              className={`btn-flag ${isFlagged ? "flagged" : ""}`}
              onClick={() => toggleFlagQuestion(currentQuestion.id)}
            >
              🚩 {isFlagged ? "Đã gắn cờ xem lại" : "Đánh dấu câu hỏi"}
            </button>
          </div>

          <div className="question-prompt">
            <p>{currentQuestion.content}</p>
          </div>

          {/* 4 PHƯƠNG ÁN TRẮC NGHIỆM A, B, C, D */}
          <div className="options-grid">
            {options.map((opt) => {
              const selected = answers[currentQuestion.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`option-choice-card ${selected ? "selected" : ""}`}
                  onClick={() => selectAnswer(currentQuestion.id, opt.key)}
                >
                  <span className="option-letter">{opt.key}</span>
                  <span className="option-content">{opt.text}</span>
                  <span className="option-radio-dot">
                    {selected ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {/* NÚT ĐIỀU HƯỚNG CÂU TRƯỚC / CÂU TIẾP */}
          <div className="question-stage-footer">
            <button
              type="button"
              className="btn-nav-q secondary"
              disabled={currentIndex === 0}
              onClick={prevQuestion}
            >
              ← Câu trước
            </button>

            <span className="stage-pos-hint">
              Sử dụng bảng câu hỏi bên phải để chuyển nhanh tới câu bất kỳ
            </span>

            <button
              type="button"
              className="btn-nav-q primary"
              disabled={currentIndex === totalQ - 1}
              onClick={nextQuestion}
            >
              Câu tiếp theo →
            </button>
          </div>
        </section>

        {/* CỘT PHẢI: BẢNG MA TRẬN CÂU HỎI (QUESTION PALETTE) */}
        <aside className="question-palette-card">
          <h3>Danh sách câu hỏi</h3>

          <div className="palette-legend-grid">
            <div className="legend-item">
              <span className="dot answered" /> Đã trả lời ({answeredCount})
            </div>
            <div className="legend-item">
              <span className="dot unanswered" /> Chưa làm ({totalQ - answeredCount})
            </div>
            <div className="legend-item">
              <span className="dot current" /> Đang chọn
            </div>
            <div className="legend-item">
              <span className="dot flagged" /> Cắm cờ ({flaggedQuestions.length})
            </div>
          </div>

          <div className="palette-numbers-grid">
            {questions.map((q, idx) => {
              const isAns = Boolean(answers[q.id]);
              const isCur = idx === currentIndex;
              const isFlg = flaggedQuestions.includes(q.id);

              return (
                <button
                  key={q.id}
                  type="button"
                  className={`palette-num-btn ${isCur ? "current" : ""} ${
                    isAns ? "answered" : ""
                  } ${isFlg ? "flagged" : ""}`}
                  onClick={() => goToQuestion(idx)}
                >
                  {idx + 1}
                  {isFlg && <i className="mini-flag">🚩</i>}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="btn-submit-exam btn-full"
            onClick={() => setShowConfirmModal(true)}
          >
            📤 Hoàn thành & Nộp bài
          </button>
        </aside>
      </div>

      {/* MODAL XÁC NHẬN NỘP BÀI */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-icon">📋</div>
            <h2>Xác nhận nộp bài thi?</h2>
            <p>
              Bạn đã trả lời <strong>{answeredCount}</strong> trên tổng số{" "}
              <strong>{totalQ}</strong> câu hỏi.
            </p>
            {totalQ - answeredCount > 0 && (
              <div className="alert-box alert-warning">
                ⚠️ Bạn vẫn còn <strong>{totalQ - answeredCount} câu hỏi</strong> chưa
                chọn đáp án!
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Quay lại làm tiếp
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
              >
                {submitting ? "Đang chấm điểm..." : "Đồng ý nộp bài"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
