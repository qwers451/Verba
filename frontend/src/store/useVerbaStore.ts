import { create } from 'zustand';
import { UserProfile, Material, InterviewSession, AnswerEvaluation, FinalReport, DashboardSummary, InterviewHistoryItem, Payment, SubscriptionPlan } from '@/types';
import { api, getApiErrorMessage } from '@/lib/api';

interface VerbaState {
  // Auth
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  hydrateAuth: () => Promise<void>;

  // User & Quota
  user: UserProfile | null;
  isLoadingUser: boolean;
  fetchUser: () => Promise<void>;

  // Dashboard and billing
  dashboardSummary: DashboardSummary | null;
  interviewHistory: InterviewHistoryItem[];
  plans: SubscriptionPlan[];
  payments: Payment[];
  isLoadingDashboard: boolean;
  isCheckingOut: boolean;
  fetchDashboard: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchPayments: () => Promise<void>;
  createYookassaCheckout: () => Promise<string>;

  // Materials
  materials: Material[];
  selectedMaterial: Material | null;
  isUploading: boolean;
  uploadError: string | null;
  fetchMaterials: () => Promise<void>;
  uploadPdf: (file: File) => Promise<void>;
  deleteMaterial: (materialId: string) => Promise<void>;
  selectMaterial: (material: Material) => void;

  // Active Interview Session
  activeSession: InterviewSession | null;
  isStartingInterview: boolean;
  currentQuestionIdx: number;
  latestEvaluation: AnswerEvaluation | null;
  isEvaluating: boolean;
  startInterview: (materialId: string, difficulty?: 'easy' | 'medium' | 'hard', totalQuestions?: number) => Promise<string | null>;
  loadInterviewSession: (sessionId: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<boolean>;
  
  // Report
  finalReport: FinalReport | null;
  isLoadingReport: boolean;
  fetchReport: (sessionId: string) => Promise<void>;

  // Speech Recognition / Voice Mode
  isVoiceModeActive: boolean;
  setVoiceModeActive: (active: boolean) => void;
}

export const useVerbaStore = create<VerbaState>((set, get) => ({
  isAuthModalOpen: false,
  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  token: null,
  login: async (email, password) => {
    try {
      const res = await api.login(email, password);
      localStorage.setItem('verba_token', res.access_token);
      set({ token: res.access_token, isAuthModalOpen: false });
      await get().fetchUser();
      await get().fetchMaterials();
      await get().fetchDashboard();
      await get().fetchPlans();
      await get().fetchPayments();
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Ошибка авторизации'));
    }
  },
  register: async (email, password, name) => {
    try {
      await api.register(email, password, name);
      const res = await api.login(email, password);
      localStorage.setItem('verba_token', res.access_token);
      set({ token: res.access_token, isAuthModalOpen: false });
      await get().fetchUser();
      await get().fetchMaterials();
      await get().fetchDashboard();
      await get().fetchPlans();
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Ошибка регистрации'));
    }
  },
  logout: () => {
    localStorage.removeItem('verba_token');
    set({ token: null, user: null, materials: [], activeSession: null, dashboardSummary: null, interviewHistory: [], plans: [], payments: [] });
  },
  hydrateAuth: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('verba_token') : null;
    if (!token) return;

    set({ token, isLoadingUser: true });
    try {
      const user = await api.getUserProfile();
      set({ user, isLoadingUser: false });
      await Promise.all([
        get().fetchMaterials(), get().fetchDashboard(),
        get().fetchPlans(), get().fetchPayments(),
      ]);
    } catch {
      set({ isLoadingUser: false });
      get().logout();
    }
  },

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
      throw err;
    }
  },

  dashboardSummary: null,
  interviewHistory: [],
  plans: [],
  payments: [],
  isLoadingDashboard: false,
  isCheckingOut: false,
  fetchDashboard: async () => {
    set({ isLoadingDashboard: true });
    try {
      const [dashboardSummary, interviewHistory] = await Promise.all([api.getDashboardSummary(), api.listInterviews()]);
      set({ dashboardSummary, interviewHistory, isLoadingDashboard: false });
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      set({ isLoadingDashboard: false });
    }
  },
  fetchPlans: async () => {
    try {
      set({ plans: await api.getSubscriptionPlans() });
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  },
  fetchPayments: async () => {
    try {
      const payments = await api.getPayments();
      const refreshedPayments = await Promise.all(payments.map(async (payment) => (
        payment.status === 'pending' ? api.refreshPaymentStatus(payment.id) : payment
      )));
      set({ payments: refreshedPayments });
      if (refreshedPayments.some((payment, index) => payment.status !== payments[index].status)) {
        await Promise.all([get().fetchUser(), get().fetchPlans(), get().fetchDashboard()]);
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  },
  createYookassaCheckout: async () => {
    set({ isCheckingOut: true });
    try {
      const checkout = await api.createYookassaCheckout('pro');
      return checkout.confirmation_url;
    } catch (err: unknown) {
      throw new Error(getApiErrorMessage(err, 'Не удалось создать платёж ЮKassa.'));
    } finally {
      set({ isCheckingOut: false });
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
    } catch (err: unknown) {
      const errMsg = getApiErrorMessage(err, 'Ошибка при загрузке PDF-файла.');
      set({ uploadError: errMsg, isUploading: false });
    }
  },

  selectMaterial: (material: Material) => set({ selectedMaterial: material }),

  deleteMaterial: async (materialId: string) => {
    try {
      await api.deleteMaterial(materialId);
      set((state) => ({
        materials: state.materials.filter((m) => m.id !== materialId),
        selectedMaterial: state.selectedMaterial?.id === materialId ? null : state.selectedMaterial
      }));
    } catch (err: unknown) {
      console.error('Error deleting material:', err);
      alert(getApiErrorMessage(err, 'Ошибка при удалении материала.'));
    }
  },

  activeSession: null,
  isStartingInterview: false,
  currentQuestionIdx: 0,
  latestEvaluation: null,
  isEvaluating: false,

  startInterview: async (materialId: string, difficulty = 'medium', totalQuestions = 5) => {
    set({ isStartingInterview: true, latestEvaluation: null, currentQuestionIdx: 0 });
    try {
      const session = await api.startInterview(materialId, totalQuestions, difficulty);
      set({
        activeSession: session,
        isStartingInterview: false,
      });
      get().fetchUser(); // Refresh quota count
      get().fetchDashboard();
      return session.id;
    } catch (err: unknown) {
      alert(getApiErrorMessage(err, 'Не удалось начать сессию собеседования.'));
      set({ isStartingInterview: false });
      return null;
    }
  },

  loadInterviewSession: async (sessionId: string) => {
    set({ isStartingInterview: true, latestEvaluation: null });
    try {
      const session = await api.getInterviewSession(sessionId);
      set({
        activeSession: session,
        currentQuestionIdx: Math.min(session.current_question_index, Math.max(0, session.dialogs.length - 1)),
        isStartingInterview: false,
      });
    } catch (err) {
      set({ isStartingInterview: false });
      throw err;
    }
  },

  submitAnswer: async (answer: string) => {
    const { activeSession, currentQuestionIdx } = get();
    if (!activeSession) return false;

    const currentDialog = activeSession.dialogs[currentQuestionIdx];
    if (!currentDialog) return false;

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
        strengths: evaluation.strengths,
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
        currentQuestionIdx: evaluation.is_last_question
          ? currentQuestionIdx
          : currentQuestionIdx + 1,
        latestEvaluation: evaluation,
        isEvaluating: false,
      });

      if (evaluation.is_last_question) {
        // Fetch report
        await get().fetchReport(activeSession.id);
        return true; // indicates it's finished
      }
      return false;
    } catch (err: unknown) {
      console.error('Error submitting answer:', err);
      set({ isEvaluating: false });
      throw new Error(getApiErrorMessage(err, 'Не удалось оценить ответ. Попробуйте ещё раз.'));
    }
  },

  finalReport: null,
  isLoadingReport: false,
  fetchReport: async (sessionId: string) => {
    set({ isLoadingReport: true });
    try {
      const [report, session] = await Promise.all([
        api.getReport(sessionId),
        api.getInterviewSession(sessionId),
      ]);
      set({
        finalReport: report,
        activeSession: session,
        isLoadingReport: false,
      });
    } catch (err) {
      console.error('Error fetching report:', err);
      set({ isLoadingReport: false });
    }
  },

  isVoiceModeActive: false,
  setVoiceModeActive: (active) => set({ isVoiceModeActive: active }),
}));
