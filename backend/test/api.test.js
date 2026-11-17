import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import "dotenv/config";

// Database tạm, không dùng hoặc xóa dữ liệu của ứng dụng.
const testDatabase = `ptit_exam_test_${Date.now()}_${process.pid}`;
process.env.DB_NAME = testDatabase;
process.env.JWT_SECRET = "test_secret_only_for_local_integration_tests";
const { pool, initializeDatabase } = await import("../src/config/db.js");
const { default: routes } = await import("../src/routes/apiRoutes.js");
const { errorHandler } = await import("../src/middlewares/errorMiddleware.js");
let server;
let baseUrl;
let teacherToken;
let studentToken;
let subjectId;
let questionId;
let examId;

async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

const examForm = () => ({ subjectId, title: "Đề kiểm thử", description: "", durationMinutes: 5, passScore: 0, isPublished: 0, questionIds: [questionId] });

before(async () => {
  await initializeDatabase();
  const app = express();
  app.use(express.json());
  app.use("/api", routes);
  app.use(errorHandler);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  for (const role of ["teacher", "student"]) {
    const result = await request("/auth/login", { method: "POST", body: { email: `${role}@ptit.edu.vn`, password: "123456" } });
    assert.equal(result.status, 200);
    if (role === "teacher") teacherToken = result.body.data.token;
    else studentToken = result.body.data.token;
  }
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  try {
    if (!/^ptit_exam_test_\d+_\d+$/.test(testDatabase)) throw new Error("Tên database kiểm thử không hợp lệ.");
    await pool.query(`DROP DATABASE IF EXISTS \`${testDatabase}\``);
  } finally {
    await pool.end();
  }
});

test("Chưa đăng nhập nhận 401; sinh viên không được quản lý câu hỏi", async () => {
  assert.equal((await request("/exams")).status, 401);
  assert.equal((await request("/questions", { token: studentToken })).status, 403);
  assert.equal((await request("/chat", { method: "POST", body: { messages: [{ role: "user", content: "Chào" }] } })).status, 401);
  // Body sai được chặn trước khi gọi nhà cung cấp, không dùng key thật trong test.
  assert.equal((await request("/chat", { method: "POST", token: studentToken, body: { messages: [] } })).status, 400);
});

test("Đăng ký không cho tự cấp quyền TEACHER; dữ liệu sai trả 400", async () => {
  const result = await request("/auth/register", { method: "POST", body: { fullName: "Sinh viên thử", email: "new@example.com", password: "123456", role: "TEACHER" } });
  assert.equal(result.status, 201);
  assert.equal(result.body.data.user.role, "STUDENT");
  assert.equal((await request("/questions", { token: result.body.data.token })).status, 403);
  assert.equal((await request("/auth/register", { method: "POST", body: { fullName: "  ", email: 123, password: "123456" } })).status, 400);
  assert.equal((await request("/auth/login", { method: "POST", body: { email: {}, password: "123456" } })).status, 400);
});

test("Tạo môn và câu hỏi; từ chối đáp án sai định dạng", async () => {
  let result = await request("/subjects", { method: "POST", token: teacherToken, body: { code: "TEST101", name: "Môn kiểm thử" } });
  assert.equal(result.status, 201);
  subjectId = result.body.data.id;
  const form = { subjectId, content: "Chọn A", optionA: "A", optionB: "B", optionC: "C", optionD: "D", correctAnswer: "A", difficulty: "EASY" };
  assert.equal((await request("/questions", { method: "POST", token: teacherToken, body: { ...form, correctAnswer: "X" } })).status, 400);
  result = await request("/questions", { method: "POST", token: teacherToken, body: form });
  assert.equal(result.status, 201);
  questionId = result.body.data.id;
});

test("Kiểm tra thời lượng, điểm đạt, câu trùng, câu sai môn và không lưu đề lỗi", async () => {
  for (const change of [{ durationMinutes: -1 }, { durationMinutes: 2.5 }, { durationMinutes: [5] }, { passScore: 11 }, { passScore: [] }, { description: null }, { questionIds: [] }, { questionIds: [questionId, questionId] }, { questionIds: [1] }]) {
    const result = await request("/exams", { method: "POST", token: teacherToken, body: { ...examForm(), ...change } });
    assert.equal(result.status, 400, JSON.stringify(change));
  }
  const [rows] = await pool.query("SELECT id FROM exams WHERE subject_id = ?", [subjectId]);
  assert.equal(rows.length, 0);
  const result = await request("/exams", { method: "POST", token: teacherToken, body: examForm() });
  assert.equal(result.status, 201);
  examId = result.body.data.id;
});

test("Sinh viên không thể liệt kê, xem hay nộp đề nháp", async () => {
  const list = await request("/exams", { token: studentToken });
  assert.equal(list.body.data.some((exam) => exam.id === examId), false);
  assert.equal((await request(`/exams/${examId}`, { token: studentToken })).status, 403);
  assert.equal((await request("/submissions", { method: "POST", token: studentToken, body: { examId } })).status, 403);
});

test("Sửa đề hợp lệ; cập nhật sai giữ nguyên danh sách câu hỏi", async () => {
  assert.equal((await request(`/exams/${examId}`, { method: "PUT", token: teacherToken, body: { ...examForm(), isPublished: 1 } })).status, 200);
  assert.equal((await request(`/exams/${examId}`, { method: "PUT", token: teacherToken, body: { ...examForm(), questionIds: [1] } })).status, 400);
  const detail = await request(`/exams/${examId}`, { token: studentToken });
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.questions.length, 1);
  assert.equal(detail.body.data.questions[0].correct_answer, undefined);
  assert.equal(detail.body.data.questions[0].explanation, undefined);
});

test("Chấm điểm ở server; từ chối đáp án lạ, câu ngoài đề và thời gian âm", async () => {
  for (const change of [{ answers: null }, { answers: [] }, { answers: { [questionId]: "X" } }, { answers: { 999999: "A" } }, { timeSpentSeconds: -1 }, { timeSpentSeconds: 301 }, { timeSpentSeconds: [] }]) {
    assert.equal((await request("/submissions", { method: "POST", token: studentToken, body: { examId, ...change } })).status, 400);
  }
  const result = await request("/submissions", { method: "POST", token: studentToken, body: { examId, answers: { [questionId]: "A" }, timeSpentSeconds: 10, score: 0 } });
  assert.equal(result.status, 201);
  assert.equal(result.body.data.score, 10);
  const detail = await request(`/submissions/${result.body.data.submissionId}`, { token: studentToken });
  assert.equal(detail.body.data.questions[0].is_correct, true);
  const other = await request("/auth/login", { method: "POST", body: { email: "giang.lth@ptit.edu.vn", password: "123456" } });
  assert.equal((await request(`/submissions/${result.body.data.submissionId}`, { token: other.body.data.token })).status, 403);
});

test("Giữ lịch sử: không sửa/xóa đề đã thi, câu trong đề hoặc môn đang có dữ liệu", async () => {
  assert.equal((await request(`/exams/${examId}`, { method: "PUT", token: teacherToken, body: examForm() })).status, 409);
  assert.equal((await request(`/exams/${examId}`, { method: "DELETE", token: teacherToken })).status, 409);
  assert.equal((await request(`/questions/${questionId}`, { method: "DELETE", token: teacherToken })).status, 409);
  assert.equal((await request(`/questions/${questionId}`, { method: "PUT", token: teacherToken, body: {} })).status, 409);
  assert.equal((await request(`/subjects/${subjectId}`, { method: "DELETE", token: teacherToken })).status, 409);
  assert.equal((await request(`/subjects/${subjectId}`, { method: "PUT", token: teacherToken, body: { code: "NEW", name: "Tên mới" } })).status, 409);
});
