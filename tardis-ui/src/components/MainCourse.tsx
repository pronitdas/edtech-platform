'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Quiz from '@/components/Quiz';

import MarkdownSlideshow from '@/components/MarkdownSlideshow';
import Chatbot from './ChatBot';
import YouTubePlaceholder from './Video';
import Loader from './ui/Loader';
import MindMap from './MindMap';
import PERatioCalculator from './PERatioCalculator';
import PriceToCashFlowCalculator from './PriceToCashFlowCalculator';
import StockValuationModel from './StockValuationModel';
import DividendGrowthModel from './DividendGrowthModel';
import DiscountRateCalculator from './DiscountRateModel';
import PERatioVisualization from './PERatioVisualization';
import DividendGrowthCalculator from './DividendGrowthModel';
import BookValueCalculator from './BookValueCalculator';
import PriceToDividendCalculator from './PriceToDividendCalculator';
import LiquidationValueCalculator from './LiquidationValueCalculator';

// MainCourse Component
const MainCourse = ({ content, language }) => {
    const { notes, latex_code, mindmap, quiz = [], summary, og, video_url = "k85mRPqvMbE" } = content;
    const [activeTab, setActiveTab] = useState("notes");
    const [viewMode, setViewMode] = useState("default"); // Add view mode state
    const renderQuiz = useMemo(() =>
        quiz && quiz.length > 0 ? (
            <Quiz questions={quiz} />
        ) : (
            <p className="text-center">Generate quiz questions in the Text Analysis section to start the quiz.</p>
        ), [quiz]);
    const renderMarkdown = useCallback((activeTab) => {
        // Map of special content start phrases to their corresponding components
        const specialContentMap = {
            "How much investors": <PERatioCalculator />,
            "Evaluate": <PriceToCashFlowCalculator />,
            "This tool": <StockValuationModel />,
            "Understanding": <DividendGrowthCalculator />,
            "The discount rate": <DiscountRateCalculator />,
            "Key Insights": <PERatioVisualization />,
            "The Dividend Growth Model": <DividendGrowthModel />,
            "Book Value": <BookValueCalculator />,
            "Price-to-Dividend": <PriceToDividendCalculator />,
            "Liquidation value": <LiquidationValueCalculator />
        };

        // Determine content based on activeTab
        let mdContent;
        switch (activeTab) {
            case 'notes':
                mdContent = latex_code || og;

                // Check for special content components
                for (const [startPhrase, component] of Object.entries(specialContentMap)) {
                    if (mdContent?.startsWith(startPhrase)) {
                        return component;
                    }
                }
                break;

            case 'regenNotes':
                mdContent = notes;
                break;

            case 'regenSummary':
                mdContent = summary;
                break;

            default:
                mdContent = "No Content";
        }

        // Handle content processing
        if (!mdContent) {
            mdContent = ["Is being generated"];
        } else if (mdContent.includes("|||||")) {
            mdContent = mdContent.split("|||||");
        } else {
            mdContent = [mdContent];
        }

        return (
            <MarkdownSlideshow
                key={activeTab}
                content={mdContent}
                knowledge_id={content.knowledge_id}
            />
        );
    }, [content.knowledge_id, latex_code, notes, og, summary, viewMode]);
    const tabFactory = useCallback(({ latex_code, notes, og, summary, questions, video_url }) => {
        return [
            { label: "Notes", key: "notes", render: () => renderMarkdown(activeTab), condition: latex_code, },
            {
                label: "Assisted Notes",
                key: "regenNotes",
                render: () => renderMarkdown(activeTab),
                condition: notes,
            },
            {
                label: "Assisted Summary",
                key: "regenSummary",
                render: () => renderMarkdown(activeTab),
                condition: summary,
            },
            {
                label: "Mindmap",
                key: "mindmap",
                render: () => <MindMap markdown={mindmap} />,
                condition: mindmap,
            },
            {
                label: "Quiz",
                key: "quiz",
                render: () => renderQuiz,
                condition: quiz && quiz.length > 0,
            },
            {
                label: "Video",
                key: "video",
                render: () => <YouTubePlaceholder videoId={video_url} />,
            },
        ];
    }, [activeTab, quiz, renderMarkdown, renderQuiz]);

    const tabs = tabFactory({
        latex_code,
        og,
        notes,
        summary,
        questions: quiz,
        video_url
    });
    useEffect(() => {
        const tabs = tabFactory({ latex_code, notes, og, summary, questions: quiz, video_url });

        // Find the current active tab configuration
        const currentTab = tabs.find(tab => tab.key === activeTab);

        // If the current active tab doesn't exist or its condition is falsy (except for notes tab)
        if (!currentTab || (activeTab !== "notes" && !currentTab.condition)) {
            // Find the notes tab as a fallback
            const notesTab = tabs.find(tab => tab.key === "notes");

            // Only switch if the notes tab exists and has a valid condition
            if (notesTab && notesTab.condition) {
                setActiveTab("notes");
            } else {
                // If notes tab is also invalid, find the first valid tab
                const firstValidTab = tabs.find(tab => tab.condition);
                if (firstValidTab) {
                    setActiveTab(firstValidTab.key);
                }
            }
        }
    }, [activeTab, tabFactory, latex_code, notes, og, summary, quiz, video_url]);



    const renderTabs = useMemo(() => {
        const filteredTabs = tabs.filter((tab) => tab.condition === undefined || tab.condition);

        return (
            <div className="flex items-center">
                <div className="flex space-x-4">
                    {filteredTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`py-2 px-4 rounded ${activeTab === tab.key ? "bg-blue-600" : "bg-gray-700 hover:bg-blue-500"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }, [activeTab, tabs]);

    return (
        <div className="main-course bg-gray-900 h-full text-white p-3">
            {/* Tab Navigation */}
            <div className="mb-8">{renderTabs}</div>

            {/* Main Content Area */}
            <div style={{ height: 530 }} className="flex justify-between">
                <div className="flex pr-6 w-3/4">{tabs.find((tab) => tab.key === activeTab)?.render()}</div>
                <div className="flex pl-6 w-1/4">
                    <Chatbot language={language} topic={notes || latex_code} />
                </div>
            </div>
        </div>
    );
};

export default MainCourse;
