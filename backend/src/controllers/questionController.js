import { pool } from "../config/db.js";
import { isText, validateQuestion } from "../utils/validation.js";

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

export async function createSubject(req, res, next) {
  try {
    const { code, name, description } = req.body;
    if (!isText(code, 30) || !isText(name, 150) || typeof (description ?? "") !== "string") {
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

export async function updateSubject(req, res, next) {
  try {
    const { id } = req.params;
    const { code, name, description } = req.body;
    if (!isText(code, 30) || !isText(name, 150) || typeof (description ?? "") !== "string") {
      return res.status(400).json({
        success: false,
        message: "Mã môn học và tên môn học không được để trống.",
      });
    }

    const [used] = await pool.query(
      "SELECT sub.id FROM submissions sub JOIN exams e ON sub.exam_id = e.id WHERE e.subject_id = ? LIMIT 1", [id]
    );
    if (used.length) return res.status(409).json({ success: false, message: "Môn học đã có kết quả thi nên không thể sửa." });
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

export async function deleteSubject(req, res, next) {
  try {
    const { id } = req.params;
    const [children] = await pool.query(
      "SELECT (SELECT COUNT(*) FROM questions WHERE subject_id = ?) + (SELECT COUNT(*) FROM exams WHERE subject_id = ?) AS total", [id, id]
    );
    if (Number(children[0].total) > 0) {
      return res.status(409).json({ success: false, message: "Chỉ xóa được môn học chưa có câu hỏi và đề thi." });
    }
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

    const message = validateQuestion(req.body);
    if (message) return res.status(400).json({ success: false, message });
    const [subjects] = await pool.query("SELECT id FROM subjects WHERE id = ?", [Number(subjectId)]);
    if (!subjects.length) return res.status(400).json({ success: false, message: "Môn học không tồn tại." });

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

export async function updateQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const [linked] = await pool.query("SELECT id FROM exam_questions WHERE question_id = ? LIMIT 1", [id]);
    if (linked.length) {
      return res.status(409).json({ success: false, message: "Câu hỏi đang thuộc đề thi nên không thể sửa/xóa. Hãy tạo câu hỏi mới hoặc gỡ khỏi đề chưa có bài nộp." });
    }
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

    const message = validateQuestion(req.body);
    if (message) return res.status(400).json({ success: false, message });
    const [subjects] = await pool.query("SELECT id FROM subjects WHERE id = ?", [Number(subjectId)]);
    if (!subjects.length) return res.status(400).json({ success: false, message: "Môn học không tồn tại." });

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

export async function deleteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const [linked] = await pool.query("SELECT id FROM exam_questions WHERE question_id = ? LIMIT 1", [id]);
    if (linked.length) {
      return res.status(409).json({ success: false, message: "Câu hỏi đang thuộc đề thi nên không thể sửa/xóa. Hãy tạo câu hỏi mới hoặc gỡ khỏi đề chưa có bài nộp." });
    }
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
