import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import Chatbot from './ChatBot';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';

interface ChatbotFloatingButtonProps {
  contentContext: string;
  chapterTitle: string;
}

const ChatbotFloatingButton: React.FC<ChatbotFloatingButtonProps> = ({
  contentContext,
  chapterTitle
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { trackEvent } = useInteractionTracker() as any;

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleQuestionAsked = (question: string) => {
    if (trackEvent) {
      trackEvent('chatbot_query', undefined, { query: question, chapter: chapterTitle });
    }
  };

  return (
    <div className="relative">
      {/* Floating Button */}
      <button
        onClick={toggleChatbot}
        className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-colors flex items-center justify-center"
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>

      {/* Chatbot Dialog */}
      {isOpen && (
        <div className="absolute bottom-16 left-0 w-80 h-96 bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700 flex flex-col">
          <div className="bg-indigo-900/20 p-2 text-white font-medium flex justify-between items-center">
            <span>Course Assistant: {chapterTitle}</span>
            <button 
              onClick={toggleChatbot}
              className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-indigo-800/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-grow overflow-hidden">
            <Chatbot
              topic={`${chapterTitle}: ${contentContext}`}
              language="English"
              onQuestionAsked={handleQuestionAsked}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotFloatingButton; 