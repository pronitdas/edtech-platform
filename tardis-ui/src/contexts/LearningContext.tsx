import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { Chapter } from '@/types/api'
import type { VideoContent, QuizContent, ModuleContent } from '@/types/content'
import { DynamicApiClient } from '@/services/dynamic-api-client'
import { useAuth } from './AuthContext'

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
  apiClient: DynamicApiClient | null
  // Helper functions
  setView: (view: ViewType) => void
  setTopic: (topic: Partial<CurrentTopic>) => void
  setVideoContent: (content: VideoContent | null) => void
  setQuizContent: (content: QuizContent | null) => void
  toggleSidebar: () => void
  setContent: (content: ModuleContent | null) => void
  resetLearningState: () => void
  // API helper functions
  fetchKnowledgeFiles: (knowledgeId: number) => Promise<any>
  startProcessing: (knowledgeId: number, options?: any) => Promise<any>
  getProcessingStatus: (knowledgeId: number) => Promise<any>
  getChapterData: (knowledgeId: number, options?: any) => Promise<any>
}

const LearningContext = createContext<LearningContextType | undefined>(undefined)

// Provider
interface LearningProviderProps {
  children: ReactNode
}

export const LearningProvider: React.FC<LearningProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(learningReducer, initialState)
  const { apiClient } = useAuth()

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

  // API helper functions
  const fetchKnowledgeFiles = async (knowledgeId: number) => {
    if (!apiClient) throw new Error('API client not available')
    return await (apiClient as any).getKnowledgeFilesKnowledgeKnowledgeIdFilesGet({
      knowledge_id: knowledgeId
    })
  }

  const startProcessing = async (knowledgeId: number, options: any = {}) => {
    if (!apiClient) throw new Error('API client not available')
    return await (apiClient as any).startProcessingProcessKnowledgeIdGet({
      knowledge_id: knowledgeId,
      generate_content: options.generate_content || true,
      content_types: options.content_types || ['notes', 'summary', 'quiz'],
      content_language: options.content_language || 'English'
    })
  }

  const getProcessingStatus = async (knowledgeId: number) => {
    if (!apiClient) throw new Error('API client not available')
    return await (apiClient as any).getProcessingStatusProcessKnowledgeIdStatusGet({
      knowledge_id: knowledgeId
    })
  }

  const getChapterData = async (knowledgeId: number, options: any = {}) => {
    if (!apiClient) throw new Error('API client not available')
    return await (apiClient as any).getChapterDataChaptersKnowledgeIdGet({
      knowledge_id: knowledgeId,
      chapter_id: options.chapter_id,
      types: options.types,
      language: options.language || 'English'
    })
  }

  const value: LearningContextType = {
    state,
    dispatch,
    apiClient,
    setView,
    setTopic,
    setVideoContent,
    setQuizContent,
    toggleSidebar,
    setContent,
    resetLearningState,
    fetchKnowledgeFiles,
    startProcessing,
    getProcessingStatus,
    getChapterData
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