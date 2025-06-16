import React from 'react'
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Book,
  BrainCircuit,
  HelpCircle,
  XCircle,
} from 'lucide-react'
import { ContentType } from '@/services/edtech-api'
import { ChapterV1 } from '@/types/database'

interface ContentTypeInfo {
  type: ContentType
  label: string
  icon: React.ReactNode
  description: string
}

const CONTENT_TYPES: ContentTypeInfo[] = [
  {
    type: 'notes',
    label: 'Detailed Notes',
    icon: <FileText className='h-4 w-4 sm:h-5 sm:w-5' />,
    description: 'Comprehensive study notes with examples',
  },
  {
    type: 'summary',
    label: 'Summary',
    icon: <Book className='h-4 w-4 sm:h-5 sm:w-5' />,
    description: 'Quick overview of key concepts',
  },
  {
    type: 'quiz',
    label: 'Quiz',
    icon: <HelpCircle className='h-4 w-4 sm:h-5 sm:w-5' />,
    description: 'Test your knowledge',
  },
  {
    type: 'mindmap',
    label: 'Mind Map',
    icon: <BrainCircuit className='h-4 w-4 sm:h-5 sm:w-5' />,
    description: 'Visual concept map',
  },
]

interface ContentTypeCardProps {
  info: ContentTypeInfo
  isAvailable: boolean
  isGenerating: boolean
  onGenerate: () => void
}

const ContentTypeCard: React.FC<ContentTypeCardProps> = ({
  info,
  isAvailable,
  isGenerating,
  onGenerate,
}) => (
  <div className='flex flex-col items-start gap-3 rounded-lg bg-gray-800 p-3 sm:flex-row sm:space-x-3 sm:p-4'>
    <div className='flex-shrink-0 rounded-md bg-gray-700 p-2'>{info.icon}</div>
    <div className='flex-grow'>
      <h3 className='flex items-center gap-2 text-base font-semibold sm:text-lg'>
        {info.label}
        {isAvailable ? (
          <CheckCircle className='h-3 w-3 text-green-500 sm:h-4 sm:w-4' />
        ) : (
          <AlertCircle className='h-3 w-3 text-yellow-500 sm:h-4 sm:w-4' />
        )}
      </h3>
      <p className='mt-1 text-xs text-gray-400 sm:text-sm'>
        {info.description}
      </p>
    </div>
    {!isAvailable && (
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className='mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto'
      >
        {isGenerating ? (
          <>
            <Loader2 className='h-3 w-3 animate-spin sm:h-4 sm:w-4' />
            <span className='xs:inline hidden'>Generating...</span>
            <span className='xs:hidden'>...</span>
          </>
        ) : (
          'Generate'
        )}
      </button>
    )}
  </div>
)

interface ContentGenerationPanelProps {
  chapter: ChapterV1
  language: string
  missingTypes: ContentType[]
  generatingTypes: ContentType[]
  isGenerating: boolean
  onGenerate: (type: ContentType) => void
  onClose: () => void
}

export const ContentGenerationPanel: React.FC<ContentGenerationPanelProps> = ({
  chapter,
  language,
  missingTypes,
  generatingTypes,
  isGenerating,
  onGenerate,
  onClose,
}) => {
  return (
    <div className='absolute bottom-0 right-0 top-0 z-20 flex w-80 flex-col border-l border-gray-700 bg-gray-800 shadow-xl'>
      <div className='flex items-center justify-between border-b border-gray-700 p-4'>
        <h2 className='text-lg font-bold'>Content Generation</h2>
        <button
          onClick={onClose}
          className='rounded-full p-1 text-gray-400 hover:bg-gray-700 hover:text-white'
          aria-label='Close panel'
        >
          <XCircle className='h-5 w-5' />
        </button>
      </div>

      <div className='flex-grow space-y-4 overflow-y-auto p-4'>
        {CONTENT_TYPES.map(typeInfo => (
          <ContentTypeCard
            key={typeInfo.type}
            info={typeInfo}
            isAvailable={!missingTypes.includes(typeInfo.type)}
            isGenerating={generatingTypes.includes(typeInfo.type)}
            onGenerate={() => onGenerate(typeInfo.type)}
          />
        ))}

        <div className='mt-6 rounded-lg border border-gray-700 bg-gray-700/30 p-3'>
          <h3 className='mb-2 text-sm font-medium'>About Content Generation</h3>
          <p className='text-xs text-gray-400'>
            Generate learning materials powered by AI to enhance your study
            experience. Missing content will be created based on your course
            materials.
          </p>
        </div>
      </div>
    </div>
  )
}
