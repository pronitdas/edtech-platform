import React from 'react';
import { Loader2, CheckCircle, AlertCircle, FileText, Book, BrainCircuit, HelpCircle } from 'lucide-react';
import { ContentType } from '@/services/edtech-api';

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
    icon: <FileText className="w-5 h-5" />,
    description: 'Comprehensive study notes with examples'
  },
  {
    type: 'summary',
    label: 'Summary',
    icon: <Book className="w-5 h-5" />,
    description: 'Quick overview of key concepts'
  },
  {
    type: 'quiz',
    label: 'Quiz',
    icon: <HelpCircle className="w-5 h-5" />,
    description: 'Test your knowledge'
  },
  {
    type: 'mindmap',
    label: 'Mind Map',
    icon: <BrainCircuit className="w-5 h-5" />,
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
  <div className="bg-gray-800 p-4 rounded-lg flex items-start space-x-4">
    <div className="flex-shrink-0">{info.icon}</div>
    <div className="flex-grow">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {info.label}
        {isAvailable ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-500" />
        )}
      </h3>
      <p className="text-sm text-gray-400">{info.description}</p>
    </div>
    {!isAvailable && (
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate'
        )}
      </button>
    )}
  </div>
);

interface ContentGenerationPanelProps {
  availableTypes: ContentType[];
  generatingTypes: ContentType[];
  onGenerateContent: (type: ContentType) => void;
}

export const ContentGenerationPanel: React.FC<ContentGenerationPanelProps> = ({
  availableTypes,
  generatingTypes,
  onGenerateContent
}) => {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold mb-6">Content Generation</h2>
      <div className="space-y-4">
        {CONTENT_TYPES.map((typeInfo) => (
          <ContentTypeCard
            key={typeInfo.type}
            info={typeInfo}
            isAvailable={availableTypes.includes(typeInfo.type)}
            isGenerating={generatingTypes.includes(typeInfo.type)}
            onGenerate={() => onGenerateContent(typeInfo.type)}
          />
        ))}
      </div>
    </div>
  );
}; 