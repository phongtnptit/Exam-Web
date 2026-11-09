import { pool } from "../config/db.js";

/**
 * GET /api/subjects - Lấy danh sách môn học kèm số lượng câu hỏi & đề thi
 */
export async function getSubjects(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM questions q WHERE q.subject_id = s.id) AS question_count,
        (SELECT COUNT(*) FROM exams e WHERE e.subject_id = s.id) AS exam_count
      FROM subjects s
      ORDER BY s.id ASC
    `);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/subjects - Thêm môn học mới (Giảng viên)
 */
export async function createSubject(req, res, next) {
  try {
    const { code, name, description } = req.body;
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: "Mã môn học và tên môn học không được để trống.",
      });
    }

    const [existing] = await pool.query(
      "SELECT id FROM subjects WHERE code = ?",
      [code.trim().toUpperCase()]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Mã môn học này đã tồn tại.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO subjects (code, name, description, created_by) VALUES (?, ?, ?, ?)`,
      [code.trim().toUpperCase(), name.trim(), description || "", req.user.id]
    );

    return res.status(201).json({
      success: true,
      message: "Tạo môn học mới thành công!",
      data: {
        id: result.insertId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description || "",
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/subjects/:id - Cập nhật môn học (Giảng viên)
 */
export async function updateSubject(req, res, next) {
  try {
    const { id } = req.params;
    const { code, name, description } = req.body;
    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: "Mã môn học và tên môn học không được để trống.",
      });
    }

    const [result] = await pool.query(
      `UPDATE subjects SET code = ?, name = ?, description = ? WHERE id = ?`,
      [code.trim().toUpperCase(), name.trim(), description || "", id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy môn học cần cập nhật.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật môn học thành công!",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/subjects/:id - Xóa môn học (Giảng viên)
 */
export async function deleteSubject(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM subjects WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy môn học cần xóa.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa môn học thành công!",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/questions - Lấy danh sách ngân hàng câu hỏi (lọc theo subjectId, difficulty, search)
 */
export async function getQuestions(req, res, next) {
  try {
    const { subjectId, difficulty, search } = req.query;
    let sql = `
      SELECT q.*, s.name AS subject_name, s.code AS subject_code
      FROM questions q
      INNER JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (subjectId) {
      sql += " AND q.subject_id = ?";
      params.push(Number(subjectId));
    }
    if (difficulty) {
      sql += " AND q.difficulty = ?";
      params.push(difficulty);
    }
    if (search) {
      sql += " AND q.content LIKE ?";
      params.push(`%${search.trim()}%`);
    }

    sql += " ORDER BY q.id DESC";

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
 * POST /api/questions - Thêm câu hỏi mới vào ngân hàng (Giảng viên)
 */
export async function createQuestion(req, res, next) {
  try {
    const {
      subjectId,
      content,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      difficulty = "MEDIUM",
      explanation = "",
    } = req.body;

    if (!subjectId || !content || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ môn học, nội dung câu hỏi, 4 phương án A/B/C/D và đáp án đúng.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO questions 
        (subject_id, content, option_a, option_b, option_c, option_d, correct_answer, difficulty, explanation, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(subjectId),
        content.trim(),
        optionA.trim(),
        optionB.trim(),
        optionC.trim(),
        optionD.trim(),
        correctAnswer,
        difficulty,
        explanation.trim(),
        req.user.id,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Thêm câu hỏi vào ngân hàng thành công!",
      data: { id: result.insertId },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/questions/:id - Cập nhật câu hỏi (Giảng viên)
 */
export async function updateQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const {
      subjectId,
      content,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      difficulty = "MEDIUM",
      explanation = "",
    } = req.body;

    if (!subjectId || !content || !optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin câu hỏi và 4 phương án.",
      });
    }

    const [result] = await pool.query(
      `UPDATE questions
       SET subject_id = ?, content = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?,
           correct_answer = ?, difficulty = ?, explanation = ?
       WHERE id = ?`,
      [
        Number(subjectId),
        content.trim(),
        optionA.trim(),
        optionB.trim(),
        optionC.trim(),
        optionD.trim(),
        correctAnswer,
        difficulty,
        explanation.trim(),
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy câu hỏi cần cập nhật.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật câu hỏi thành công!",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/questions/:id - Xóa câu hỏi khỏi ngân hàng (Giảng viên)
 */
export async function deleteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM questions WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy câu hỏi cần xóa.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa câu hỏi khỏi ngân hàng!",
    });
  } catch (error) {
    next(error);
  }
}
