'use client';

import { useCallback, useMemo, useState } from 'react';
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
        let mdContent = null;
        switch (activeTab) {
            case 'notes':
                mdContent = latex_code || og;
                if (mdContent.startsWith("How much investors")) {
                    return <PERatioCalculator />
                }
                if (mdContent.startsWith("Evaluate")) {
                    return <PriceToCashFlowCalculator />
                }
                if (mdContent.startsWith("This tool")) {
                    return <StockValuationModel />
                }
                if (mdContent.startsWith("Understanding")) {
                    return <DividendGrowthCalculator />
                }
                if (mdContent.startsWith("The discount rate")) {
                    return <DiscountRateCalculator/>
                }
                if (mdContent.startsWith("Key Insights")) {
                    return <PERatioVisualization/>
                }
                if (mdContent.startsWith("The Dividend Growth Model")) {
                    return <DividendGrowthModel />
                }
                if (mdContent.startsWith("Book Value")) {
                    return <BookValueCalculator />
                }
                if (mdContent.startsWith("Price-to-Dividend")) {
                    return <PriceToDividendCalculator />
                }
                if (mdContent.startsWith("Liquidation value")) {
                    return <LiquidationValueCalculator />
                }
                break;
            case 'regenNotes':
                mdContent = notes;
                break;
            case 'regenSummary':
                mdContent = summary;
                break;
            default:
                mdContent = "No Content"
        }
        if (mdContent.includes("|||||")) {
            mdContent = mdContent.split("|||||")
        } else {
            mdContent = [mdContent]
        }

        return <MarkdownSlideshow
            key={activeTab}
            content={mdContent}
            knowledge_id={content.knowledge_id}
        />;
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
