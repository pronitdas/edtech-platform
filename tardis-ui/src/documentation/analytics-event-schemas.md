# Analytics Event Schemas Documentation

This document outlines the standardized schemas for all event types tracked in the application.

## Base Schema

All analytics events extend from a base schema that includes common required fields:

```typescript
interface BaseAnalyticsEvent {
  knowledgeId: string // Link to curriculum knowledge
  moduleId: string // Module containing this content
  timestamp?: number // When event occurred (set automatically if not provided)
}
```

## Video Events

### Video Play Event

Tracks when a video starts playing.

```typescript
interface VideoPlayEvent extends BaseAnalyticsEvent {
  currentTime: number // Current playback position in seconds
  totalDuration: number // Total video duration in seconds
  progressPercent: number // Percentage of video watched (0-100)
  videoId: string // Identifier for the specific video
  videoTitle?: string // Title of the video
  quality?: string // Video quality (e.g., "720p", "1080p")
}
```

### Video Pause Event

Tracks when a video is paused.

```typescript
interface VideoPauseEvent extends VideoPlayEvent {
  pauseReason?: string // Reason for pausing (e.g., "user", "buffer", "visibility")
  timeWatched: number // Time watched since last play event
}
```

### Video Complete Event

Tracks when a video is completed.

```typescript
interface VideoCompleteEvent extends BaseAnalyticsEvent {
  videoId: string // Identifier for the specific video
  videoTitle?: string // Title of the video
  watchedSegments: [number, number][] // Segments of video watched [[start1, end1], [start2, end2], ...]
  totalWatchedTime: number // Total time watched in seconds
  completePercent: number // Percentage of video watched in total (0-100)
  watchCount: number // Number of times video was started
}
```

### Video Progress Event

Tracks milestone progress through a video (25%, 50%, 75%, 100%).

```typescript
interface VideoProgressEvent extends VideoPlayEvent {
  milestone: number // Percentage milestone reached (25, 50, 75, 100)
}
```

## Quiz Events

### Quiz Start Event

Tracks when a quiz is started.

```typescript
interface QuizStartEvent extends BaseAnalyticsEvent {
  quizId: string // Identifier for the quiz
  quizTitle?: string // Title of the quiz
  questionCount: number // Total number of questions
  difficulty?: string // Quiz difficulty level
  timeLimit?: number // Time limit in seconds (if applicable)
  attemptNumber: number // Which attempt this is (1, 2, 3, etc.)
}
```

### Quiz Question Answer Event

Tracks individual question answers.

```typescript
interface QuizQuestionAnswerEvent extends BaseAnalyticsEvent {
  quizId: string // Identifier for the quiz
  attemptId: string // Unique identifier for this attempt
  questionId: string // Question identifier
  questionType: string // Type of question (multiple-choice, fill-blank, etc)
  isCorrect: boolean // Whether the answer was correct
  timeTaken: number // Time taken to answer in seconds
  userAnswer: any // The answer provided by the user
  correctAnswer?: any // The correct answer
}
```

### Quiz Submit Event

Tracks when a quiz is submitted.

```typescript
interface QuizSubmitEvent extends BaseAnalyticsEvent {
  quizId: string // Identifier for the quiz
  quizTitle?: string // Title of the quiz
  attemptId: string // Unique identifier for this attempt
  score: number // Score achieved
  maxScore: number // Maximum possible score
  durationSeconds: number // Time taken to complete the quiz
  correctAnswers: number // Number of correct answers
  totalQuestions: number // Total number of questions
  attemptNumber: number // Which attempt this is (1, 2, 3, etc.)
  passingScore?: number // Passing score threshold (if applicable)
  passed?: boolean // Whether the user passed
}
```

## Roleplay Events

### Roleplay Start Event

Tracks when a roleplay scenario begins.

```typescript
interface RoleplayStartEvent extends BaseAnalyticsEvent {
  scenarioId: string
  scenarioTitle: string
  difficulty: string
  estimatedDuration: number
  studentProfiles: Array<{
    name: string
    personality: string
  }>
}
```

### Roleplay Response Event

Tracks individual teacher responses during roleplay.

```typescript
interface RoleplayResponseEvent extends BaseAnalyticsEvent {
  scenarioId: string
  step: number
  studentName: string
  studentPersonality: string
  question: string
  response: string
  responseTime: number
  feedbackProvided?: string
}
```

### Roleplay Complete Event

Tracks when a roleplay scenario is completed.

```typescript
interface RoleplayCompleteEvent extends BaseAnalyticsEvent {
  scenarioId: string
  totalSteps: number
  completedSteps: number
  totalScore: number
  maxPossibleScore: number
  durationSeconds: number
  evaluations: Array<{
    criteriaId: string
    criteriaName: string
    score: number
    maxScore: number
    feedback: string
  }>
}
```

## Other Content Events

### Content View Event

Tracks when a user views any content.

```typescript
interface ContentViewEvent extends BaseAnalyticsEvent {
  contentId: string // Identifier for the content
  contentType: string // Type of content (article, video, mindmap, etc.)
  contentTitle?: string // Title of the content
  viewDuration?: number // How long the content was viewed (in seconds)
  referrer?: string // Where the user came from
}
```

### Navigation Event

Tracks user navigation through the application.

```typescript
interface NavigationEvent extends BaseAnalyticsEvent {
  fromRoute: string // Previous route
  toRoute: string // Current route
  navigationMethod: string // How navigation occurred (link, button, back, etc.)
  durationOnPreviousPage?: number // Time spent on previous page in seconds
}
```

### MindMap Interaction Event

Tracks interactions with mind maps.

```typescript
interface MindMapInteractionEvent extends BaseAnalyticsEvent {
  mapId: string // Identifier for the mind map
  interactionType: string // Type of interaction (zoom, pan, click, expand, collapse)
  nodeId?: string // Identifier for the node being interacted with
  nodeTitle?: string // Title of the node
  zoomLevel?: number // Current zoom level
  expandedNodes?: number // Number of expanded nodes
}
```

## Usage with Analytics Hooks

The application provides specialized hooks for tracking events with these schemas:

- `useVideoAnalytics`: For tracking video interactions
- `useQuizAnalytics`: For tracking quiz interactions
- `useRoleplayAnalytics`: For tracking roleplay interactions
- `useContentViewAnalytics`: For tracking content views
- `useNavigationAnalytics`: For tracking user navigation
- `useMindMapAnalytics`: For tracking mindmap interactions

### Example: Video Analytics

```typescript
import { useVideoAnalytics } from '@/hooks/useVideoAnalytics';

const MyVideoPlayer = ({ knowledgeId, moduleId, videoId, title }) => {
  const videoAnalytics = useVideoAnalytics({
    knowledgeId,
    moduleId,
    videoId,
    videoTitle: title
  });

  const handlePlay = () => {
    const currentTime = player.currentTime;
    const duration = player.duration;
    videoAnalytics.trackPlay(currentTime, duration);
  };

  const handlePause = () => {
    const currentTime = player.currentTime;
    const duration = player.duration;
    videoAnalytics.trackPause(currentTime, duration, 'user');
  };

  // Check progress on time update
  const handleTimeUpdate = () => {
    const currentTime = player.currentTime;
    const duration = player.duration;
    videoAnalytics.checkAndTrackProgress(currentTime, duration);
  };

  const handleEnded = () => {
    videoAnalytics.trackComplete(player.duration);
  };

  return (
    <video
      onPlay={handlePlay}
      onPause={handlePause}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
    />
  );
};
```

### Example: Quiz Analytics

```typescript
import { useQuizAnalytics } from '@/hooks/useQuizAnalytics';

const QuizComponent = ({ knowledgeId, moduleId, quizId, title, questions }) => {
  const quizAnalytics = useQuizAnalytics({
    knowledgeId,
    moduleId,
    quizId,
    quizTitle: title
  });

  useEffect(() => {
    // Track quiz start
    quizAnalytics.trackStart(questions.length, 'medium');
  }, []);

  const handleAnswer = (question, answer) => {
    // Create a timer to measure response time
    const timer = quizAnalytics.createQuestionTimer();
    timer.start();

    // Handle answer...

    // Track the answer
    const isCorrect = checkAnswer(question, answer);
    const timeTaken = timer.end();

    quizAnalytics.trackAnswer(
      question.id,
      question.type,
      isCorrect,
      timeTaken,
      answer,
      question.correctAnswer
    );
  };

  const handleSubmit = () => {
    const score = calculateScore();
    quizAnalytics.trackSubmit(score, 100, questions.length, 60);
  };

  return (
    // Quiz component JSX
  );
};
```

### Example: Content View Analytics

```typescript
import { useContentViewAnalytics } from '@/hooks/useContentViewAnalytics';

const ArticleComponent = ({ knowledgeId, moduleId, articleId, title }) => {
  // The hook will automatically track:
  // - Initial view on mount
  // - View with duration on unmount
  const contentAnalytics = useContentViewAnalytics({
    knowledgeId,
    moduleId,
    contentId: articleId,
    contentType: 'article',
    contentTitle: title
  });

  // For manually tracking with additional info
  const handleShareClick = () => {
    // Track the current view when sharing
    const duration = contentAnalytics.getCurrentViewDuration();
    contentAnalytics.trackView(duration, 'share-button');

    // Share logic...
  };

  return (
    <div className="article">
      <h1>{title}</h1>
      <div className="content">
        {/* Article content */}
      </div>
      <button onClick={handleShareClick}>Share</button>
    </div>
  );
};
```

### Example: Navigation Analytics

```typescript
import { useNavigationAnalytics } from '@/hooks/useNavigationAnalytics';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const NavigationWrapper = ({ knowledgeId, moduleId, children }) => {
  const router = useRouter();
  const navigationAnalytics = useNavigationAnalytics({
    knowledgeId,
    moduleId
  });

  // Initialize on mount with current route
  useEffect(() => {
    navigationAnalytics.initializeTracking(router.asPath);

    // Set up router change listeners
    const handleRouteChangeStart = (url: string) => {
      navigationAnalytics.navigateTo(url, 'client-navigation');
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router, navigationAnalytics]);

  // Custom navigation handling
  const handleButtonNavigation = (path) => {
    navigationAnalytics.navigateTo(path, 'button-click');
    router.push(path);
  };

  return (
    <div>
      <button onClick={() => handleButtonNavigation('/dashboard')}>
        Dashboard
      </button>
      {children}
    </div>
  );
};
```

### Example: MindMap Analytics

```typescript
import { useMindMapAnalytics } from '@/hooks/useMindMapAnalytics';

const MindMapComponent = ({ knowledgeId, moduleId, mapId }) => {
  const mindMapAnalytics = useMindMapAnalytics({
    knowledgeId,
    moduleId,
    mapId
  });

  const handleNodeClick = (node) => {
    mindMapAnalytics.trackNodeClick(node.id, node.title);
    // Node click logic...
  };

  const handleNodeExpand = (node, expandedCount) => {
    mindMapAnalytics.trackNodeExpand(node.id, node.title, expandedCount);
    // Node expand logic...
  };

  const handleZoom = (level) => {
    mindMapAnalytics.trackZoom(level);
    // Zoom logic...
  };

  const handleSearch = (searchTerm) => {
    // Search logic...
    const foundNode = search(searchTerm);

    if (foundNode) {
      mindMapAnalytics.trackSearch(foundNode.id, foundNode.title);
    } else {
      mindMapAnalytics.trackSearch(); // No node found
    }
  };

  return (
    <div className="mind-map">
      {/* Mind map implementation */}
    </div>
  );
};
```
