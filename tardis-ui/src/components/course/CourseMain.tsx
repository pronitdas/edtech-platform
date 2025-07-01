'use client'

import React, { useMemo } from 'react'
import { Chapter, ChapterContent } from '@/types/api'
import { CourseProvider } from '@/contexts/CourseContext'
import { useCourse } from '@/contexts/CourseContext'
import CourseHeader from './CourseHeader'
import CourseContentRenderer from './CourseContentRenderer'
import { ContentGenerationPanel } from '@/components/content/ContentGenerationPanel'
import ChatbotFloatingButton from '@/components/ChatbotFloatingButton'
import LearningReport from '@/components/LearningReport'
import { useChapters } from '@/hooks/useChapters'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'

import Loader from '@/components/ui/Loader'

interface CourseMainProps {
  content: ChapterContent
  language: string
  chapter: Chapter
}

// Add props interface for CourseContent
interface CourseContentProps {
  content: ChapterContent
  chapter: Chapter
  language: string
}

const CourseContent: React.FC<CourseContentProps> = ({
  content,
  chapter,
  language,
}) => {
  const {
    activeTab,
    showReport,
    isFullscreenMindmap,
    showSettings,
    sidebarOpen,
    isLoading,
    availableTabs,
    toggleSidebar,
    handleTabClick,
    showContentGenerationPanel,
    hideContentGenerationPanel,
    handleMindmapBack,
    generatingTypes,
    handleGenerateContent: generateContentFromHook,
    handleCloseReport,
    handleShowReport,
  } = useCourse()

  const { getMissingContentTypes, isGeneratingContent: isHookGenerating } =
    useChapters()

  const { session } = useInteractionTracker()
  const userId = session?.metadata?.userId

  // Create chaptersMeta array from the current chapter
  const chaptersMeta = useMemo(() => {
    if (!chapter) return []
    return [chapter]
  }, [chapter])

  return (
    <div className='course-viewer flex min-h-screen flex-col bg-gray-900'>
      {/* Course Header Component */}
      <CourseHeader
        chapter={chapter}
        activeTab={activeTab}
        sidebarOpen={sidebarOpen}
        availableTabs={availableTabs}
        getMissingContentTypes={getMissingContentTypes}
        toggleSidebar={toggleSidebar}
        handleTabClick={handleTabClick}
        onShowSettings={showContentGenerationPanel}
        showSettingsButton={
          content ? getMissingContentTypes(content).length > 0 : false
        }
        onShowReport={handleShowReport}
      />

      {/* Main Content Area */}
      <div className='relative flex-grow overflow-hidden'>
        {/* Settings Panel */}
        {showSettings && (
          <ContentGenerationPanel
            chapter={chapter}
            language={language}
            missingTypes={content ? getMissingContentTypes(content) : []}
            onGenerate={generateContentFromHook}
            isGenerating={isHookGenerating}
            onClose={hideContentGenerationPanel}
            generatingTypes={generatingTypes}
          />
        )}

        {/* Content Renderer Component */}
        <CourseContentRenderer
          activeTab={activeTab}
          content={content}
          chapter={chapter}
          language={language}
          chaptersMeta={chaptersMeta}
          isLoading={isLoading}
          showReport={showReport}
          isFullscreenMindmap={isFullscreenMindmap}
          sidebarOpen={sidebarOpen}
          onMindmapBack={handleMindmapBack}
          onToggleMindmapFullscreen={handleMindmapBack}
          onCloseReport={handleCloseReport}
          onGenerateContentRequest={showContentGenerationPanel}
        />

        {/* Chatbot Floating Button */}
        <div className='absolute bottom-4 left-4 z-50'>
          <ChatbotFloatingButton
            contentContext={content?.notes || ''}
            chapterTitle={chapter?.chaptertitle || 'Current Chapter'}
          />
        </div>
      </div>

      {/* Learning Report Modal */}
      {showReport && userId && chapter?.knowledge_id && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
          <div className='max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-gray-800'>
            <LearningReport
              userId={userId}
              knowledgeId={String(chapter.knowledge_id)}
              onClose={handleCloseReport}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Main component with CourseProvider
const CourseMain: React.FC<CourseMainProps> = ({
  content,
  language,
  chapter,
}) => {
  // Ensure we have valid chapter data before rendering
  if (!chapter || !chapter.id) {
    return (
      <div className='flex h-screen flex-col items-center justify-center bg-gray-900 text-white'>
        <Loader size='large' />
        <p className='mt-4'>Loading chapter data...</p>
      </div>
    )
  }

  // Create availableTabs from content
  const getAvailableTabs = () => {
    const tabs = []

    if (content.notes) {
      tabs.push({
        label: 'Notes',
        key: 'notes',
        iconIdentifier: 'FileText',
      })
    }

    if (content.summary) {
      tabs.push({
        label: 'Summary',
        key: 'summary',
        iconIdentifier: 'BookOpen',
      })
    }

    if (content.quiz && content.quiz.length > 0) {
      tabs.push({
        label: 'Quiz',
        key: 'quiz',
        iconIdentifier: 'PieChart',
      })
    }

    if (content.video_url) {
      tabs.push({
        label: 'Video',
        key: 'video',
        iconIdentifier: 'Video',
      })
    }

    if (content.roleplay) {
      tabs.push({
        label: 'Roleplay',
        key: 'roleplay',
        iconIdentifier: 'MessageSquare',
      })
    }

    return tabs
  }

  return (
    <CourseProvider
      content={content}
      chapter={chapter}
      language={language}
      availableTabs={getAvailableTabs()}
    >
      <CourseContent content={content} chapter={chapter} language={language} />
    </CourseProvider>
  )
}

export default CourseMain
