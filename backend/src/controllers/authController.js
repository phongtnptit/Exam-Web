import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

function signUserToken(user) {
  const secret = process.env.JWT_SECRET || "ptit_online_exam_secret_key_2026";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      studentCode: user.student_code,
    },
    secret,
    { expiresIn }
  );
}

/**
 * POST /api/auth/register - Đăng ký tài khoản mới
 */
export async function register(req, res, next) {
  try {
    const { fullName, email, password, role = "STUDENT", studentCode = "" } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có tối thiểu 6 ký tự.",
      });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email.trim().toLowerCase(),
    ]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email này đã được đăng ký trong hệ thống.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const validRole = role === "TEACHER" ? "TEACHER" : "STUDENT";
    const defaultCode =
      studentCode.trim() ||
      (validRole === "TEACHER"
        ? `GV${Math.floor(100 + Math.random() * 900)}`
        : `B22DCCN${Math.floor(100 + Math.random() * 900)}`);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, student_code)
       VALUES (?, ?, ?, ?, ?)`,
      [fullName.trim(), email.trim().toLowerCase(), passwordHash, validRole, defaultCode]
    );

    const newUser = {
      id: result.insertId,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: validRole,
      student_code: defaultCode,
    };

    const token = signUserToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      data: {
        token,
        user: {
          id: newUser.id,
          fullName: newUser.full_name,
          email: newUser.email,
          role: newUser.role,
          studentCode: newUser.student_code,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login - Đăng nhập nhận JWT Token
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ email và mật khẩu.",
      });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email.trim().toLowerCase(),
    ]);
    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    const token = signUserToken(user);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          studentCode: user.student_code,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me - Lấy thông tin người dùng hiện tại từ JWT
 */
export async function getMe(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, student_code, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng.",
      });
    }

    const u = rows[0];
    return res.status(200).json({
      success: true,
      data: {
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        studentCode: u.student_code,
        createdAt: u.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}
