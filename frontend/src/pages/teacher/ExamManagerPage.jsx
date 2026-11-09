import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

const emptyExam = {
  subjectId: "",
  title: "",
  description: "",
  durationMinutes: 25,
  passScore: 5.0,
  isPublished: 1,
  questionIds: [],
};

export default function ExamManagerPage() {
  const [activeTab, setActiveTab] = useState("EXAMS"); // "EXAMS" | "RESULTS"
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [form, setForm] = useState(emptyExam);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [exRes, subRes, qRes, sumRes] = await Promise.all([
        axiosClient.get("/exams"),
        axiosClient.get("/subjects"),
        axiosClient.get("/questions"),
        axiosClient.get("/submissions"),
      ]);
      const subList = subRes.data.data || [];
      setExams(exRes.data.data || []);
      setSubjects(subList);
      setQuestions(qRes.data.data || []);
      setSubmissions(sumRes.data.data || []);

      if (subList.length > 0 && !form.subjectId) {
        setForm((prev) => ({ ...prev, subjectId: subList[0].id }));
      }
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Lỗi tải dữ liệu quản lý đề thi.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Lọc câu hỏi trong ngân hàng khớp với môn học đang chọn
  const availableQuestions = questions.filter(
    (q) => Number(q.subject_id) === Number(form.subjectId)
  );

  const toggleSelectQuestion = (qId) => {
    setForm((prev) => {
      const exists = prev.questionIds.includes(qId);
      return {
        ...prev,
        questionIds: exists
          ? prev.questionIds.filter((id) => id !== qId)
          : [...prev.questionIds, qId],
      };
    });
  };

  const selectAllSubjectQuestions = () => {
    const allIds = availableQuestions.map((q) => q.id);
    setForm((prev) => ({ ...prev, questionIds: allIds }));
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    setNotice({ type: "", text: "" });

    if (form.questionIds.length === 0) {
      setNotice({
        type: "error",
        text: "⚠️ Vui lòng tích chọn ít nhất 1 câu hỏi cho đề thi!",
      });
      return;
    }

    try {
      if (editingId) {
        await axiosClient.put(`/exams/${editingId}`, form);
        setNotice({ type: "success", text: "✅ Cập nhật đề thi thành công!" });
      } else {
        await axiosClient.post("/exams", form);
        setNotice({ type: "success", text: "✅ Tạo đề thi mới thành công!" });
      }
      setEditingId(null);
      setForm({ ...emptyExam, subjectId: subjects[0]?.id || "" });
      loadData();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Không thể lưu đề thi.",
      });
    }
  };

  const handleEditExam = async (exam) => {
    try {
      const res = await axiosClient.get(`/exams/${exam.id}`);
      const detail = res.data.data;
      setEditingId(detail.id);
      setForm({
        subjectId: detail.subject_id,
        title: detail.title,
        description: detail.description || "",
        durationMinutes: detail.duration_minutes,
        passScore: detail.pass_score,
        isPublished: detail.is_published,
        questionIds: (detail.questions || []).map((q) => q.id),
      });
      setActiveTab("EXAMS");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      alert("Không thể tải chi tiết đề thi để chỉnh sửa.");
    }
  };

  const handleDeleteExam = async (exam) => {
    if (!window.confirm(`Xóa đề thi "${exam.title}"?`)) return;
    try {
      await axiosClient.delete(`/exams/${exam.id}`);
      setNotice({ type: "success", text: "🗑️ Đã xóa đề thi thành công!" });
      loadData();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Không thể xóa đề thi.",
      });
    }
  };

  const handleDeleteSubmission = async (id) => {
    if (!window.confirm("Bạn muốn xóa kết quả bài thi này?")) return;
    try {
      await axiosClient.delete(`/submissions/${id}`);
      setNotice({ type: "success", text: "🗑️ Đã xóa lượt nộp bài!" });
      loadData();
    } catch (err) {
      setNotice({ type: "error", text: "Không thể xóa kết quả." });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <span className="section-badge">QUẢN LÝ ĐỀ THI & THỐNG KÊ ĐIỂM</span>
          <h1>Quản lý Đề thi & Kết quả Sinh viên</h1>
          <p>
            Thiết lập cấu trúc đề thi từ ngân hàng câu hỏi và theo dõi bảng điểm
            của toàn bộ sinh viên.
          </p>
        </div>

        <div className="tab-switcher">
          <button
            type="button"
            className={`tab-btn ${activeTab === "EXAMS" ? "active" : ""}`}
            onClick={() => setActiveTab("EXAMS")}
          >
            ⚙️ Quản lý Đề thi ({exams.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "RESULTS" ? "active" : ""}`}
            onClick={() => setActiveTab("RESULTS")}
          >
            📊 Bảng điểm Sinh viên ({submissions.length})
          </button>
        </div>
      </div>

      {notice.text && (
        <div
          className={`alert-box ${
            notice.type === "error" ? "alert-error" : "alert-success"
          }`}
        >
          {notice.text}
        </div>
      )}

      {activeTab === "EXAMS" ? (
        <>
          {/* FORM TẠO / CẬP NHẬT ĐỀ THI */}
          <section className="panel-card">
            <div className="panel-header">
              <h2>
                {editingId
                  ? `✏️ Chỉnh sửa Đề thi #${editingId}`
                  : "➕ Tạo Đề thi Trắc nghiệm Mới"}
              </h2>
            </div>

            <form onSubmit={handleSaveExam} className="admin-form">
              <div className="form-row-2">
                <div className="form-field">
                  <label>Học phần / Môn học *</label>
                  <select
                    value={form.subjectId}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        subjectId: Number(e.target.value),
                        questionIds: [],
                      }))
                    }
                    required
                  >
                    <option value="">-- Chọn môn học --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Tiêu đề đề thi *</label>
                  <input
                    type="text"
                    placeholder="VD: Đề thi Giữa kỳ Lập trình Web - Ca 1"
                    value={form.title}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, title: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-field">
                  <label>Thời gian làm bài (Phút) *</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        durationMinutes: Number(e.target.value),
                      }))
                    }
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Điểm chuẩn Đạt (Thang 10)</label>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    max={10}
                    value={form.passScore}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        passScore: Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Trạng thái xuất bản</label>
                  <select
                    value={form.isPublished}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        isPublished: Number(e.target.value),
                      }))
                    }
                  >
                    <option value={1}>🟢 Mở thi công khai (Published)</option>
                    <option value={0}>🔒 Bản nháp tạm khóa (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Mô tả / Ghi chú quy chế đề thi</label>
                <input
                  type="text"
                  placeholder="Nhập mô tả ngắn gọn cho đề thi..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>

              {/* CHỌN CÂU HỎI TỪ NGÂN HÀNG ĐƯA VÀO ĐỀ */}
              <div className="question-picker-box">
                <div className="picker-header">
                  <strong>
                    📋 Chọn câu hỏi đưa vào đề ({form.questionIds.length} /{" "}
                    {availableQuestions.length} câu đã chọn)
                  </strong>
                  <button
                    type="button"
                    className="btn-sm edit"
                    onClick={selectAllSubjectQuestions}
                  >
                    ✓ Chọn tất cả câu hỏi môn này
                  </button>
                </div>

                {availableQuestions.length === 0 ? (
                  <p className="sub-text">
                    Môn học này chưa có câu hỏi nào. Hãy sang mục Ngân hàng câu
                    hỏi để thêm trước.
                  </p>
                ) : (
                  <div className="picker-list">
                    {availableQuestions.map((q) => {
                      const checked = form.questionIds.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className={`picker-item ${checked ? "checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectQuestion(q.id)}
                          />
                          <span className="picker-q-text">
                            <strong>#{q.id}:</strong> {q.content}
                          </span>
                          <span className="picker-q-ans">
                            Đáp án: {q.correct_answer}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="form-actions-right">
                {editingId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingId(null);
                      setForm({
                        ...emptyExam,
                        subjectId: subjects[0]?.id || "",
                      });
                    }}
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
                <button type="submit" className="btn-primary">
                  {editingId ? "💾 Lưu cập nhật Đề thi" : "➕ Xuất bản Đề thi mới"}
                </button>
              </div>
            </form>
          </section>

          {/* BẢNG DANH SÁCH ĐỀ THI */}
          <section className="panel-card">
            <div className="panel-header">
              <h2>Danh sách Đề thi trong hệ thống ({exams.length})</h2>
            </div>

            {loading ? (
              <div className="loading-box">Đang tải...</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã môn</th>
                      <th>Tên đề thi</th>
                      <th>Thời lượng</th>
                      <th>Số câu</th>
                      <th>Lượt nộp</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((ex) => (
                      <tr key={ex.id}>
                        <td>
                          <span className="code-badge">{ex.subject_code}</span>
                        </td>
                        <td>
                          <strong>{ex.title}</strong>
                          <div className="sub-text">{ex.subject_name}</div>
                        </td>
                        <td>{ex.duration_minutes} phút</td>
                        <td>{ex.question_count} câu</td>
                        <td>{ex.submission_count} lượt</td>
                        <td>
                          <span
                            className={`status-tag ${
                              ex.is_published ? "pass" : "draft"
                            }`}
                          >
                            {ex.is_published ? "Đang mở" : "Bản nháp"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="action-btn-group">
                            <button
                              type="button"
                              className="btn-sm edit"
                              onClick={() => handleEditExam(ex)}
                            >
                              Sửa đề
                            </button>
                            <button
                              type="button"
                              className="btn-sm delete"
                              onClick={() => handleDeleteExam(ex)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        /* TAB BẢNG ĐIỂM & THỐNG KÊ SINH VIÊN */
        <section className="panel-card">
          <div className="panel-header">
            <h2>Bảng điểm toàn bộ lượt thi của Sinh viên ({submissions.length})</h2>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã SV</th>
                  <th>Họ tên Sinh viên</th>
                  <th>Đề thi & Môn học</th>
                  <th>Số câu đúng</th>
                  <th>Điểm số</th>
                  <th>Thời gian nộp</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => {
                  const score = Number(sub.score);
                  return (
                    <tr key={sub.id}>
                      <td>
                        <span className="code-badge">
                          {sub.student_code || "SV"}
                        </span>
                      </td>
                      <td>
                        <strong>{sub.student_name}</strong>
                        <div className="sub-text">{sub.student_email}</div>
                      </td>
                      <td>
                        <strong>{sub.exam_title}</strong>
                        <div className="sub-text">
                          {sub.subject_code} • {sub.subject_name}
                        </div>
                      </td>
                      <td>
                        {sub.correct_count} / {sub.total_questions} câu
                      </td>
                      <td>
                        <span
                          className={`score-pill ${
                            score >= 8 ? "high" : score >= 5 ? "medium" : "low"
                          }`}
                        >
                          {score.toFixed(2)} / 10
                        </span>
                      </td>
                      <td>
                        {new Date(sub.submitted_at).toLocaleString("vi-VN")}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-btn-group">
                          <Link
                            to={`/results/${sub.id}`}
                            className="btn-sm edit"
                          >
                            Xem bài
                          </Link>
                          <button
                            type="button"
                            className="btn-sm delete"
                            onClick={() => handleDeleteSubmission(sub.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
