# Product Requirements Document (PRD)

## Title
**Symbiotic Learning Agents (SLA) for Tardis EdTech Platform**

---

## Objective
Create a multi-agent architecture that dynamically enhances student learning by:
- Monitoring real-time student interaction.
- Proactively intervening with personalized support.
- Adjusting difficulty dynamically.
- Offering immediate micro-teaching when confusion or fatigue is detected.
- Motivating students to maintain engagement.

Agents will operate symbiotically alongside existing components (Slope Tool, Practice Problems, Cognitive Load Tracker, AI Provider).

---

## Scope
This PRD covers:
- First wave agent rollout: **Cognitive Agent, Tutor Agent, Difficulty Agent, Motivator Agent, Explainer Agent**.
- Event-driven architecture for agent triggers.
- Lightweight agent decision-making framework.
- Seamless UI interventions without disrupting user flow.

---

## Deliverables
1. **Agent Framework Core**
    - Event Dispatcher
    - Agent Manager
    - Agent API Interface

2. **Agents (Wave 1)**
    - Cognitive Agent (fatigue & hesitation detection)
    - Tutor Agent (micro-teaching based on errors)
    - Difficulty Agent (dynamic progression)
    - Motivator Agent (engagement encouragement)
    - Explainer Agent (dynamic visualization & correction)

3. **UI Interventions**
    - Contextual prompts (hints, encouragements, reteaching popups)
    - Non-blocking overlays and nudges
    - Animation support for interventions

4. **Agent Decision Engine**
    - Basic priority ruleset (conflicting agent suggestions resolution)

5. **Event Signal System**
    - WrongAnswerEvent
    - CorrectAnswerEvent
    - HintRequestedEvent
    - IdleDetectedEvent
    - FatigueSpikeDetectedEvent
    - StreakAchievedEvent

6. **Analytics + Logging**
    - Every agent action logged for future self-tuning.

---

## User Stories

### Student Stories
- As a student, I want the platform to detect when I’m struggling and offer hints or easier problems.
- As a student, I want encouragement when I complete several problems correctly.
- As a student, I want explanations when I make mistakes without manually requesting help.
- As a student, I want my practice difficulty to adapt automatically as I improve.

### Teacher Stories
- As a teacher, I want a log of interventions made by agents for each student.
- As a teacher, I want to review common error patterns detected by agents.

---

## Functional Requirements

### 1. Agent Framework
- [FR-01] Implement EventDispatcher system.
- [FR-02] Define AgentManager to load and prioritize agent responses.
- [FR-03] Each Agent implements `AgentAPI` interface: `onEvent(event): AgentAction|null`

### 2. Cognitive Agent
- [FR-04] Listen for FatigueSpikeDetectedEvent, IdleDetectedEvent, HighMistakeRate.
- [FR-05] Trigger: Suggest 1-minute break or lighter activity.

### 3. Tutor Agent
- [FR-06] Listen for WrongAnswerEvent, HintRequestedEvent.
- [FR-07] Trigger: Offer short micro-lesson or step-by-step guide.

### 4. Difficulty Agent
- [FR-08] Listen for CorrectAnswerEvent, WrongAnswerEvent, StreakAchievedEvent.
- [FR-09] Adjust problem difficulty up/down dynamically.

### 5. Motivator Agent
- [FR-10] Listen for StreakAchievedEvent, FatigueSpikeDetectedEvent.
- [FR-11] Trigger: Positive reinforcement messages, secret badges, or unlockable bonus problems.

### 6. Explainer Agent
- [FR-12] Listen for WrongAnswerEvent.
- [FR-13] Trigger: Dynamic graphical correction visualization.

### 7. UI Integration
- [FR-14] Intervention UI must be non-blocking.
- [FR-15] Must gracefully stack multiple interventions.
- [FR-16] Animations must complete within 1.5 seconds max.

### 8. Logging
- [FR-17] Log all agent-triggered events for future analysis.

---

## Non-Functional Requirements
- [NFR-01] Agents must act within 150ms of event dispatch.
- [NFR-02] System should prioritize student experience — agents cannot interrupt or freeze interaction.
- [NFR-03] All agent decisions must be traceable in logs.
- [NFR-04] System must be extensible to add new agents later without architecture change.

---

## Success Metrics
- 10%+ improvement in problem-solving accuracy after agent interventions.
- 20%+ reduction in session dropout rate after cognitive agent nudges.
- 25%+ increase in average session duration for motivated students.
- 90%+ of interventions completed without error or complaint.

---

## Timeline
| Phase | Deliverables | Time |
|:------|:-------------|:----|
| Phase 1 | Event Dispatcher + AgentManager Skeleton | 1 week |
| Phase 2 | Cognitive Agent + Tutor Agent MVP | 2 weeks |
| Phase 3 | Difficulty Agent + Motivator Agent + Explainer Agent | 2 weeks |
| Phase 4 | UI Integration, Testing & Logging System | 2 weeks |
| Phase 5 | Pilot Launch and Monitoring | 1 week |

---

## Future Extensions (Post MVP)
- Feedback Loop: Agents self-tune their intervention success over time.
- Personalization Engine: Tailor agents' behavior to student learning style.
- Knowledge Graph Agent: Recommend next topics based on mastered skills.
- Sentiment Detection Agent: Use tone and behavior to detect frustration or boredom.

---

# END OF PRD

