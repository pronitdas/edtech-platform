import { useState, useEffect, useRef } from 'react';
import { interactionTracker } from '@/services/interaction-tracking';
import { MessageSquare, Send, User, Bot, RefreshCw, ChevronLeft } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  background?: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  characters: Character[];
  initialPrompt: string;
  relatedCourse?: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  character?: string;
  timestamp: Date;
}

interface RoleplayComponentProps {
  scenarios?: Scenario[];
  onClose?: () => void;
  defaultScenario?: string;
}

const defaultScenarios: Scenario[] = [
  {
    id: 'gnosticism-debate',
    title: 'Gnostic Debate',
    description: 'Engage in a philosophical debate with a Gnostic teacher about the nature of reality and knowledge.',
    characters: [
      {
        id: 'gnostic-teacher',
        name: 'Valentinus',
        description: 'A prominent Gnostic teacher from Alexandria',
        avatar: '/avatars/gnostic-teacher.png'
      }
    ],
    initialPrompt: 'Greetings, seeker of knowledge. I am Valentinus, a teacher of the secret wisdom. What questions do you have about the true nature of our world and the divine spark within you?',
    relatedCourse: 'Gnosticism'
  },
  {
    id: 'corporate-valuation',
    title: 'Investment Advisor Meeting',
    description: 'Role-play as an investment analyst discussing valuation methods with a client.',
    characters: [
      {
        id: 'investment-advisor',
        name: 'Morgan',
        description: 'An experienced investment advisor specializing in equity valuation',
        avatar: '/avatars/investment-advisor.png'
      }
    ],
    initialPrompt: 'Good morning! I am Morgan, your investment advisor. I understand you are interested in learning more about how we value companies before making investment recommendations. What specific valuation methods would you like to discuss today?',
    relatedCourse: 'Corporate Valuation'
  }
];

// Add responsive hook
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    width: screenSize.width,
    height: screenSize.height,
    isMobile: screenSize.width < 640,
    isTablet: screenSize.width >= 640 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
  };
};

const RoleplayComponent = ({ 
  scenarios = defaultScenarios, 
  onClose,
  defaultScenario 
}: RoleplayComponentProps) => {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScenarioList, setShowScenarioList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useScreenSize();
  
  // Adjust layout for specific screen sizes
  const adaptToScreenSize = () => {
    // Return adjusted styles or classNames based on screen size
    if (isMobile) {
      return {
        mainPadding: 'p-2 sm:p-4',
        messageMaxWidth: 'max-w-[90%] sm:max-w-[80%]',
        inputHeight: 'h-10',
      };
    } else {
      return {
        mainPadding: 'p-4 sm:p-6',
        messageMaxWidth: 'max-w-[75%]',
        inputHeight: 'h-12',
      };
    }
  };
  
  const styles = adaptToScreenSize();

  // Initialize with default scenario if provided
  useEffect(() => {
    if (defaultScenario) {
      const scenario = scenarios.find(s => s.id === defaultScenario);
      if (scenario) {
        handleScenarioSelect(scenario);
      }
    }
  }, [defaultScenario, scenarios]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle scenario selection
  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setShowScenarioList(false);
    setMessages([
      {
        id: Date.now().toString(),
        content: scenario.initialPrompt,
        sender: 'ai',
        character: scenario.characters[0].id,
        timestamp: new Date()
      }
    ]);
    interactionTracker.trackAnimationView();
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedScenario) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      // In a real implementation, this would call an API to get the AI response
      // For now, we'll simulate a response after a delay
      setTimeout(() => {
        const aiResponse = generateSimpleResponse(inputValue, selectedScenario);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          sender: 'ai',
          character: selectedScenario.characters[0].id,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1500);
      
      interactionTracker.trackAnimationView();
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsTyping(false);
    }
  };

  // Simplified response generator (placeholder for actual AI integration)
  const generateSimpleResponse = (userInput: string, scenario: Scenario): string => {
    const character = scenario.characters[0];
    
    // Very basic response logic based on scenario
    if (scenario.id === 'gnosticism-debate') {
      if (userInput.toLowerCase().includes('knowledge') || userInput.toLowerCase().includes('gnosis')) {
        return `True gnosis is not mere intellectual understanding, but direct spiritual knowledge. It is the recognition of your divine origin and the spark of the true God within you.`;
      } else if (userInput.toLowerCase().includes('demiurge') || userInput.toLowerCase().includes('creator')) {
        return `The Demiurge is the false creator god who fashioned this material prison. He is ignorant of the true spiritual realm above him and believes himself to be the only god.`;
      } else {
        return `That is an interesting question. In Gnostic teaching, we believe that this material world is a prison created by a lesser deity. The true God is far beyond this realm, and pieces of that divine light are trapped within certain humans. Through gnosis, or spiritual knowledge, we can escape this prison and return to the divine realm.`;
      }
    } else if (scenario.id === 'corporate-valuation') {
      if (userInput.toLowerCase().includes('p/e') || userInput.toLowerCase().includes('price to earnings')) {
        return `The Price-to-Earnings ratio is one of the most common valuation metrics. It compares a company's share price to its earnings per share. A high P/E might indicate that investors expect high growth in the future, but it could also suggest the stock is overvalued. Industry context is crucial when interpreting P/E ratios.`;
      } else if (userInput.toLowerCase().includes('dcf') || userInput.toLowerCase().includes('discounted cash flow')) {
        return `Discounted Cash Flow analysis is a more comprehensive valuation method that estimates a company's intrinsic value based on projected future cash flows. We discount these future cash flows back to present value using an appropriate discount rate that reflects the risk. It's more complex but often provides a more complete picture than simple ratio analysis.`;
      } else {
        return `That's a great question about valuation. When analyzing companies, we use multiple methods including P/E ratios, price-to-book, discounted cash flow models, and comparative analysis. Each has strengths and limitations, which is why we typically use several approaches to triangulate a reasonable valuation range.`;
      }
    } else {
      return `I'm interested in discussing that further. Could you elaborate on your thoughts?`;
    }
  };

  // Reset the conversation
  const handleResetConversation = () => {
    if (!selectedScenario) return;
    
    setMessages([
      {
        id: Date.now().toString(),
        content: selectedScenario.initialPrompt,
        sender: 'ai',
        character: selectedScenario.characters[0].id,
        timestamp: new Date()
      }
    ]);
    
    interactionTracker.trackAnimationView();
  };

  // Return to scenario selection
  const handleBack = () => {
    setShowScenarioList(true);
    setSelectedScenario(null);
    setMessages([]);
  };

  // Get character info
  const getCharacterInfo = (characterId: string) => {
    if (!selectedScenario) return null;
    return selectedScenario.characters.find(c => c.id === characterId);
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white rounded-lg overflow-hidden flex flex-col">
      {showScenarioList ? (
        <div className={styles.mainPadding}>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>Role-Play Scenarios</span>
            </h3>
            {onClose && (
              <button 
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 sm:py-2 sm:px-4 rounded-md shadow transition duration-200 ease-in-out text-sm sm:text-base"
              >
                Close
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto flex-grow">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario)}
                className="flex flex-col p-3 sm:p-4 bg-gray-800 hover:bg-indigo-600 text-white rounded-md shadow transition-all duration-200 ease-in-out text-left"
              >
                <span className="text-base sm:text-lg font-medium">{scenario.title}</span>
                <span className="text-xs sm:text-sm text-gray-300 mt-1">{scenario.description}</span>
                <div className="flex items-center mt-2 sm:mt-3 text-xs">
                  <span className="bg-indigo-800 px-2 py-1 rounded-full">
                    {scenario.characters.length} character{scenario.characters.length !== 1 ? 's' : ''}
                  </span>
                  {scenario.relatedCourse && (
                    <span className="ml-2 bg-gray-700 px-2 py-1 rounded-full">
                      {scenario.relatedCourse}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* Roleplay header */}
          <div className="bg-gray-800 p-3 sm:p-4 flex justify-between items-center border-b border-gray-700">
            <div className="flex items-center">
              <button 
                onClick={handleBack}
                className="mr-3 p-1 hover:bg-gray-700 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="font-medium text-base sm:text-lg">{selectedScenario?.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">{selectedScenario?.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleResetConversation}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors" 
                title="Reset conversation"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-1 px-3 rounded-md shadow transition-colors"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
          
          {/* Messages area */}
          <div className={`flex-grow overflow-y-auto ${styles.mainPadding} space-y-3 sm:space-y-4`}>
            {messages.map((message) => {
              const character = message.character ? getCharacterInfo(message.character) : null;
              return (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`${styles.messageMaxWidth} rounded-lg p-3 sm:p-4 ${
                      message.sender === 'user' 
                        ? 'bg-indigo-600 rounded-tr-none' 
                        : 'bg-gray-800 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center mb-1 sm:mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gray-700 mr-2">
                        {message.sender === 'user' ? 
                          <User className="w-3 h-3 sm:w-4 sm:h-4" /> : 
                          <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
                        }
                      </div>
                      <span className="font-medium text-sm sm:text-base">
                        {message.sender === 'user' ? 'You' : character?.name || 'AI'}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-lg rounded-tl-none p-3 sm:p-4 max-w-[80%] sm:max-w-[70%]">
                  <div className="flex space-x-2 items-center text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef}></div>
          </div>
          
          {/* Input area */}
          <div className={`p-${styles.inputHeight} border-t border-gray-700 bg-gray-800`}>
            <div className="flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-grow bg-gray-700 text-white rounded-l-lg px-3 py-2 sm:py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping || !inputValue.trim()}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg px-3 sm:px-4 py-2 sm:py-3 transition-colors ${
                  (isTyping || !inputValue.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-400 px-1 hidden sm:block">
              <p>Tip: Ask specific questions about {selectedScenario?.relatedCourse || 'the topic'} to get more detailed responses.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleplayComponent; 