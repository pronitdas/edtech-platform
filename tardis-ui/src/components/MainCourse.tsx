'use client';

import { useCallback, useEffect, useState } from 'react';
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
import { interactionTracker } from '@/services/interaction-tracking';
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

const MainCourse = ({ content, language, chapter }: MainCourseProps) => {
    const { notes, latex_code, mindmap, quiz = [], summary, og, video_url } = content;
    const [activeTab, setActiveTab] = useState(video_url ? "video" : "notes");
    const [showReport, setShowReport] = useState(false);
    const [isFullscreenMindmap, setIsFullscreenMindmap] = useState(false);
    const [timelineMarkers, setTimelineMarkers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [generatingTypes, setGeneratingTypes] = useState<ContentType[]>([]);
    const [isMobileView, setIsMobileView] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isGeneratingRoleplay, setIsGeneratingRoleplay] = useState(false);
    const [activeChapterId, setActiveChapterId] = useState<string | undefined>(undefined);
    const { oAiKey } = useAuthState();
    
    const {
        generateMissingContent,
        getMissingContentTypes,
        isGeneratingContent
    } = useChapters();

    // Add responsive behavior detection
    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        
        // Set initial state
        handleResize();
        
        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Generate chapter markers for video timeline
    useEffect(() => {
        if (chapter && chapter.id) {
            // Fetch chapters for the current knowledge
            const fetchChapterMarkers = async () => {
                try {
                    const { data: chapterData, error } = await supabase
                        .from('chapters')
                        .select('id, chaptertitle, timestamp_start, timestamp_end, chapter_type, subtopic')
                        .eq('knowledge_id', chapter.knowledge_id)
                        .order('timestamp_start', { ascending: true });
                    
                    if (error) throw error;
                    
                    if (chapterData && chapterData.length > 0) {
                        const markers = chapterData.map(ch => ({
                            id: ch.id.toString(),
                            time: ch.timestamp_start || 0,
                            label: ch.subtopic,
                            chapterTitle: ch.chaptertitle,
                            description: ch.subtopic,
                            type: ch.chapter_type?.toLowerCase() as 'latex' | 'code' | 'roleplay' | 'default'
                        }));
                        
                        setTimelineMarkers(markers);
                    }
                } catch (err) {
                    console.error('Error fetching chapter markers:', err);
                }
            };
            
            fetchChapterMarkers();
        }
    }, [chapter]);

    // Handle active chapter change
    const handleChapterChange = (chapterId: string) => {
        setActiveChapterId(chapterId);
        
        // Find the chapter in timeline markers
        const chapterMarker = timelineMarkers.find(marker => marker.id === chapterId);
        
        if (chapterMarker) {
            // If we're not on the video tab, switch to it
            if (activeTab !== 'video') {
                setActiveTab('video');
            }
            
            // Track the navigation
            interactionTracker.trackChapterNavigation(chapterId);
        }
    };

    // Define available tabs
    const tabs = [
        {
            label: "Notes",
            key: "notes",
            condition: latex_code || og,
            content: latex_code || og,
            icon: <FileText className="w-4 h-4" />
        },
        {
            label: "Assisted Notes",
            key: "regenNotes",
            condition: notes,
            content: notes,
            icon: <BookOpen className="w-4 h-4" />
        },
        {
            label: "Summary",
            key: "regenSummary",
            condition: summary,
            content: summary,
            icon: <FileText className="w-4 h-4" />
        },
        {
            label: "Mindmap",
            key: "mindmap",
            condition: mindmap,
            content: mindmap,
            icon: <Brain className="w-4 h-4" />
        },
        {
            label: "Quiz",
            key: "quiz",
            condition: quiz && quiz.length > 0,
            content: quiz,
            icon: <PieChart className="w-4 h-4" />
        },
        {
            label: "Roleplay",
            key: "roleplay",
            condition: true,
            content: null,
            icon: <MessageSquare className="w-4 h-4" />
        },
        {
            label: "Video",
            key: "video",
            condition: Boolean(video_url),
            content: video_url,
            icon: <Video className="w-4 h-4" />
        },
        // {
        //     label: "Practice",
        //     key: "practice",
        //     condition: true,
        //     content: null,
        //     icon: <Play className="w-4 h-4" />
        // },
        {
            label: "Report",
            key: "report",
            condition: true,
            content: null,
            icon: <BarChart2 className="w-4 h-4" />
        }
    ];

    // Filter tabs based on available content
    const availableTabs = tabs.filter(tab => tab.condition);

    // Set default tab if current is not available
    useEffect(() => {
        const currentTabExists = availableTabs.some(tab => tab.key === activeTab);
        if (!currentTabExists && availableTabs.length > 0) {
            setActiveTab(availableTabs[0].key);
        }
    }, [availableTabs, activeTab]);

    // Handle tab click
    const handleTabClick = (tabKey: string) => {
        setIsLoading(true);
        setActiveTab(tabKey);
        
        // Track tab interactions
        switch (tabKey) {
            case 'quiz':
                interactionTracker.trackQuizClick();
                break;
            case 'notes':
            case 'regenNotes':
                interactionTracker.trackNotesClick();
                break;
            case 'regenSummary':
                interactionTracker.trackSummaryClick();
                break;
            case 'mindmap':
                interactionTracker.trackMindmapClick();
                break;
            case 'practice':
                interactionTracker.trackAnimationView();
                break;
            case 'report':
                setShowReport(true);
                break;
        }

        // Simulate loading delay
        setTimeout(() => {
            setIsLoading(false);
        }, 300);
    };

    // Handle mindmap back button
    const handleMindmapBack = () => {
        setIsFullscreenMindmap(false);
    };

    // Get available and missing content types
    const availableTypes = Object.keys(content || {}).filter(key => 
        ['notes', 'summary', 'quiz', 'mindmap'].includes(key) && content[key]
    ) as ContentType[];

    // Handle content generation
    const handleGenerateContent = async (type: ContentType) => {
        if (generatingTypes.includes(type)) return;
        
        setGeneratingTypes(prev => [...prev, type]);
        try {
            await generateMissingContent(chapter, language, [type]);
        } finally {
            setGeneratingTypes(prev => prev.filter(t => t !== type));
        }
    };

    // Handle roleplay generation
    const handleGenerateRoleplay = async () => {
        if (isGeneratingRoleplay || !oAiKey || !content.knowledge_id) return;
        
        setIsGeneratingRoleplay(true);
        try {
            // Get topic from chapter or content title
            const topic = content?.chapter || content?.title || '';
            // Get content from latex_code or original content
            const contentText = content?.latex_code || content?.og || '';
            
            const roleplayData = await generateRoleplayScenarios(
                content.knowledge_id,
                topic,
                contentText,
                oAiKey,
                language
            );
            
            // Update content with new roleplay data to avoid reloading
            if (roleplayData) {
                // Simulate content update
                setIsLoading(true);
                // Use a timeout to allow UI to show loading state
                setTimeout(() => {
                    const updatedContent = { ...content, roleplay: roleplayData };
                    Object.assign(content, { roleplay: roleplayData });
                    setIsLoading(false);
                }, 1000);
            }
        } catch (error) {
            console.error('Error generating roleplay scenarios:', error);
        } finally {
            setIsGeneratingRoleplay(false);
        }
    };

    // Convert QuizQuestion[] to Question[] format expected by Quiz component
    const convertQuizFormat = (quizData: QuizQuestion[] | undefined): { question: string; options: string[]; answer: string; }[] => {
        if (!quizData || !Array.isArray(quizData)) return [];
        
        return quizData.map(q => ({
            question: q.question,
            options: q.options,
            answer: q.answer || q.correct_answer
        }));
    };

    // Handle marker click in video
    const handleVideoMarkerClick = (marker: any) => {
        if (marker.id) {
            setActiveChapterId(marker.id);
            interactionTracker.trackChapterNavigation(marker.id);
        }
    };

    // Render content based on active tab
    const renderContent = () => {
        // Loading state
        if (isLoading) {
            return <Loader size="large" />;
        }

        // Show report
        if (showReport) {
            return <LearningReport learningData={interactionTracker.getData()} />;
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
                        <div className="w-full md:w-1/4 h-full overflow-auto bg-gray-800 p-4">
                            <h3 className="text-xl font-semibold text-white mb-4">Chapters</h3>
                            <div className="space-y-2">
                                {timelineMarkers.map((marker: any) => (
                                    <button
                                        key={marker.id}
                                        onClick={() => handleChapterChange(marker.id)}
                                        className={`w-full text-left p-3 rounded-md flex items-start space-x-2 transition-colors ${
                                            activeChapterId === marker.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                        }`}
                                    >
                                        <div className={`w-3 h-3 mt-1.5 rounded-full flex-shrink-0 ${getMarkerColorClass(marker.type)}`} />
                                        <div>
                                            <p className="font-medium">{marker.chapterTitle || marker.label}</p>
                                            {marker.description && (
                                                <p className="text-sm text-gray-300 mt-1">{marker.description}</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // Show notes (original or latex)
        if ((activeTab === "notes" && latex_code) || (activeTab === "notes" && og)) {
            const notesContent = latex_code || og;
            return (
                <MarkdownSlideshow
                    content={typeof notesContent === 'string' ? [notesContent] : notesContent}
                    knowledge_id={chapter.knowledge_id.toString()}
                />
            );
        }

        // Show AI generated notes
        if (activeTab === "regenNotes" && notes) {
            return (
                <MarkdownSlideshow
                    content={typeof notes === 'string' ? [notes] : notes}
                    knowledge_id={chapter.knowledge_id.toString()}
                />
            );
        }

        // Show AI generated summary
        if (activeTab === "regenSummary" && summary) {
            return (
                <MarkdownSlideshow
                    content={typeof summary === 'string' ? [summary] : summary}
                    knowledge_id={chapter.knowledge_id.toString()}
                />
            );
        }

        // Show mindmap
        if (activeTab === "mindmap" && mindmap) {
            return (
                <div className="relative h-full">
                    {!isFullscreenMindmap && (
                        <button
                            onClick={handleMindmapBack}
                            className="absolute top-2 left-2 z-10 bg-gray-800 text-white p-2 rounded-full"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <EnhancedMindMap
                        data={mindmap}
                        isFullscreen={isFullscreenMindmap}
                        onToggleFullscreen={() => setIsFullscreenMindmap(!isFullscreenMindmap)}
                    />
                </div>
            );
        }

        // Show interactive roleplay
        if (activeTab === "roleplay") {
            if (content?.roleplay?.scenarios) {
                return (
                    <RoleplayComponent
                        scenarios={content.roleplay.scenarios}
                        onRegenerate={handleGenerateRoleplay}
                        isGenerating={isGeneratingRoleplay}
                    />
                );
            } else {
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-800 rounded-lg">
                        <div className="mb-6 text-center">
                            <h3 className="text-xl font-semibold text-white mb-2">No Roleplay Scenarios Available</h3>
                            <p className="text-gray-400">Would you like to generate interactive roleplay scenarios for this content?</p>
                        </div>
                        <button
                            onClick={handleGenerateRoleplay}
                            disabled={isGeneratingRoleplay}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isGeneratingRoleplay ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <span>Generate Roleplay Scenarios</span>
                            )}
                        </button>
                    </div>
                );
            }
        }

        // Show quiz
        if (activeTab === "quiz" && quiz && quiz.length > 0) {
            return <Quiz questions={quiz} />;
        }

        // Default: No content available
        return (
            <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg p-8">
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">No Content Available</h3>
                    <p className="text-gray-400 mb-6">Would you like to generate content for this topic?</p>
                    
                    <button
                        onClick={() => setShowSettings(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Generate Content
                    </button>
                </div>
            </div>
        );
    };

    // Helper for marker color classes
    const getMarkerColorClass = (type?: string) => {
        switch (type) {
            case 'latex':
                return 'bg-purple-500';
            case 'code':
                return 'bg-green-500';
            case 'roleplay':
                return 'bg-indigo-500';
            default:
                return 'bg-red-500';
        }
    };

    // Toggle sidebar for responsive layouts
    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Helper to get the current content context for the chatbot
    const getCurrentContentContext = (): string => {
        switch (activeTab) {
            case 'video':
                return `Video: ${chapter.chaptertitle}`;
            case 'notes':
                return latex_code || og || 'Notes content';
            case 'regenNotes':
                return notes || 'AI-generated notes';
            case 'regenSummary':
                return summary || 'AI-generated summary';
            case 'mindmap':
                return `Mindmap for: ${chapter.chaptertitle}`;
            case 'quiz':
                return `Quiz for: ${chapter.chaptertitle}`;
            case 'roleplay':
                return `Roleplay for: ${chapter.chaptertitle}`;
            case 'report':
                return `Learning report for: ${chapter.chaptertitle}`;
            default:
                return chapter.chaptertitle;
        }
    };

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
                            onClick={() => setShowSettings(!showSettings)}
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
                        onClose={() => setShowSettings(false)}
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
                        <LearningReport onClose={() => setShowReport(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainCourse;
