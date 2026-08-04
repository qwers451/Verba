import axios from 'axios';
import { UserProfile, Material, InterviewSession, AnswerEvaluation, FinalReport, DocumentChunk, DashboardSummary, InterviewHistoryItem, Payment, SubscriptionPlan } from '@/types';

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('verba_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const api = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 expects 'username'
    formData.append('password', password);
    const res = await apiClient.post('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  },

  register: async (email: string, password: string, name: string) => {
    const res = await apiClient.post('/auth/register', { email, password, name });
    return res.data;
  },
  getUserProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/user/me');
    return res.data;
  },

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await apiClient.get('/dashboard/summary');
    return res.data;
  },

  getSubscriptionPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await apiClient.get('/billing/plans');
    return res.data;
  },

  createYookassaCheckout: async (planCode: 'pro'): Promise<{ payment: Payment; confirmation_url: string }> => {
    const res = await apiClient.post('/billing/yookassa/checkout', { plan_code: planCode });
    return res.data;
  },

  refreshPaymentStatus: async (paymentId: string): Promise<Payment> => {
    const res = await apiClient.get(`/billing/payments/${paymentId}/status`);
    return res.data;
  },

  getPayments: async (): Promise<Payment[]> => {
    const res = await apiClient.get('/billing/payments');
    return res.data;
  },

  uploadMaterial: async (file: File): Promise<Material> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/materials/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  listMaterials: async (): Promise<Material[]> => {
    const res = await apiClient.get('/materials');
    return res.data;
  },

  deleteMaterial: async (materialId: string) => {
    const res = await apiClient.delete(`/materials/${materialId}`);
    return res.data;
  },

    getMaterialPdfBlob: async (materialId: string): Promise<Blob> => {
    const res = await apiClient.get(`/materials/${materialId}/pdf`, {
      responseType: 'blob'
    });
    return res.data;
  },

  getMaterialChunks: async (materialId: string): Promise<DocumentChunk[]> => {
    const res = await apiClient.get(`/materials/${materialId}/chunks`);
    return res.data;
  },

  startInterview: async (materialId: string, totalQuestions: number = 5, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<InterviewSession> => {
    const res = await apiClient.post('/interviews/start', {
      material_id: materialId,
      total_questions: totalQuestions,
      difficulty,
    });
    return res.data;
  },

  getInterviewSession: async (sessionId: string): Promise<InterviewSession> => {
    const res = await apiClient.get(`/interviews/${sessionId}`);
    return res.data;
  },

  listInterviews: async (): Promise<InterviewHistoryItem[]> => {
    const res = await apiClient.get('/interviews');
    return res.data;
  },

  submitAnswer: async (sessionId: string, questionNumber: number, answer: string): Promise<AnswerEvaluation> => {
    const res = await apiClient.post('/interviews/answer', {
      session_id: sessionId,
      question_number: questionNumber,
      user_answer: answer,
    });
    return res.data;
  },

  getReport: async (sessionId: string): Promise<FinalReport> => {
    const res = await apiClient.get(`/interviews/${sessionId}/report`);
    return res.data;
  },
};
