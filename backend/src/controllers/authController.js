import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { isText } from "../utils/validation.js";

function signUserToken(user) {
  const secret = process.env.JWT_SECRET;
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

export async function register(req, res, next) {
  try {
    const { fullName, email, password, studentCode = "" } = req.body;

    if (!isText(fullName, 120) || !isText(email, 150) || typeof password !== "string" || typeof studentCode !== "string" || studentCode.trim().length > 30) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Email không hợp lệ." });
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

    const validRole = "STUDENT";
    const defaultCode = studentCode.trim() || `SV${Date.now()}`;

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

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!isText(email, 150) || typeof password !== "string" || !password) {
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
