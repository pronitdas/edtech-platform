# Interactive Quiz Platform

## Overview
The Interactive Quiz Platform will enhance learning outcomes by providing engaging, adaptive quizzes with immediate feedback and comprehensive analytics. This feature directly improves learning effectiveness and provides actionable insights for both learners and instructors.

## Business Value
- **Improved Learning Outcomes**: Research shows immediate feedback increases knowledge retention by up to 20%
- **Enhanced Engagement**: Interactive elements increase student engagement and course completion rates
- **Data-Driven Teaching**: Analytics help instructors identify knowledge gaps and optimize content
- **Measurable Progress**: Students gain visibility into their progress and areas for improvement

## Technical Scope

### Core Quiz Engine
- Support for multiple question types:
  - Multiple choice (single and multi-select)
  - True/False
  - Matching
  - Short answer
  - Drag and drop
  - Code challenges (with syntax highlighting)
- Adaptive question selection based on previous answers
- Question randomization to prevent memorization
- Time limits (optional per quiz or question)
- Media support (images, videos, audio) within questions

### User Experience
- Clean, accessible interface following WCAG 2.1 AA standards
- Mobile-responsive design
- Progress indicators
- Real-time feedback on answers
- Score summaries and performance metrics
- Achievement badges and progress visualization
- Keyboard navigation and screen reader support

### Instructor Features
- Quiz builder with drag-and-drop interface
- Question bank management
- Ability to import questions from standard formats (SCORM, QTI)
- Question tagging by topic, difficulty, and custom categories
- Quiz scheduling and availability settings
- Performance analytics dashboard

### Analytics & Reporting
- Detailed performance metrics per student
- Question difficulty analysis
- Knowledge gap identification
- Quiz effectiveness reporting
- Export capabilities for data analysis
- Comparative performance metrics

## Implementation Plan

### Phase 1: Question Types & Core Engine (Week 1-2)

#### Technical Tasks
1. Create base Quiz component architecture
   - QuizContainer
   - QuestionRenderer
   - AnswerInput (for different question types)
   - FeedbackDisplay
   - ProgressTracker

2. Implement core question types
   - MultipleChoiceQuestion
   - TrueFalseQuestion
   - ShortAnswerQuestion

3. Develop answer validation system
   - Exact match validation
   - Pattern match validation for text answers
   - Custom validation functions

4. Build feedback mechanisms
   - Immediate correctness indicators
   - Explanation display
   - Next question navigation

#### Testing Strategy
- Unit tests for all question components
- Integration tests for question-answer-feedback flow
- Accessibility testing for all question types
- Mobile responsiveness tests

### Phase 2: Quiz Builder & Management (Week 3-4)

#### Technical Tasks
1. Develop quiz creation interface
   - Question editor with rich text support
   - Media upload and management
   - Question sequence organization
   - Settings configuration (time limits, randomization)

2. Build question bank management
   - Create/edit/delete questions
   - Categorization and tagging system
   - Search and filtering capabilities
   - Import/export functionality

3. Implement quiz assignment features
   - Scheduling and availability settings
   - Student group assignment
   - Attempt limits configuration
   - Results visibility options

#### Testing Strategy
- Unit tests for editor components
- Integration tests for quiz creation flow
- User testing with instructors
- Data integrity tests for quiz storage

### Phase 3: Analytics & Optimization (Week 5-6)

#### Technical Tasks
1. Create analytics data collection system
   - Answer tracking
   - Time spent per question
   - Attempt patterns
   - Score calculation

2. Develop analytics dashboards
   - Student performance views
   - Question effectiveness analysis
   - Class-wide performance metrics
   - Trend visualization

3. Implement data export capabilities
   - CSV export
   - Data visualization exports
   - API access for external tools

4. Optimize performance
   - Query optimization
   - Client-side rendering improvements
   - Response time testing and optimization

#### Testing Strategy
- Integration tests for analytics data flow
- Performance testing under load
- Data accuracy verification
- User testing with instructors for dashboard usability

## Technical Architecture

### Frontend Components
```
/src
  /components
    /quiz
      /engine
        QuizContainer.tsx
        QuestionRenderer.tsx
        ProgressTracker.tsx
        TimerDisplay.tsx
        FeedbackDisplay.tsx
      /questions
        MultipleChoiceQuestion.tsx
        TrueFalseQuestion.tsx
        ShortAnswerQuestion.tsx
        MatchingQuestion.tsx
        DragDropQuestion.tsx
        CodeChallengeQuestion.tsx
      /builder
        QuizEditor.tsx
        QuestionEditor.tsx
        MediaUploader.tsx
        QuizSettings.tsx
      /analytics
        StudentPerformance.tsx
        QuestionAnalytics.tsx
        ClassPerformance.tsx
        ProgressCharts.tsx
```

### State Management
```typescript
// quizState.ts
interface QuizState {
  currentQuizId: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, Answer>;
  timeRemaining?: number;
  isSubmitted: boolean;
  feedback: FeedbackState;
  score?: QuizScore;
}

// Question and Answer interfaces
interface Question {
  id: string;
  type: QuestionType;
  content: string;
  media?: MediaItem[];
  correctAnswer: any;
  explanation?: string;
  points: number;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Answer {
  questionId: string;
  response: any;
  isCorrect?: boolean;
  attemptCount: number;
  timeSpent: number;
}

interface QuizScore {
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  questionBreakdown: Record<string, PointsEarned>;
}
```

### API Endpoints
```
POST /api/quizzes
GET /api/quizzes/:id
PUT /api/quizzes/:id
DELETE /api/quizzes/:id

POST /api/quizzes/:id/start
POST /api/quizzes/:id/submit
GET /api/quizzes/:id/results

GET /api/questions?filter=
POST /api/questions
PUT /api/questions/:id
DELETE /api/questions/:id

GET /api/analytics/student/:id/performance
GET /api/analytics/quiz/:id/performance
GET /api/analytics/course/:id/performance
```

### Database Schema
```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  course_id UUID REFERENCES courses(id),
  created_by UUID REFERENCES users(id),
  time_limit INTEGER,
  attempts_allowed INTEGER,
  randomize_questions BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id),
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  difficulty TEXT,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE question_media (
  id UUID PRIMARY KEY,
  question_id UUID REFERENCES questions(id),
  media_type TEXT NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE question_tags (
  question_id UUID REFERENCES questions(id),
  tag TEXT NOT NULL,
  PRIMARY KEY (question_id, tag)
);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score NUMERIC,
  total_time_spent INTEGER,
  is_complete BOOLEAN DEFAULT false
);

CREATE TABLE question_responses (
  id UUID PRIMARY KEY,
  attempt_id UUID REFERENCES quiz_attempts(id),
  question_id UUID REFERENCES questions(id),
  response JSONB NOT NULL,
  is_correct BOOLEAN,
  time_spent INTEGER,
  points_earned NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Component Examples

### MultipleChoiceQuestion Component
```tsx
interface MultipleChoiceQuestionProps {
  question: {
    id: string;
    content: string;
    options: string[];
    correctAnswer: number | number[];
    multiSelect?: boolean;
    explanation?: string;
  };
  onAnswer: (answer: number | number[]) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  userAnswer?: number | number[];
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  onAnswer,
  disabled = false,
  showFeedback = false,
  userAnswer
}) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    Array.isArray(userAnswer) ? userAnswer : userAnswer !== undefined ? [userAnswer] : []
  );

  const handleOptionChange = (optionIndex: number) => {
    if (disabled) return;
    
    if (question.multiSelect) {
      setSelectedOptions(prev => 
        prev.includes(optionIndex)
          ? prev.filter(idx => idx !== optionIndex)
          : [...prev, optionIndex]
      );
    } else {
      setSelectedOptions([optionIndex]);
      onAnswer(optionIndex);
    }
  };

  const handleSubmitMultiSelect = () => {
    if (disabled) return;
    onAnswer(selectedOptions);
  };

  const isCorrect = (optionIndex: number): boolean | undefined => {
    if (!showFeedback) return undefined;
    
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.includes(optionIndex);
    }
    
    return optionIndex === question.correctAnswer;
  };

  return (
    <div className="quiz-question multiple-choice" data-testid="multiple-choice-question">
      <div className="question-content">
        <h3>{question.content}</h3>
      </div>
      
      <div className="options-list">
        {question.options.map((option, index) => {
          const selected = selectedOptions.includes(index);
          const correct = isCorrect(index);
          
          let className = "option";
          if (showFeedback) {
            className += selected && correct ? " correct" : "";
            className += selected && correct === false ? " incorrect" : "";
            className += !selected && correct ? " missed" : "";
          } else {
            className += selected ? " selected" : "";
          }
          
          return (
            <div 
              key={index}
              className={className}
              onClick={() => handleOptionChange(index)}
              role="checkbox"
              aria-checked={selected}
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleOptionChange(index);
                }
              }}
              data-testid={`option-${index}`}
            >
              <div className="option-indicator">
                {question.multiSelect ? (
                  <span className="checkbox">{selected ? '✓' : ''}</span>
                ) : (
                  <span className="radio">{selected ? '●' : ''}</span>
                )}
              </div>
              <div className="option-content">{option}</div>
              {showFeedback && (
                <div className="option-feedback">
                  {selected && correct && <span className="correct-icon">✓</span>}
                  {selected && correct === false && <span className="incorrect-icon">✗</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {question.multiSelect && (
        <button 
          className="submit-button"
          onClick={handleSubmitMultiSelect}
          disabled={disabled || selectedOptions.length === 0}
          data-testid="submit-multi-select"
        >
          Submit
        </button>
      )}
      
      {showFeedback && question.explanation && (
        <div className="explanation" data-testid="question-explanation">
          <h4>Explanation:</h4>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
};
```

### QuizAnalytics Component
```tsx
interface QuizAnalyticsProps {
  quizId: string;
  courseId: string;
}

export const QuizAnalytics: React.FC<QuizAnalyticsProps> = ({ quizId, courseId }) => {
  const [analyticsData, setAnalyticsData] = useState<{
    attempts: number;
    averageScore: number;
    questionPerformance: {
      questionId: string;
      content: string;
      correctPercentage: number;
      averageTimeSpent: number;
    }[];
    studentPerformance: {
      studentId: string;
      studentName: string;
      score: number;
      completionTime: number;
    }[];
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/quiz/${quizId}/performance`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch quiz analytics');
        }
        
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [quizId]);
  
  if (loading) return <div className="loading-spinner" data-testid="analytics-loading" />;
  if (error) return <div className="error-message" data-testid="analytics-error">{error}</div>;
  if (!analyticsData) return null;
  
  return (
    <div className="quiz-analytics" data-testid="quiz-analytics">
      <div className="analytics-header">
        <h2>Quiz Performance Analytics</h2>
        <div className="summary-stats">
          <div className="stat-card">
            <h3>Total Attempts</h3>
            <p className="stat-value">{analyticsData.attempts}</p>
          </div>
          <div className="stat-card">
            <h3>Average Score</h3>
            <p className="stat-value">{analyticsData.averageScore.toFixed(1)}%</p>
          </div>
        </div>
      </div>
      
      <div className="analytics-section">
        <h3>Question Performance</h3>
        <div className="question-performance-chart">
          {/* Visualization component would go here */}
          <table className="performance-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Correct %</th>
                <th>Avg. Time</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.questionPerformance.map(question => (
                <tr key={question.questionId}>
                  <td>{question.content}</td>
                  <td>{question.correctPercentage.toFixed(1)}%</td>
                  <td>{Math.round(question.averageTimeSpent)}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="analytics-section">
        <h3>Student Performance</h3>
        <div className="student-performance-list">
          <table className="performance-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                <th>Completion Time</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.studentPerformance.map(student => (
                <tr key={student.studentId}>
                  <td>{student.studentName}</td>
                  <td>{student.score.toFixed(1)}%</td>
                  <td>{Math.floor(student.completionTime / 60)}m {student.completionTime % 60}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="export-actions">
        <button className="export-button" data-testid="export-csv">
          Export to CSV
        </button>
        <button className="export-button" data-testid="export-pdf">
          Export to PDF
        </button>
      </div>
    </div>
  );
};
```

## Testing Strategy

### Unit Tests
- Test individual question components
- Validate answer evaluation logic
- Test scoring calculations
- Verify timer functionality

### Integration Tests
- Test quiz flow from start to completion
- Verify data saved correctly after submission
- Test analytics data collection and display

### User Acceptance Testing
- Instructor testing of quiz creation
- Student testing of quiz taking experience
- Accessibility testing with screen readers

## Success Metrics
- 95% of students able to complete quizzes without technical issues
- Average quiz completion time reduced by 15% compared to previous system
- 90% of instructors report quiz analytics as useful for instruction
- Quiz question performance data shows improvement in targeted knowledge areas

## Rollout Plan
1. Alpha testing with internal team
2. Beta testing with select instructors
3. Limited course deployment
4. Platform-wide rollout
5. Post-launch analysis and optimization 