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
  Settings
} from 'lucide-react';

// Import calculators and models
import { getSpecialComponent } from '@/services/component-mapper';

interface MainCourseProps {
    content: any;
    language: string;
    chapter: any;
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
    const { notes, latex_code, mindmap, quiz = [], summary, og, video_url = "k85mRPqvMbE" } = content;
    const [activeTab, setActiveTab] = useState("notes");
    const [showReport, setShowReport] = useState(false);
    const [isFullscreenMindmap, setIsFullscreenMindmap] = useState(false);
    const [timelineMarkers, setTimelineMarkers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(true);
    const [generatingTypes, setGeneratingTypes] = useState<ContentType[]>([]);
    
    const {
        generateMissingContent,
        getMissingContentTypes,
        isGeneratingContent
    } = useChapters();

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
            condition: true,
            content: video_url,
            icon: <Video className="w-4 h-4" />
        },
        {
            label: "Practice",
            key: "practice",
            condition: true,
            content: null,
            icon: <Play className="w-4 h-4" />
        },
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

    // Render content based on active tab
    const renderContent = useCallback(() => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            );
        }

        const tab = tabs.find(t => t.key === activeTab);
        if (!tab) return <div>No content available</div>;

        switch (activeTab) {
            case 'notes':
            case 'regenNotes':
            case 'regenSummary':
                // Check for special components first
                const specialComponent = getSpecialComponent(tab.content);
                if (specialComponent) return specialComponent;

                // Process markdown content
                let mdContent = tab.content;
                if (!mdContent) {
                    mdContent = ["Content is being generated..."];
                } else if (typeof mdContent === 'string') {
                    mdContent = mdContent.includes("|||||")
                        ? mdContent.split("|||||")
                        : [mdContent];
                }

                // Use ContentToggle for notes with video
                if (video_url) {
                    return (
                        <ContentToggle
                            videoSrc={video_url}
                            videoTitle={content.title || "Course Video"}
                            markers={timelineMarkers}
                            notes={mdContent}
                            knowledgeId={content.knowledge_id}
                        />
                    );
                }

                return (
                    <MarkdownSlideshow
                        content={mdContent}
                        knowledge_id={content.knowledge_id}
                    />
                );

            case 'mindmap':
                return (
                    <EnhancedMindMap 
                        markdown={mindmap} 
                        fullScreen={isFullscreenMindmap}
                        onBack={handleMindmapBack}
                    />
                );

            case 'quiz':
                return quiz && quiz.length > 0
                    ? <Quiz questions={quiz} />
                    : <div className="flex flex-col items-center justify-center h-full text-white">
                        <PieChart className="w-16 h-16 text-gray-600 mb-4" />
                        <p className="text-xl">No quiz questions available</p>
                      </div>;

            case 'video':
                return (
                    <VideoPlayer 
                        src={video_url} 
                        title={content.title || "Course Video"}
                        markers={timelineMarkers}
                        onPlay={() => interactionTracker.trackVideoPlay()}
                        onPause={() => interactionTracker.trackVideoPause()}
                        onSeek={() => interactionTracker.trackTimelineSeek()}
                    />
                );

            case 'practice':
                // Filter modules based on content title if available
                const filteredModules = content.title 
                    ? animationModules.filter(m => m.relatedVideos?.includes(content.title))
                    : animationModules;
                
                return (
                    <InteractiveModule 
                        modules={filteredModules}
                        onModuleComplete={(title) => console.log(`Completed module: ${title}`)}
                    />
                );

            case 'roleplay':
                return (
                    <RoleplayComponent 
                        defaultScenario={content.title === "Gnosticism" ? "gnosticism-debate" : 
                                       content.title === "Corporate Valuation" ? "corporate-valuation" : undefined}
                        onClose={() => setActiveTab('video')}
                    />
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-white">
                        <FileText className="w-16 h-16 text-gray-600 mb-4" />
                        <p className="text-xl">Select a tab to view content</p>
                    </div>
                );
        }
    }, [activeTab, content, tabs, quiz, mindmap, video_url, isFullscreenMindmap, timelineMarkers, isLoading]);

    return (
        <div className="flex h-full">
            <div className="flex-grow overflow-auto">
                {/* Main content area */}
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h1 className="text-2xl font-bold text-white">
                            {content?.chapter || 'Course Content'}
                        </h1>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 hover:bg-gray-700 rounded-full"
                            title="Content Settings"
                        >
                            <Settings className="w-6 h-6" />
                        </button>
                    </div>
                    
                    {/* Content tabs and display */}
                    <div className="mb-6">
                        <div className="flex space-x-2 flex-wrap border-b border-gray-700 pb-2">
                            {availableTabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => handleTabClick(tab.key)}
                                    className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm mb-2 transition-colors ${
                                        activeTab === tab.key
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                        }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-col md:flex-row h-[600px] gap-4">
                        <div className="w-full md:w-3/4 h-full bg-gray-800 rounded-lg overflow-hidden">
                            {renderContent()}
                        </div>
                        <div className="w-full md:w-1/4 h-full">
                            <div className="bg-gray-800 h-full rounded-lg overflow-hidden">
                                <Chatbot 
                                    language={language} 
                                    topic={notes || latex_code}
                                    onQuestionAsked={(question) => interactionTracker.trackChatbotQuestion(question)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Learning Report Modal */}
                    {showReport && (
                        <LearningReport onClose={() => setShowReport(false)} />
                    )}
                </div>
            </div>

            {/* Settings sidebar */}
            {showSettings && (
                <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
                    <ContentGenerationPanel
                        availableTypes={availableTypes}
                        generatingTypes={generatingTypes}
                        onGenerateContent={handleGenerateContent}
                    />
                </div>
            )}
        </div>
    );
};

export default MainCourse;
