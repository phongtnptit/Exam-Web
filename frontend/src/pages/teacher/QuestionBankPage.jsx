import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";

const emptyQuestion = {
  subjectId: "",
  content: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A",
  difficulty: "MEDIUM",
  explanation: "",
};

const emptySubject = {
  code: "",
  name: "",
  description: "",
};

export default function QuestionBankPage() {
  const [activeTab, setActiveTab] = useState("QUESTIONS"); // "QUESTIONS" | "SUBJECTS"
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bộ lọc câu hỏi
  const [filterSubject, setFilterSubject] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // Form Câu hỏi (Thêm / Sửa)
  const [qForm, setQForm] = useState(emptyQuestion);
  const [editingQId, setEditingQId] = useState(null);

  // Form Môn học (Thêm / Sửa)
  const [sForm, setSForm] = useState(emptySubject);
  const [editingSId, setEditingSId] = useState(null);

  const [notice, setNotice] = useState({ type: "", text: "" });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [subRes, qRes] = await Promise.all([
        axiosClient.get("/subjects"),
        axiosClient.get("/questions"),
      ]);
      const subList = subRes.data.data || [];
      setSubjects(subList);
      setQuestions(qRes.data.data || []);
      if (subList.length > 0 && !qForm.subjectId) {
        setQForm((prev) => ({ ...prev, subjectId: subList[0].id }));
      }
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Lỗi tải ngân hàng câu hỏi.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ============================================================================
  // XỬ LÝ CRUD CÂU HỎI
  // ============================================================================
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    setNotice({ type: "", text: "" });
    try {
      if (editingQId) {
        await axiosClient.put(`/questions/${editingQId}`, qForm);
        setNotice({ type: "success", text: "✅ Cập nhật câu hỏi thành công!" });
      } else {
        await axiosClient.post("/questions", qForm);
        setNotice({
          type: "success",
          text: "✅ Đã thêm câu hỏi mới vào ngân hàng!",
        });
      }
      setEditingQId(null);
      setQForm({ ...emptyQuestion, subjectId: subjects[0]?.id || "" });
      loadAll();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Không thể lưu câu hỏi.",
      });
    }
  };

  const handleEditQuestion = (q) => {
    setEditingQId(q.id);
    setQForm({
      subjectId: q.subject_id,
      content: q.content,
      optionA: q.option_a,
      optionB: q.option_b,
      optionC: q.option_c,
      optionD: q.option_d,
      correctAnswer: q.correct_answer,
      difficulty: q.difficulty || "MEDIUM",
      explanation: q.explanation || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa câu hỏi #${id}?`)) return;
    try {
      await axiosClient.delete(`/questions/${id}`);
      setNotice({ type: "success", text: "🗑️ Đã xóa câu hỏi khỏi ngân hàng!" });
      loadAll();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Lỗi xóa câu hỏi.",
      });
    }
  };

  // ============================================================================
  // XỬ LÝ CRUD MÔN HỌC
  // ============================================================================
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setNotice({ type: "", text: "" });
    try {
      if (editingSId) {
        await axiosClient.put(`/subjects/${editingSId}`, sForm);
        setNotice({ type: "success", text: "✅ Cập nhật môn học thành công!" });
      } else {
        await axiosClient.post("/subjects", sForm);
        setNotice({ type: "success", text: "✅ Tạo môn học mới thành công!" });
      }
      setEditingSId(null);
      setSForm(emptySubject);
      loadAll();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Lỗi lưu môn học.",
      });
    }
  };

  const handleEditSubject = (sub) => {
    setEditingSId(sub.id);
    setSForm({
      code: sub.code,
      name: sub.name,
      description: sub.description || "",
    });
  };

  const handleDeleteSubject = async (sub) => {
    if (
      !window.confirm(
        `Xóa môn học "${sub.name}" sẽ xóa toàn bộ câu hỏi và đề thi thuộc môn này. Tiếp tục?`
      )
    )
      return;
    try {
      await axiosClient.delete(`/subjects/${sub.id}`);
      setNotice({ type: "success", text: "🗑️ Đã xóa môn học thành công!" });
      loadAll();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.response?.data?.message || "Không thể xóa môn học.",
      });
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchSub = !filterSubject || Number(q.subject_id) === Number(filterSubject);
    const matchKey =
      !filterSearch ||
      q.content.toLowerCase().includes(filterSearch.trim().toLowerCase());
    return matchSub && matchKey;
  });

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <span className="section-badge">PHÂN HỆ GIẢNG VIÊN (CRUD)</span>
          <h1>Quản lý Học phần & Ngân hàng Câu hỏi</h1>
          <p>
            Biên soạn câu hỏi trắc nghiệm 4 lựa chọn, phân loại mức độ khó và
            quản lý danh mục môn học.
          </p>
        </div>

        <div className="tab-switcher">
          <button
            type="button"
            className={`tab-btn ${activeTab === "QUESTIONS" ? "active" : ""}`}
            onClick={() => setActiveTab("QUESTIONS")}
          >
            📝 Ngân hàng câu hỏi ({questions.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "SUBJECTS" ? "active" : ""}`}
            onClick={() => setActiveTab("SUBJECTS")}
          >
            🏷️ Danh mục Môn học ({subjects.length})
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

      {activeTab === "QUESTIONS" ? (
        <>
          {/* FORM THÊM / SỬA CÂU HỎI */}
          <section className="panel-card">
            <div className="panel-header">
              <h2>
                {editingQId
                  ? `✏️ Chỉnh sửa câu hỏi #${editingQId}`
                  : "➕ Thêm câu hỏi mới vào Ngân hàng đề"}
              </h2>
            </div>

            <form onSubmit={handleSaveQuestion} className="admin-form">
              <div className="form-row-3">
                <div className="form-field">
                  <label>Môn học *</label>
                  <select
                    value={qForm.subjectId}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, subjectId: e.target.value }))
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
                  <label>Đáp án đúng *</label>
                  <select
                    value={qForm.correctAnswer}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, correctAnswer: e.target.value }))
                    }
                  >
                    <option value="A">Đáp án A</option>
                    <option value="B">Đáp án B</option>
                    <option value="C">Đáp án C</option>
                    <option value="D">Đáp án D</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Độ khó *</label>
                  <select
                    value={qForm.difficulty}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, difficulty: e.target.value }))
                    }
                  >
                    <option value="EASY">Dễ (Easy)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="HARD">Khó (Hard)</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Nội dung câu hỏi *</label>
                <textarea
                  rows={3}
                  placeholder="Nhập câu hỏi trắc nghiệm..."
                  value={qForm.content}
                  onChange={(e) =>
                    setQForm((p) => ({ ...p, content: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-field">
                  <label>Phương án A *</label>
                  <input
                    type="text"
                    placeholder="Nội dung đáp án A"
                    value={qForm.optionA}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, optionA: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Phương án B *</label>
                  <input
                    type="text"
                    placeholder="Nội dung đáp án B"
                    value={qForm.optionB}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, optionB: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Phương án C *</label>
                  <input
                    type="text"
                    placeholder="Nội dung đáp án C"
                    value={qForm.optionC}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, optionC: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Phương án D *</label>
                  <input
                    type="text"
                    placeholder="Nội dung đáp án D"
                    value={qForm.optionD}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, optionD: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Giải thích đáp án (Hiển thị sau khi sinh viên nộp bài)</label>
                <input
                  type="text"
                  placeholder="Giải thích ngắn gọn lý do chọn đáp án đúng..."
                  value={qForm.explanation}
                  onChange={(e) =>
                    setQForm((p) => ({ ...p, explanation: e.target.value }))
                  }
                />
              </div>

              <div className="form-actions-right">
                {editingQId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingQId(null);
                      setQForm({
                        ...emptyQuestion,
                        subjectId: subjects[0]?.id || "",
                      });
                    }}
                  >
                    Hủy sửa
                  </button>
                )}
                <button type="submit" className="btn-primary">
                  {editingQId ? "💾 Lưu cập nhật" : "➕ Thêm vào Ngân hàng câu hỏi"}
                </button>
              </div>
            </form>
          </section>

          {/* DANH SÁCH NGÂN HÀNG CÂU HỎI */}
          <section className="panel-card">
            <div className="panel-header-flex">
              <h2>Danh sách câu hỏi ({filteredQuestions.length})</h2>
              <div className="inline-filters">
                <input
                  type="text"
                  placeholder="Tìm nội dung câu hỏi..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                />
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                >
                  <option value="">Tất cả môn học</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-box">Đang tải...</div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>ID</th>
                      <th style={{ width: "130px" }}>Môn học</th>
                      <th>Câu hỏi & 4 Phương án</th>
                      <th style={{ width: "90px" }}>Đáp án</th>
                      <th style={{ width: "160px", textAlign: "right" }}>
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map((q) => (
                      <tr key={q.id}>
                        <td>#{q.id}</td>
                        <td>
                          <span className="code-badge">{q.subject_code}</span>
                          <div className="sub-text">{q.subject_name}</div>
                        </td>
                        <td>
                          <strong>{q.content}</strong>
                          <div className="mini-options-row">
                            <span>A. {q.option_a}</span>
                            <span>B. {q.option_b}</span>
                            <span>C. {q.option_c}</span>
                            <span>D. {q.option_d}</span>
                          </div>
                        </td>
                        <td>
                          <span className="correct-badge">{q.correct_answer}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="action-btn-group">
                            <button
                              type="button"
                              className="btn-sm edit"
                              onClick={() => handleEditQuestion(q)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn-sm delete"
                              onClick={() => handleDeleteQuestion(q.id)}
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
        /* TAB QUẢN LÝ MÔN HỌC */
        <>
          <section className="panel-card">
            <div className="panel-header">
              <h2>
                {editingSId ? "✏️ Cập nhật Môn học" : "➕ Thêm Môn học mới"}
              </h2>
            </div>

            <form onSubmit={handleSaveSubject} className="admin-form">
              <div className="form-row-2">
                <div className="form-field">
                  <label>Mã học phần (VD: INT1434) *</label>
                  <input
                    type="text"
                    placeholder="INT1434"
                    value={sForm.code}
                    onChange={(e) =>
                      setSForm((p) => ({ ...p, code: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Tên môn học *</label>
                  <input
                    type="text"
                    placeholder="Lập trình Web"
                    value={sForm.name}
                    onChange={(e) =>
                      setSForm((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Mô tả học phần</label>
                <input
                  type="text"
                  placeholder="Mô tả tóm tắt nội dung môn học..."
                  value={sForm.description}
                  onChange={(e) =>
                    setSForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>

              <div className="form-actions-right">
                {editingSId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditingSId(null);
                      setSForm(emptySubject);
                    }}
                  >
                    Hủy
                  </button>
                )}
                <button type="submit" className="btn-primary">
                  {editingSId ? "💾 Lưu cập nhật" : "➕ Tạo môn học"}
                </button>
              </div>
            </form>
          </section>

          <section className="panel-card">
            <div className="panel-header">
              <h2>Danh sách các Môn học ({subjects.length})</h2>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã HP</th>
                    <th>Tên môn học</th>
                    <th>Mô tả</th>
                    <th>Số câu hỏi</th>
                    <th>Số đề thi</th>
                    <th style={{ textAlign: "right" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <span className="code-badge">{sub.code}</span>
                      </td>
                      <td>
                        <strong>{sub.name}</strong>
                      </td>
                      <td>{sub.description}</td>
                      <td>{sub.question_count} câu</td>
                      <td>{sub.exam_count} đề</td>
                      <td style={{ textAlign: "right" }}>
                        <div className="action-btn-group">
                          <button
                            type="button"
                            className="btn-sm edit"
                            onClick={() => handleEditSubject(sub)}
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            className="btn-sm delete"
                            onClick={() => handleDeleteSubject(sub)}
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
          </section>
        </>
      )}
    </div>
  );
}
