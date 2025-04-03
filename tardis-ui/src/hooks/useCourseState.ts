import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ContentType } from '@/services/edtech-api';
import { ChapterContent, ChapterV1 } from '@/types/database';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { useChapters } from '@/hooks/useChapters';
import useAuthState from '@/hooks/useAuth';
import { generateRoleplayScenarios } from '@/services/edtech-content';
import { BookOpen as BookOpenIcon } from 'lucide-react'; // Import a specific icon

// Define TabConfig type - Icon is now a string identifier
interface TabConfig {
  label: string;
  key: string;
  iconIdentifier: string; // e.g., 'FileText', 'BookOpen'
}

// Config for the Original content tab
const OG_TAB_CONFIG: TabConfig = {
  label: "Original", 
  key: "og", 
  iconIdentifier: "BookOpen" // Using BookOpen icon for original content
};

// Base tab structure with icon identifiers
const BASE_TABS: Omit<TabConfig, 'icon'>[] = [
  { label: "Notes", key: "notes", iconIdentifier: "FileText" },
  { label: "Summary", key: "summary", iconIdentifier: "BookOpen" },
  { label: "Quiz", key: "quiz", iconIdentifier: "PieChart" },
  { label: "Mindmap", key: "mindmap", iconIdentifier: "Brain" },
  { label: "Video", key: "video", iconIdentifier: "Video" },
  // { label: "Report", key: "report", iconIdentifier: "BarChart2" }, // Remove Report from base tabs
  // TODO: Add Roleplay, Interactive Modules etc. here
];

// Helper to check if a tab should be available based on content
const isTabAvailable = (tabKey: string, content: ChapterContent | null | undefined): boolean => {
    if (!content) return false; // No content, no tabs (except OG handled separately)
    switch (tabKey) {
        case 'notes': return Boolean(content.notes);
        case 'summary': return Boolean(content.summary);
        case 'quiz': return Boolean(content.quiz && content.quiz.length > 0);
        case 'mindmap': return Boolean(content.mindmap);
        case 'video': return Boolean(content.video_url);
        case 'og': return false; // OG content availability is checked separately via chapter prop
        // Add cases for other types
        default: return false;
    }
};

// Interface for the hook's state
interface CourseState {
  activeTab: string;
  showReport: boolean;
  isFullscreenMindmap: boolean;
  // timelineMarkers: any[]; // Consider moving marker logic if tied to video player state
  isLoading: boolean;
  showSettings: boolean;
  generatingTypes: ContentType[];
  isMobileView: boolean;
  sidebarOpen: boolean;
  isGeneratingRoleplay: boolean;
  // activeChapterId: string | undefined; // If chapter change logic moves here
}

// Interface for the hook's return value
interface UseCourseStateReturn extends CourseState {
  // State Setters/Updaters exposed by the hook
  handleTabClick: (tabKey: string) => void;
  toggleSidebar: () => void;
  handleMindmapBack: () => void;
  toggleMindmapFullscreen: () => void;
  showContentGenerationPanel: () => void;
  hideContentGenerationPanel: () => void;
  handleGenerateContent: (type: ContentType) => Promise<void>;
  handleGenerateRoleplay: () => Promise<void>;
  handleCloseReport: () => void;
  handleShowReport: () => void; // Add function to show report
  availableTabs: TabConfig[]; // Use the defined TabConfig
  getMissingContentTypes: (content: ChapterContent | null | undefined) => ContentType[];
  isGeneratingContent: (type: ContentType) => boolean; // Function checking local state
  // Add other handlers as needed, e.g., handleChapterChange, handleVideoMarkerClick
  getCurrentContentContext: () => string;
  isChapterHookGenerating: boolean; // Boolean flag from useChapters hook
}

// Initial state calculation helper
const getInitialActiveTab = (content: ChapterContent | null | undefined): string => {
    // Use the helper function to find the first available tab or default
    const firstAvailable = BASE_TABS.find(tab => isTabAvailable(tab.key, content));
    return firstAvailable ? firstAvailable.key : 'notes'; // Default to notes if nothing else
};

export const useCourseState = (initialContent: ChapterContent | null | undefined, chapter: ChapterV1 | null | undefined, language: string): UseCourseStateReturn => {
  const { notes, latex_code, mindmap, quiz = [], summary, og: generatedOgField, video_url } = initialContent || {};
  const interactionTracker = useInteractionTracker();
  const { 
    generateMissingContent, 
    getMissingContentTypes, 
    isGeneratingContent: isChapterHookGenerating
  } = useChapters();
  const { oAiKey } = useAuthState();

  // Determine initial active tab based on chapter.chapter presence
  const determineInitialTab = () => {
    if (chapter?.chapter) { // Check chapter.chapter instead of chapter.og
      return OG_TAB_CONFIG.key; // Default to 'og' if original chapter content exists
    }
    // Fallback: Find the first available *generated* content tab
    const firstAvailableGenerated = BASE_TABS.find(tab => isTabAvailable(tab.key, initialContent));
    return firstAvailableGenerated ? firstAvailableGenerated.key : OG_TAB_CONFIG.key; // Default to OG if available, else maybe first in list? or handle no tabs case
  };

  const [state, setState] = useState<CourseState>(() => ({
    activeTab: determineInitialTab(), // Use the function here
    showReport: false, // Default to false
    isFullscreenMindmap: false,
    // timelineMarkers: [], // Initialize markers if managed here
    isLoading: false,
    showSettings: false,
    generatingTypes: [],
    isMobileView: typeof window !== 'undefined' && window.innerWidth < 768,
    sidebarOpen: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true, // Default open on SSR/initial
    isGeneratingRoleplay: false,
  }));

  // Calculate available tabs, prioritizing 'og' if chapter.chapter present
  const availableTabs = useMemo(() => {
      const tabs: TabConfig[] = [];
      // Add 'Original' tab first if chapter.chapter exists
      if (chapter?.chapter) { // Check chapter.chapter instead of chapter.og
          tabs.push(OG_TAB_CONFIG);
      }
      // Add available generated content tabs
      BASE_TABS.forEach(tabConfig => {
          if (isTabAvailable(tabConfig.key, initialContent)) {
              tabs.push(tabConfig);
          }
      });
      return tabs;
  }, [initialContent, chapter]); // Add chapter as a dependency

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const shouldOpenSidebar = window.innerWidth >= 1024;
      setState(prevState => ({
        ...prevState,
        isMobileView: isMobile,
        // Only adjust sidebar based on resize if it wasn't manually toggled? Decide on behavior.
        // sidebarOpen: shouldOpenSidebar
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to reset tab if current one becomes unavailable
  useEffect(() => {
    const currentTabIsAvailable = availableTabs.some(tab => tab.key === state.activeTab);
    if (!currentTabIsAvailable && availableTabs.length > 0) {
        setState(prevState => ({ ...prevState, activeTab: availableTabs[0].key }));
    }
  }, [availableTabs, state.activeTab]);

  // --- State Update Callbacks ---

  const toggleSidebar = useCallback(() => {
    setState(prevState => ({ ...prevState, sidebarOpen: !prevState.sidebarOpen }));
  }, []);

  const handleTabClick = useCallback((tabKey: string) => {
    setState(prevState => ({
      ...prevState,
      // isLoading: true, // Consider if loading state is needed just for tab switch
      activeTab: tabKey,
      // showReport: tabKey === 'report' // Remove report logic
    }));

    // Track interactions (ensure chapter and video_url are stable or passed correctly)
    if (!chapter) return;
    switch (tabKey) {
        case 'quiz': interactionTracker.trackQuizStart(parseInt(chapter.id.toString(), 10), { chapterTitle: chapter.chaptertitle }); break;
        case 'notes': interactionTracker.trackContentView('notes', { chapterTitle: chapter.chaptertitle, contentType: 'notes' }); break;
        case 'summary': interactionTracker.trackContentView('summary', { chapterTitle: chapter.chaptertitle, contentType: 'summary' }); break;
        case 'mindmap': interactionTracker.trackContentView('mindmap', { chapterTitle: chapter.chaptertitle, contentType: 'mindmap' }); break;
        case 'video': if (video_url) interactionTracker.trackVideoPlay(parseInt(chapter.id.toString(), 10), { chapterTitle: chapter.chaptertitle, videoUrl: video_url }); break;
        case 'og': interactionTracker.trackContentView('og', { chapterTitle: chapter.chaptertitle, contentType: 'original' }); break; // Track 'og' view
    }
    // Simulate loading delay removed, content renderer handles its own loading state
  }, [chapter, interactionTracker, video_url]); // Add dependencies carefully

  const handleMindmapBack = useCallback(() => {
    setState(prevState => ({ ...prevState, isFullscreenMindmap: false }));
  }, []);

  const toggleMindmapFullscreen = useCallback(() => {
    setState(prevState => ({ ...prevState, isFullscreenMindmap: !prevState.isFullscreenMindmap }));
  }, []);

  const showContentGenerationPanel = useCallback(() => {
    setState(prevState => ({ ...prevState, showSettings: true }));
  }, []);

  const hideContentGenerationPanel = useCallback(() => {
    setState(prevState => ({ ...prevState, showSettings: false }));
  }, []);

  const handleGenerateContent = useCallback(async (type: ContentType) => {
    if (state.generatingTypes.includes(type) || !chapter) return;
    setState(prevState => ({ ...prevState, generatingTypes: [...prevState.generatingTypes, type] }));
    try {
      await generateMissingContent(chapter, language, [type]);
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
    } finally {
      setState(prevState => ({ ...prevState, generatingTypes: prevState.generatingTypes.filter(t => t !== type) }));
    }
  }, [state.generatingTypes, chapter, language, generateMissingContent]);

  // Ref for interaction tracker to potentially avoid dependency issues in callbacks
  const interactionTrackerRef = useRef(interactionTracker);
  useEffect(() => {
      interactionTrackerRef.current = interactionTracker;
  }, [interactionTracker]);

  const handleGenerateRoleplay = useCallback(async () => {
    if (state.isGeneratingRoleplay || !chapter || !oAiKey) return;

    setState(prevState => ({ ...prevState, isGeneratingRoleplay: true }));
    try {
      const scenarios = await generateRoleplayScenarios(
        chapter.knowledge_id,
        String(chapter.id),
        oAiKey,
        notes || summary || chapter.chapter || '' // Context for generation
      );
      interactionTrackerRef.current.trackContentView('roleplay', { // Use ref
          chapterTitle: chapter.chaptertitle,
          contentType: 'roleplay',
          scenariosCount: scenarios?.length || 0
      });
      // TODO: Update state or trigger refetch to show new roleplay content
      console.log("Generated Roleplay Scenarios:", scenarios); // Placeholder
    } catch (error) {
      console.error('Error generating roleplay scenarios:', error);
    } finally {
      setState(prevState => ({ ...prevState, isGeneratingRoleplay: false }));
    }
  }, [state.isGeneratingRoleplay, chapter, oAiKey, notes, summary]);

  const handleCloseReport = useCallback(() => {
      setState(prevState => ({ ...prevState, showReport: false }));
  }, []);

  // Add function to show the report
  const handleShowReport = useCallback(() => {
      setState(prevState => ({ ...prevState, showReport: true }));
  }, []);

  const isGeneratingContent = useCallback((type: ContentType): boolean => {
      return state.generatingTypes.includes(type);
  }, [state.generatingTypes]);

  const getCurrentContentContext = useCallback(() => {
        if (!chapter) return '';
        switch (state.activeTab) {
            case 'notes': return notes || '';
            case 'summary': return summary || '';
            case 'quiz': return `Quiz content for ${chapter.chaptertitle}`;
            case 'mindmap': return `Mindmap for ${chapter.chaptertitle}`;
            case 'og': return chapter.chapter || ''; // Context for original content is chapter.chapter
            // Add cases for other content types
            default: return chapter.chapter || ''; // Fallback context is chapter.chapter
        }
    }, [state.activeTab, notes, summary, chapter]);

  // Return state values and handlers
  return {
    ...state,
    handleTabClick,
    toggleSidebar,
    handleMindmapBack,
    toggleMindmapFullscreen,
    showContentGenerationPanel,
    hideContentGenerationPanel,
    handleGenerateContent,
    handleGenerateRoleplay,
    handleCloseReport,
    handleShowReport, // Return the new function
    availableTabs, // Memoized and filtered tabs with icons
    getMissingContentTypes,
    isGeneratingContent,
    getCurrentContentContext,
    isChapterHookGenerating,
  };
}; 