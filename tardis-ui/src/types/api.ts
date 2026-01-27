export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface User {
  id: number
  email: string
  name?: string
  created_at: string
  role?: 'student' | 'teacher' | 'content_creator'
  onboarding_completed?: boolean
  subjects_of_interest?: string[]
}

export interface Knowledge {
  created_at: string
  difficulty_level: string | null
  filename: string[] | null
  has_transcript: boolean | null
  id: number
  metadata: Json | null
  name: string
  prerequisites: string | null
  roleplay: string | null
  seeded: boolean | null
  status: string | null
  summarizedrag: string | null
  summary: string | null
  target_audience: string | null
  userId: string | null
  video_duration: number | null
  video_url: string | null
}

export interface Chapter {
  id: string
  knowledge_id: number
  title: string
  content: string
  summary?: string
  notes?: string
  quiz?: any
  mindmap?: any
  language: string
  chapter?: string | null
  chapter_type?: string | null
  chaptertitle: string
  context?: string | null
  k_id?: number
  level?: number | null
  lines?: number | null
  metadata?: Json | null
  needs_code?: boolean | null
  needs_latex?: boolean | null
  needs_roleplay?: boolean | null
  seeded?: boolean | null
  subtopic: string
  timestamp_end?: number | null
  timestamp_start?: number | null
  topic: string
  type?: string | null
  video_url?: string | null
}

export interface RoleplayScenario {
  id: number
  knowledge_id: number
  chapter_id?: string
  language: string
  topic: string
  prompt: string
  response: string
  created_at: string
}

export interface UserEvent {
  event_type: string
  knowledge_id?: number
  chapter_id?: string
  content_id?: string
  data?: any
  userId?: string // User identifier
}

export interface AnalyticsData {
  progress_percent: number
  chapters_viewed: number
  last_access: string
}

export interface ChapterContent {
  id?: number
  chapter?: string
  chapter_id?: number
  context?: string | null
  created_at?: string | null
  image_url?: string | null
  knowledge_id?: number
  latex_code?: string | null
  notes?: string | null
  summary?: string | null
  subtopic?: string
  topic?: string
  video_url?: string | null
  quiz?: QuizQuestion[]
  roleplay?:
    | string
    | {
        scenarios: Array<{
          id: string
          title: string
          description: string
          characters: Array<{
            id: string
            name: string
            description: string
          }>
          initialPrompt: string
          relatedCourse: string
        }>
      }
  mindmap?: string
  og?: string
  title?: string
  interactive?: InteractiveContent // Added field for interactive content
}

export interface VideoMetadata
  extends Omit<Knowledge, 'prerequisites' | 'target_audience'> {
  title: string
  description: string
  summary: string
  video_url: string
  video_duration: number
  difficulty_level: string
  target_audience: string[]
  prerequisites: string[]
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
  answer: string
  explanation?: string
  points?: number
}

export interface InteractiveContent {
  type: string // e.g., "slope-drawer", "equation-solver", etc.
  config?: Json // Configuration specific to the interactive component
  problems?: Array<{
    id: string
    question: string
    difficulty: 'easy' | 'medium' | 'hard'
    hints?: string[]
    solution?: string | { slope: number; yIntercept: number }
    data?: Json // Component-specific data needed for the problem
    targetPoints?: { x: number; y: number }[]
    startPoints?: { x: number; y: number }[]
  }>
  wordProblems?: Array<{
    id: string
    text: string
    difficulty: 'easy' | 'medium' | 'hard'
    context?: string
    illustration?: string // SVG data or URL
    solution?: string
  }>
  conceptExplanations?: Array<{
    id: string
    title: string
    content: string
    examples?: Array<{
      id: string
      description: string
      illustration?: string
    }>
  }>
}

export interface LearningAnalytics {
  engagement_score: number | null
  understanding_level: string | null
  strengths: string[] | null
  weaknesses: string[] | null
  recommendations: string[] | null
  user_id: string
  knowledge_id: string
  total_time: number
  completion_rate: number
  last_activity: string
  analytics_data: Json
}

export interface EdTechChapter {
  id: number
  knowledge_id: number
  chaptertitle: string
  subtopic: string
  topic?: string
  timestamp_start?: number
  timestamp_end?: number
}
