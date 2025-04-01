import React from 'react';
import { Loader2, CheckCircle, AlertCircle, FileText, Book, BrainCircuit, HelpCircle, XCircle } from 'lucide-react';
import { ContentType } from '@/services/edtech-api';
import { ChapterV1 } from '@/types/database';

interface ContentTypeInfo {
  type: ContentType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const CONTENT_TYPES: ContentTypeInfo[] = [
  {
    type: 'notes',
    label: 'Detailed Notes',
    icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />,
    description: 'Comprehensive study notes with examples'
  },
  {
    type: 'summary',
    label: 'Summary',
    icon: <Book className="w-4 h-4 sm:w-5 sm:h-5" />,
    description: 'Quick overview of key concepts'
  },
  {
    type: 'quiz',
    label: 'Quiz',
    icon: <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
    description: 'Test your knowledge'
  },
  {
    type: 'mindmap',
    label: 'Mind Map',
    icon: <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" />,
    description: 'Visual concept map'
  }
];

interface ContentTypeCardProps {
  info: ContentTypeInfo;
  isAvailable: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

const ContentTypeCard: React.FC<ContentTypeCardProps> = ({
  info,
  isAvailable,
  isGenerating,
  onGenerate
}) => (
  <div className="bg-gray-800 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row items-start gap-3 sm:space-x-3">
    <div className="flex-shrink-0 bg-gray-700 p-2 rounded-md">
      {info.icon}
    </div>
    <div className="flex-grow">
      <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
        {info.label}
        {isAvailable ? (
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
        )}
      </h3>
      <p className="text-xs sm:text-sm text-gray-400 mt-1">{info.description}</p>
    </div>
    {!isAvailable && (
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="mt-2 sm:mt-0 w-full sm:w-auto px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            <span className="hidden xs:inline">Generating...</span>
            <span className="xs:hidden">...</span>
          </>
        ) : (
          'Generate'
        )}
      </button>
    )}
  </div>
);

interface ContentGenerationPanelProps {
  chapter: ChapterV1;
  language: string;
  missingTypes: ContentType[];
  generatingTypes: ContentType[];
  isGenerating: boolean;
  onGenerate: (type: ContentType) => void;
  onClose: () => void;
}

export const ContentGenerationPanel: React.FC<ContentGenerationPanelProps> = ({
  chapter,
  language,
  missingTypes,
  generatingTypes,
  isGenerating,
  onGenerate,
  onClose
}) => {
  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-gray-800 border-l border-gray-700 shadow-xl z-20 flex flex-col">
      <div className="border-b border-gray-700 p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold">Content Generation</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700"
          aria-label="Close panel"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {CONTENT_TYPES.map((typeInfo) => (
          <ContentTypeCard
            key={typeInfo.type}
            info={typeInfo}
            isAvailable={!missingTypes.includes(typeInfo.type)}
            isGenerating={generatingTypes.includes(typeInfo.type)}
            onGenerate={() => onGenerate(typeInfo.type)}
          />
        ))}
        
        <div className="mt-6 p-3 bg-gray-700/30 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium mb-2">About Content Generation</h3>
          <p className="text-xs text-gray-400">
            Generate learning materials powered by AI to enhance your study experience. 
            Missing content will be created based on your course materials.
          </p>
        </div>
      </div>
    </div>
  );
}; 