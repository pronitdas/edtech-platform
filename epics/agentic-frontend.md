# Refactor Plan: Injecting Event-Driven Architecture into Tardis EdTech

## Objective
Enable seamless agent integration by refactoring existing codebase to an event-driven model with minimal disruption.

---

## High-Level Phases

1. **Foundation Setup**  
   - Introduce EventDispatcher and AgentManager.  
   - Establish global context/provider.
2. **Hook & Component Refactoring**  
   - Modify hooks and components to emit events instead of direct side-effects.  
   - Abstract math-specific logic for reusability.
3. **Agent Simulation & Testing**  
   - Build simulation harness.  
   - Expand test coverage around event flows.

---

## Phase 1: Foundation Setup (1 week)

### 1.1 Create Event System Modules
- **`src/events/EventDispatcher.ts`**  
  - Implement `dispatch(event: Event)`, `subscribe(eventType, handler)`, `unsubscribe(...)`.
  - Define `Event` interface: `{ type: string; payload?: any; timestamp: Date }`.
- **`src/agents/AgentManager.ts`**  
  - Initialize at app root.  
  - Loads agents, subscribes to dispatcher.  
  - Exposes `registerAgent(agent: Agent)` and `start()`.
- **`src/agents/AgentAPI.ts`**  
  - Define interface: `onEvent(event: Event): AgentAction | null`.

### 1.2 Integrate in App Root
- In **`App.tsx`** or **`CourseContentRenderer.tsx`**:  
  - Wrap children with `<EventProvider>` context.  
  - Instantiate `AgentManager` in `useEffect`, call `start()`.

### 1.3 Smoke Test
- Dispatch a dummy event on startup.  
- Verify AgentManager receives it (console.log).

---

## Phase 2: Hook & Component Refactoring (2–3 weeks)

### 2.1 Refactor Core Hooks to Emit Events
- **`useGraphManagement`**  
  - Emit `IdleDetectedEvent` when no canvas interaction for X seconds.  
  - Emit `DrawActionEvent` on point/line creation.
- **`useProblemGeneration`**  
  - Emit `WrongAnswerEvent` / `CorrectAnswerEvent` on validation.
  
> **Action**: Replace `setState` side-effects with `dispatcher.dispatch(...)`.

### 2.2 Refactor Cognitive Load Hook
- **`useCognitiveLoad`**  
  - Remove internal callbacks; instead subscribe to relevant events.  
  - Emit `FatigueSpikeDetectedEvent` when thresholds exceeded.

### 2.3 Refactor Components to Dispatch UI Events
- **`SlopeDrawing.tsx`**  
  - On user actions (undo, reset, hint click), dispatch corresponding events.
- **`PracticeSession.tsx`**, **`FeedbackSystem.tsx`**  
  - Dispatch `HintRequestedEvent`, `SessionStartEvent`, `SessionEndEvent`.

### 2.4 Abstract Math Logic
- Introduce `MathObject` interface: `{ id: string; type: 'line'|'shape'|...; data: any }`.
- Refactor `GraphCanvas` and hooks to accept generic `MathObject` rather than slope-only.

---

## Phase 3: Agent Simulation & Testing (2 weeks)

### 3.1 Build Agent Simulation Harness
- **`src/tests/agent/simulation.spec.ts`**  
  - Simulate event streams.  
  - Assert AgentManager and agents produce expected `AgentAction`s.

### 3.2 Expand Test Coverage
- Add unit tests for each dispatch in hooks/components.  
- Integration tests for dispatcher → AgentManager → UI effect.

### 3.3 Pilot Agent Flow in UI
- Implement simple UI logger overlay showing dispatched events and agent responses.  
- Validate non-blocking and correct ordering.

---

## Rollout & Monitoring

- **Staged Release**: Feature-flag event-driven mode.  
- **Monitor Logs**: Ensure <150ms dispatch-to-action latency.  
- **User Feedback**: Collect early feedback on hint timing, UI nudges.

---

## Ownership & Next Steps

- **Assigned To**: FE Team Lead / Mid-Senior Devs.  
- **Kickoff**: Day 1 of Sprint.  
- **Progress Sync**: Daily standups + bi-weekly review.  
- **Go/No-Go**: After Phase 1 smoke tests.

---

*End of Refactor Plan*

# Refactor Plan: Injecting Event-Driven Architecture into Tardis EdTech

## Objective
Enable seamless agent integration by refactoring existing codebase to an event-driven model with minimal disruption.

---

## High-Level Phases

1. **Foundation Setup**  
   - Introduce EventDispatcher and AgentManager.  
   - Establish global context/provider.
2. **Hook & Component Refactoring**  
   - Modify hooks and components to emit events instead of direct side-effects.  
   - Abstract math-specific logic for reusability.
3. **Agent Simulation & Testing**  
   - Build simulation harness.  
   - Expand test coverage around event flows.

---

## Phase 1: Foundation Setup (1 week)

### 1.1 Create Event System Modules
- **`src/events/EventDispatcher.ts`**  
  - Implement `dispatch(event: Event)`, `subscribe(eventType, handler)`, `unsubscribe(...)`.
  - Define `Event` interface: `{ type: string; payload?: any; timestamp: Date }`.
- **`src/agents/AgentManager.ts`**  
  - Initialize at app root.  
  - Loads agents, subscribes to dispatcher.  
  - Exposes `registerAgent(agent: Agent)` and `start()`.
- **`src/agents/AgentAPI.ts`**  
  - Define interface: `onEvent(event: Event): AgentAction | null`.

### 1.2 Integrate in App Root
- In **`App.tsx`** or **`CourseContentRenderer.tsx`**:  
  - Wrap children with `<EventProvider>` context.  
  - Instantiate `AgentManager` in `useEffect`, call `start()`.

### 1.3 Smoke Test
- Dispatch a dummy event on startup.  
- Verify AgentManager receives it (console.log).

---

## Phase 2: Hook & Component Refactoring (2–3 weeks)

### 2.1 Refactor Core Hooks to Emit Events
- **`useGraphManagement`**  
  - Emit `IdleDetectedEvent` when no canvas interaction for X seconds.  
  - Emit `DrawActionEvent` on point/line creation.
- **`useProblemGeneration`**  
  - Emit `WrongAnswerEvent` / `CorrectAnswerEvent` on validation.
  
> **Action**: Replace `setState` side-effects with `dispatcher.dispatch(...)`.

### 2.2 Refactor Cognitive Load Hook
- **`useCognitiveLoad`**  
  - Remove internal callbacks; instead subscribe to relevant events.  
  - Emit `FatigueSpikeDetectedEvent` when thresholds exceeded.

### 2.3 Refactor Components to Dispatch UI Events
- **`SlopeDrawing.tsx`**  
  - On user actions (undo, reset, hint click), dispatch corresponding events.
- **`PracticeSession.tsx`**, **`FeedbackSystem.tsx`**  
  - Dispatch `HintRequestedEvent`, `SessionStartEvent`, `SessionEndEvent`.

### 2.4 Abstract Math Logic
- Introduce `MathObject` interface: `{ id: string; type: 'line'|'shape'|...; data: any }`.
- Refactor `GraphCanvas` and hooks to accept generic `MathObject` rather than slope-only.

---

## Phase 3: Agent Simulation & Testing (2 weeks)

### 3.1 Build Agent Simulation Harness
- **`src/tests/agent/simulation.spec.ts`**  
  - Simulate event streams.  
  - Assert AgentManager and agents produce expected `AgentAction`s.

### 3.2 Expand Test Coverage
- Add unit tests for each dispatch in hooks/components.  
- Integration tests for dispatcher → AgentManager → UI effect.

### 3.3 Pilot Agent Flow in UI
- Implement simple UI logger overlay showing dispatched events and agent responses.  
- Validate non-blocking and correct ordering.

---

## Rollout & Monitoring

- **Staged Release**: Feature-flag event-driven mode.  
- **Monitor Logs**: Ensure <150ms dispatch-to-action latency.  
- **User Feedback**: Collect early feedback on hint timing, UI nudges.

---

## Ownership & Next Steps

- **Assigned To**: FE Team Lead / Mid-Senior Devs.  
- **Kickoff**: Day 1 of Sprint.  
- **Progress Sync**: Daily standups + bi-weekly review.  
- **Go/No-Go**: After Phase 1 smoke tests.

---

*End of Refactor Plan*

