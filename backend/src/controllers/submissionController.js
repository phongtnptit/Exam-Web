import { pool } from "../config/db.js";

/**
 * POST /api/submissions - Nộp bài thi & Chấm điểm tự động trên Server
 */
export async function submitExam(req, res, next) {
  try {
    const { examId, answers = {}, timeSpentSeconds = 0 } = req.body;
    if (!examId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã đề thi (examId).",
      });
    }

    // Lấy toàn bộ câu hỏi và đáp án đúng của đề thi từ MySQL
    const [questions] = await pool.query(
      `
      SELECT q.id, q.correct_answer
      FROM exam_questions eq
      INNER JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      `,
      [Number(examId)]
    );

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Đề thi chưa có câu hỏi nào để chấm điểm.",
      });
    }

    let correctCount = 0;
    const totalQuestions = questions.length;

    for (const q of questions) {
      const studentChoice = answers[q.id] || answers[String(q.id)];
      if (studentChoice && studentChoice === q.correct_answer) {
        correctCount++;
      }
    }

    const score = Number(((correctCount / totalQuestions) * 10).toFixed(2));

    const [result] = await pool.query(
      `INSERT INTO submissions 
        (exam_id, student_id, score, correct_count, total_questions, time_spent_seconds, answers_json)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(examId),
        req.user.id,
        score,
        correctCount,
        totalQuestions,
        Number(timeSpentSeconds) || 0,
        JSON.stringify(answers),
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Nộp bài thành công! Hệ thống đã chấm điểm tự động.",
      data: {
        submissionId: result.insertId,
        score,
        correctCount,
        totalQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/submissions/my-history - Lấy lịch sử làm bài của Sinh viên đang đăng nhập
 */
export async function getMySubmissions(req, res, next) {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        sub.*,
        e.title AS exam_title,
        e.duration_minutes,
        e.pass_score,
        s.name AS subject_name,
        s.code AS subject_code
      FROM submissions sub
      INNER JOIN exams e ON sub.exam_id = e.id
      INNER JOIN subjects s ON e.subject_id = s.id
      WHERE sub.student_id = ?
      ORDER BY sub.submitted_at DESC
      `,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/submissions/:id - Xem chi tiết 1 bài thi đã nộp kèm đáp án đúng & giải thích
 */
export async function getSubmissionDetail(req, res, next) {
  try {
    const { id } = req.params;

    const [subRows] = await pool.query(
      `
      SELECT 
        sub.*,
        e.title AS exam_title,
        e.duration_minutes,
        e.pass_score,
        s.name AS subject_name,
        s.code AS subject_code,
        u.full_name AS student_name,
        u.email AS student_email,
        u.student_code
      FROM submissions sub
      INNER JOIN exams e ON sub.exam_id = e.id
      INNER JOIN subjects s ON e.subject_id = s.id
      INNER JOIN users u ON sub.student_id = u.id
      WHERE sub.id = ?
      `,
      [id]
    );

    if (subRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kết quả bài thi này.",
      });
    }

    const submission = subRows[0];

    // Chỉ cho phép chính sinh viên đó hoặc giảng viên xem
    if (req.user.role === "STUDENT" && submission.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem bài thi của sinh viên khác.",
      });
    }

    const [questions] = await pool.query(
      `
      SELECT 
        q.id,
        q.content,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.difficulty,
        q.explanation,
        eq.order_index
      FROM exam_questions eq
      INNER JOIN questions q ON eq.question_id = q.id
      WHERE eq.exam_id = ?
      ORDER BY eq.order_index ASC, q.id ASC
      `,
      [submission.exam_id]
    );

    const parsedAnswers =
      typeof submission.answers_json === "string"
        ? JSON.parse(submission.answers_json || "{}")
        : submission.answers_json || {};

    const detailedQuestions = questions.map((q) => {
      const selectedOption = parsedAnswers[q.id] || parsedAnswers[String(q.id)] || null;
      return {
        ...q,
        selected_option: selectedOption,
        is_correct: selectedOption === q.correct_answer,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        ...submission,
        questions: detailedQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/submissions - Lấy toàn bộ kết quả & thống kê cho Giảng viên
 */
export async function getAllSubmissions(req, res, next) {
  try {
    const { examId } = req.query;
    let sql = `
      SELECT 
        sub.*,
        e.title AS exam_title,
        e.pass_score,
        s.name AS subject_name,
        s.code AS subject_code,
        u.full_name AS student_name,
        u.email AS student_email,
        u.student_code
      FROM submissions sub
      INNER JOIN exams e ON sub.exam_id = e.id
      INNER JOIN subjects s ON e.subject_id = s.id
      INNER JOIN users u ON sub.student_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (examId) {
      sql += " AND sub.exam_id = ?";
      params.push(Number(examId));
    }

    sql += " ORDER BY sub.submitted_at DESC";

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
 * DELETE /api/submissions/:id - Xóa một lượt kết quả thi (Giảng viên)
 */
export async function deleteSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM submissions WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi kết quả cần xóa.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Đã xóa kết quả thi thành công!",
    });
  } catch (error) {
    next(error);
  }
}
