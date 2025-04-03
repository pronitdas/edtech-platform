# Roleplay Analytics Implementation Guide

This guide explains how to implement analytics tracking for roleplay scenarios in the application. The implementation follows the standardized event schema defined in Chunk 2 of the analytics migration plan.

## Overview

Roleplay analytics allow tracking user interactions during roleplay scenarios, including:
- Starting a roleplay scenario
- Tracking responses during the scenario
- Recording the final results and evaluations

## Setup

### 1. Import the Hook

The `useRoleplayAnalytics` hook provides a simplified interface for tracking roleplay events. 

```typescript
import { useRoleplayAnalytics } from '@/hooks/useRoleplayAnalytics';

// Inside your component
const { 
  trackRoleplayStart,
  trackTeacherResponse, 
  trackRoleplayComplete,
  createResponseTimer
} = useRoleplayAnalytics(knowledgeId, moduleId);
```

### 2. Track Roleplay Start

When a user begins a roleplay scenario, track the start event:

```typescript
// Example scenario object
const scenario = {
  id: '123',
  title: 'Classroom Management Scenario',
  difficulty: 'intermediate',
  estimatedDuration: 600, // in seconds
  students: [
    { name: 'Alex', personality: 'Disruptive' },
    { name: 'Jamie', personality: 'Shy' }
  ]
};

// When the scenario starts
useEffect(() => {
  trackRoleplayStart(scenario);
}, [scenario, trackRoleplayStart]);
```

### 3. Track Teacher Responses

Use the response tracking when the user responds to a student:

```typescript
// Example response tracking
const handleTeacherResponse = (question, response, studentInfo) => {
  // Create a timer when the question is asked
  const getElapsedTime = createResponseTimer();
  
  // When the teacher submits their response
  const onSubmit = (finalResponse) => {
    const responseTime = getElapsedTime(); // Time in milliseconds
    
    trackTeacherResponse(
      scenario.id,
      studentInfo.name,
      studentInfo.personality,
      question,
      finalResponse,
      currentStep,
      responseTime,
      immediateFeedback // Optional feedback
    );
  };
  
  return { onSubmit };
};
```

### 4. Track Completion

When the scenario is completed, track the results:

```typescript
const handleRoleplayComplete = (results) => {
  trackRoleplayComplete(
    scenario.id,
    totalSteps,
    completedSteps,
    results.totalScore,
    results.maxPossibleScore,
    scenarioDurationInSeconds,
    results.evaluations.map(eval => ({
      criteriaId: eval.id,
      criteriaName: eval.name,
      score: eval.score,
      maxScore: eval.maxScore,
      feedback: eval.feedback
    }))
  );
  
  // Navigate to results page or show summary
  router.push(`/roleplay/${scenario.id}/results`);
};
```

## Complete Example

Here's a complete example of implementing roleplay analytics in a component:

```tsx
import React, { useState, useEffect } from 'react';
import { useRoleplayAnalytics } from '@/hooks/useRoleplayAnalytics';

interface RoleplayProps {
  knowledgeId: string;
  moduleId: string;
  scenarioId: string;
}

export const RoleplayComponent: React.FC<RoleplayProps> = ({
  knowledgeId,
  moduleId,
  scenarioId
}) => {
  const [scenario, setScenario] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [responses, setResponses] = useState<string[]>([]);
  
  // Initialize analytics
  const { 
    trackRoleplayStart,
    trackTeacherResponse, 
    trackRoleplayComplete,
    createResponseTimer
  } = useRoleplayAnalytics(knowledgeId, moduleId);
  
  // Fetch scenario data
  useEffect(() => {
    const fetchScenario = async () => {
      // Fetch scenario data from API
      const data = await fetchScenarioById(scenarioId);
      setScenario(data);
    };
    
    fetchScenario();
  }, [scenarioId]);
  
  // Track scenario start
  useEffect(() => {
    if (scenario) {
      trackRoleplayStart(scenario);
      setStartTime(Date.now());
    }
  }, [scenario, trackRoleplayStart]);
  
  // Handle teacher response
  const handleResponse = () => {
    const timeTracker = createResponseTimer();
    
    return (response: string) => {
      const responseTime = timeTracker();
      const currentQuestion = scenario.steps[currentStep].question;
      const student = scenario.students[scenario.steps[currentStep].studentIndex];
      
      trackTeacherResponse(
        scenarioId,
        student.name,
        student.personality,
        currentQuestion,
        response,
        currentStep + 1, // 1-indexed step
        responseTime
      );
      
      // Save response and move to next step
      setResponses(prev => [...prev, response]);
      setCurrentStep(prev => prev + 1);
    };
  };
  
  // Handle completion
  const completeRoleplay = (evaluations) => {
    const durationSeconds = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const totalScore = evaluations.reduce((sum, e) => sum + e.score, 0);
    const maxScore = evaluations.reduce((sum, e) => sum + e.maxScore, 0);
    
    trackRoleplayComplete(
      scenarioId,
      scenario.steps.length,
      responses.length,
      totalScore,
      maxScore,
      durationSeconds,
      evaluations
    );
  };
  
  if (!scenario) return <div>Loading scenario...</div>;
  
  // Render roleplay UI
  return (
    <div className="roleplay-container">
      {/* Scenario UI implementation */}
    </div>
  );
};
```

## Testing

To test your roleplay analytics implementation, use the testing helper:

```typescript
import { analyticsTestHelpers } from '@/utils/test-helpers';

// In your test
test('Roleplay analytics tracking works correctly', async () => {
  const result = await analyticsTestHelpers.testRoleplayAnalytics(
    'test-user-id',
    'test-knowledge-id',
    'test-module-id'
  );
  
  expect(result.success).toBe(true);
  expect(result.events?.start).toBe(true);
  expect(result.events?.response).toBe(true);
  expect(result.events?.complete).toBe(true);
});
```

## Event Schema Reference

### Roleplay Start Event
```typescript
interface RoleplayStartEvent {
  // Required fields for all events
  knowledgeId: string;  // Link to curriculum knowledge
  moduleId: string;     // Module containing this roleplay
  
  // Roleplay-specific fields
  scenarioId: string;
  scenarioTitle: string;
  difficulty: string;
  estimatedDuration: number;
  studentProfiles: Array<{
    name: string;
    personality: string;
  }>;
}
```

### Roleplay Response Event
```typescript
interface RoleplayResponseEvent {
  // Required fields for all events
  knowledgeId: string;
  moduleId: string;
  
  // Roleplay-specific fields
  scenarioId: string;
  step: number;
  studentName: string;
  studentPersonality: string;
  question: string;
  response: string;
  responseTime: number;  // Time taken to respond in ms
  feedbackProvided?: string;
}
```

### Roleplay Complete Event
```typescript
interface RoleplayCompleteEvent {
  // Required fields for all events
  knowledgeId: string;
  moduleId: string;
  
  // Roleplay-specific fields
  scenarioId: string;
  totalSteps: number;
  completedSteps: number;
  totalScore: number;
  maxPossibleScore: number;
  durationSeconds: number;
  evaluations: Array<{
    criteriaId: string;
    criteriaName: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;
}
``` 