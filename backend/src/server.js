import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initializeDatabase } from "./config/db.js";
import apiRoutes from "./routes/apiRoutes.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Endpoint kiểm tra trạng thái server
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PTIT Online Exam API Server is running!",
  });
});

// Mount toàn bộ REST API dưới tiền tố /api
app.use("/api", apiRoutes);

// Middleware xử lý 404 và Lỗi tập trung
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Backend PTIT Online Exam đang chạy tại: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Không thể kết nối MySQL hoặc khởi tạo CSDL:", error.message);
    process.exit(1);
  }
}

startServer();
