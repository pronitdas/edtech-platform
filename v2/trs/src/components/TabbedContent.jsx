'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Book, Code, FileText, HelpCircle, Video } from 'lucide-react';
import MarkdownViewer from '@/components/MarkdownViewer';
import Quiz from '@/components/Quiz';



const TabbedContent = ({
  notes,
  latexCode,
  summary,
  quiz,
  videoUrl,
  knowledge_id,
  language,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('notes');

  const tabs = [
    {
      id: 'notes',
      label: language === 'English' ? 'Notes' : 'Notas',
      icon: Book,
      content: <MarkdownViewer content={notes} knowledge_id={knowledge_id} />
    },
    {
      id: 'latex',
      label: 'LaTeX',
      icon: Code,
      content: <MarkdownViewer content={latexCode} knowledge_id={knowledge_id} />
    },
    {
      id: 'summary',
      label: language === 'English' ? 'Summary' : 'Resumen',
      icon: FileText,
      content: <MarkdownViewer content={summary} knowledge_id={knowledge_id} />
    },
    {
      id: 'quiz',
      label: language === 'English' ? 'Quiz' : 'Cuestionario',
      icon: HelpCircle,
      content: <Quiz questions={quiz} language={language} />
    },
  ];

  if (videoUrl) {
    tabs.push({
      id: 'video',
      label: language === 'English' ? 'Video' : 'Vídeo',
      icon: Video,
      content: (
        <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
          <video
            controls
            className="w-full h-full object-contain"
            poster="/placeholder.svg?height=720&width=1280"
          >
            <source src={videoUrl} type="video/mp4" />
            {language === 'English'
              ? 'Your browser does not support the video tag.'
              : 'Tu navegador no soporta el tag de video.'}
          </video>
        </div>
      )
    });
  }

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] rounded-lg overflow-hidden">
      <div className="flex border-b border-[#2A2A2A] px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative
                ${activeTab === tab.id
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                  layoutId="activeTab"
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-grow overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tabs.find(tab => tab.id === activeTab)?.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabbedContent;

