import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useExamStore = create(persist((set, get) => ({

  selectedSubjectId: "",
  searchQuery: "",
  setSelectedSubjectId: (subjectId) => set({ selectedSubjectId: subjectId }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  ownerId: null,
  deadline: 0,
  activeExam: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  flaggedQuestions: [],
  remainingSeconds: 0,
  totalSeconds: 0,

  startExamSession: (examData, userId) => {
    const saved = get();

    if (saved.ownerId === userId && saved.activeExam?.id === examData.id &&
        saved.totalSeconds === Number(examData.duration_minutes) * 60 &&
        JSON.stringify(saved.questions) === JSON.stringify(examData.questions)) {
      set({ activeExam: examData, remainingSeconds: Math.max(0, Math.ceil((saved.deadline - Date.now()) / 1000)) });
      return;
    }
    const durationSec = (Number(examData.duration_minutes) || 30) * 60;
    set({
      ownerId: userId,
      deadline: Date.now() + durationSec * 1000,
      activeExam: examData,
      questions: examData.questions || [],
      currentIndex: 0,
      answers: {},
      flaggedQuestions: [],
      remainingSeconds: durationSec,
      totalSeconds: durationSec,
    });
  },

  selectAnswer: (questionId, optionKey) =>
    set((state) => state.deadline <= Date.now() ? {} : ({
      answers: {
        ...state.answers,
        [questionId]: optionKey,
      },
    })),

  toggleFlagQuestion: (questionId) =>
    set((state) => {
      const exists = state.flaggedQuestions.includes(questionId);
      return {
        flaggedQuestions: exists
          ? state.flaggedQuestions.filter((id) => id !== questionId)
          : [...state.flaggedQuestions, questionId],
      };
    }),

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

  tickTimer: () =>
    set((state) => ({
      remainingSeconds: Math.max(0, Math.ceil((state.deadline - Date.now()) / 1000)),
    })),

  resetExamSession: () =>
    set({
      ownerId: null,
      deadline: 0,
      activeExam: null,
      questions: [],
      currentIndex: 0,
      answers: {},
      flaggedQuestions: [],
      remainingSeconds: 0,
      totalSeconds: 0,
    }),
}), {
  name: "ptit_exam_session",
  storage: createJSONStorage(() => sessionStorage),
  partialize: (state) => ({
    ownerId: state.ownerId,
    deadline: state.deadline,
    activeExam: state.activeExam,
    questions: state.questions,
    currentIndex: state.currentIndex,
    answers: state.answers,
    flaggedQuestions: state.flaggedQuestions,
    totalSeconds: state.totalSeconds,
  }),
}));
