# Symbiotic Learning Agents (SLA) Worklog

## Project Overview
Implementing a multi-agent architecture that dynamically enhances student learning by creating symbiotic AI agents that monitor, support, and adapt to student needs in real-time. The system leverages specialized GGUF models to create an intelligent agent flock that responds to student signals, provides personalized interventions, and optimizes the learning experience.

## Task Group 1: Agent Framework Core

### Tasks
1. Design and implement EventDispatcher system
2. Develop AgentManager to orchestrate agent interactions
3. Create AgentAPI interface for consistent communication
4. Build event signaling system for inter-agent coordination
5. Implement agent decision engine for conflict resolution

### Definition of Done
- Event Dispatcher successfully routes user interaction events to appropriate agents
- AgentManager can load, prioritize and coordinate multiple agent responses
- All agents implement the AgentAPI interface with standard methods
- Events are properly triggered and propagated through the system
- Agent priorities and conflicts are resolved according to defined rules

### Acceptance Criteria
- Event system handles all required event types: WrongAnswerEvent, CorrectAnswerEvent, HintRequestedEvent, IdleDetectedEvent, FatigueSpikeDetectedEvent, StreakAchievedEvent
- Agent Manager handles concurrent agent operations without performance degradation
- System maintains <150ms response time for agent decisions
- Logging captures all agent activity for analysis
- Agent API supports both synchronous and streaming responses

### Technical Implementation
```typescript
// Core event types
interface Event {
  type: EventType;
  timestamp: number;
  userId: string;
  sessionId: string;
  data: any;
}

type EventType = 
  | 'WrongAnswerEvent' 
  | 'CorrectAnswerEvent'
  | 'HintRequestedEvent'
  | 'IdleDetectedEvent'
  | 'FatigueSpikeDetectedEvent'
  | 'StreakAchievedEvent';

// Agent action response
interface AgentAction {
  type: 'hint' | 'break' | 'motivate' | 'explain' | 'adjustDifficulty';
  content: string;
  priority: number; // 1-10
  urgency: number; // 1-5
  visualization?: any;
  metadata?: Record<string, any>;
}

// Standard Agent API
interface AgentAPI {
  onEvent(event: Event): Promise<AgentAction | null>;
  getAgentType(): string;
  getAgentPriority(): number;
}

// Event dispatcher implementation
class EventDispatcher {
  private listeners: Map<EventType, AgentAPI[]> = new Map();
  
  registerListener(eventType: EventType, agent: AgentAPI) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(agent);
  }
  
  async dispatchEvent(event: Event): Promise<AgentAction[]> {
    const agents = this.listeners.get(event.type) || [];
    const actions = await Promise.all(
      agents.map(agent => agent.onEvent(event))
    );
    return actions.filter(action => action !== null) as AgentAction[];
  }
}

// Agent Manager implementation
class AgentManager {
  private dispatcher: EventDispatcher;
  private agents: AgentAPI[] = [];
  
  constructor(dispatcher: EventDispatcher) {
    this.dispatcher = dispatcher;
  }
  
  registerAgent(agent: AgentAPI) {
    this.agents.push(agent);
  }
  
  async handleEvent(event: Event): Promise<AgentAction | null> {
    const actions = await this.dispatcher.dispatchEvent(event);
    
    if (actions.length === 0) return null;
    
    // Sort by priority and urgency
    actions.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      return priorityDiff !== 0 ? priorityDiff : b.urgency - a.urgency;
    });
    
    return actions[0]; // Return highest priority action
  }
}
```

## Task Group 2: LLM Model Integration

### Tasks
1. Configure docker-compose for GGUF model deployment
2. Create model selection strategy based on agent needs
3. Implement model fallback mechanisms
4. Set up model caching and pre-loading
5. Optimize model performance for real-time responses

### Definition of Done
- All required GGUF models are properly loaded and accessible
- Model gateway routes requests to appropriate models
- Fallback mechanisms handle model unavailability
- Performance testing confirms sub-2 second response times
- Metrics tracking implemented for model monitoring

### Acceptance Criteria
- Model serving infrastructure supports at least 5 concurrent requests
- Response times remain under 2 seconds for standard interactions
- Models automatically fall back to smaller versions when needed
- Memory usage is optimized to allow multiple models to run simultaneously
- Logging captures key model performance metrics

### Model Selection Strategy

#### Primary Model Assignments
1. **Cognitive Agent**: `Llama-3.1-8B-UltraLong-1M-Instruct` (IQ4_XS)
   - *Rationale*: Long context window (1M tokens) for analyzing student behavior patterns
   - *Memory*: ~4GB VRAM
   - *Strengths*: Temporal pattern recognition, fatigue signal detection

2. **Tutor Agent**: `gemma3-4B-claude-3.7-sonnet-reasoning-distilled` (Q8_0)
   - *Rationale*: Strong reasoning capabilities for guided instruction
   - *Memory*: ~2GB VRAM
   - *Strengths*: Clear explanations, step-by-step instruction, adaptive teaching

3. **Difficulty Agent**: `granite-3.3-8b-instruct` (Q4_K_M)
   - *Rationale*: Strong evaluation capabilities for student assessment
   - *Memory*: ~4GB VRAM
   - *Strengths*: Knowledge assessment, difficulty scaling, progression planning

4. **Motivator Agent**: `qwen3-8b` or `Falcon3-Mamba-7B-Instruct` (q4_k_m)
   - *Rationale*: Engaging personality for student motivation
   - *Memory*: ~4GB VRAM
   - *Strengths*: Natural conversational style, positive reinforcement generation

5. **Explainer Agent**: 
   - For code/technical: `codegeex4-all-9b` (Q4_K_M) or `DeepCoder-14B-Preview` (IQ4_XS)
   - For general content: `THUDM_GLM-Z1-9B-0414` (Q3_K_S)
   - *Rationale*: Domain-specific knowledge for accurate explanations
   - *Memory*: ~5GB VRAM
   - *Strengths*: Visual explanation generation, error correction, example creation

#### Fallback Model Strategy
- Tier 1 Fallbacks (75-90% capability): Next-best specialized model
- Tier 2 Fallbacks (50-75% capability): Multi-purpose models like `DeepSeek-R1-Distill-Llama-8B` (Q4_K_M)
- Tier 3 Fallbacks (<50% capability): Small general models like `Llama-3.2-1B-Instruct` (Q8_0)

### Technical Implementation
```yaml
# Model server docker-compose configuration
version: '3.8'

services:
  llama-cpp-server:
    image: ghcr.io/ggerganov/llama.cpp:server
    volumes:
      - ./models:/models
    ports:
      - "8082:8080"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    command: >
      --model /models/Llama-3.1-8B-UltraLong-1M-Instruct.IQ4_XS.gguf
      --host 0.0.0.0
      --port 8080
      --context-size 4096
      --batch-size 512
      --threads 4
      --n-gpu-layers 35

  model-gateway:
    build:
      context: ./gateway
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
      - MODEL_MAPPING=cognitive:http://llama-cpp-server:8080,tutor:http://gemma-server:8080
      - DEFAULT_MODEL=tutor
    depends_on:
      - llama-cpp-server
      - gemma-server
```

## Task Group 3: Agent Implementation

### Tasks
1. Implement Cognitive Agent (fatigue & hesitation detection)
2. Develop Tutor Agent (micro-teaching capabilities)
3. Create Difficulty Agent (progression management)
4. Build Motivator Agent (engagement strategies)
5. Implement Explainer Agent (visualization & correction)

### Definition of Done
- All five agents fully implemented and tested
- Each agent properly handles relevant events
- Agents coordinate through the framework
- Performance testing confirms response time targets
- Integration testing verifies correct agent behavior

### Technical Implementation

#### Cognitive Agent Implementation
```typescript
class CognitiveAgent implements AgentAPI {
  private llmClient: LLMClient;
  private userStateCache: Map<string, UserState> = new Map();
  
  constructor() {
    this.llmClient = new LLMClient({
      primaryModel: 'Llama-3.1-8B-UltraLong-1M-Instruct',
      fallbackModel: 'cogito-v1-preview-llama-8B'
    });
  }
  
  getAgentType(): string {
    return 'cognitive';
  }
  
  getAgentPriority(): number {
    return 9; // High priority for fatigue detection
  }
  
  async onEvent(event: Event): Promise<AgentAction | null> {
    // Only process relevant events
    if (!['IdleDetectedEvent', 'FatigueSpikeDetectedEvent', 'WrongAnswerEvent'].includes(event.type)) {
      return null;
    }
    
    // Get user state or initialize new one
    let userState = this.userStateCache.get(event.userId) || {
      fatigueLevel: 0,
      mistakeCount: 0,
      idleTime: 0,
      lastActivityTime: Date.now(),
      recentEvents: []
    };
    
    // Update user state based on event
    this.updateUserState(userState, event);
    
    // Store updated state
    this.userStateCache.set(event.userId, userState);
    
    // Check if intervention is needed
    if (this.shouldIntervene(userState, event)) {
      return this.generateIntervention(userState, event);
    }
    
    return null;
  }
  
  private updateUserState(state: UserState, event: Event): void {
    // Implementation details for updating user state
  }
  
  private shouldIntervene(state: UserState, event: Event): boolean {
    // Decision logic for intervention
    return state.fatigueLevel > 7 || 
           (event.type === 'WrongAnswerEvent' && state.mistakeCount > 3) ||
           (event.type === 'IdleDetectedEvent' && state.idleTime > 60);
  }
  
  private async generateIntervention(state: UserState, event: Event): Promise<AgentAction> {
    // Generate appropriate intervention based on state
    const prompt = `
    You are a cognitive assistant that helps students when they show signs of fatigue or confusion.
    Current user state:
    - Fatigue level: ${state.fatigueLevel}/10
    - Recent mistakes: ${state.mistakeCount}
    - Idle time: ${state.idleTime} seconds
    
    Generate an appropriate intervention that could be:
    1. A suggestion to take a short break
    2. A switch to an easier topic
    3. A motivational message
    
    Keep your response concise and supportive.
    `;
    
    const response = await this.llmClient.complete(prompt, { max_tokens: 150 });
    
    return {
      type: 'break',
      content: response.text,
      priority: state.fatigueLevel > 8 ? 10 : 8,
      urgency: state.fatigueLevel > 8 ? 5 : 3
    };
  }
}

interface UserState {
  fatigueLevel: number;
  mistakeCount: number;
  idleTime: number;
  lastActivityTime: number;
  recentEvents: Event[];
}
```

#### Tutor Agent Implementation
```typescript
class TutorAgent implements AgentAPI {
  private llmClient: LLMClient;
  
  constructor() {
    this.llmClient = new LLMClient({
      primaryModel: 'gemma3-4B-claude-3.7-sonnet-reasoning-distilled',
      fallbackModel: 'Reasoning-Llama-3.2-3B-Math-Instruct-RE1-ORPO'
    });
  }
  
  getAgentType(): string {
    return 'tutor';
  }
  
  getAgentPriority(): number {
    return 7;
  }
  
  async onEvent(event: Event): Promise<AgentAction | null> {
    if (event.type !== 'WrongAnswerEvent' && event.type !== 'HintRequestedEvent') {
      return null;
    }
    
    const problem = event.data.problem;
    const studentAnswer = event.data.studentAnswer;
    const correctAnswer = event.data.correctAnswer;
    
    const prompt = `
    You are a patient, encouraging tutor helping a student understand a concept.
    
    Problem: ${problem}
    Student's answer: ${studentAnswer}
    Correct answer: ${correctAnswer}
    
    Create a helpful micro-lesson that:
    1. Identifies the specific misconception or error
    2. Explains the correct approach step-by-step
    3. Provides a simple additional example that reinforces the concept
    
    Your explanation should be clear, concise, and encouraging.
    `;
    
    const response = await this.llmClient.complete(prompt, { max_tokens: 350 });
    
    return {
      type: 'explain',
      content: response.text,
      priority: event.type === 'HintRequestedEvent' ? 8 : 7,
      urgency: event.type === 'HintRequestedEvent' ? 4 : 3
    };
  }
}
```

### Implementation for remaining agents follows similar patterns.

## Task Group 4: UI Integration

### Tasks
1. Design intervention UI components
2. Implement non-blocking overlay system
3. Create animation framework for agent interactions
4. Develop graceful stacking for multiple interventions
5. Build user response capture system

### Definition of Done
- UI components for all agent intervention types
- Animation system for smooth agent interactions
- User can respond to agent interventions
- Multiple interventions can be managed gracefully
- UI performance testing confirms smooth operation

### Acceptance Criteria
- Interventions display within 200ms of agent decision
- Animations complete within 1.5 seconds
- UI elements are non-blocking and allow continued interaction
- Multiple interventions stack appropriately without visual clutter
- User feedback system captures responses to interventions

### Technical Implementation
```typescript
// React component example for agent interventions
interface InterventionProps {
  action: AgentAction;
  onDismiss: () => void;
  onAccept: () => void;
  onReject: () => void;
}

const AgentIntervention: React.FC<InterventionProps> = ({ 
  action, 
  onDismiss, 
  onAccept, 
  onReject 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Animate entrance
    setIsVisible(true);
    
    // Auto-dismiss certain interventions after a period
    if (action.type === 'motivate') {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    // Wait for exit animation
    setTimeout(onDismiss, 400);
  };
  
  return (
    <div className={`intervention ${action.type} ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="intervention-content">
        {action.visualization && (
          <div className="visualization">
            {/* Render visualization based on type */}
            {renderVisualization(action.visualization)}
          </div>
        )}
        <div className="message">{action.content}</div>
      </div>
      <div className="intervention-actions">
        {action.type === 'break' && (
          <>
            <button onClick={onAccept}>Take a Break</button>
            <button onClick={onReject}>Continue Working</button>
          </>
        )}
        {action.type === 'explain' && (
          <button onClick={handleDismiss}>Got it</button>
        )}
        {/* Other action types */}
      </div>
    </div>
  );
};

// Intervention manager component
const InterventionManager: React.FC = () => {
  const [interventions, setInterventions] = useState<AgentAction[]>([]);
  
  // Listen for new interventions
  useEffect(() => {
    const subscription = agentEventBus.subscribe(
      'newIntervention',
      (action: AgentAction) => {
        setInterventions(prev => [...prev, action]);
      }
    );
    return () => subscription.unsubscribe();
  }, []);
  
  const handleDismiss = (index: number) => {
    setInterventions(prev => prev.filter((_, i) => i !== index));
  };
  
  // Sort interventions by priority and urgency
  const sortedInterventions = [...interventions].sort((a, b) => {
    const priorityDiff = b.priority - a.priority;
    return priorityDiff !== 0 ? priorityDiff : b.urgency - a.urgency;
  });
  
  // Only show top 2 interventions at a time
  const visibleInterventions = sortedInterventions.slice(0, 2);
  
  return (
    <div className="intervention-container">
      {visibleInterventions.map((action, index) => (
        <AgentIntervention
          key={index}
          action={action}
          onDismiss={() => handleDismiss(index)}
          onAccept={() => {
            // Handle acceptance
            handleDismiss(index);
          }}
          onReject={() => {
            // Handle rejection
            handleDismiss(index);
          }}
        />
      ))}
    </div>
  );
};
```

## Task Group 5: Analytics and Logging

### Tasks
1. Implement comprehensive logging system
2. Create agent effectiveness metrics
3. Build analytics dashboard for teacher insights
4. Develop A/B testing framework for agent improvements
5. Implement student progress tracking

### Definition of Done
- All agent actions logged with relevant context
- Analytics system captures key effectiveness metrics
- Teachers can view insights about agent interventions
- A/B testing framework enables comparison of agent strategies
- Student progress tracking shows impact of interventions

### Acceptance Criteria
- Logging captures event details, agent decisions, and student responses
- Analytics provide actionable insights for teachers
- Dashboard presents data in a clear, intuitive manner
- A/B testing framework supports statistical analysis
- Student progress metrics show correlation with agent interventions

### Technical Implementation
```typescript
// Agent logging service
class AgentAnalyticsService {
  private loggingClient: LoggingClient;
  private metricsClient: MetricsClient;
  
  constructor() {
    this.loggingClient = new LoggingClient();
    this.metricsClient = new MetricsClient();
  }
  
  logAgentDecision(event: Event, agent: string, action: AgentAction | null) {
    this.loggingClient.log('agent_decision', {
      timestamp: Date.now(),
      userId: event.userId,
      sessionId: event.sessionId,
      eventType: event.type,
      agentType: agent,
      action: action ? {
        type: action.type,
        priority: action.priority,
        urgency: action.urgency,
        contentLength: action.content.length
      } : null,
      wasActionTaken: action !== null
    });
    
    // Update metrics
    if (action) {
      this.metricsClient.increment(`agent.${agent}.actions_taken`);
      this.metricsClient.increment(`agent.${agent}.action_type.${action.type}`);
    } else {
      this.metricsClient.increment(`agent.${agent}.actions_skipped`);
    }
  }
  
  logUserResponse(actionId: string, response: 'accept' | 'reject' | 'dismiss') {
    this.loggingClient.log('user_response', {
      timestamp: Date.now(),
      actionId,
      response
    });
    
    this.metricsClient.increment(`user_response.${response}`);
  }
  
  recordIntervention(userId: string, agentType: string, intervationType: string, beforeMetrics: any, afterMetrics: any) {
    // Record effectiveness of intervention
    const effectiveness = this.calculateEffectiveness(beforeMetrics, afterMetrics);
    
    this.loggingClient.log('intervention_effectiveness', {
      timestamp: Date.now(),
      userId,
      agentType,
      intervationType,
      beforeMetrics,
      afterMetrics,
      effectiveness
    });
    
    this.metricsClient.recordHistogram(
      `intervention.${agentType}.${intervationType}.effectiveness`,
      effectiveness
    );
  }
  
  private calculateEffectiveness(before: any, after: any): number {
    // Calculate effectiveness score based on before/after metrics
    // Return a value between 0-100
    return 0; // Placeholder
  }
}
```

## Timeline and Milestones

### Phase 1: Framework Development (2 weeks)
- Design and implement event system
- Create agent manager
- Define unified agent API
- Implement basic logging

### Phase 2: Agent Implementation (3 weeks)
- Cognitive Agent MVP
- Tutor Agent MVP
- Remaining agent implementations
- LLM integration and performance tuning

### Phase 3: UI Integration (2 weeks)
- Design and implement intervention UI
- Create animation system
- Build user response handling
- Integration testing

### Phase 4: Analytics and Testing (2 weeks)
- Complete logging system
- Build analytics dashboard
- Implement A/B testing framework
- Comprehensive performance testing

### Phase 5: Pilot Launch (1 week)
- Deploy to limited user group
- Monitor performance and user feedback
- Make final adjustments
- Prepare for full rollout

## Success Metrics
As defined in the PRD:
- 10%+ improvement in problem-solving accuracy after agent interventions
- 20%+ reduction in session dropout rate after cognitive agent nudges
- 25%+ increase in average session duration for motivated students
- 90%+ of interventions completed without error or complaint

## Future Enhancements
- Self-learning agents that improve over time
- Cross-agent collaboration for complex scenarios
- Advanced visualization capabilities
- Expanded agent types for specific subject domains
- Integration with physical sensing (webcam-based fatigue detection)
