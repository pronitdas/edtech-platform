'use client'

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'
import Quiz from '@/components/Quiz'
import MarkdownSlideshow from '@/components/MarkdownSlideshow'
import Chatbot from './ChatBot'
import VideoPlayer from './VideoPlayer'
import ContentToggle from './ContentToggle'
import InteractiveModule from './InteractiveModule'
import EnhancedMindMap from './EnhancedMindMap'
import LearningReport from './LearningReport'
import RoleplayComponent from './RoleplayComponent'
import Loader from './ui/Loader'
import { ContentGenerationPanel } from './content/ContentGenerationPanel'
import { useChapters } from '@/hooks/useChapters'
import { ContentType } from '@/services/edtech-api'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'
import { generateRoleplayScenarios } from '@/services/edtech-content'
import useAuthState from '@/hooks/useAuth'

import ChatbotFloatingButton from './ChatbotFloatingButton'
import {
  BookOpen,
  FileText,
  PieChart,
  Video,
  Brain,
  Play,
  BarChart2,
  ChevronLeft,
  MessageSquare,
  Settings,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react'
import { Chapter, ChapterContent, QuizQuestion } from '@/types/api'
import { useCourseState } from '@/hooks/useCourseState'
import CourseHeader from './course/CourseHeader'
import CourseSidebar from './course/CourseSidebar'
import CourseContentRenderer from './course/CourseContentRenderer'

// Import calculators and models
import { getSpecialComponent } from '@/services/component-mapper'

// Define animation modules
const animationModules = [
  {
    title: 'Price to Earnings Model',
    component: 'PriceToEarningsModel',
    type: 'animation' as const,
    relatedVideos: ['Corporate Valuation'],
    description: 'Calculate and visualize price to earnings ratios',
  },
  {
    title: 'Price to Cash Flow Model',
    component: 'PriceToCashFlowModel',
    type: 'animation' as const,
    relatedVideos: ['Corporate Valuation'],
    description: 'Analyze price to cash flow metrics',
  },
  {
    title: 'Price to Dividend Model',
    component: 'PriceToDividendModel',
    type: 'animation' as const,
    relatedVideos: ['Corporate Valuation'],
    description: 'Explore dividend-based valuation',
  },
  {
    title: 'Book Value Calculator',
    component: 'BookValueCalculator',
    type: 'animation' as const,
    relatedVideos: ['Corporate Valuation'],
    description: 'Calculate book value to market price ratios',
  },
  {
    title: 'Stock Valuation Model',
    component: 'StockValuationModel',
    type: 'animation' as const,
    relatedVideos: ['Corporate Valuation'],
    description: 'Comprehensive stock valuation tool',
  },
  {
    title: 'Dividend Growth Calculator',
    component: 'DividendGrowthCalculator',
    type: 'animation' as const,
    relatedVideos: ['Corporate Valuation'],
    description: 'Calculate future dividend growth',
  },
  {
    title: 'Discount Rate Model',
    component: 'DiscountRateModel',
    type: 'animation' as const,
    relatedVideos: ['Corporate Valuation'],
    description: 'Analyze discount rates for valuations',
  },
]

// Interface for component state to reduce re-renders
interface CourseState {
  activeTab: string
  showReport: boolean
  isFullscreenMindmap: boolean
  timelineMarkers: any[]
  isLoading: boolean
  showSettings: boolean
  generatingTypes: ContentType[]
  isMobileView: boolean
  sidebarOpen: boolean
  isGeneratingRoleplay: boolean
  activeChapterId: string | undefined
}

// Define a type for the icon map
type IconMap = { [key: string]: LucideIcon }

// Map icon identifiers to actual Lucide components
const iconMap: IconMap = {
  FileText,
  BookOpen,
  PieChart,
  Brain,
  Video,
  BarChart2,
  // Add other icons if needed by tabs
}

const getIconComponent = (identifier: string): React.ReactElement | null => {
  const IconComponent = iconMap[identifier]
  return IconComponent ? <IconComponent className='h-4 w-4' /> : null
}

interface MainCourseProps {
  // Expect content and chapter to be potentially null/undefined initially
  content: ChapterContent | null | undefined
  language: string
  chapter: Chapter | null | undefined
}

const MainCourse = ({
  content: initialContent,
  language,
  chapter: initialChapter,
}: MainCourseProps) => {
  // Debug logs to track data flow
  console.log('MainCourse raw props:', {
    initialContent,
    language,
    initialChapter,
    hasContent: !!initialContent,
    hasChapter: !!initialChapter,
    contentType: initialContent ? typeof initialContent : 'undefined',
    chapterType: initialChapter ? typeof initialChapter : 'undefined',
  })

  // Ensure we have at least an empty object for content
  const content = initialContent || {}
  const chapter =
    initialChapter ||
    ({
      id: '0',
      chaptertitle: 'Loading...',
      chapter: '',
      knowledge_id: 0,
      created_at: new Date().toISOString(),
      chapter_type: 'text',
      context: '',
      k_id: 0,
      level: 1,
      lines: 0,
      metadata: null,
      needs_code: false,
      needs_latex: false,
      needs_roleplay: false,
      seeded: false,
      subtopic: '',
      timestamp_end: null,
      timestamp_start: null,
      topic: 'General',
      type: null,
    } satisfies Chapter)

  console.log('MainCourse processed data:', {
    content,
    chapter,
    isContentEmpty: Object.keys(content).length === 0,
    isChapterDefault: chapter.id === '0',
  })

  // Use the custom hook for state management
  const {
    activeTab,
    showReport,
    isFullscreenMindmap,
    isLoading,
    showSettings,
    generatingTypes,
    isMobileView,
    sidebarOpen,
    isGeneratingRoleplay,
    handleTabClick,
    toggleSidebar,
    handleMindmapBack,
    toggleMindmapFullscreen,
    showContentGenerationPanel,
    hideContentGenerationPanel,
    handleGenerateContent,
    handleGenerateRoleplay,
    handleCloseReport,
    handleShowReport,
    availableTabs,
    getMissingContentTypes,
    isGeneratingContent,
    getCurrentContentContext,
    isChapterHookGenerating,
  } = useCourseState(content, chapter, language || 'en')

  console.log('Course state:', {
    activeTab,
    availableTabs,
    showSettings,
    content,
  })

  // Show loading state if we don't have real content yet
  if (!initialContent || !initialChapter) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-900'>
        <Loader size='large' />
      </div>
    )
  }

  return (
    <div className='course-viewer flex min-h-screen flex-col bg-gray-900 md:flex-row'>
      <div className='relative flex flex-grow flex-col overflow-hidden'>
        <CourseHeader
          chapter={chapter}
          activeTab={activeTab}
          availableTabs={availableTabs}
          handleTabClick={handleTabClick}
          onShowSettings={showContentGenerationPanel}
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          showSettingsButton={getMissingContentTypes(content).length > 0}
          getMissingContentTypes={getMissingContentTypes}
          onShowReport={handleShowReport}
        />

        <div className='flex flex-grow overflow-hidden'>
          <div
            className={`h-full flex-grow overflow-y-auto transition-all duration-300 ${activeTab === 'video' && sidebarOpen ? 'md:w-3/4' : 'w-full'}`}
          >
            <CourseContentRenderer
              activeTab={activeTab}
              content={content}
              chapter={chapter}
              isLoading={isLoading}
              showReport={showReport}
              isFullscreenMindmap={isFullscreenMindmap}
              sidebarOpen={sidebarOpen}
              onMindmapBack={handleMindmapBack}
              onToggleMindmapFullscreen={toggleMindmapFullscreen}
              onCloseReport={handleCloseReport}
              onGenerateContentRequest={showContentGenerationPanel}
            />
          </div>

          {activeTab === 'video' && <CourseSidebar isOpen={sidebarOpen} />}
        </div>

        {showSettings && (
          <div className='absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4'>
            <ContentGenerationPanel
              chapter={chapter}
              language={language || 'en'}
              missingTypes={getMissingContentTypes(content)}
              onGenerate={handleGenerateContent}
              isGenerating={isChapterHookGenerating}
              generatingTypes={generatingTypes}
              onClose={hideContentGenerationPanel}
            />
          </div>
        )}

        <div className='absolute bottom-4 left-4 z-30'>
          <ChatbotFloatingButton
            contentContext={getCurrentContentContext()}
            chapterTitle={chapter.chaptertitle}
          />
        </div>
      </div>
    </div>
  )
}

export default MainCourse
