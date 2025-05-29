# Implementation Guide: Agentic AI Tutor Integration

## Overview
This guide provides technical direction for the implementation of our three key components:
1. Advanced AI Tutor with Knowledge Graph
2. Slope Drawing Tool Polish
3. Cognitive Load Tracking Enhancements

The guide focuses on integration points, architectural decisions, and best practices for creating a cohesive system.

## Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (React)                       │
├───────────┬─────────────────┬───────────────┬───────────────┤
│  Slope    │   Cognitive     │    UI         │  Event        │
│  Drawing  │   Load          │ Intervention  │  System       │
│   Tool    │   Indicator     │  Components   │               │
└─────┬─────┴────────┬────────┴───────┬───────┴───────┬───────┘
      │              │                │               │
      │              │                │               │
      │              │                │               │
┌─────▼─────┐ ┌──────▼───────┐ ┌──────▼───────┐ ┌─────▼───────┐
│ Canvas    │ │ Cognitive    │ │ Agent        │ │ Neo4j       │
│ Service   │ │ Load Service │ │ Framework    │ │ Knowledge   │
└───────────┘ └──────────────┘ └──────────────┘ │ Graph       │
                                    │           └─────────────┘
                                    │                 ▲
                               ┌────▼─────┐           │
                               │  LLM     │           │
                               │ Gateway  │───────────┘
                               └──────────┘
```

## 1. Event-Driven Architecture Implementation

### EventDispatcher Implementation
```typescript
// src/events/EventDispatcher.ts
export interface Event {
  type: string;
  payload?: any;
  timestamp: Date;
}

export class EventDispatcher {
  private subscribers: Map<string, Array<(event: Event) => void>> = new Map();

  public subscribe(eventType: string, handler: (event: Event) => void): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    
    this.subscribers.get(eventType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscribers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  public dispatch(event: Event): void {
    const handlers = this.subscribers.get(event.type) || [];
    
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error handling event ${event.type}:`, error);
      }
    });
  }
}

export const dispatcher = new EventDispatcher();
```

### React Integration
```typescript
// src/events/EventProvider.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { Event, EventDispatcher, dispatcher } from './EventDispatcher';

interface EventContextType {
  dispatcher: EventDispatcher;
  dispatch: (event: Omit<Event, 'timestamp'>) => void;
}

const EventContext = createContext<EventContextType | null>(null);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = (event: Omit<Event, 'timestamp'>): void => {
    dispatcher.dispatch({
      ...event,
      timestamp: new Date()
    });
  };

  return (
    <EventContext.Provider value={{ dispatcher, dispatch }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
```

## 2. Slope Drawing Tool Integration

### Refactoring Hooks to Emit Events
```typescript
// src/hooks/useGraphManagement.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useEvent } from '../events/EventProvider';

export const useGraphManagement = (canvasWidth: number, canvasHeight: number) => {
  // Existing state code...
  const [points, setPoints] = useState<Point[]>([]);
  const { dispatch } = useEvent();
  const lastInteractionTime = useRef(Date.now());
  
  // Emit IdleDetectedEvent after 30 seconds of no interaction
  useEffect(() => {
    const checkIdleStatus = () => {
      const now = Date.now();
      if (now - lastInteractionTime.current > 30000) {
        dispatch({
          type: 'IdleDetectedEvent',
          payload: {
            duration: now - lastInteractionTime.current
          }
        });
      }
    };
    
    const interval = setInterval(checkIdleStatus, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);
  
  const addPoint = useCallback((point: Point) => {
    setPoints(prev => [...prev, point]);
    lastInteractionTime.current = Date.now();
    
    dispatch({
      type: 'DrawActionEvent',
      payload: {
        action: 'addPoint',
        point
      }
    });
  }, [dispatch]);
  
  // Other methods...
  
  return {
    points,
    addPoint,
    // Other returned values...
  };
};
```

### Points to Modify in Slope Drawing Components
1. `SlopeDrawing.tsx`: Wrap with `EventProvider`
2. `GraphCanvas.tsx`: Emit events for user interactions
3. `useProblemGeneration.ts`: Emit events for correct/incorrect solutions
4. `useCognitiveLoad.ts`: Listen for events instead of using callbacks

## 3. Cognitive Load Tracking Integration

### Refactoring Cognitive Load for Event-Driven Architecture
```typescript
// src/hooks/useCognitiveLoad.ts
import { useEffect, useState } from 'react';
import { useEvent } from '../events/EventProvider';

export const useCognitiveLoad = () => {
  const [cognitiveLoad, setCognitiveLoad] = useState(0);
  const { dispatcher, dispatch } = useEvent();
  
  useEffect(() => {
    const handleDrawAction = (event) => {
      // Increment cognitive load based on drawing actions
      setCognitiveLoad(prev => Math.min(prev + 0.1, 1.0));
    };
    
    const handleWrongAnswer = (event) => {
      // Increase cognitive load more significantly for wrong answers
      setCognitiveLoad(prev => Math.min(prev + 0.2, 1.0));
    };
    
    const handleIdleDetected = (event) => {
      // Decrease cognitive load during idle periods
      setCognitiveLoad(prev => Math.max(prev - 0.15, 0.0));
    };
    
    // Subscribe to events
    const unsubscribeDrawAction = dispatcher.subscribe('DrawActionEvent', handleDrawAction);
    const unsubscribeWrongAnswer = dispatcher.subscribe('WrongAnswerEvent', handleWrongAnswer);
    const unsubscribeIdleDetected = dispatcher.subscribe('IdleDetectedEvent', handleIdleDetected);
    
    // Monitor for fatigue
    const checkFatigue = () => {
      if (cognitiveLoad > 0.8) {
        dispatch({
          type: 'FatigueSpikeDetectedEvent',
          payload: {
            level: cognitiveLoad
          }
        });
      }
    };
    
    const fatigueInterval = setInterval(checkFatigue, 10000);
    
    return () => {
      unsubscribeDrawAction();
      unsubscribeWrongAnswer();
      unsubscribeIdleDetected();
      clearInterval(fatigueInterval);
    };
  }, [cognitiveLoad, dispatcher, dispatch]);
  
  return {
    cognitiveLoad,
    // Additional methods/data...
  };
};
```

## 4. Agent Framework Implementation

### Agent Manager
```typescript
// src/agents/AgentManager.ts
import { Event, dispatcher } from '../events/EventDispatcher';
import { Agent, AgentAction } from './AgentAPI';

export class AgentManager {
  private agents: Agent[] = [];
  
  constructor() {
    // Subscribe to all events
    dispatcher.subscribe('*', this.handleEvent.bind(this));
  }
  
  public registerAgent(agent: Agent): void {
    this.agents.push(agent);
  }
  
  public start(): void {
    this.agents.forEach(agent => {
      if (agent.init) agent.init();
    });
  }
  
  private handleEvent(event: Event): void {
    const actions: Array<{ action: AgentAction, priority: number }> = [];
    
    // Collect actions from all agents
    this.agents.forEach(agent => {
      const action = agent.onEvent(event);
      if (action) {
        actions.push({
          action,
          priority: action.priority || 0
        });
      }
    });
    
    // Sort by priority (higher first)
    actions.sort((a, b) => b.priority - a.priority);
    
    // Execute highest priority action
    if (actions.length > 0) {
      this.executeAction(actions[0].action);
    }
  }
  
  private executeAction(action: AgentAction): void {
    // Dispatch UI action event
    dispatcher.dispatch({
      type: 'AgentActionEvent',
      payload: action,
      timestamp: new Date()
    });
  }
}
```

### Agent API Interface
```typescript
// src/agents/AgentAPI.ts
import { Event } from '../events/EventDispatcher';

export interface AgentAction {
  type: string;
  payload: any;
  priority?: number;
}

export interface Agent {
  name: string;
  init?: () => void;
  onEvent: (event: Event) => AgentAction | null;
}

export abstract class BaseAgent implements Agent {
  public name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  public init(): void {
    // Default implementation
  }
  
  public abstract onEvent(event: Event): AgentAction | null;
}
```

## 5. Neo4j Knowledge Graph Integration

### Graph Service Layer
```typescript
// src/services/knowledgeGraph.ts
import neo4j from 'neo4j-driver';

export class KnowledgeGraphService {
  private driver: neo4j.Driver;
  
  constructor(uri: string, username: string, password: string) {
    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }
  
  public async getConceptPrerequisites(conceptId: string): Promise<any[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(
        `MATCH (c:Concept {id: $conceptId})<-[:PREREQUISITE_OF]-(p:Concept)
         RETURN p`,
        { conceptId }
      );
      
      return result.records.map(record => record.get('p').properties);
    } finally {
      await session.close();
    }
  }
  
  public async updateStudentKnowledge(studentId: string, conceptId: string, mastery: number): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(
        `MERGE (s:Student {id: $studentId})
         MERGE (c:Concept {id: $conceptId})
         MERGE (s)-[r:KNOWS]->(c)
         SET r.mastery = $mastery,
             r.updatedAt = datetime()`,
        { studentId, conceptId, mastery }
      );
    } finally {
      await session.close();
    }
  }
  
  // Additional methods...
}
```

## 6. LLM Gateway Service

### LLM Gateway API Interface
```typescript
// src/services/llmGateway.ts
export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  purpose: 'explain' | 'hint' | 'teach' | 'visualize';
  conceptContext?: string[];
}

export interface LLMResponse {
  text: string;
  modelUsed: string;
  tokensUsed: number;
}

export class LLMGatewayService {
  private apiUrl: string;
  private apiKey: string;
  
  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }
  
  public async getCompletion(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(`${this.apiUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`LLM Gateway error: ${response.statusText}`);
    }
    
    return await response.json();
  }
}
```

## 7. Integration Steps

### Phase 1: Event System Integration (Sprint 15)
1. Create and implement `EventDispatcher` and `EventProvider`
2. Modify core hooks to emit events:
   - `useGraphManagement`: DrawActionEvent, IdleDetectedEvent
   - `useProblemGeneration`: CorrectAnswerEvent, WrongAnswerEvent
   - `useCognitiveLoad`: FatigueSpikeDetectedEvent
3. Create event debugging tools

### Phase 2: Agent Framework & Neo4j (Sprint 15)
1. Set up Neo4j infrastructure and schema
2. Develop Knowledge Graph service layer
3. Implement Agent Manager and base Agent classes
4. Create test harness for simulating events and agent responses

### Phase 3: Agent Implementation (Sprint 16)
1. Implement the five Wave 1 agents:
   - Cognitive Agent
   - Tutor Agent
   - Difficulty Agent
   - Motivator Agent
   - Explainer Agent
2. Develop UI intervention components
3. Create Agent Decision Engine
4. Integrate with Analytics system

## 8. Best Practices

### Code Organization
- Group related components in feature folders
- Keep core services and utilities in dedicated directories
- Maintain clear separation between UI and business logic

### Performance Considerations
- Minimize re-renders with React.memo and useCallback
- Keep agent processing lightweight (<150ms response time)
- Cache knowledge graph queries where possible
- Batch event dispatches when appropriate

### Testing Strategy
- Unit test each agent in isolation
- Create event sequence tests for complex interactions
- Implement performance benchmarks
- Test with simulated high event volume

### Documentation
- Document all event types with payloads
- Create clear agent responsibilities matrix
- Maintain API documentation for knowledge graph and LLM services

## 9. Common Pitfalls & Solutions

### Circular Dependencies
- **Problem**: Event handlers creating new events causing loops
- **Solution**: Implement throttling and cycle detection

### Race Conditions
- **Problem**: Events being processed out of order
- **Solution**: Use timestamps and sequence IDs for ordered processing

### Performance Issues
- **Problem**: Too many events causing UI lag
- **Solution**: Batch processing, debouncing, and optimized rendering

### Memory Leaks
- **Problem**: Failure to unsubscribe from events
- **Solution**: Ensure cleanup in useEffect return functions

## 10. Conclusion

This implementation guide provides a foundation for integrating our three key components through an event-driven architecture. By following these patterns and best practices, we'll create a flexible, maintainable system that allows for future agent extensions while ensuring a smooth, responsive user experience.

Remember that the core principle is "loose coupling through events" - components should communicate via the event system rather than directly calling each other's methods, enabling a more modular and testable architecture. 