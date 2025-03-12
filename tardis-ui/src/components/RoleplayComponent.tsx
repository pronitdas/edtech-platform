import { useState, useEffect, useRef, useCallback } from 'react';
import { interactionTracker } from '@/services/interaction-tracking';
import { MessageSquare, Send, User, Bot, RefreshCw, ChevronLeft, Loader2 } from 'lucide-react';
import useAuthState from '@/hooks/useAuth';
import { OpenAIClient } from '@/services/openAi';

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
  topic?: string;
  language?: string;
  contextualInformation?: string;
  showScenarioGeneration?: boolean;
}

// Sample fallback scenario in case API fails
const fallbackScenario: Scenario = {
  id: 'default',
  title: 'Educational Discussion',
  description: 'Engage in a discussion about the topic you are learning.',
  characters: [
    {
      id: 'expert',
      name: 'Expert',
      description: 'An expert in the field',
      avatar: '/avatars/expert.png'
    }
  ],
  initialPrompt: 'Hello! I\'m here to discuss this topic with you. What would you like to know?',
  relatedCourse: 'General'
};

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
  scenarios = [], 
  onClose,
  defaultScenario,
  topic = '',
  language = 'English',
  contextualInformation = '',
  showScenarioGeneration = true
}: RoleplayComponentProps) => {
  const { oAiKey } = useAuthState();
  const [apiClient, setApiClient] = useState<OpenAIClient | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScenarioList, setShowScenarioList] = useState(true);
  const [generatedScenarios, setGeneratedScenarios] = useState<Scenario[]>([]);
  const [isGeneratingScenarios, setIsGeneratingScenarios] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useScreenSize();
  
  // Initialize OpenAI client
  useEffect(() => {
    if (!apiClient && oAiKey) {
      setApiClient(new OpenAIClient(oAiKey));
    }
  }, [oAiKey, apiClient]);

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

  // Generate scenarios based on context
  const generateScenarios = useCallback(async () => {
    if (!apiClient) {
      console.error('OpenAI client not initialized');
      setGeneratedScenarios(scenarios.length > 0 ? scenarios : [fallbackScenario]);
      return;
    }

    if (!topic && !contextualInformation) {
      setGeneratedScenarios(scenarios.length > 0 ? scenarios : [fallbackScenario]);
      return;
    }

    setIsGeneratingScenarios(true);
    
    try {
      const systemPrompt = `
You are an educational roleplay designer. Create ${scenarios.length > 0 ? 'additional' : '3'} engaging roleplay scenarios for students learning about "${topic}" in ${language}.
Each scenario should:
1. Be relevant to the subject matter
2. Feature one or more character personas
3. Include a compelling initial prompt
4. Be engaging and educational

${contextualInformation ? `Additional context for the scenarios: ${contextualInformation}` : ''}

Format your response as a valid JSON array of scenarios:
[
  {
    "id": "unique-id-1",
    "title": "Scenario Title",
    "description": "Brief description of the scenario",
    "characters": [
      {
        "id": "character-id-1",
        "name": "Character Name",
        "description": "Brief description of the character"
      }
    ],
    "initialPrompt": "The initial message from the character to start the conversation",
    "relatedCourse": "${topic}"
  }
]`;

      const scenariosJson = await apiClient.chatCompletion(
        [{ role: 'system', content: systemPrompt }],
        'o1-mini',
        2000
      );

      try {
        const parsedScenarios = JSON.parse(scenariosJson) as Scenario[];
        // Combine with any provided scenarios
        const combinedScenarios = [...scenarios, ...parsedScenarios];
        setGeneratedScenarios(combinedScenarios.length > 0 ? combinedScenarios : [fallbackScenario]);
      } catch (parseError) {
        console.error('Error parsing generated scenarios:', parseError);
        // Use fallback if parsing fails
        setGeneratedScenarios(scenarios.length > 0 ? scenarios : [fallbackScenario]);
      }
    } catch (error) {
      console.error('Error generating scenarios:', error);
      setGeneratedScenarios(scenarios.length > 0 ? scenarios : [fallbackScenario]);
    } finally {
      setIsGeneratingScenarios(false);
    }
  }, [apiClient, topic, language, contextualInformation, scenarios]);

  // Generate scenarios on component mount if needed
  useEffect(() => {
    if (showScenarioGeneration && scenarios.length === 0) {
      generateScenarios();
    } else {
      setGeneratedScenarios(scenarios);
    }
  }, [showScenarioGeneration, scenarios, generateScenarios]);

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
    if (!inputValue.trim() || !selectedScenario || !apiClient) return;
    
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
      // Context-aware roleplay AI responses
      const character = selectedScenario.characters[0];
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      const systemPrompt = `
You are roleplaying as ${character.name}, ${character.description}, in a learning scenario about "${selectedScenario.title}".
Topic: ${topic || selectedScenario.relatedCourse || 'General Education'}
Language: ${language}

CHARACTER BACKGROUND:
${character.description}

SCENARIO CONTEXT:
${selectedScenario.description}

${contextualInformation ? `ADDITIONAL CONTEXT:
${contextualInformation}` : ''}

INSTRUCTIONS:
- Stay in character at all times
- Be educational but engaging
- Keep responses concise (2-3 paragraphs maximum)
- Relate your responses to the educational topic when relevant
- Use appropriate language and terminology for ${language}
- Aim to draw out the user's understanding and reasoning through questions`;

      const aiResponse = await apiClient.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: inputValue }
        ],
        'o1-mini',
        800
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        character: selectedScenario.characters[0].id,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      interactionTracker.trackAnimationView();
      interactionTracker.trackChatbotQuestion(inputValue);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Fallback to simple response if API fails
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble responding right now. Could you try a different question?",
        sender: 'ai',
        character: selectedScenario.characters[0].id,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsTyping(false);
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

  // Generate new scenarios
  const handleGenerateNewScenarios = () => {
    if (isGeneratingScenarios) return;
    generateScenarios();
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white rounded-lg overflow-hidden flex flex-col">
      {showScenarioList ? (
        <div className={styles.mainPadding}>
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>Role-Play Scenarios {topic ? `for ${topic}` : ''}</span>
            </h3>
            <div className="flex items-center gap-2">
              {showScenarioGeneration && (
                <button 
                  onClick={handleGenerateNewScenarios}
                  disabled={isGeneratingScenarios || !apiClient}
                  className={`bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-1 px-3 rounded-md shadow transition-colors ${isGeneratingScenarios ? 'opacity-50' : ''}`}
                >
                  {isGeneratingScenarios ? (
                    <div className="flex items-center">
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <span>Generate New</span>
                  )}
                </button>
              )}
              {onClose && (
                <button 
                  onClick={onClose}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 sm:py-2 sm:px-4 rounded-md shadow transition duration-200 ease-in-out text-sm sm:text-base"
                >
                  Close
                </button>
              )}
            </div>
          </div>
          
          {isGeneratingScenarios ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
              <p className="text-gray-300">Creating engaging scenarios about {topic || 'your subject'}...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 overflow-y-auto flex-grow">
              {generatedScenarios.length > 0 ? (
                generatedScenarios.map((scenario) => (
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
                ))
              ) : (
                <div className="col-span-full text-center p-6 bg-gray-800 rounded-lg">
                  <p className="text-gray-300 mb-3">No scenarios available.</p>
                  {showScenarioGeneration && (
                    <button
                      onClick={handleGenerateNewScenarios}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition"
                    >
                      Generate Scenarios
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
          <div className={`p-3 border-t border-gray-700 bg-gray-800`}>
            <div className="flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-grow bg-gray-700 text-white rounded-l-lg px-3 py-2 sm:py-3 outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                disabled={isTyping}
              />
              <button
                onClick={handleSendMessage}
                disabled={isTyping || !inputValue.trim() || !apiClient}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-lg px-3 sm:px-4 py-2 sm:py-3 transition-colors ${
                  (isTyping || !inputValue.trim() || !apiClient) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-400 px-1 hidden sm:block">
              <p>Tip: Ask specific questions about {selectedScenario?.relatedCourse || topic || 'the topic'} to get more detailed responses.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleplayComponent; 