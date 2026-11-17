import { test } from "node:test";
import assert from "node:assert/strict";

const storage = new Map();
globalThis.sessionStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
};
const { useExamStore } = await import("../src/store/useExamStore.js");
const exam = { id: 1, duration_minutes: 5, questions: [{ id: 10, content: "Câu 1" }] };

test("F5 khôi phục đáp án, cờ và hạn nộp; không cấp lại thời gian", () => {
  const store = useExamStore;
  store.getState().startExamSession(exam, 2);
  store.getState().selectAnswer(10, "A");
  store.getState().toggleFlagQuestion(10);
  const deadline = store.getState().deadline;
  store.setState({ answers: {}, activeExam: null, deadline: 0 });
  // Giả lập bộ nhớ JS bị xóa khi F5, giữ lại sessionStorage trước F5.
  const saved = { state: { ownerId: 2, deadline, activeExam: exam, questions: exam.questions, answers: { 10: "A" }, flaggedQuestions: [10], totalSeconds: 300, currentIndex: 0 }, version: 0 };
  sessionStorage.setItem("ptit_exam_session", JSON.stringify(saved));
  store.persist.rehydrate();
  store.getState().startExamSession(exam, 2);
  assert.equal(store.getState().deadline, deadline);
  assert.equal(store.getState().answers[10], "A");
  assert.deepEqual(store.getState().flaggedQuestions, [10]);
});

test("Tab chạy nền vẫn hết giờ; hết giờ không đổi được đáp án", () => {
  useExamStore.setState({ deadline: Date.now() - 1000 });
  useExamStore.getState().tickTimer();
  assert.equal(useExamStore.getState().remainingSeconds, 0);
  useExamStore.getState().selectAnswer(10, "B");
  assert.equal(useExamStore.getState().answers[10], "A");
});

test("Đổi tài khoản hoặc nộp bài không giữ lại đáp án cũ", () => {
  useExamStore.getState().startExamSession(exam, 3);
  assert.deepEqual(useExamStore.getState().answers, {});
  assert.equal(useExamStore.getState().remainingSeconds, 300);
  useExamStore.getState().resetExamSession();
  assert.equal(useExamStore.getState().activeExam, null);
  assert.equal(JSON.parse(sessionStorage.getItem("ptit_exam_session")).state.deadline, 0);
});
