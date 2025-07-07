// Main Practice Module
export { default as UnifiedPracticeModule } from './UnifiedPracticeModule'

// Practice Modes
export { default as FlashcardMode } from './modes/FlashcardMode'
export { default as SpeedDrillMode } from './modes/SpeedDrillMode'

// Analytics & Progress Tracking
export { default as PracticeAnalytics } from './PracticeAnalytics'

// Gamification
export { default as GamificationSystem } from './GamificationSystem'

// Onboarding Integration
export { default as PracticeOnboardingComplete } from './PracticeOnboardingComplete'

// Types
export interface PracticeQuestion {
  id: string
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer' | 'matching' | 'ordering'
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  hints?: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  topic: string
  subtopic?: string
  estimatedTime: number
  points: number
}

export interface PracticeSession {
  id: string
  mode: PracticeMode
  questions: PracticeQuestion[]
  startTime?: Date
  endTime?: Date
  score: number
  totalQuestions: number
  timeSpent: number
  hintsUsed: number
  difficulty: string
}

export type PracticeMode = 
  | 'adaptive-quiz'
  | 'flashcards'
  | 'speed-drill'
  | 'deep-practice'
  | 'weakness-focus'
  | 'review-mode'
  | 'challenge-mode'
  | 'explanation-mode'