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

  // Simple response generator (placeholder for actual AI integration)
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
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>Role-Play Scenarios</span>
            </h3>
            {onClose && (
              <button 
                onClick={onClose}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md shadow transition duration-200 ease-in-out"
              >
                Close
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4 overflow-y-auto flex-grow">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario)}
                className="flex flex-col p-4 bg-gray-800 hover:bg-indigo-600 text-white rounded-md shadow transition-all duration-200 ease-in-out text-left"
              >
                <span className="text-lg font-medium">{scenario.title}</span>
                <span className="text-sm text-gray-300 mt-1">{scenario.description}</span>
                <div className="flex items-center mt-3 text-xs">
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
          {/* Header */}
          <div className="bg-gray-800 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-medium">{selectedScenario?.title}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResetConversation}
                className="text-gray-400 hover:text-white transition-colors"
                title="Reset conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              {onClose && (
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Close roleplay"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((message) => {
              const character = message.character ? getCharacterInfo(message.character) : null;
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    {message.sender === 'ai' && character && (
                      <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-700">
                        <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center">
                          {character.avatar ? (
                            <img 
                              src={character.avatar} 
                              alt={character.name} 
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <span className="text-sm font-medium">{character.name}</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="text-xs opacity-50 mt-1 text-right">
                      {new Intl.DateTimeFormat('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }).format(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-white rounded-lg p-3 max-w-[80%]">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-grow bg-gray-800 text-white rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-md p-2 transition-colors ${
                  !inputValue.trim() || isTyping ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleplayComponent; 