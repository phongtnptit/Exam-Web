import jwt from "jsonwebtoken";

/**
 * Middleware 1: Xác thực JWT Token từ Header Authorization: Bearer <token>
 */
export function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Bạn chưa đăng nhập hoặc thiếu Token xác thực (401 Unauthorized).",
      });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "ptit_online_exam_secret_key_2026";
    const decoded = jwt.verify(token, secret);

    req.user = decoded; // { id, email, fullName, role, studentCode }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.",
    });
  }
}

/**
 * Middleware 2: Kiểm tra phân quyền theo vai trò (Role-Based Access Control)
 * Ví dụ: requireRole("TEACHER")
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện thao tác này (403 Forbidden).",
      });
    }
    next();
  };
}
