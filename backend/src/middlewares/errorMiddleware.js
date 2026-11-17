export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy đường dẫn API: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  if ((err.statusCode || err.status || 500) >= 500) console.error("🔥 [Server Error]:", err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message;
  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "Email hoặc mã môn học đã tồn tại.";
  } else if (["ER_NO_REFERENCED_ROW_2", "ER_ROW_IS_REFERENCED_2"].includes(err.code)) {
    statusCode = 400;
    message = "Dữ liệu liên quan không tồn tại hoặc đang được sử dụng.";
  } else if (statusCode >= 500) {
    message = "Máy chủ gặp lỗi. Vui lòng thử lại sau.";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
