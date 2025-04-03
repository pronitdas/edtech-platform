'use client';

import React, { useEffect, useMemo } from 'react';
import { ChapterContent, ChapterV1 } from '@/types/database';
import { CourseProvider } from '@/contexts/CourseContext';
import { useCourse } from '@/contexts/CourseContext';
import CourseHeader from './CourseHeader';
import CourseContentRenderer from './CourseContentRenderer';
import { ContentGenerationPanel } from '@/components/content/ContentGenerationPanel';
import ChatbotFloatingButton from '@/components/ChatbotFloatingButton';
import LearningReport from '@/components/LearningReport';
import { useChapters } from '@/hooks/useChapters';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { 
  BookOpen, 
  FileText, 
  PieChart, 
  Video, 
  Brain, 
  Play, 
  BarChart2, 
  MessageSquare
} from 'lucide-react';
import { ContentType } from '@/services/edtech-api';
import Loader from '@/components/ui/Loader';

interface CourseMainProps {
  content: ChapterContent;
  language: string;
  chapter: ChapterV1;
}

// Add props interface for CourseContent
interface CourseContentProps {
  content: ChapterContent;
  chapter: ChapterV1;
  language: string;
}

const CourseContent: React.FC<CourseContentProps> = ({ content, chapter, language }) => {
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
  } = useCourse();
  
  const {
    getMissingContentTypes,
    isGeneratingContent: isHookGenerating
  } = useChapters();
  
  const interactionTracker = useInteractionTracker();

  // Create chaptersMeta array from the current chapter
  const chaptersMeta = useMemo(() => {
    if (!chapter) return [];
    return [chapter];
  }, [chapter]);
  
  return (
    <div className="course-viewer bg-gray-900 min-h-screen flex flex-col">
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
        showSettingsButton={content ? getMissingContentTypes(content).length > 0 : false} 
        onShowReport={handleShowReport}
      />
      
      {/* Main Content Area */}
      <div className="flex-grow overflow-hidden relative">
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
        <div className="absolute bottom-4 left-4 z-50">
          <ChatbotFloatingButton 
            contentContext={content?.notes || ''}
            chapterTitle={chapter?.chaptertitle || 'Current Chapter'}
          />
        </div>
      </div>

      {/* Learning Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
            <LearningReport onClose={handleCloseReport} /> 
          </div>
        </div>
      )}
    </div>
  );
};

// Main component with CourseProvider
const CourseMain: React.FC<CourseMainProps> = ({ content, language, chapter }) => {
  // Ensure we have valid chapter data before rendering
  if (!chapter || !chapter.id) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <Loader size="large" />
        <p className="mt-4">Loading chapter data...</p>
      </div>
    );
  }
  
  // Create availableTabs from content
  const getAvailableTabs = () => {
    const tabs = [];
    
    if (content.notes) {
      tabs.push({
        label: "Notes",
        key: "notes",
        icon: <FileText className="w-4 h-4" />
      });
    }
    
    if (content.summary) {
      tabs.push({
        label: "Summary",
        key: "summary",
        icon: <BookOpen className="w-4 h-4" />
      });
    }
    
    if (content.quiz && content.quiz.length > 0) {
      tabs.push({
        label: "Quiz",
        key: "quiz",
        icon: <PieChart className="w-4 h-4" />
      });
    }
    
    if (content.mindmap) {
      tabs.push({
        label: "Mindmap",
        key: "mindmap",
        icon: <Brain className="w-4 h-4" />
      });
    }
    
    if (content.video_url) {
      tabs.push({
        label: "Video",
        key: "video",
        icon: <Video className="w-4 h-4" />
      });
    }
    
    if (content.roleplay) {
      tabs.push({
        label: "Roleplay",
        key: "roleplay",
        icon: <MessageSquare className="w-4 h-4" />
      });
    }
    
    return tabs;
  };
  
  return (
    <CourseProvider 
      content={content} 
      chapter={chapter}
      language={language}
      availableTabs={getAvailableTabs()}
    >
      <CourseContent content={content} chapter={chapter} language={language} />
    </CourseProvider>
  );
};

export default CourseMain; 