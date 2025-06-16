export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: string;
}

export interface Knowledge {
  id: number;
  name: string;
  content_type: string;
  created_at: string;
  status?: 'processing' | 'completed' | 'failed';
}

export interface Chapter {
  id: string;
  knowledge_id: number;
  title: string;
  content: string;
  summary?: string;
  notes?: string;
  quiz?: any;
  mindmap?: any;
  language: string;
}

export interface RoleplayScenario {
  id: number;
  knowledge_id: number;
  chapter_id?: string;
  language: string;
  topic: string;
  prompt: string;
  response: string;
  created_at: string;
}

export interface UserEvent {
  event_type: string;
  knowledge_id?: number;
  chapter_id?: string;
  content_id?: string;
  data?: any;
}

export interface AnalyticsData {
  progress_percent: number;
  chapters_viewed: number;
  last_access: string;
}
