import { create } from "zustand";

/**
 * useExamStore - Quản lý State Phòng thi & Bộ lọc Đề thi bằng Zustand
 * (Đáp ứng yêu cầu mục 2 của đề bài: "Redux Toolkit hoặc Zustand")
 */
export const useExamStore = create((set, get) => ({
  // 1. State bộ lọc tìm kiếm đề thi ở Trang chủ
  selectedSubjectId: "",
  searchQuery: "",
  setSelectedSubjectId: (subjectId) => set({ selectedSubjectId: subjectId }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // 2. State Phòng thi trực tuyến (Exam Room)
  activeExam: null,
  questions: [],
  currentIndex: 0,
  answers: {}, // { [questionId]: 'A' | 'B' | 'C' | 'D' }
  flaggedQuestions: [], // Mảng ID các câu hỏi được cắm cờ xem lại
  remainingSeconds: 0,
  totalSeconds: 0,

  // Khởi tạo phòng thi mới
  startExamSession: (examData) => {
    const durationSec = (Number(examData.duration_minutes) || 30) * 60;
    set({
      activeExam: examData,
      questions: examData.questions || [],
      currentIndex: 0,
      answers: {},
      flaggedQuestions: [],
      remainingSeconds: durationSec,
      totalSeconds: durationSec,
    });
  },

  // Chọn đáp án A / B / C / D cho 1 câu hỏi
  selectAnswer: (questionId, optionKey) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: optionKey,
      },
    })),

  // Bật / tắt cờ đánh dấu câu hỏi phân vân
  toggleFlagQuestion: (questionId) =>
    set((state) => {
      const exists = state.flaggedQuestions.includes(questionId);
      return {
        flaggedQuestions: exists
          ? state.flaggedQuestions.filter((id) => id !== questionId)
          : [...state.flaggedQuestions, questionId],
      };
    }),

  // Di chuyển tới câu hỏi bất kỳ
  goToQuestion: (index) => {
    const total = get().questions.length;
    if (index >= 0 && index < total) {
      set({ currentIndex: index });
    }
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get();
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentIndex } = get();
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 });
    }
  },

  // Giảm bộ đếm thời gian mỗi giây
  tickTimer: () =>
    set((state) => ({
      remainingSeconds: Math.max(0, state.remainingSeconds - 1),
    })),

  // Xóa trạng thái phòng thi sau khi nộp bài
  resetExamSession: () =>
    set({
      activeExam: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      flaggedQuestions: [],
      remainingSeconds: 0,
      totalSeconds: 0,
    }),
}));
