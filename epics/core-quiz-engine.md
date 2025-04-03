# Core Quiz Engine

## Epic Metadata
**Epic ID:** EP-508  
**Priority:** High  
**Estimated Effort:** 7-9 weeks  
**Dependencies:** None, can be developed in parallel with other epics  
**Business Value:** Very High (Core learning functionality)  
**Classification:** Essential (learning assessment foundation)

## Context
Assessments are a critical component of effective learning, but the current platform lacks a robust quiz system that supports diverse question types, adaptive learning, and comprehensive analytics. Instructors need advanced tools to create engaging assessments that accurately measure learning outcomes, while students need interactive quiz experiences that provide immediate feedback and adapt to their knowledge levels.

Current limitations in the assessment system include:
1. **Limited question types:** Basic multiple choice with few interactive options
2. **Static assessments:** No adaptation based on student performance
3. **Poor feedback mechanisms:** Minimal feedback that doesn't promote learning
4. **Limited analytics:** Basic scoring without detailed performance insights
5. **Isolated quizzes:** Assessments aren't integrated with learning pathways

## Business Case
- **Learning Effectiveness:** Improve knowledge retention through spaced repetition and immediate feedback
- **Engagement:** Increase student engagement with interactive assessment formats
- **Personalization:** Adapt assessment difficulty to individual student knowledge levels
- **Instructor Insights:** Provide detailed analytics on student performance and content effectiveness
- **Learning Pathway Integration:** Connect assessments to content recommendations and learning paths
- **Standards Alignment:** Support educational standards and competency tracking

## References & Links
- **[Strategic Roadmap](strategic-roadmap.md)** - Related to Interactive Quiz Platform (Epic 2)
- **[Roadmap to Production](../tardis-ui/.issues/roadmap-to-production.md)** - Supports Phase 2: Interactive Learning Features
- **[Media-Uploader Issues](../media-uploader/issues.md)** - Epic 11: Core Quiz Engine section

## Technical Scope

### Question Type Framework
- Implement core question type architecture
- Create multiple choice, true/false, and matching question types
- Add short answer and essay question support
- Implement hotspot and image-based questions
- Create drag-and-drop and ordering question types

### Adaptive Assessment Engine
- Implement item response theory algorithms
- Create adaptive difficulty adjustment
- Add knowledge gap identification
- Implement spaced repetition scheduling
- Create personalized question selection

### Interactive Feedback System
- Implement immediate feedback mechanisms
- Create explanation generation for incorrect answers
- Add hint system for struggling students
- Implement progress visualization
- Create remediation content recommendations

### Scoring and Analytics
- Implement flexible scoring algorithms
- Create performance analytics dashboard
- Add question effectiveness analysis
- Implement learning objective achievement tracking
- Create competency-based reporting

### Integration Framework
- Implement learning management system integration
- Create content recommendation engine connection
- Add learning pathway integration
- Implement standards alignment mapping
- Create third-party assessment tool integration

## Implementation Plan

### Phase 1: Question Type Architecture (Weeks 1-3)
1. Design core question framework
   - Create question type specification schema
   - Implement question rendering engine
   - Design answer validation architecture
   - Create scoring algorithm framework
   - Implement question metadata system

2. Implement basic question types
   - Create multiple choice question component
   - Implement true/false question component
   - Add fill-in-the-blank question type
   - Create matching question component
   - Implement short answer question type

3. Build advanced question types
   - Create hotspot and image-based questions
   - Implement drag-and-drop questions
   - Add ordering and sequence questions
   - Create mathematical formula questions
   - Implement code snippet questions

### Phase 2: Assessment Engine (Weeks 3-5)
1. Design quiz architecture
   - Create quiz configuration schema
   - Implement quiz session management
   - Design progress tracking system
   - Create time management features
   - Implement quiz security features

2. Build adaptive capabilities
   - Implement item response theory algorithms
   - Create difficulty estimation system
   - Add knowledge level assessment
   - Implement adaptive question selection
   - Create branching logic based on responses

3. Develop spaced repetition system
   - Create forgetting curve algorithms
   - Implement repeat scheduling
   - Add mastery tracking
   - Create interval adjustment based on performance
   - Implement topic relationship mapping

### Phase 3: Feedback and Analytics (Weeks 5-7)
1. Implement feedback system
   - Create immediate feedback presentation
   - Implement explanation generation
   - Add hint system with progressive disclosure
   - Create visual feedback mechanisms
   - Implement answer walkthrough capabilities

2. Build analytics engine
   - Create performance data collection
   - Implement analytics calculation engine
   - Add visualization components
   - Create reporting system
   - Implement export capabilities

3. Develop insights generation
   - Create knowledge gap analysis
   - Implement question effectiveness metrics
   - Add learning pattern recognition
   - Create prediction algorithms for performance
   - Implement recommendation generation

### Phase 4: Integration and Enhancement (Weeks 7-9)
1. Implement learning pathway integration
   - Create competency mapping system
   - Implement learning objective alignment
   - Add prerequisite relationship tracking
   - Create content recommendation engine
   - Implement learning path adjustment

2. Build external integrations
   - Create LMS integration using standards (LTI, etc.)
   - Implement grade passback capabilities
   - Add third-party assessment tool integration
   - Create question import/export functionality
   - Implement standards alignment mapping

3. Enhance user experience
   - Create mobile-optimized question types
   - Implement accessibility enhancements
   - Add gamification elements
   - Create interactive coaching during assessments
   - Implement social learning components

## Acceptance Criteria

### Question Type Framework
- [ ] System supports at least 8 different question types
- [ ] Question types are rendered correctly across all devices
- [ ] Questions support rich media (images, video, audio)
- [ ] Scoring works correctly for all question types
- [ ] Questions can be tagged with metadata (difficulty, topic, etc.)

### Adaptive Assessment Engine
- [ ] Assessments adapt difficulty based on student performance
- [ ] System identifies knowledge gaps for targeted learning
- [ ] Spaced repetition schedules questions for optimal retention
- [ ] Branching logic adjusts question sequence based on responses
- [ ] Assessment difficulty matches to learner's knowledge level

### Interactive Feedback System
- [ ] Students receive immediate feedback on answers
- [ ] Incorrect answers include explanations that facilitate learning
- [ ] Hints are available for students who are struggling
- [ ] Progress visualization shows mastery development
- [ ] System recommends relevant content based on performance

### Scoring and Analytics
- [ ] Flexible scoring supports various assessment strategies
- [ ] Analytics dashboard provides insights at student and class level
- [ ] Question effectiveness analysis identifies problematic questions
- [ ] Learning objective achievement is tracked and reported
- [ ] Competency-based reporting aligns with educational standards

### Integration Framework
- [ ] Quizzes integrate with learning management systems
- [ ] Assessment results inform content recommendations
- [ ] Quizzes connect to learning pathways for personalized journeys
- [ ] Standards alignment facilitates educational requirement mapping
- [ ] Third-party assessment tools can be integrated where needed

## Definition of Done
- All acceptance criteria are met
- Quiz engine performance is optimized for large scale usage
- All question types are accessible and meet WCAG 2.1 AA standards
- Security testing confirms data protection and prevents cheating
- Comprehensive analytics are available for instructors and administrators
- Documentation is complete for all quiz features
- Instructor and student onboarding materials are available

## Good to Have
- AI-generated question variants to prevent memorization
- Peer assessment capabilities for subjective questions
- Virtual proctoring features for high-stakes assessments
- Offline assessment mode with synchronization
- Collaborative quiz-taking for team-based learning
- Question generation from course content
- Custom question type creation tool for instructors

## Examples and Models

### Question Type Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Question Type                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Renderer   │    │  Validator   │    │   Scorer    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Feedback   │    │   Hints     │    │  Analytics   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  Multiple      │  │  Drag & Drop   │  │  Short Answer  │
│  Choice        │  │                │  │                │
└────────────────┘  └────────────────┘  └────────────────┘
```

### Adaptive Assessment Flow
```typescript
interface QuestionItem {
  id: string;
  type: QuestionType;
  difficulty: number; // 0-1 scale
  discrimination: number; // how well it differentiates knowledge levels
  guessing: number; // probability of guessing correctly
  content: any; // question content
  answers: Answer[];
  tags: string[]; // topic, learning objective, etc.
  metadata: Record<string, any>;
}

interface Assessment {
  id: string;
  title: string;
  description: string;
  settings: {
    adaptive: boolean;
    timeLimit?: number;
    passingScore?: number;
    maxQuestions?: number;
    shuffleQuestions: boolean;
    shuffleAnswers: boolean;
    showFeedback: FeedbackTiming;
  };
  questionPool: QuestionItem[];
  learningObjectives: LearningObjective[];
}

class AdaptiveEngine {
  private assessment: Assessment;
  private session: AssessmentSession;
  
  constructor(assessment: Assessment, learnerProfile: LearnerProfile) {
    this.assessment = assessment;
    this.session = this.initializeSession(learnerProfile);
  }
  
  private initializeSession(learner: LearnerProfile): AssessmentSession {
    // Create initial session with learner's estimated knowledge level
    return {
      id: generateUUID(),
      startTime: new Date(),
      currentQuestion: null,
      answeredQuestions: [],
      estimatedAbility: learner.knowledgeLevel || 0.5, // start at middle if unknown
      confidenceInterval: 0.4, // wide initial confidence interval
      complete: false
    };
  }
  
  public getNextQuestion(): QuestionItem | null {
    if (this.session.complete) return null;
    
    // Select next question based on current ability estimate
    const nextQuestion = this.findOptimalQuestion(
      this.assessment.questionPool,
      this.session.estimatedAbility,
      this.session.answeredQuestions.map(aq => aq.questionId)
    );
    
    this.session.currentQuestion = nextQuestion;
    return nextQuestion;
  }
  
  public submitAnswer(answer: UserAnswer): QuestionFeedback {
    // Process answer and update ability estimate
    const correct = this.evaluateAnswer(this.session.currentQuestion!, answer);
    const feedback = this.generateFeedback(this.session.currentQuestion!, answer, correct);
    
    this.session.answeredQuestions.push({
      questionId: this.session.currentQuestion!.id,
      userAnswer: answer,
      correct,
      timestamp: new Date()
    });
    
    // Update ability estimate using Item Response Theory
    this.updateAbilityEstimate();
    
    // Check if assessment should end
    this.checkCompletionCriteria();
    
    return feedback;
  }
  
  private updateAbilityEstimate(): void {
    // Implementation of IRT ability estimation algorithm
    // Uses question parameters (difficulty, discrimination, guessing)
    // and response pattern to estimate learner ability
  }
  
  private findOptimalQuestion(
    questions: QuestionItem[], 
    currentAbility: number,
    answeredIds: string[]
  ): QuestionItem {
    // Select question that provides maximum information at current ability
    // while considering learning objectives coverage
  }
}
``` 