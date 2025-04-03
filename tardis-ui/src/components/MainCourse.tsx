'use client';

import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import Quiz from '@/components/Quiz';
import MarkdownSlideshow from '@/components/MarkdownSlideshow';
import Chatbot from './ChatBot';
import VideoPlayer from './VideoPlayer';
import ContentToggle from './ContentToggle';
import InteractiveModule from './InteractiveModule';
import EnhancedMindMap from './EnhancedMindMap';
import LearningReport from './LearningReport';
import RoleplayComponent from './RoleplayComponent';
import Loader from './ui/Loader';
import { ContentGenerationPanel } from './content/ContentGenerationPanel';
import { useChapters } from '@/hooks/useChapters';
import { ContentType } from '@/services/edtech-api';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { generateRoleplayScenarios } from '@/services/edtech-content';
import useAuthState from '@/hooks/useAuth';
import supabase from '@/services/supabase';
import ChatbotFloatingButton from './ChatbotFloatingButton';
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
  RefreshCw
} from 'lucide-react';
import { ChapterContent, ChapterV1, QuizQuestion } from '@/types/database';
import { useCourseState } from '@/hooks/useCourseState';
import CourseHeader from './course/CourseHeader';
import CourseSidebar from './course/CourseSidebar';
import CourseContentRenderer from './course/CourseContentRenderer';

// Import calculators and models
import { getSpecialComponent } from '@/services/component-mapper';

// Define animation modules
const animationModules = [
    {
        title: "Price to Earnings Model",
        component: "PriceToEarningsModel",
        type: "animation" as const,
        relatedVideos: ["Corporate Valuation"],
        description: "Calculate and visualize price to earnings ratios"
    },
    {
        title: "Price to Cash Flow Model",
        component: "PriceToCashFlowModel",
        type: "animation" as const,
        relatedVideos: ["Corporate Valuation"],
        description: "Analyze price to cash flow metrics"
    },
    {
        title: "Price to Dividend Model",
        component: "PriceToDividendModel",
        type: "animation" as const,
        relatedVideos: ["Corporate Valuation"],
        description: "Explore dividend-based valuation"
    },
    {
        title: "Book Value Calculator",
        component: "BookValueCalculator",
        type: "animation" as const,
        relatedVideos: ["Corporate Valuation"],
        description: "Calculate book value to market price ratios"
    },
    {
        title: "Stock Valuation Model",
        component: "StockValuationModel",
        type: "animation" as const,
        relatedVideos: ["Corporate Valuation"],
        description: "Comprehensive stock valuation tool"
    },
    {
        title: "Dividend Growth Calculator",
        component: "DividendGrowthCalculator",
        type: "animation" as const,
        relatedVideos: ["Corporate Valuation"],
        description: "Calculate future dividend growth"
    },
    {
        title: "Discount Rate Model",
        component: "DiscountRateModel",
        type: "animation" as const,
        relatedVideos: ["Corporate Valuation"],
        description: "Analyze discount rates for valuations"
    }
];

// Interface for component state to reduce re-renders
interface CourseState {
    activeTab: string;
    showReport: boolean;
    isFullscreenMindmap: boolean;
    timelineMarkers: any[];
    isLoading: boolean;
    showSettings: boolean;
    generatingTypes: ContentType[];
    isMobileView: boolean;
    sidebarOpen: boolean;
    isGeneratingRoleplay: boolean;
    activeChapterId: string | undefined;
}

// Define a type for the icon map
type IconMap = { [key: string]: React.ComponentType<{ className?: string }> };

// Map icon identifiers to actual Lucide components
const iconMap: IconMap = {
    FileText,
    BookOpen,
    PieChart,
    Brain,
    Video,
    BarChart2,
    // Add other icons if needed by tabs
};

const getIconComponent = (identifier: string): React.ReactElement | null => {
    const IconComponent = iconMap[identifier];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
};

interface MainCourseProps {
    // Expect content and chapter to be potentially null/undefined initially
    content: ChapterContent | null | undefined;
    language: string;
    chapter: ChapterV1 | null | undefined;
}

const MainCourse = ({ content: initialContent, language, chapter: initialChapter }: MainCourseProps) => {

    // TODO: Handle loading state for initial chapter/content fetching if necessary
    // This example assumes initialChapter and initialContent are either loaded or null/undefined

    // Use the custom hook for state management
    const {
        activeTab,
        showReport,
        isFullscreenMindmap,
        isLoading, // Loading state from the hook (e.g., for tab switching simulations)
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
        availableTabs, // These now have iconIdentifiers
        getMissingContentTypes,
        isGeneratingContent, // Function checking specific type generation
        getCurrentContentContext,
        isChapterHookGenerating, // Boolean overall generating flag from useChapters
    } = useCourseState(initialContent, initialChapter, language);

    // Early return if essential data isn't loaded
    if (!initialChapter || !initialContent) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900">
                <Loader size="large" />
            </div>
        );
    }

    // Now we know initialChapter and initialContent are defined
    const chapter = initialChapter;
    const content = initialContent;

    return (
        // Outer container
        <div className="course-viewer bg-gray-900 min-h-screen flex flex-col md:flex-row">

            {/* Header + Main Area Container (Takes full height, relative positioning for children) */} 
            <div className="flex-grow flex flex-col overflow-hidden relative">
                {/* Header */} 
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
                />

                {/* Content + Sidebar Container (Takes remaining space) */} 
                <div className="flex-grow flex overflow-hidden">
                    {/* Content Renderer */} 
                    <div className={`flex-grow h-full overflow-y-auto transition-all duration-300 ${activeTab === 'video' && sidebarOpen ? 'md:w-3/4' : 'w-full'}"`}>
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
                    </div> {/* Closes Content Renderer div */} 

                    {/* Sidebar (Only for Video Tab) */} 
                    {activeTab === 'video' && (
                        <CourseSidebar isOpen={sidebarOpen} />
                    )}
                </div> {/* Closes Content + Sidebar div */} 

                {/* Settings Panel (Absolutely positioned within Header + Main Area container) */} 
                {showSettings && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
                      <ContentGenerationPanel
                          chapter={chapter}
                          language={language}
                          missingTypes={getMissingContentTypes(content)}
                          onGenerate={handleGenerateContent}
                          isGenerating={isChapterHookGenerating}
                          generatingTypes={generatingTypes}
                          onClose={hideContentGenerationPanel}
                      />
                    </div> // Closes Settings Panel div
                )}

                {/* Chatbot Button (Absolutely positioned within Header + Main Area container) */} 
                <div className="absolute bottom-4 left-4 z-30">
                    <ChatbotFloatingButton
                        contentContext={getCurrentContentContext()}
                        chapterTitle={chapter.chaptertitle}
                    />
                </div> {/* Closes Chatbot Button div */} 

            </div> {/* Closes Header + Main Area div */} 

            {/* Learning Report could be a modal triggered outside the main flow */} 

        </div> // Closes Outer container div
    );
};

export default MainCourse;
