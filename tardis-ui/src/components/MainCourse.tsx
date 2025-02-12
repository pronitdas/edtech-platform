'use client';

import { useCallback, useMemo, useState } from 'react';
import Quiz from '@/components/Quiz';

import MarkdownSlideshow from '@/components/MarkdownSlideshow';
import Chatbot from './ChatBot';
import UnderwaterAdventure from './Immersive';
import SnakeAndLadderGame from './SnakesAndLadder';
import YouTubePlaceholder from './Video';
import Loader from './ui/Loader';

// MainCourse Component
const MainCourse = ({ content, language }) => {
    const { notes, latex_code, quiz = [], summary, og, video_url = "k85mRPqvMbE" } = content;
    console.log(notes);
    // State Management
    const [activeTab, setActiveTab] = useState<string>("notes");


    const renderQuiz = useMemo(() =>
        quiz && quiz.length > 0 ? (
            <Quiz questions={quiz} />
        ) : (
            <p className="text-center">Generate quiz questions in the Text Analysis section to start the quiz.</p>
        ), [quiz]);

    const renderMarkdown = useCallback((activeTab) => {
        let mdContent = null;
        console.log("render markdown called", activeTab)
        switch (activeTab) {
            case 'notes':
                mdContent = latex_code || og;

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
        return mdContent ? <MarkdownSlideshow
            key={activeTab}
            content={mdContent}
            knowledge_id={content.knowledge_id}
        /> : <Loader></Loader>;
    }, [content.knowledge_id, latex_code, notes, og, summary]);

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
                label: "Quiz",
                key: "quiz",
                render: () => renderQuiz,
                condition: quiz && quiz.length > 0,
            },
            {
                label: "Immersive Quiz",
                key: "immersive",
                render: () => <UnderwaterAdventure questions={questions} />,
                condition: quiz && quiz.length > 0,
            },
            {
                label: "Snakes & Ladder",
                key: "snakes-ladder",
                render: () => <SnakeAndLadderGame questions={questions} />,
                condition: quiz && quiz.length > 0,
            },
            {
                label: "Video",
                key: "video",
                render: () => <YouTubePlaceholder videoId={video_url} />,
            },
        ];
    }, [activeTab, quiz, renderMarkdown, renderQuiz])
    // Render Tabs
    const tabs = tabFactory({
        latex_code,
        og,
        notes,
        summary,
        questions: quiz,
        video_url
    })
    const renderTabs = useMemo(() => {

        return tabs
            .filter((tab) => tab.condition === undefined || tab.condition)
            .map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-2 px-4 rounded ${activeTab === tab.key ? "bg-blue-600" : "bg-gray-700 hover:bg-blue-500"
                        }`}
                >
                    {tab.label}
                </button>
            ))
    }, [activeTab,
        tabs,
    ]);

    return (
        <div className="main-course bg-gray-900 h-full text-white  p-3">
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-8">{renderTabs}</div>

            {/* Main Content Area */}
            <div className="flex  h-3/4 justify-between">
                <div className="flex pr-6 w-3/4 ">{tabs.find((tab) => tab.key === activeTab)?.render()}</div>

                <div className="flex pl-6 w-1/4">

                    <Chatbot language={language} topic={notes || latex_code} />
                </div>
            </div>
        </div>
    );
};

export default MainCourse;
