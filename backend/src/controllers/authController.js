import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import { isText } from "../utils/validation.js";
import { sendVerificationCode, isMailConfigured } from "../utils/mailer.js";
import {
  generateVerificationCode,
  hashVerificationCode,
  verificationExpiryDate,
  RESEND_COOLDOWN_SECONDS,
} from "../utils/verification.js";

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
      emailVerified: Boolean(user.email_verified),
    },
    secret,
    { expiresIn }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    studentCode: user.student_code,
    emailVerified: Boolean(user.email_verified),
  };
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

    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
      normalizedEmail,
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

    // Tai khoan moi chua xac minh email: tao ma 6 so, chi luu hash cua ma.
    const code = generateVerificationCode();
    const expiresAt = verificationExpiryDate();

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, student_code, email_verified, verification_code_hash, verification_expires, verification_sent_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, NOW())`,
      [fullName.trim(), normalizedEmail, passwordHash, validRole, defaultCode, hashVerificationCode(code), expiresAt]
    );

    // Gui ma qua Gmail. Neu chua cau hinh SMTP thi mailer chi in ma ra
    // console (che do dev), tai khoan van tao xong va co the gui lai ma sau.
    let emailSent = false;
    try {
      emailSent = await sendVerificationCode(normalizedEmail, fullName.trim(), code);
    } catch (mailError) {
      console.error("Không gửi được mã xác minh email:", mailError.message);
    }

    return res.status(201).json({
      success: true,
      message: emailSent
        ? "Đăng ký tài khoản thành công! Mã xác minh 6 số đã được gửi về email của bạn."
        : "Đăng ký tài khoản thành công! Chưa gửi được mã xác minh, vui lòng bấm Gửi lại mã.",
      data: {
        email: normalizedEmail,
        needsVerification: true,
        emailSent,
        mailConfigured: isMailConfigured(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const { email, code } = req.body;

    if (!isText(email, 150) || typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đúng mã xác minh 6 số.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      normalizedEmail,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với email này.",
      });
    }

    const user = rows[0];

    // Tai khoan da xac minh roi thi cap token luon (cho phep dang nhap).
    if (user.email_verified) {
      const token = signUserToken(user);
      return res.status(200).json({
        success: true,
        message: "Email đã được xác minh trước đó.",
        data: { token, user: publicUser(user) },
      });
    }

    if (
      !user.verification_code_hash ||
      !user.verification_expires ||
      new Date(user.verification_expires).getTime() < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        code: "CODE_EXPIRED",
        message: "Mã xác minh đã hết hạn. Vui lòng gửi lại mã mới.",
      });
    }

    if (hashVerificationCode(code.trim()) !== user.verification_code_hash) {
      return res.status(400).json({
        success: false,
        code: "CODE_INVALID",
        message: "Mã xác minh không đúng. Vui lòng kiểm tra lại.",
      });
    }

    await pool.query(
      `UPDATE users
       SET email_verified = 1, verification_code_hash = NULL,
           verification_expires = NULL, verification_sent_at = NULL
       WHERE id = ?`,
      [user.id]
    );

    const verifiedUser = { ...user, email_verified: 1 };
    const token = signUserToken(verifiedUser);

    return res.status(200).json({
      success: true,
      message: "Xác minh email thành công! Bạn đã có thể sử dụng tài khoản.",
      data: { token, user: publicUser(verifiedUser) },
    });
  } catch (error) {
    next(error);
  }
}

export async function resendCode(req, res, next) {
  try {
    const { email } = req.body;

    if (!isText(email, 150) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Email không hợp lệ." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      normalizedEmail,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với email này.",
      });
    }

    const user = rows[0];
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Tài khoản này đã xác minh email rồi, bạn có thể đăng nhập.",
      });
    }

    // Chong spam nut Gui lai: toi thieu 60 giay moi duoc gui 1 lan.
    if (user.verification_sent_at) {
      const waitedSeconds = Math.floor(
        (Date.now() - new Date(user.verification_sent_at).getTime()) / 1000
      );
      if (waitedSeconds < RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({
          success: false,
          message: `Vui lòng chờ ${RESEND_COOLDOWN_SECONDS - waitedSeconds} giây trước khi gửi lại mã.`,
        });
      }
    }

    const code = generateVerificationCode();
    const expiresAt = verificationExpiryDate();

    await pool.query(
      `UPDATE users
       SET verification_code_hash = ?, verification_expires = ?, verification_sent_at = NOW()
       WHERE id = ?`,
      [hashVerificationCode(code), expiresAt, user.id]
    );

    let emailSent = false;
    try {
      emailSent = await sendVerificationCode(normalizedEmail, user.full_name, code);
    } catch (mailError) {
      console.error("Không gửi lại được mã xác minh email:", mailError.message);
    }

    return res.status(200).json({
      success: true,
      message: emailSent
        ? "Đã gửi lại mã xác minh 6 số về email của bạn."
        : "Đã tạo mã xác minh mới nhưng chưa gửi được email, vui lòng thử lại sau.",
      data: { email: normalizedEmail, emailSent },
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

    // Chan dang nhap khi tai khoan chua xac minh email.
    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Tài khoản chưa xác minh email. Vui lòng nhập mã 6 số đã gửi về email của bạn.",
        data: { email: user.email },
      });
    }

    const token = signUserToken(user);

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name, email, role, student_code, email_verified, created_at FROM users WHERE id = ?",
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
        emailVerified: Boolean(u.email_verified),
        createdAt: u.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
}
