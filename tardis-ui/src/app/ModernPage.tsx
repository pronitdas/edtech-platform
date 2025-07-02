'use client'

import React, { lazy, Suspense, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

// Contexts and Hooks
import { InteractionTrackerProvider } from '@/contexts/InteractionTrackerContext'
import { LearningProvider, useLearning } from '@/contexts/LearningContext'
import { useUser } from '@/contexts/UserContext'
import { useKnowledgeData } from '@/hooks/useKnowledgeData'
import { useLanguage } from '@/hooks/useLanguage'
import { useChapters } from '@/hooks/useChapters'
import usePerformanceTracking from '@/hooks/usePerformanceTracking'

// Services
import { analyticsService } from '@/services/analytics-service'

// Components - Lazy loaded for performance
const RealDashboard = lazy(() => import('@/components/RealDashboard'))
const KnowledgeSelector = lazy(() => import('@/components/learning/KnowledgeSelector'))
const ChapterView = lazy(() => import('@/components/learning/ChapterView'))
const CourseContent = lazy(() => import('@/components/learning/CourseContent'))
const LearningModule = lazy(() => import('@/components/learning/LearningModule'))
const NavigationHeader = lazy(() => import('@/components/learning/NavigationHeader'))

// UI Components
import Loader from '@/components/ui/Loader'
import ChapterAdapter from '@/components/ChapterAdapter'
import { LearningDashboard } from '@/components/analytics/LearningDashboard'

// Types
import { Chapter } from '@/types/api'
import type { ModuleContent, VideoContent, QuizContent } from '@/types/content'

const LoadingFallback = () => (
  <div className="flex h-full items-center justify-center">
    <Loader size="medium" color="green" />
  </div>
)

const LearningOrchestrator: React.FC = () => {
  // Performance tracking
  usePerformanceTracking('learning-app')
  
  // User and navigation
  const { user } = useUser()
  const navigate = useNavigate()
  
  // Learning state
  const { state, setView, setTopic, setVideoContent, setQuizContent, toggleSidebar, setContent } = useLearning()
  const { currentView, currentTopic, videoContent, quizContent, sidebarOpen, content } = state
  
  // Data hooks
  const { knowledge } = useKnowledgeData()
  const { language, setLanguage } = useLanguage()
  const {
    uploadedFiles,
    chaptersMeta,
    fetchChapters,
    fetchChapterMeta,
    getEdTechContentForChapter,
    fetchKnowledgeData,
  } = useChapters()

  // User authentication check
  const userId = user?.id
  if (!userId) {
    navigate('/login')
    return null
  }

  // Navigation handlers
  const handleNavigateToLearning = useCallback(() => {
    setView('knowledge_selection')
  }, [setView])

  const handleNavigateToDashboard = useCallback(() => {
    setView('dashboard')
    setContent(null)
    setTopic({
      knowledgeId: null,
      topicId: null,
      topic: null,
      language: language,
    })
  }, [setView, setContent, setTopic, language])

  const handleKnowledgeClick = useCallback(async (id: string) => {
    const numericId = parseInt(id)
    await fetchChapters(numericId, language)
    setTopic({ ...currentTopic, knowledgeId: numericId, topic: null })
    await fetchChapterMeta(numericId, language)
    await fetchKnowledgeData(numericId)
    setView('chapter_selection')
    setContent(null)
  }, [currentTopic, fetchChapters, fetchChapterMeta, fetchKnowledgeData, language, setTopic, setView, setContent])

  const handleChapterClick = useCallback(async (chapter: Chapter) => {
    if (currentTopic.topic?.id !== chapter.id) {
      const content = await getEdTechContentForChapter(chapter, language)
      if (content) {
        setTopic({ topic: chapter, language })
        setView('course_content')
      }
    }
  }, [language, currentTopic, getEdTechContentForChapter, setTopic, setView])

  const handleModuleSelect = useCallback((moduleType: string, moduleContent: any) => {
    let actualContent = moduleContent

    // Handle nested content structure
    if (moduleContent?.version && typeof moduleContent === 'object') {
      const keys = Object.keys(moduleContent).filter(k => k !== 'version')
      if (keys.length === 1 && typeof moduleContent[keys[0]!] === 'object') {
        actualContent = moduleContent[keys[0]!]
      }
    }

    if (!actualContent || typeof actualContent !== 'object') {
      console.error('Invalid module content:', actualContent)
      return
    }

    if (moduleType === 'video' && actualContent.id && actualContent.url) {
      setVideoContent(actualContent)
      setView('learning_module')
    } else if (moduleType === 'quiz' && actualContent.id && actualContent.title && Array.isArray(actualContent.questions)) {
      setQuizContent(actualContent)
      setView('learning_module')
    }
  }, [setVideoContent, setQuizContent, setView])

  const handleBack = useCallback(() => {
    switch (currentView) {
      case 'learning_module':
        setView('course_content')
        setVideoContent(null)
        setQuizContent(null)
        break
      case 'course_content':
        setView('chapter_selection')
        setContent(null)
        break
      case 'chapter_selection':
        setView('knowledge_selection')
        setContent(null)
        break
      case 'knowledge_selection':
        setView('dashboard')
        setContent(null)
        break
    }
  }, [currentView, setView, setVideoContent, setQuizContent, setContent])

  // Effects for data fetching
  useEffect(() => {
    if (currentTopic.knowledgeId) {
      fetchChapterMeta(currentTopic.knowledgeId, language)
    }
  }, [currentTopic.knowledgeId, language, fetchChapterMeta])

  useEffect(() => {
    if (currentView === 'course_content' && currentTopic.topic) {
      getEdTechContentForChapter(currentTopic.topic, language)
    }
  }, [currentView, currentTopic.topic, language, getEdTechContentForChapter])

  return (
    <div className='flex h-screen w-screen flex-col overflow-hidden bg-gray-900 shadow-lg'>
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        {currentView !== 'dashboard' && currentView !== 'knowledge_selection' && (
          <aside
            className={`${
              sidebarOpen ? 'absolute inset-y-0 left-0 z-50' : 'hidden'
            } flex-col overflow-hidden border-r border-gray-700 bg-gray-800 text-white shadow-lg md:relative md:flex md:w-1/4 md:min-w-[250px] md:max-w-[300px]`}
          >
            {/* Mobile close button */}
            <button
              className='absolute right-2 top-2 rounded-full bg-gray-700 p-1 text-gray-300 md:hidden'
              onClick={toggleSidebar}
            >
              <X className='h-5 w-5' />
            </button>

            {/* Progress tracker */}
            {currentTopic.knowledgeId && (
              <div className='border-b border-gray-700 p-3 sm:p-4'>
                <h3 className='mb-2 text-lg font-semibold'>Your Progress</h3>
                <LearningDashboard
                  userId={String(userId)}
                  courseId={currentTopic.knowledgeId?.toString() || ''}
                  compact={true}
                />
              </div>
            )}

            {/* Chapter list */}
            {uploadedFiles.length > 0 && (
              <div className='flex-1 overflow-y-auto'>
                <div className='border-b border-gray-700 p-3 sm:p-4'>
                  <h3 className='mb-2 text-lg font-semibold'>Chapters</h3>
                </div>
                <div className='sidebar-chapters overflow-y-auto'>
                  <ChapterAdapter
                    chaptersMeta={chaptersMeta}
                    onLessonClick={chapter => {
                      handleChapterClick(chapter)
                      if (sidebarOpen) toggleSidebar()
                    }}
                    chapters={uploadedFiles as Chapter[]}
                    compact={true}
                  />
                </div>
              </div>
            )}
          </aside>
        )}

        <main className='flex flex-grow flex-col overflow-hidden'>
          {/* Navigation Header */}
          <Suspense fallback={<div className="h-16 bg-gray-800" />}>
            <NavigationHeader
              currentView={currentView}
              language={language}
              onLanguageChange={setLanguage}
              onBack={handleBack}
              onNavigateToDashboard={handleNavigateToDashboard}
              onToggleSidebar={toggleSidebar}
              showSidebarToggle={currentView !== 'dashboard' && currentView !== 'knowledge_selection'}
            />
          </Suspense>

          {/* Main content area */}
          <div className='flex-grow overflow-auto'>
            <Suspense fallback={<LoadingFallback />}>
              {currentView === 'dashboard' && (
                <RealDashboard 
                  userId={String(userId)}
                  userName={user?.name || 'Student'}
                  onNavigateToLearning={handleNavigateToLearning}
                />
              )}

              {currentView === 'knowledge_selection' && (
                <KnowledgeSelector onKnowledgeClick={handleKnowledgeClick} />
              )}

              {currentView === 'chapter_selection' && <ChapterView />}

              {currentView === 'course_content' && (
                <CourseContent
                  content={content}
                  language={language}
                  currentTopic={currentTopic.topic}
                />
              )}

              {currentView === 'learning_module' && (
                <LearningModule
                  videoContent={videoContent}
                  quizContent={quizContent}
                  userId={String(userId)}
                  knowledgeId={currentTopic.knowledgeId}
                />
              )}
            </Suspense>
          </div>

          {/* Footer */}
          {currentView !== 'dashboard' && (
            <div className='flex items-center justify-center gap-2 border-t border-gray-700 bg-gray-800 p-2 text-sm text-white sm:gap-4 sm:p-4'>
              <img
                className='h-[20px] w-[20px] sm:h-[30px] sm:w-[30px]'
                src='./trs.svg'
                alt='TRS Logo'
              />
              <span>Made with love at TRS</span>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

const ModernPage: React.FC = () => {
  const { user } = useUser()
  const userId = user?.id

  if (!userId) {
    return null
  }

  return (
    <InteractionTrackerProvider
      dataService={analyticsService}
      userId={String(userId)}
    >
      <LearningProvider>
        <LearningOrchestrator />
      </LearningProvider>
    </InteractionTrackerProvider>
  )
}

export default ModernPage