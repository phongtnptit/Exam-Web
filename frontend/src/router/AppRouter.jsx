import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../components/MainLayout";
import ChatbotPage from "../pages/ChatbotPage";

import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";

import HomePage from "../pages/student/HomePage";
import ExamDetailPage from "../pages/student/ExamDetailPage";
import ExamRoomPage from "../pages/student/ExamRoomPage";
import MyResultsPage from "../pages/student/MyResultsPage";
import SubmissionDetailPage from "../pages/student/SubmissionDetailPage";

import QuestionBankPage from "../pages/teacher/QuestionBankPage";
import ExamManagerPage from "../pages/teacher/ExamManagerPage";

export default function AppRouter() {
  return (
    <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>

        <Route path="/exam-room/:id" element={<ExamRoomPage />} />

        <Route element={<MainLayout />}>

          <Route path="/" element={<HomePage />} />
          <Route path="/exams/:id" element={<ExamDetailPage />} />
          <Route path="/my-results" element={<MyResultsPage />} />
          <Route path="/results/:id" element={<SubmissionDetailPage />} />
          <Route path="/chatbot" element={<ChatbotPage />} />

          <Route element={<ProtectedRoute allowedRole="TEACHER" />}>
            <Route path="/teacher/questions" element={<QuestionBankPage />} />
            <Route path="/teacher/exams" element={<ExamManagerPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
