import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useExamStore } from "../../store/useExamStore";
import { useAuth } from "../../context/AuthContext";

function formatClock(seconds) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function ExamRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    activeExam,
    questions,
    currentIndex,
    answers,
    flaggedQuestions,
    remainingSeconds,
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

  useEffect(() => {
    let cancelled = false;
    submitLockRef.current = false;
    setSubmitting(false);
    setLoading(true);
    axiosClient
      .get(`/exams/${id}?mode=take`)
      .then((res) => {
        if (cancelled) return;
        if (!res.data.data.questions?.length) throw new Error("Đề thi chưa có câu hỏi.");
        startExamSession(res.data.data, user.id);
      })
      .catch((err) => {
        if (cancelled) return;
        alert(err.response?.data?.message || err.message || "Không thể vào phòng thi.");
        navigate("/");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, user.id, navigate, startExamSession]);

  const handleFinalSubmit = useCallback(
    async (isAuto = false) => {
      if (submitLockRef.current) return;
      submitLockRef.current = true;
      setSubmitting(true);
      setShowConfirmModal(false);

      const currentState = useExamStore.getState();
      const timeSpent = Math.min(currentState.totalSeconds, Math.max(
        0, currentState.totalSeconds - Math.ceil((currentState.deadline - Date.now()) / 1000)
      ));

      try {
        const res = await axiosClient.post("/submissions", {
          examId: Number(id),
          answers: currentState.answers,
          timeSpentSeconds: timeSpent,
        });
        const submissionId = res.data.data.submissionId;
        resetExamSession();
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
    [id, navigate, resetExamSession]
  );

  useEffect(() => {
    if (loading || !activeExam || questions.length === 0) return;

    const interval = setInterval(() => {
      tickTimer();
      const currentRem = useExamStore.getState().remainingSeconds;
      if (currentRem <= 0) {
        clearInterval(interval);
        handleFinalSubmit(true);
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
  const isTimeUrgent = remainingSeconds <= 180;

  const options = [
    { key: "A", text: currentQuestion.option_a },
    { key: "B", text: currentQuestion.option_b },
    { key: "C", text: currentQuestion.option_c },
    { key: "D", text: currentQuestion.option_d },
  ];

  return (
    <div className="exam-room-shell">

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

        <div className="exam-progress-bar-wrap">
          <div className="exam-progress-track">
            <div
              className="exam-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

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

      <div className="exam-room-body container">

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

          <div className="options-grid">
            {options.map((opt) => {
              const selected = answers[currentQuestion.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={`option-choice-card ${selected ? "selected" : ""}`}
                  disabled={submitting || remainingSeconds <= 0}
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
            disabled={submitting}
            onClick={() => setShowConfirmModal(true)}
          >
            📤 Hoàn thành & Nộp bài
          </button>
        </aside>
      </div>

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
