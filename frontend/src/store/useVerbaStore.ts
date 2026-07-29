import { create } from 'zustand';
import { UserProfile, Material, InterviewSession, AnswerEvaluation, FinalReport } from '@/types';
import { api } from '@/lib/api';

interface VerbaState {
  // Navigation View
  activeTab: 'dashboard' | 'interview' | 'report';
  setActiveTab: (tab: 'dashboard' | 'interview' | 'report') => void;

  // User & Quota
  user: UserProfile | null;
  isLoadingUser: boolean;
  fetchUser: () => Promise<void>;

  // Materials
  materials: Material[];
  selectedMaterial: Material | null;
  isUploading: boolean;
  uploadError: string | null;
  fetchMaterials: () => Promise<void>;
  uploadPdf: (file: File) => Promise<void>;
  selectMaterial: (material: Material) => void;

  // Active Interview Session
  activeSession: InterviewSession | null;
  isStartingInterview: boolean;
  currentQuestionIdx: number;
  latestEvaluation: AnswerEvaluation | null;
  isEvaluating: boolean;
  startInterview: (materialId: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  
  // Report
  finalReport: FinalReport | null;
  isLoadingReport: boolean;
  fetchReport: (sessionId: string) => Promise<void>;

  // Speech Recognition / Voice Mode
  isVoiceModeActive: boolean;
  setVoiceModeActive: (active: boolean) => void;
}

export const useVerbaStore = create<VerbaState>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  user: null,
  isLoadingUser: false,
  fetchUser: async () => {
    set({ isLoadingUser: true });
    try {
      const user = await api.getUserProfile();
      set({ user, isLoadingUser: false });
    } catch (err) {
      console.error('Error fetching user:', err);
      set({ isLoadingUser: false });
    }
  },

  materials: [],
  selectedMaterial: null,
  isUploading: false,
  uploadError: null,
  fetchMaterials: async () => {
    try {
      const materials = await api.listMaterials();
      set({ materials });
      if (materials.length > 0 && !get().selectedMaterial) {
        set({ selectedMaterial: materials[0] });
      }
    } catch (err) {
      console.error('Error fetching materials:', err);
    }
  },

  uploadPdf: async (file: File) => {
    set({ isUploading: true, uploadError: null });
    try {
      const newMat = await api.uploadMaterial(file);
      const updatedList = [newMat, ...get().materials];
      set({
        materials: updatedList,
        selectedMaterial: newMat,
        isUploading: false,
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Ошибка при загрузке PDF-файла.';
      set({ uploadError: errMsg, isUploading: false });
    }
  },

  selectMaterial: (material: Material) => set({ selectedMaterial: material }),

  activeSession: null,
  isStartingInterview: false,
  currentQuestionIdx: 0,
  latestEvaluation: null,
  isEvaluating: false,

  startInterview: async (materialId: string) => {
    set({ isStartingInterview: true, latestEvaluation: null, currentQuestionIdx: 0 });
    try {
      const session = await api.startInterview(materialId, 5);
      set({
        activeSession: session,
        activeTab: 'interview',
        isStartingInterview: false,
      });
      get().fetchUser(); // Refresh quota count
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Не удалось начать сессию собеседования.');
      set({ isStartingInterview: false });
    }
  },

  submitAnswer: async (answer: string) => {
    const { activeSession, currentQuestionIdx } = get();
    if (!activeSession) return;

    const currentDialog = activeSession.dialogs[currentQuestionIdx];
    if (!currentDialog) return;

    set({ isEvaluating: true });
    try {
      const evaluation = await api.submitAnswer(
        activeSession.id,
        currentDialog.question_number,
        answer
      );

      // Update dialog in state
      const updatedDialogs = [...activeSession.dialogs];
      updatedDialogs[currentQuestionIdx] = {
        ...updatedDialogs[currentQuestionIdx],
        user_answer: answer,
        score: evaluation.score,
        feedback: evaluation.feedback,
        missed_concepts: evaluation.missed_concepts,
        referenced_pages: evaluation.referenced_pages,
      };

      const updatedSession = {
        ...activeSession,
        dialogs: updatedDialogs,
        current_question_index: evaluation.is_last_question
          ? currentQuestionIdx
          : currentQuestionIdx + 1,
      };

      set({
        activeSession: updatedSession,
        latestEvaluation: evaluation,
        isEvaluating: false,
      });

      if (evaluation.is_last_question) {
        // Fetch report & open report tab
        await get().fetchReport(activeSession.id);
      }
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      set({ isEvaluating: false });
    }
  },

  finalReport: null,
  isLoadingReport: false,
  fetchReport: async (sessionId: string) => {
    set({ isLoadingReport: true });
    try {
      const report = await api.getReport(sessionId);
      set({
        finalReport: report,
        isLoadingReport: false,
        activeTab: 'report',
      });
    } catch (err) {
      console.error('Error fetching report:', err);
      set({ isLoadingReport: false });
    }
  },

  isVoiceModeActive: false,
  setVoiceModeActive: (active) => set({ isVoiceModeActive: active }),
}));
