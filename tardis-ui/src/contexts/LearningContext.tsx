import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Chapter } from '@/types/api'
import type { VideoContent, QuizContent, ModuleContent } from '@/types/content'

// Types
export type ViewType = 'dashboard' | 'knowledge_selection' | 'chapter_selection' | 'course_content' | 'learning_module'

export interface CurrentTopic {
  knowledgeId: number | null
  topicId: string | null
  topic: Chapter | null
  language: string
}

export interface LearningState {
  currentView: ViewType
  currentTopic: CurrentTopic
  videoContent: VideoContent | null
  quizContent: QuizContent | null
  sidebarOpen: boolean
  content: ModuleContent | null
}

// Actions
type LearningAction =
  | { type: 'SET_VIEW'; payload: ViewType }
  | { type: 'SET_TOPIC'; payload: Partial<CurrentTopic> }
  | { type: 'SET_VIDEO_CONTENT'; payload: VideoContent | null }
  | { type: 'SET_QUIZ_CONTENT'; payload: QuizContent | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_CONTENT'; payload: ModuleContent | null }
  | { type: 'RESET_LEARNING_STATE' }

// Initial state
const initialState: LearningState = {
  currentView: 'dashboard',
  currentTopic: {
    knowledgeId: null,
    topicId: null,
    topic: null,
    language: 'English'
  },
  videoContent: null,
  quizContent: null,
  sidebarOpen: false,
  content: null
}

// Reducer
const learningReducer = (state: LearningState, action: LearningAction): LearningState => {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload }
    
    case 'SET_TOPIC':
      return {
        ...state,
        currentTopic: { ...state.currentTopic, ...action.payload }
      }
    
    case 'SET_VIDEO_CONTENT':
      return { ...state, videoContent: action.payload }
    
    case 'SET_QUIZ_CONTENT':
      return { ...state, quizContent: action.payload }
    
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    
    case 'SET_CONTENT':
      return { ...state, content: action.payload }
    
    case 'RESET_LEARNING_STATE':
      return {
        ...state,
        content: null,
        videoContent: null,
        quizContent: null,
        currentTopic: {
          ...state.currentTopic,
          knowledgeId: null,
          topicId: null,
          topic: null
        }
      }
    
    default:
      return state
  }
}

// Context
interface LearningContextType {
  state: LearningState
  dispatch: React.Dispatch<LearningAction>
  // Helper functions
  setView: (view: ViewType) => void
  setTopic: (topic: Partial<CurrentTopic>) => void
  setVideoContent: (content: VideoContent | null) => void
  setQuizContent: (content: QuizContent | null) => void
  toggleSidebar: () => void
  setContent: (content: ModuleContent | null) => void
  resetLearningState: () => void
}

const LearningContext = createContext<LearningContextType | undefined>(undefined)

// Provider
interface LearningProviderProps {
  children: ReactNode
}

export const LearningProvider: React.FC<LearningProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(learningReducer, initialState)

  // Helper functions
  const setView = (view: ViewType) => {
    dispatch({ type: 'SET_VIEW', payload: view })
  }

  const setTopic = (topic: Partial<CurrentTopic>) => {
    dispatch({ type: 'SET_TOPIC', payload: topic })
  }

  const setVideoContent = (content: VideoContent | null) => {
    dispatch({ type: 'SET_VIDEO_CONTENT', payload: content })
  }

  const setQuizContent = (content: QuizContent | null) => {
    dispatch({ type: 'SET_QUIZ_CONTENT', payload: content })
  }

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' })
  }

  const setContent = (content: ModuleContent | null) => {
    dispatch({ type: 'SET_CONTENT', payload: content })
  }

  const resetLearningState = () => {
    dispatch({ type: 'RESET_LEARNING_STATE' })
  }

  const value: LearningContextType = {
    state,
    dispatch,
    setView,
    setTopic,
    setVideoContent,
    setQuizContent,
    toggleSidebar,
    setContent,
    resetLearningState
  }

  return (
    <LearningContext.Provider value={value}>
      {children}
    </LearningContext.Provider>
  )
}

// Hook
export const useLearning = (): LearningContextType => {
  const context = useContext(LearningContext)
  if (!context) {
    throw new Error('useLearning must be used within a LearningProvider')
  }
  return context
}

export default LearningContext