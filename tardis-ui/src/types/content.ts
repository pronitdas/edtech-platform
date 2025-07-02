// Content-related TypeScript interfaces

export interface VideoContent {
  id: string
  url: string
  title: string
  thumbnail?: string
  duration?: number
  description?: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

export interface QuizContent {
  id: string
  title: string
  description?: string
  questions: QuizQuestion[]
  time_limit?: number
  passing_score?: number
}

export interface ModuleContent {
  version?: string
  [key: string]: unknown
}

export type LearningModuleType = 'video' | 'quiz' | 'interactive' | 'document'

export interface LearningModule {
  id: string
  type: LearningModuleType
  title: string
  content: VideoContent | QuizContent
  metadata?: Record<string, unknown>
}