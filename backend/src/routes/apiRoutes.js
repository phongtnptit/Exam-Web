import express from "express";
import { verifyToken, requireRole } from "../middlewares/authMiddleware.js";
import { register, login, getMe } from "../controllers/authController.js";
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
} from "../controllers/examController.js";
import {
  submitExam,
  getMySubmissions,
  getSubmissionDetail,
  getAllSubmissions,
  deleteSubmission,
} from "../controllers/submissionController.js";

const router = express.Router();

// ============================================================================
// 1. AUTHENTICATION ROUTES (TV1)
// ============================================================================
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/me", verifyToken, getMe);

// ============================================================================
// 2. SUBJECTS & QUESTION BANK ROUTES (TV2)
// ============================================================================
router.get("/subjects", verifyToken, getSubjects);
router.post("/subjects", verifyToken, requireRole("TEACHER"), createSubject);
router.put("/subjects/:id", verifyToken, requireRole("TEACHER"), updateSubject);
router.delete("/subjects/:id", verifyToken, requireRole("TEACHER"), deleteSubject);

router.get("/questions", verifyToken, requireRole("TEACHER"), getQuestions);
router.post("/questions", verifyToken, requireRole("TEACHER"), createQuestion);
router.put("/questions/:id", verifyToken, requireRole("TEACHER"), updateQuestion);
router.delete("/questions/:id", verifyToken, requireRole("TEACHER"), deleteQuestion);

// ============================================================================
// 3. EXAMS MANAGEMENT ROUTES (TV3)
// ============================================================================
router.get("/exams", verifyToken, getExams);
router.get("/exams/:id", verifyToken, getExamById);
router.post("/exams", verifyToken, requireRole("TEACHER"), createExam);
router.put("/exams/:id", verifyToken, requireRole("TEACHER"), updateExam);
router.delete("/exams/:id", verifyToken, requireRole("TEACHER"), deleteExam);

// ============================================================================
// 4. SUBMISSIONS & EXAM ROOM ROUTES (TV4)
// ============================================================================
router.post("/submissions", verifyToken, submitExam);
router.get("/submissions/my-history", verifyToken, getMySubmissions);
router.get("/submissions/:id", verifyToken, getSubmissionDetail);
router.get("/submissions", verifyToken, requireRole("TEACHER"), getAllSubmissions);
router.delete("/submissions/:id", verifyToken, requireRole("TEACHER"), deleteSubmission);

export default router;
