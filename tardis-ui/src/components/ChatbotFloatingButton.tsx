import React, { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import Chatbot from './ChatBot'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'

interface ChatbotFloatingButtonProps {
  contentContext: string
  chapterTitle: string
}

const ChatbotFloatingButton: React.FC<ChatbotFloatingButtonProps> = ({
  contentContext,
  chapterTitle,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { trackEvent } = useInteractionTracker() as any

  const toggleChatbot = () => {
    setIsOpen(!isOpen)
  }

  const handleQuestionAsked = (question: string) => {
    if (trackEvent) {
      trackEvent('chatbot_query', undefined, {
        query: question,
        chapter: chapterTitle,
      })
    }
  }

  return (
    <div className='relative'>
      {/* Floating Button */}
      <button
        onClick={toggleChatbot}
        className='flex items-center justify-center rounded-full bg-indigo-600 p-3 text-white shadow-lg transition-colors hover:bg-indigo-700'
        aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
      >
        {isOpen ? (
          <X className='h-6 w-6' />
        ) : (
          <MessageSquare className='h-6 w-6' />
        )}
      </button>

      {/* Chatbot Dialog */}
      {isOpen && (
        <div className='absolute bottom-16 left-0 flex h-96 w-80 flex-col overflow-hidden rounded-lg border border-gray-700 bg-gray-800 shadow-xl'>
          <div className='flex items-center justify-between bg-indigo-900/20 p-2 font-medium text-white'>
            <span>Course Assistant: {chapterTitle}</span>
            <button
              onClick={toggleChatbot}
              className='rounded-full p-1 text-gray-300 hover:bg-indigo-800/30 hover:text-white'
            >
              <X className='h-4 w-4' />
            </button>
          </div>
          <div className='flex-grow overflow-hidden'>
            <Chatbot
              topic={`${chapterTitle}: ${contentContext}`}
              language='English'
              onQuestionAsked={handleQuestionAsked}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatbotFloatingButton
