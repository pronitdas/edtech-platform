'use client'

import { useCallback, useEffect, useState } from 'react'
import FileUploader from '@/components/FileUploader'
import CourseMain from '@/components/course/CourseMain'
import ChapterAdapter from '@/components/ChapterAdapter'
import Knowledge from '@/components/Knowledge'
import { useKnowledgeData } from '@/hooks/useKnowledgeData'
import { useLanguage } from '@/hooks/useLanguage'
import { useChapters } from '@/hooks/useChapters'
import useAuth from '@/hooks/useAuth'
import Loader from '@/components/ui/Loader'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { QuizComponent } from '@/components/quiz/QuizComponent'
import { LearningDashboard } from '@/components/analytics/LearningDashboard'
import { InteractionTrackerProvider } from '@/contexts/InteractionTrackerContext'
import { analyticsService } from '@/services/analytics-service'
import { ChevronLeft, Menu, X } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useNavigate } from 'react-router-dom'
import { Chapter, ChapterContent, QuizQuestion } from '@/types/api'

// Enum for application views
const VIEW_TYPES = {
  KNOWLEDGE_SELECTION: 'knowledge_selection',
  CHAPTER_SELECTION: 'chapter_selection',
  COURSE_CONTENT: 'course_content',
  LEARNING_MODULE: 'learning_module',
}

function EdtechApp() {
  // User auth state - use a simpler approach for user ID
  const { user } = useUser()
  const navigate = useNavigate() // Initialize useNavigate hook

  let userId = null
  if (user) {
    userId = user.id // We'll use a fixed ID for now, in a real app this would come from auth
  } else {
    navigate('/login')
  }

  // Knowledge and language hooks
  const { knowledge } = useKnowledgeData()
  const { language, setLanguage } = useLanguage()

  // Chapters and content state
  const {
    uploadedFiles,
    content,
    setContent,
    chaptersMeta,
    fetchChapters,
    fetchChapterMeta,
    getEdTechContentForChapter,
    fetchKnowledgeData,
  } = useChapters()

  // Application state
  const [currentView, setCurrentView] = useState(VIEW_TYPES.KNOWLEDGE_SELECTION)
  const [currentTopic, setCurrentTopic] = useState<{
    knowledgeId: number | null
    topicId: string | null
    topic: Chapter | null
    language: string
  }>({
    knowledgeId: null,
    topicId: null,
    topic: null,
    language: language,
  })

  // Learning module content
  const [videoContent, setVideoContent] = useState<any>(null)
  const [quizContent, setQuizContent] = useState<any>(null)

  // Sidebar mobile toggle state
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Handle knowledge domain selection
  const handleKnowledgeClick = async (id: string) => {
    const numericId = parseInt(id)
    await fetchChapters(numericId, language)
    setCurrentTopic({ ...currentTopic, knowledgeId: numericId, topic: null })
    await fetchChapterMeta(numericId, language)
    await fetchKnowledgeData(numericId)
    setCurrentView(VIEW_TYPES.CHAPTER_SELECTION)
    setContent(null)
  }

  // Handle chapter/topic selection
  const handleChapterClick = useCallback(
    async (chapter: Chapter) => {
      console.log('Chapter clicked:', chapter) // Debug log
      if (currentTopic.topic?.id !== chapter.id) {
        console.log('Loading chapter content for:', chapter) // Debug log
        const content = await getEdTechContentForChapter(chapter, language)
        if (content) {
          setCurrentTopic(prev => ({ ...prev, topic: chapter, language }))
          setCurrentView(VIEW_TYPES.COURSE_CONTENT)
        } else {
          console.error('Failed to load chapter content')
        }
      } else {
        console.log('Chapter already selected:', chapter) // Debug log
      }
    },
    [language, currentTopic, getEdTechContentForChapter, setCurrentView]
  )

  // Handle navigation to learning module (video, quiz, etc.)
  const handleModuleSelect = (moduleType: string, moduleContent: any) => {
    console.log(
      `handleModuleSelect called with type: ${moduleType}, content:`,
      moduleContent
    ) // Add logging

    let actualContent = moduleContent

    // Attempt to extract nested content if moduleContent has keys like 'version' and a dynamic content key
    // This structure was observed in logs, e.g., { version: "1", "some-key-v1": { ...data... } }
    if (
      moduleContent &&
      typeof moduleContent === 'object' &&
      !Array.isArray(moduleContent) &&
      moduleContent.version
    ) {
      const keys = Object.keys(moduleContent).filter(k => k !== 'version')
      if (
        keys.length === 1 &&
        typeof moduleContent[keys[0]!] === 'object' &&
        moduleContent[keys[0]!] !== null
      ) {
        console.log(`Extracting nested content under key: ${keys[0]}`)
        actualContent = moduleContent[keys[0]!]
      } else if (keys.length > 1) {
        console.warn(
          "Module content has 'version' but multiple other keys, structure unclear:",
          moduleContent
        )
        // Proceeding with original moduleContent, hoping it's the correct flat structure somehow
        actualContent = moduleContent
      }
      // If keys.length === 0, actualContent remains moduleContent, which might be just { version: "..." } - error handled below
    }

    // General check for invalid content after potential extraction
    if (!actualContent || typeof actualContent !== 'object') {
      console.error(
        `Invalid or non-object moduleContent received for type ${moduleType} after potential extraction:`,
        actualContent
      )
      // Optionally reset state or show an error to the user
      // For now, just prevent changing the view
      // Consider navigating back: setCurrentView(VIEW_TYPES.COURSE_CONTENT);
      return
    }

    if (moduleType === 'video') {
      // Basic validation for video content
      if (actualContent && actualContent.id && actualContent.url) {
        setVideoContent(actualContent)
        setCurrentView(VIEW_TYPES.LEARNING_MODULE)
      } else {
        console.error('Invalid video content structure:', actualContent)
        // Handle error - maybe go back or show message
        // Consider navigating back: setCurrentView(VIEW_TYPES.COURSE_CONTENT);
      }
    } else if (moduleType === 'quiz') {
      // Basic validation for quiz content
      if (
        actualContent &&
        actualContent.id &&
        actualContent.title &&
        Array.isArray(actualContent.questions)
      ) {
        setQuizContent(actualContent)
        setCurrentView(VIEW_TYPES.LEARNING_MODULE)
      } else {
        console.error('Invalid quiz content structure:', actualContent)
        // Handle error - maybe go back or show message
        // Consider navigating back: setCurrentView(VIEW_TYPES.COURSE_CONTENT);
      }
    } else {
      console.warn(`Unhandled module type in handleModuleSelect: ${moduleType}`)
      // Don't change view if type is unknown or content was invalid
    }
  }

  // Handle back button logic
  const handleBack = () => {
    switch (currentView) {
      case VIEW_TYPES.LEARNING_MODULE:
        setCurrentView(VIEW_TYPES.COURSE_CONTENT)
        setVideoContent(null)
        setQuizContent(null)
        break
      case VIEW_TYPES.COURSE_CONTENT:
        setCurrentView(VIEW_TYPES.CHAPTER_SELECTION)
        setContent(null)
        break
      case VIEW_TYPES.CHAPTER_SELECTION:
        setCurrentView(VIEW_TYPES.KNOWLEDGE_SELECTION)
        setContent(null)
        break
      default:
        // Do nothing if we're already at the root view
        break
    }
  }

  // Fetch chapter metadata when knowledge or language changes
  useEffect(() => {
    if (currentTopic.knowledgeId) {
      fetchChapterMeta(currentTopic.knowledgeId, language)
    }
  }, [currentTopic.knowledgeId, language])

  // Fetch course content when topic changes
  useEffect(() => {
    if (currentView === VIEW_TYPES.COURSE_CONTENT && currentTopic.topic) {
      getEdTechContentForChapter(currentTopic.topic, language)
    }
  }, [currentView, currentTopic.topic, language])

  return (
    <InteractionTrackerProvider
      dataService={analyticsService}
      userId={userId || ''}
    >
      <div className='flex h-screen w-screen flex-col overflow-hidden bg-gray-900 shadow-lg'>
        {/* Main content area with sidebar */}
        <div className='flex flex-1 overflow-hidden'>
          {/* Sidebar - Show in all views except knowledge selection */}
          {currentView !== VIEW_TYPES.KNOWLEDGE_SELECTION && (
            <aside
              className={`${sidebarOpen ? 'absolute inset-y-0 left-0 z-50' : 'hidden'} flex-col overflow-hidden border-r border-gray-700 bg-gray-800 text-white shadow-lg md:relative md:flex md:w-1/4 md:min-w-[250px] md:max-w-[300px]`}
            >
              {/* Mobile close button */}
              <button
                className='absolute right-2 top-2 rounded-full bg-gray-700 p-1 text-gray-300 md:hidden'
                onClick={toggleSidebar}
              >
                <X className='h-5 w-5' />
              </button>

              {/* Course Completion Tracker */}
              {currentTopic.knowledgeId && (
                <div className='border-b border-gray-700 p-3 sm:p-4'>
                  <h3 className='mb-2 text-lg font-semibold'>Your Progress</h3>
                  <LearningDashboard
                    userId={userId || ''}
                    courseId={currentTopic.knowledgeId?.toString() || ''}
                    compact={true}
                  />
                </div>
              )}

              {/* Chapter Selector */}
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
                        if (sidebarOpen) setSidebarOpen(false)
                      }}
                      chapters={uploadedFiles as Chapter[]}
                      compact={true}
                    />
                  </div>
                </div>
              )}

              {/* File uploader - only show in chapter selection view */}
            </aside>
          )}

          <main className='flex flex-grow flex-col overflow-hidden'>
            {/* Top navigation bar with back button, sidebar toggle and language selector */}
            {currentView !== VIEW_TYPES.KNOWLEDGE_SELECTION && (
              <div className='flex items-center justify-between border-b border-gray-700 bg-gray-800 p-2 text-white sm:p-3'>
                <div className='flex items-center gap-2'>
                  {/* Mobile sidebar toggle */}
                  <button
                    onClick={toggleSidebar}
                    className='rounded bg-gray-700 p-1.5 text-white md:hidden'
                  >
                    <Menu className='h-5 w-5' />
                  </button>

                  <button
                    onClick={handleBack}
                    className='flex items-center gap-1 rounded-md bg-blue-500 px-3 py-1 text-sm transition-colors hover:bg-blue-600 sm:text-base'
                  >
                    <ChevronLeft className='h-4 w-4' />
                    <span>Back</span>
                  </button>
                </div>
                <LanguageSelector language={language} onChange={setLanguage} />
              </div>
            )}

            {/* Main content area */}
            <div className='flex-grow overflow-auto'>
              {currentView === VIEW_TYPES.KNOWLEDGE_SELECTION && (
                <div className='flex h-full flex-col md:flex-row'>
                  {/* Sidebar for knowledge selection view */}
                  <aside className='w-full overflow-y-auto border-b border-gray-700 bg-gray-800 p-3 text-white sm:p-4 md:w-1/4 md:min-w-[250px] md:max-w-[300px] md:border-b-0 md:border-r'>
                    <FileUploader />
                  </aside>

                  {/* Knowledge grid */}
                  <div className='flex-1 overflow-auto'>
                    <Knowledge
                      dimensions={knowledge}
                      onClick={handleKnowledgeClick}
                    />
                  </div>
                </div>
              )}

              {currentView === VIEW_TYPES.CHAPTER_SELECTION && (
                <div className='flex h-full w-full items-center justify-center text-white'>
                  <div className='mx-auto max-w-md p-6 text-center'>
                    <h2 className='mb-4 text-2xl font-bold'>
                      Select a Chapter
                    </h2>
                    <p className='mb-4 text-gray-400'>
                      Please select a chapter from the sidebar to view its
                      content.
                    </p>
                  </div>
                </div>
              )}

              {currentView === VIEW_TYPES.COURSE_CONTENT && (
                <div className='flex h-full flex-col'>
                  <div className='flex-grow'>
                    {content && currentTopic.topic ? (
                      <CourseMain
                        content={content}
                        language={language}
                        chapter={currentTopic.topic}
                      />
                    ) : (
                      <div className='flex h-full items-center justify-center'>
                        <Loader size='medium' color='green' />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentView === VIEW_TYPES.LEARNING_MODULE && (
                <div className='grid grid-cols-1 gap-4 p-3 sm:gap-8 sm:p-6 lg:grid-cols-3'>
                  <div className='space-y-6 sm:space-y-8 lg:col-span-2'>
                    {videoContent && (
                      <section>
                        <h2 className='mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl'>
                          Video Lesson
                        </h2>
                        <div className='overflow-hidden rounded-lg bg-gray-800 shadow-lg'>
                          <VideoPlayer
                            contentId={videoContent.id}
                            videoUrl={videoContent.url}
                            title={videoContent.title}
                            poster={videoContent.thumbnail}
                          />
                        </div>
                      </section>
                    )}

                    {quizContent && (
                      <section>
                        <h2 className='mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl'>
                          Knowledge Check
                        </h2>
                        <div className='overflow-hidden rounded-lg bg-gray-800 p-4 shadow-lg'>
                          <QuizComponent
                            quizId={quizContent.id}
                            title={quizContent.title}
                            questions={quizContent.questions}
                          />
                        </div>
                      </section>
                    )}
                  </div>

                  <div className='lg:col-span-1'>
                    <h2 className='mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl'>
                      Your Progress
                    </h2>
                    <div className='overflow-hidden rounded-lg bg-gray-800 shadow-lg'>
                      <LearningDashboard
                        userId={userId || ''}
                        courseId={currentTopic.knowledgeId?.toString() || ''}
                        compact={window.innerWidth < 1024}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <Footer />
          </main>
        </div>
      </div>
    </InteractionTrackerProvider>
  )
}

const LanguageSelector = ({
  language,
  onChange,
}: {
  language: string
  onChange: (lang: string) => void
}) => (
  <select
    value={language}
    onChange={e => onChange(e.target.value)}
    className='rounded-md border border-gray-600 bg-gray-700 px-2 py-1 text-sm text-white sm:px-3 sm:py-1'
  >
    <option value='English'>English</option>
    <option value='Hindi'>Hindi</option>
    <option value='Vietnamese'>Vietnamese</option>
    <option value='Bengali'>Bengali</option>
    <option value='Marathi'>Marathi</option>
  </select>
)

const Footer = () => (
  <div className='flex items-center justify-center gap-2 border-t border-gray-700 bg-gray-800 p-2 text-sm text-white sm:gap-4 sm:p-4'>
    <img
      className='h-[20px] w-[20px] sm:h-[30px] sm:w-[30px]'
      src='./trs.svg'
      alt='TRS Logo'
    />
    <span>Made with love at TRS</span>
  </div>
)

export default EdtechApp
