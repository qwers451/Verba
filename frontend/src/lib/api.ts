import axios from 'axios';
import { UserProfile, Material, InterviewSession, AnswerEvaluation, FinalReport } from '@/types';

const API_BASE = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getUserProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/user/me');
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

  startInterview: async (materialId: string, totalQuestions: number = 5): Promise<InterviewSession> => {
    const res = await apiClient.post('/interviews/start', {
      material_id: materialId,
      total_questions: totalQuestions,
    });
    return res.data;
  },

  getInterviewSession: async (sessionId: string): Promise<InterviewSession> => {
    const res = await apiClient.get(`/interviews/${sessionId}`);
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
