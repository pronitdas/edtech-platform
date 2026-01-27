import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  MessageSquare, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  BookOpen,
  HelpCircle,
  Lightbulb,
  Target,
  TrendingUp,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext';
import { apiClient } from '@/services/api-client';
import { voiceService } from '@/services/voice-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GeneratedContent {
  knowledge_id: string;
  topic: string;
  chapters?: Array<{
    id: string;
    title: string;
    content: string;
    concepts: string[];
  }>;
  mind_maps?: Array<{
    id: string;
    title: string;
    nodes: any[];
  }>;
  notes?: Array<{
    id: string;
    section: string;
    content: string;
    key_points: string[];
  }>;
  summary?: {
    main_points: string[];
    key_concepts: string[];
    learning_outcomes: string[];
  };
  quiz?: {
    questions: Array<{
      id: string;
      question: string;
      correct_answer: string;
      explanation?: string;
    }>;
  };
}

interface TutorMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  content_reference?: {
    type: 'chapter' | 'note' | 'quiz' | 'summary';
    id: string;
    title: string;
  };
  assistance_type?: 'explanation' | 'hint' | 'encouragement' | 'correction' | 'extension';
}

interface TutorContext {
  current_section?: string;
  progress_data?: {
    chapters_completed: number;
    quiz_scores: number[];
    time_spent: number;
    difficulty_level: string;
  };
  learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  knowledge_gaps?: string[];
}

interface GeneratedContentTutorProps {
  content: GeneratedContent;
  currentSection?: string;
  isOpen: boolean;
  onClose: () => void;
  compact?: boolean;
  enableVoice?: boolean;
}

const GeneratedContentTutor: React.FC<GeneratedContentTutorProps> = ({
  content,
  currentSection,
  isOpen,
  onClose,
  compact = false,
  enableVoice = true
}) => {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [tutorContext, setTutorContext] = useState<TutorContext>({});
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { user } = useUser();
  const { trackContentView } = useInteractionTracker();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<typeof window.SpeechRecognition | null>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeTutor();
    }
  }, [isOpen, content]);

  useEffect(() => {
    // Update context when section changes
    if (currentSection) {
      setTutorContext(prev => ({
        ...prev,
        current_section: currentSection
      }));
    }
  }, [currentSection]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeTutor = async () => {
    const welcomeMessage: TutorMessage = {
      id: generateId(),
      role: 'assistant',
      content: `Hi! I'm your AI tutor for "${content.topic}". I'm here to help you understand the concepts, answer questions, and guide you through the learning material. What would you like to explore first?`,
      timestamp: Date.now(),
      assistance_type: 'encouragement'
    };

    setMessages([welcomeMessage]);
    
    // Load user's learning context
    await loadLearningContext();
    
    if (enableVoice && isSpeaking) {
      speakMessage(welcomeMessage.content);
    }
  };

  const loadLearningContext = async () => {
    try {
      const response = await apiClient.get(`/api/v2/analytics/learning-context/${content.knowledge_id}?user_id=${user?.id}`);
      if (response.data) {
        setTutorContext(prev => ({
          ...prev,
          progress_data: response.data.progress,
          learning_style: response.data.learning_style,
          knowledge_gaps: response.data.knowledge_gaps
        }));
      }
    } catch (error) {
      console.log('Could not load learning context, using default');
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const speakMessage = async (text: string) => {
    if (!enableVoice || !voiceService.isSupported) return;
    
    setIsSpeaking(true);
    try {
      await voiceService.speak(text, { 
        language: 'en-US',
        rate: 0.9,
        pitch: 1,
        volume: 0.8
      });
    } finally {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    // Setup voice service callbacks
    voiceService.setCallbacks({
      onResult: (transcript) => {
        setCurrentMessage(transcript);
      },
      onError: (error) => {
        console.error('Voice recognition error:', error);
        setIsListening(false);
      },
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false)
    });
  }, []);

  const startListening = async () => {
    if (!enableVoice || !voiceService.isSupported) return;

    try {
      await voiceService.startListening();
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    voiceService.stopListening();
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: TutorMessage = {
      id: generateId(),
      role: 'user',
      content: currentMessage,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Track user interaction
      trackContentView('ai_tutor_query', {
        knowledgeId: content.knowledge_id,
        moduleId: 'ai_tutor',
        contentType: 'tutoring_session',
        query: currentMessage,
        section: currentSection,
        timestamp: Date.now()
      });

      // Prepare context for AI tutor
      const tutorPrompt = buildTutorPrompt(currentMessage);
      
      const response = await apiClient.post('/api/v2/ai-tutor/chat', {
        user_id: user?.id,
        knowledge_id: content.knowledge_id,
        message: currentMessage,
        context: {
          content_summary: content.summary,
          current_section: currentSection,
          tutor_context: tutorContext,
          conversation_history: messages.slice(-10) // Last 10 messages for context
        },
        prompt: tutorPrompt
      });

      if (response.data?.response) {
        const assistantMessage: TutorMessage = {
          id: generateId(),
          role: 'assistant',
          content: response.data.response,
          timestamp: Date.now(),
          content_reference: response.data.content_reference,
          assistance_type: response.data.assistance_type || 'explanation'
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (enableVoice && window.speechSynthesis && !isSpeaking) {
          speakMessage(assistantMessage.content);
        }
      }
    } catch (error) {
      console.error('Error getting tutor response:', error);
      const errorMessage: TutorMessage = {
        id: generateId(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Could you try rephrasing your question?",
        timestamp: Date.now(),
        assistance_type: 'correction'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const buildTutorPrompt = (userMessage: string): string => {
    return `You are an intelligent AI tutor helping a student learn about "${content.topic}". 

Context:
- Current topic: ${content.topic}
- Current section: ${currentSection || 'General'}
- Student progress: ${tutorContext.progress_data?.chapters_completed || 0} chapters completed
- Learning style: ${tutorContext.learning_style || 'unknown'}
- Knowledge gaps: ${tutorContext.knowledge_gaps?.join(', ') || 'none identified'}

Available content:
- ${content.chapters?.length || 0} chapters
- ${content.notes?.length || 0} study notes
- ${content.quiz?.questions?.length || 0} quiz questions
- Key concepts: ${content.summary?.key_concepts?.join(', ') || 'various'}

Guidelines:
1. Be encouraging and supportive
2. Provide clear, concise explanations
3. Use examples and analogies when helpful
4. Suggest specific content sections when relevant
5. Adapt to the student's learning style
6. Identify and address knowledge gaps
7. Ask follow-up questions to check understanding

Student's question: "${userMessage}"

Provide a helpful, educational response that guides the student's learning.`;
  };

  const suggestQuickHelp = (type: 'explanation' | 'example' | 'practice' | 'review') => {
    const suggestions = {
      explanation: `Can you explain the key concepts in ${currentSection || 'this topic'}?`,
      example: `Can you give me a practical example of ${content.summary?.key_concepts?.[0] || 'this concept'}?`,
      practice: 'What should I practice to better understand this material?',
      review: 'Can you help me review the most important points?'
    };
    
    setCurrentMessage(suggestions[type]);
  };

  const getAssistanceIcon = (type?: string) => {
    switch (type) {
      case 'explanation': return <BookOpen className="h-4 w-4" />;
      case 'hint': return <Lightbulb className="h-4 w-4" />;
      case 'encouragement': return <TrendingUp className="h-4 w-4" />;
      case 'correction': return <Target className="h-4 w-4" />;
      case 'extension': return <Brain className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed ${compact ? 'bottom-4 right-4 w-80' : 'inset-4'} z-50`}
    >
      <Card className={`bg-gray-800 border-gray-700 shadow-xl ${isMinimized ? 'h-16' : compact ? 'h-96' : 'h-full'} flex flex-col`}>
        {/* Header */}
        <CardHeader className="pb-2 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">AI Tutor</CardTitle>
                <p className="text-sm text-gray-400 line-clamp-1">{content.topic}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {compact && (
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}>
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-2 mb-1">
                          {getAssistanceIcon(message.assistance_type)}
                          <span className="text-xs text-gray-400 capitalize">
                            {message.assistance_type || 'response'}
                          </span>
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      {message.content_reference && (
                        <div className="mt-2 text-xs text-blue-300">
                          📚 Related: {message.content_reference.title}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-gray-300">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Help Suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-400 mb-2">Quick help:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'explanation' as const, label: 'Explain', icon: BookOpen },
                    { type: 'example' as const, label: 'Example', icon: Lightbulb },
                    { type: 'practice' as const, label: 'Practice', icon: Target },
                    { type: 'review' as const, label: 'Review', icon: TrendingUp }
                  ].map(({ type, label, icon: Icon }) => (
                    <button
                      key={type}
                      onClick={() => suggestQuickHelp(type)}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      <Icon className="h-3 w-3" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask me anything about this topic..."
                    className="w-full p-3 pr-10 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  {enableVoice && (
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`p-2 rounded-lg transition-colors ${
                        isListening 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      }`}
                      disabled={isLoading}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  )}

                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isLoading}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
};

export default GeneratedContentTutor;