'use client';

import { useCallback, useEffect, useState } from 'react';
import Quiz from '@/components/Quiz';
import MarkdownSlideshow from '@/components/MarkdownSlideshow';
import Chatbot from './ChatBot';
import YouTubePlaceholder from './Video';
import Loader from './ui/Loader';
import MindMap from './MindMap';

// Import calculators and models
import { getSpecialComponent } from '@/services/component-mapper';

interface MainCourseProps {
    content: any;
    language: string;
}

const MainCourse = ({ content, language }: MainCourseProps) => {
    const { notes, latex_code, mindmap, quiz = [], summary, og, video_url = "k85mRPqvMbE" } = content;
    const [activeTab, setActiveTab] = useState("notes");

    // Define available tabs
    const tabs = [
        {
            label: "Notes",
            key: "notes",
            condition: latex_code || og,
            content: latex_code || og
        },
        {
            label: "Assisted Notes",
            key: "regenNotes",
            condition: notes,
            content: notes
        },
        {
            label: "Assisted Summary",
            key: "regenSummary",
            condition: summary,
            content: summary
        },
        {
            label: "Mindmap",
            key: "mindmap",
            condition: mindmap,
            content: mindmap
        },
        {
            label: "Quiz",
            key: "quiz",
            condition: quiz && quiz.length > 0,
            content: quiz
        },
        {
            label: "Video",
            key: "video",
            condition: true,
            content: video_url
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

    // Render content based on active tab
    const renderContent = useCallback(() => {
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

                return (
                    <MarkdownSlideshow
                        content={mdContent}
                        knowledge_id={content.knowledge_id}
                    />
                );

            case 'mindmap':
                return <MindMap markdown={mindmap} />;

            case 'quiz':
                return quiz && quiz.length > 0
                    ? <Quiz questions={quiz} />
                    : <p className="text-center">No quiz questions available</p>;

            case 'video':
                return <YouTubePlaceholder videoId={video_url} />;

            default:
                return <div>Select a tab to view content</div>;
        }
    }, [activeTab, content, tabs, quiz, mindmap, video_url]);

    return (
        <div className="bg-gray-900 h-full text-white p-4">
            {/* Tab Navigation */}
            <div className="mb-4">
                <div className="flex space-x-2">
                    {availableTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`py-2 px-3 rounded text-sm ${activeTab === tab.key
                                    ? "bg-blue-600"
                                    : "bg-gray-700 hover:bg-blue-500"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex h-[500px]">
                <div className="w-3/4 pr-4">
                    {renderContent()}
                </div>
                <div className="w-1/4 pl-4">
                    <Chatbot language={language} topic={notes || latex_code} />
                </div>
            </div>
        </div>
    );
};

export default MainCourse;
