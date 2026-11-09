import { pool } from "../config/db.js";

/**
 * GET /api/exams - Lấy danh sách đề thi (kèm bộ lọc subjectId, search)
 */
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

/**
 * GET /api/exams/:id - Xem thông tin chi tiết đề thi (kèm danh sách câu hỏi)
 * Nếu người gọi là STUDENT đang vào phòng thi thì ẩn đáp án đúng (correct_answer)
 */
export async function getExamById(req, res, next) {
  try {
    const { id } = req.params;
    const { mode } = req.query; // mode=take -> không trả về correct_answer

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

/**
 * POST /api/exams - Tạo đề thi mới và gán danh sách câu hỏi (Giảng viên)
 */
export async function createExam(req, res, next) {
  try {
    const {
      subjectId,
      title,
      description = "",
      durationMinutes = 30,
      passScore = 5.0,
      isPublished = 1,
      questionIds = [],
    } = req.body;

    if (!subjectId || !title || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ môn học, tên đề thi và thời gian làm bài.",
      });
    }

    if (Number(durationMinutes) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Thời gian làm bài phải lớn hơn 0 phút.",
      });
    }

    const [examResult] = await pool.query(
      `INSERT INTO exams (subject_id, title, description, duration_minutes, pass_score, is_published, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(subjectId),
        title.trim(),
        description.trim(),
        Number(durationMinutes),
        Number(passScore),
        isPublished ? 1 : 0,
        req.user.id,
      ]
    );

    const examId = examResult.insertId;

    // Gán danh sách câu hỏi vào bảng trung gian exam_questions
    if (Array.isArray(questionIds) && questionIds.length > 0) {
      let order = 1;
      for (const qId of questionIds) {
        await pool.query(
          `INSERT IGNORE INTO exam_questions (exam_id, question_id, order_index) VALUES (?, ?, ?)`,
          [examId, Number(qId), order++]
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: "Tạo đề thi mới thành công!",
      data: { id: examId },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/exams/:id - Cập nhật thông tin đề thi và danh sách câu hỏi (Giảng viên)
 */
export async function updateExam(req, res, next) {
  try {
    const { id } = req.params;
    const {
      subjectId,
      title,
      description = "",
      durationMinutes = 30,
      passScore = 5.0,
      isPublished = 1,
      questionIds,
    } = req.body;

    if (!subjectId || !title || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ môn học, tên đề thi và thời gian làm bài.",
      });
    }

    const [result] = await pool.query(
      `UPDATE exams
       SET subject_id = ?, title = ?, description = ?, duration_minutes = ?, pass_score = ?, is_published = ?
       WHERE id = ?`,
      [
        Number(subjectId),
        title.trim(),
        description.trim(),
        Number(durationMinutes),
        Number(passScore),
        isPublished ? 1 : 0,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi cần cập nhật.",
      });
    }

    // Nếu gửi kèm mảng questionIds thì cập nhật lại danh sách câu hỏi của đề
    if (Array.isArray(questionIds)) {
      await pool.query("DELETE FROM exam_questions WHERE exam_id = ?", [id]);
      let order = 1;
      for (const qId of questionIds) {
        await pool.query(
          `INSERT IGNORE INTO exam_questions (exam_id, question_id, order_index) VALUES (?, ?, ?)`,
          [id, Number(qId), order++]
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật đề thi thành công!",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/exams/:id - Xóa đề thi (Giảng viên)
 */
export async function deleteExam(req, res, next) {
  try {
    const { id } = req.params;
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
