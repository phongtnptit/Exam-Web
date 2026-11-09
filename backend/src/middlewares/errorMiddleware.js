/**
 * Middleware xử lý 404 khi gọi vào API không tồn tại
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy đường dẫn API: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Middleware xử lý lỗi tập trung (Global Error Handler - 4 tham số chuẩn Express)
 */
export function errorHandler(err, req, res, next) {
  console.error("🔥 [Server Error]:", err);

  const statusCode = err.statusCode || 500;
  const message =
    err.message || "Đã xảy ra lỗi trên máy chủ nội bộ (500 Internal Server Error).";

  res.status(statusCode).json({
    success: false,
    message,
  });
}
