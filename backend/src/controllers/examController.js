import { pool } from "../config/db.js";
import { validateExam } from "../utils/validation.js";

export async function getExams(req, res, next) {
  try {
    const { subjectId, search, publishedOnly } = req.query;

    let sql = `
      SELECT
        e.*,
        s.name AS subject_name,
        s.code AS subject_code,
        u.full_name AS teacher_name,
        (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = e.id) AS question_count,
        (SELECT COUNT(*) FROM submissions sub WHERE sub.exam_id = e.id) AS submission_count
      FROM exams e
      INNER JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (publishedOnly === "true" || req.user?.role === "STUDENT") {
      sql += " AND e.is_published = 1";
    }
    if (subjectId) {
      sql += " AND e.subject_id = ?";
      params.push(Number(subjectId));
    }
    if (search) {
      sql += " AND (e.title LIKE ? OR s.name LIKE ?)";
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    sql += " ORDER BY e.id DESC";

    const [rows] = await pool.query(sql, params);
    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function getExamById(req, res, next) {
  try {
    const { id } = req.params;
    const { mode } = req.query;

    const [examRows] = await pool.query(
      `
      SELECT
        e.*,
        s.name AS subject_name,
        s.code AS subject_code,
        u.full_name AS teacher_name
      FROM exams e
      INNER JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
      `,
      [id]
    );

    if (examRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi này.",
      });
    }

    const exam = examRows[0];
    if (req.user.role === "STUDENT" && !exam.is_published) {
      return res.status(403).json({ success: false, message: "Đề thi này chưa được mở." });
    }

    const [questionRows] = await pool.query(
      `
      SELECT
        q.id,
        q.subject_id,
        q.content,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.difficulty,
        q.correct_answer,
        q.explanation,
        eq.order_index
      FROM exam_questions eq
      INNER JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      ORDER BY eq.order_index ASC, q.id ASC
      `,
      [id]
    );

    const isStudentTaking = req.user?.role === "STUDENT" || mode === "take";
    const formattedQuestions = questionRows.map((q) => {
      if (isStudentTaking) {
        return {
          id: q.id,
          subject_id: q.subject_id,
          content: q.content,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          difficulty: q.difficulty,
          order_index: q.order_index,
        };
      }
      return q;
    });

    return res.status(200).json({
      success: true,
      data: {
        ...exam,
        questions: formattedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createExam(req, res, next) {
  return saveExam(req, res, next, false);
}

export async function updateExam(req, res, next) {
  return saveExam(req, res, next, true);
}

async function saveExam(req, res, next, isUpdate) {
  let connection;
  try {
    const message = validateExam(req.body);
    if (message) return res.status(400).json({ success: false, message });
    const { subjectId, title, description = "", durationMinutes, passScore, isPublished, questionIds } = req.body;
    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (isUpdate) {
      const [exams] = await connection.query("SELECT id FROM exams WHERE id = ? FOR UPDATE", [req.params.id]);
      if (!exams.length) throw Object.assign(new Error("Không tìm thấy đề thi."), { statusCode: 404 });
      const [submissions] = await connection.query("SELECT id FROM submissions WHERE exam_id = ? LIMIT 1", [req.params.id]);
      if (submissions.length) throw Object.assign(new Error("Đề đã có bài nộp nên không thể sửa. Hãy tạo đề mới."), { statusCode: 409 });
    }

    const [subjects] = await connection.query("SELECT id FROM subjects WHERE id = ?", [Number(subjectId)]);
    if (!subjects.length) throw Object.assign(new Error("Môn học không tồn tại."), { statusCode: 400 });
    const [questions] = await connection.query(
      "SELECT id FROM questions WHERE subject_id = ? AND id IN (?) FOR UPDATE",
      [Number(subjectId), questionIds.map(Number)]
    );
    if (questions.length !== questionIds.length) {
      throw Object.assign(new Error("Tất cả câu hỏi phải tồn tại và thuộc môn học đã chọn."), { statusCode: 400 });
    }

    const values = [Number(subjectId), title.trim(), description.trim(), Number(durationMinutes), Number(passScore), isPublished ? 1 : 0];
    let examId = req.params.id;
    if (isUpdate) {
      await connection.query(
        "UPDATE exams SET subject_id = ?, title = ?, description = ?, duration_minutes = ?, pass_score = ?, is_published = ? WHERE id = ?",
        [...values, examId]
      );
      await connection.query("DELETE FROM exam_questions WHERE exam_id = ?", [examId]);
    } else {
      const [result] = await connection.query(
        "INSERT INTO exams (subject_id, title, description, duration_minutes, pass_score, is_published, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [...values, req.user.id]
      );
      examId = result.insertId;
    }
    for (const [index, questionId] of questionIds.entries()) {
      await connection.query(
        "INSERT INTO exam_questions (exam_id, question_id, order_index) VALUES (?, ?, ?)",
        [examId, Number(questionId), index + 1]
      );
    }
    await connection.commit();
    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? "Cập nhật đề thi thành công!" : "Tạo đề thi thành công!",
      data: { id: Number(examId) },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally {
    if (connection) connection.release();
  }
}

export async function deleteExam(req, res, next) {
  try {
    const { id } = req.params;
    const [used] = await pool.query("SELECT id FROM submissions WHERE exam_id = ? LIMIT 1", [id]);
    if (used.length) return res.status(409).json({ success: false, message: "Đề đã có bài nộp nên không thể xóa." });
    const [result] = await pool.query("DELETE FROM exams WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi cần xóa.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa đề thi thành công!",
    });
  } catch (error) {
    next(error);
  }
}
