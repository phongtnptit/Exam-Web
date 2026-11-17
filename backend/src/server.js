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
    origin: (process.env.FRONTEND_URL || "http://localhost:5173").split(",").map((url) => url.trim()),
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "PTIT Online Exam API Server is running!",
  });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  try {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "replace_with_your_jwt_secret") {
      throw new Error("Hãy đặt JWT_SECRET riêng trong backend/.env trước khi chạy.");
    }
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
