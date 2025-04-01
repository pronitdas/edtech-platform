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

// Import calculators and models
import { getSpecialComponent } from '@/services/component-mapper';

interface MainCourseProps {
    content: ChapterContent;
    language: string;
    chapter: ChapterV1;
}

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

const MainCourse = ({ content, language, chapter }: MainCourseProps) => {
    const { notes, latex_code, mindmap, quiz = [], summary, og, video_url } = content;
    
    // Use a single state object to reduce re-renders
    const [state, setState] = useState<CourseState>({
        activeTab: video_url ? "video" : "notes",
        showReport: false,
        isFullscreenMindmap: false,
        timelineMarkers: [],
        isLoading: false,
        showSettings: false,
        generatingTypes: [],
        isMobileView: false,
        sidebarOpen: true,
        isGeneratingRoleplay: false,
        activeChapterId: undefined,
    });
    
    const {
        generateMissingContent,
        getMissingContentTypes,
        isGeneratingContent
    } = useChapters();
    
    // Get interaction tracker using the optimized context
    const interactionTracker = useInteractionTracker();
    const { oAiKey } = useAuthState();

    // Extract state variables
    const {
        activeTab,
        showReport,
        isFullscreenMindmap,
        timelineMarkers,
        isLoading,
        showSettings,
        generatingTypes,
        isMobileView,
        sidebarOpen,
        isGeneratingRoleplay,
        activeChapterId
    } = state;

    // Add responsive behavior detection with optimized dependencies
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            const shouldOpenSidebar = window.innerWidth >= 1024;
            
            setState(prevState => ({
                ...prevState,
                isMobileView: isMobile,
                sidebarOpen: shouldOpenSidebar
            }));
        };
        
        // Set initial state
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array since we only want to run this on mount

    // Toggle sidebar with memoized callback
    const toggleSidebar = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            sidebarOpen: !prevState.sidebarOpen
        }));
    }, []);

    // Handle chapter change with memoized callback
    const handleChapterChange = useCallback((chapterId: string) => {
        setState(prevState => ({
            ...prevState,
            activeChapterId: chapterId,
            isLoading: true
        }));
        
        // Record interaction
        interactionTracker.trackContentView(chapterId, {
            chapterTitle: chapter.chaptertitle,
            source: 'chapter_navigation'
        });
        
        // Simulate loading delay
        setTimeout(() => {
            setState(prevState => ({
                ...prevState,
                isLoading: false
            }));
        }, 300);
    }, [chapter.chaptertitle, interactionTracker]);

    // Memoize tabs configuration to prevent recreation on each render
    const tabs = useMemo(() => [
        {
            label: "Notes",
            key: "notes",
            condition: Boolean(notes),
            content: notes,
            icon: <FileText className="w-4 h-4" />
        },
        {
            label: "Summary",
            key: "summary",
            condition: Boolean(summary),
            content: summary,
            icon: <BookOpen className="w-4 h-4" />
        },
        {
            label: "Quiz",
            key: "quiz",
            condition: Boolean(quiz && quiz.length > 0),
            content: quiz,
            icon: <PieChart className="w-4 h-4" />
        },
        {
            label: "Mindmap",
            key: "mindmap",
            condition: Boolean(mindmap),
            content: mindmap,
            icon: <Brain className="w-4 h-4" />
        },
        {
            label: "Video",
            key: "video",
            condition: Boolean(video_url),
            content: video_url,
            icon: <Video className="w-4 h-4" />
        },
        {
            label: "Report",
            key: "report",
            condition: true,
            content: null,
            icon: <BarChart2 className="w-4 h-4" />
        }
    ], [notes, summary, quiz, mindmap, video_url]);

    // Filter tabs based on available content
    const availableTabs = useMemo(() => 
        tabs.filter(tab => tab.condition),
    [tabs]);

    // Set default tab if current is not available
    useEffect(() => {
        const currentTabExists = availableTabs.some(tab => tab.key === activeTab);
        if (!currentTabExists && availableTabs.length > 0) {
            setState(prevState => ({
                ...prevState,
                activeTab: availableTabs[0].key
            }));
        }
    }, [availableTabs, activeTab]);

    // Handle tab click with memoized callback
    const handleTabClick = useCallback((tabKey: string) => {
        setState(prevState => ({
            ...prevState,
            isLoading: true,
            activeTab: tabKey,
            showReport: tabKey === 'report'
        }));
        
        // Track tab interactions
        switch (tabKey) {
            case 'quiz':
                interactionTracker.trackQuizStart(parseInt(chapter.id.toString(), 10), {
                    chapterTitle: chapter.chaptertitle
                });
                break;
            case 'notes':
            case 'regenNotes':
                interactionTracker.trackContentView('notes', {
                    chapterTitle: chapter.chaptertitle,
                    contentType: 'notes'
                });
                break;
            case 'summary':
            case 'regenSummary':
                interactionTracker.trackContentView('summary', {
                    chapterTitle: chapter.chaptertitle,
                    contentType: 'summary'
                });
                break;
            case 'mindmap':
                interactionTracker.trackContentView('mindmap', {
                    chapterTitle: chapter.chaptertitle,
                    contentType: 'mindmap'
                });
                break;
            case 'video':
                if (video_url) {
                    interactionTracker.trackVideoPlay(parseInt(chapter.id.toString(), 10), {
                        chapterTitle: chapter.chaptertitle,
                        videoUrl: video_url
                    });
                }
                break;
        }

        // Simulate loading delay
        setTimeout(() => {
            setState(prevState => ({
                ...prevState,
                isLoading: false
            }));
        }, 300);
    }, [chapter, interactionTracker, video_url]);

    // Handle mindmap back button
    const handleMindmapBack = useCallback(() => {
        setState(prevState => ({
            ...prevState,
            isFullscreenMindmap: false
        }));
    }, []);

    // Get available and missing content types
    const availableTypes = useMemo(() => 
        Object.keys(content || {}).filter(key => 
            ['notes', 'summary', 'quiz', 'mindmap'].includes(key) && content[key]
        ) as ContentType[],
    [content]);

    // Fix dependencies in handleGenerateContent to avoid function dependency
    const generateMissingContentRef = useRef(generateMissingContent);
    useEffect(() => {
        generateMissingContentRef.current = generateMissingContent;
    }, [generateMissingContent]);

    // Fix handleGenerateContent to use the ref instead
    const handleGenerateContent = useCallback(async (type: ContentType) => {
        if (generatingTypes.includes(type)) return;
        
        setState(prevState => ({
            ...prevState,
            generatingTypes: [...prevState.generatingTypes, type]
        }));
        
        try {
            await generateMissingContentRef.current(chapter, language, [type]);
        } finally {
            setState(prevState => ({
                ...prevState,
                generatingTypes: prevState.generatingTypes.filter(t => t !== type)
            }));
        }
    }, [chapter, language, generatingTypes]);

    // Fix handleGenerateRoleplay to avoid potential function refs
    const interactionTrackerRef = useRef(interactionTracker);
    useEffect(() => {
        interactionTrackerRef.current = interactionTracker;
    }, [interactionTracker]);

    const handleGenerateRoleplay = useCallback(async () => {
        if (isGeneratingRoleplay || !chapter) return;
        
        setState(prevState => ({
            ...prevState,
            isGeneratingRoleplay: true
        }));
        
        try {
            const scenarios = await generateRoleplayScenarios(
                chapter.knowledge_id,
                String(chapter.id),
                oAiKey || '',
                content?.notes || content?.summary || chapter.chapter || ''
            );
            
            // Track roleplay interaction using ref
            interactionTrackerRef.current.trackContentView('roleplay', {
                chapterTitle: chapter.chaptertitle,
                contentType: 'roleplay',
                scenariosCount: scenarios?.length || 0
            });
            
            // Update content with new roleplay scenarios
            if (scenarios) {
                setState(prevState => ({
                    ...prevState,
                    isGeneratingRoleplay: false
                }));
            }
        } catch (error) {
            console.error('Error generating roleplay scenarios:', error);
        } finally {
            setState(prevState => ({
                ...prevState,
                isGeneratingRoleplay: false
            }));
        }
    }, [
        chapter, 
        oAiKey, 
        content, 
        isGeneratingRoleplay
    ]);

    // Handle marker click in video
    const handleVideoMarkerClick = useCallback((marker: any) => {
        if (marker.id) {
            setState(prevState => ({
                ...prevState,
                activeChapterId: marker.id
            }));
            
            interactionTracker.trackContentView(marker.id, {
                source: 'video_marker',
                markerName: marker.name || ''
            });
        }
    }, [interactionTracker]);

    // Get current content context for the chatbot
    const getCurrentContentContext = useCallback(() => {
        switch (activeTab) {
            case 'notes':
                return content?.notes || '';
            case 'summary':
                return content?.summary || '';
            case 'quiz':
                return 'Quiz content for ' + chapter.chaptertitle;
            case 'mindmap':
                return 'Mindmap for ' + chapter.chaptertitle;
            default:
                return chapter.chapter || '';
        }
    }, [activeTab, content, chapter]);

    // Render content based on active tab - memoized to avoid unnecessary re-renders
    const renderContent = useCallback(() => {
        // Loading state
        if (isLoading) {
            return <Loader size="large" />;
        }

        // Show report
        if (showReport) {
            return <LearningReport 
                learningData={interactionTracker as any}
                onClose={() => setState(prev => ({ ...prev, showReport: false }))} 
            />;
        }

        // Video tab with improved content integration
        if (activeTab === "video" && video_url) {
            return (
                <div className="w-full h-full flex flex-col md:flex-row">
                    <div className={`w-full ${sidebarOpen ? 'md:w-3/4' : 'md:w-full'} h-full transition-all duration-300`}>
                        <ContentToggle
                            videoSrc={video_url}
                            videoTitle={chapter.chaptertitle}
                            markers={timelineMarkers}
                            notes={notes || summary || latex_code || og || "No content available"}
                            knowledgeId={chapter.knowledge_id.toString()}
                        />
                    </div>
                    
                    {sidebarOpen && (
                        <div className="w-full md:w-1/4 h-full md:overflow-y-auto bg-gray-800 border-l border-gray-700 p-2">
                            <h3 className="text-white text-sm font-semibold mb-2 pb-2 border-b border-gray-700">
                                Chapter Sections
                            </h3>
                            <div className="space-y-1">
                                {/* Chapter navigation would go here */}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Notes tab
        if (activeTab === "notes" && notes) {
            return (
                <div className="h-full overflow-y-auto">
                    <MarkdownSlideshow
                        content={[notes]}
                        knowledge_id={chapter.knowledge_id.toString()}
                    />
                </div>
            );
        }

        // Summary tab
        if (activeTab === "summary" && summary) {
            return (
                <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
                    <h1 className="text-2xl font-bold mb-4">{chapter.chaptertitle} - Summary</h1>
                    <div className="prose prose-invert prose-lg max-w-none">
                        <MarkdownSlideshow 
                            content={[summary]}
                            knowledge_id={chapter.knowledge_id.toString()}
                        />
                    </div>
                </div>
            );
        }

        // Quiz tab
        if (activeTab === "quiz" && quiz && quiz.length > 0) {
            return (
                <div className="h-full overflow-y-auto">
                    <Quiz 
                        questions={quiz as QuizQuestion[]} 
                    />
                </div>
            );
        }

        // Mindmap tab
        if (activeTab === "mindmap" && mindmap) {
            return (
                <div className="h-full">
                    {isFullscreenMindmap ? (
                        <div className="absolute inset-0 z-20 bg-gray-900">
                            <button 
                                onClick={handleMindmapBack}
                                className="absolute top-4 left-4 z-30 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <EnhancedMindMap 
                                data={mindmap} 
                                isFullscreen={true}
                            />
                        </div>
                    ) : (
                        <div className="h-full relative">
                            <EnhancedMindMap 
                                data={mindmap} 
                                onToggleFullscreen={() => setState(prev => ({ ...prev, isFullscreenMindmap: true }))}
                            />
                        </div>
                    )}
                </div>
            );
        }

        // Default content - show missing content message
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-gray-800 p-6 rounded-lg max-w-md">
                    <h2 className="text-xl font-semibold text-gray-200 mb-4">Content Not Available</h2>
                    <p className="text-gray-400 mb-6">The {activeTab} content for this chapter is not available yet.</p>
                    <button
                        onClick={() => setState(prev => ({ ...prev, showSettings: true }))}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Generate Content</span>
                    </button>
                </div>
            </div>
        );
    }, [
        activeTab, 
        chapter, 
        isFullscreenMindmap, 
        isLoading,
        notes,
        summary,
        latex_code,
        og,
        quiz,
        mindmap,
        showReport,
        sidebarOpen,
        timelineMarkers,
        video_url,
        handleMindmapBack,
        interactionTracker
    ]);

    return (
        <div className="course-viewer bg-gray-900 min-h-screen flex flex-col">
            {/* Header with tabs */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ChevronLeft 
                            className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" 
                            onClick={() => window.history.back()}
                        />
                        <h1 className="text-xl font-semibold text-white">
                            {chapter.chaptertitle || "Course Content"}
                        </h1>
                    </div>
                    
                    {activeTab === "video" && (
                        <button
                            onClick={toggleSidebar}
                            className="text-gray-400 hover:text-white focus:outline-none"
                            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                        >
                            {sidebarOpen ? "Hide Chapters" : "Show Chapters"}
                        </button>
                    )}
                    
                    {/* Settings button */}
                    {getMissingContentTypes(content).length > 0 && (
                        <button
                            onClick={() => setState(prev => ({ ...prev, showSettings: !prev.showSettings }))}
                            className="text-gray-400 hover:text-white focus:outline-none"
                            aria-label="Content settings"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                    )}
                </div>
                
                {/* Tab Navigation */}
                <div className="flex space-x-1 mt-4 overflow-x-auto pb-2">
                    {availableTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabClick(tab.key)}
                            className={`flex items-center space-x-1 px-4 py-2 rounded-md transition-colors ${
                                activeTab === tab.key
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex-grow overflow-hidden relative">
                {/* Settings Panel */}
                {showSettings && (
                    <ContentGenerationPanel
                        chapter={chapter}
                        language={language}
                        missingTypes={getMissingContentTypes(content)}
                        onGenerate={handleGenerateContent}
                        isGenerating={isGeneratingContent}
                        onClose={() => setState(prev => ({ ...prev, showSettings: false }))}
                        generatingTypes={generatingTypes}
                    />
                )}
                
                {renderContent()}

                {/* Chatbot Floating Button */}
                <div className="absolute bottom-4 left-4 z-50">
                    <ChatbotFloatingButton 
                        contentContext={getCurrentContentContext()}
                        chapterTitle={chapter.chaptertitle}
                    />
                </div>
            </div>

            {/* Learning Report Modal */}
            {showReport && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
                        <LearningReport onClose={() => setState(prev => ({ ...prev, showReport: false }))} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(MainCourse);
