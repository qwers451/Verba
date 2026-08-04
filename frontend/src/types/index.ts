export interface UserProfile {
  id: string;
  email: string;
  name: string;
  subscription_status: string;
  monthly_sessions_limit: number;
  sessions_used_this_month: number;
  sessions_remaining: number;
  subscription_title: string;
}

export interface SubscriptionPlan {
  code: 'free' | 'pro';
  title: string;
  price_rub: number;
  monthly_session_limit: number;
  features: string[];
  is_current: boolean;
}

export interface Payment {
  id: string;
  plan_code: string;
  amount_rub: number;
  status: string;
  provider: string;
  created_at: string;
}

export interface DashboardSummary {
  material_count: number;
  completed_sessions: number;
  active_sessions: number;
  average_score?: number | null;
  sessions_remaining: number;
  monthly_sessions_limit: number;
  sessions_used_this_month: number;
}

export interface InterviewHistoryItem {
  id: string;
  material_id: string;
  material_title: string;
  status: 'created' | 'generating' | 'in_progress' | 'evaluating' | 'completed' | 'failed';
  overall_score?: number | null;
  total_questions: number;
  created_at: string;
  completed_at?: string | null;
}

export interface Material {
  id: string;
  title: string;
  page_count: number;
  chunks_count: number;
  status: string;
  file_size_bytes: number;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  page_number: number;
  chunk_index: number;
  keywords: string[];
}

export interface DialogItem {
  id: string;
  question_number: number;
  question_text: string;
  topic?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  user_answer?: string | null;
  score?: number | null;
  feedback?: string | null;
  missed_concepts?: string[];
  strengths?: string[];
  referenced_pages?: number[];
}

export interface InterviewSession {
  id: string;
  material_id: string;
  material_title: string;
  status: 'created' | 'generating' | 'in_progress' | 'evaluating' | 'completed' | 'failed';
  current_question_index: number;
  total_questions: number;
  overall_score?: number | null;
  dialogs: DialogItem[];
  created_at: string;
}

export interface AnswerEvaluation {
  question_number: number;
  score: number;
  feedback: string;
  strengths: string[];
  missed_concepts: string[];
  referenced_pages: number[];
  is_last_question: boolean;
}

export interface RecommendationTopic {
  topic: string;
  status: 'weak' | 'medium' | 'strong';
  pages: number[];
  advice: string;
}

export interface FinalReport {
  session_id: string;
  material_title: string;
  overall_score: number;
  grade_label: string;
  total_questions: number;
  topics_breakdown: RecommendationTopic[];
  key_recommendations: string[];
  dialogs: DialogItem[];
}
