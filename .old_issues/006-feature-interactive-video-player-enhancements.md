# [Feature] Interactive Video Player Enhancements

## Overview
Create an enhanced video player with interactive features to improve engagement and learning outcomes, including in-video quizzes, annotations, bookmarks, and comprehensive interaction tracking.

## Background
Our current video player lacks interactive elements that can boost student engagement and retention. Modern educational platforms offer interactive video experiences that significantly improve learning outcomes.

## Technical Details

### Interactive Features to Implement

1. In-Video Quizzes
   ```typescript
   interface InVideoQuiz {
     id: string;
     videoId: number;
     timeMarker: number; // seconds into video
     questions: {
       id: string;
       text: string;
       type: 'multiple-choice' | 'true-false' | 'short-answer';
       options?: string[];
       correctAnswer: string | string[];
     }[];
     displayDuration: number; // seconds to show quiz
     required: boolean; // whether student must complete to continue
   }
   ```

2. Video Annotations
   ```typescript
   interface VideoAnnotation {
     id: string;
     videoId: number;
     timeMarker: number;
     type: 'text' | 'link' | 'image' | 'formula';
     content: string;
     position: {
       x: number; // percentage from left
       y: number; // percentage from top
     };
     style?: {
       color?: string;
       size?: string;
       opacity?: number;
     };
     displayDuration?: number;
   }
   ```

3. Bookmarking System
   ```typescript
   interface VideoBookmark {
     id: string;
     userId: string;
     videoId: number;
     timeMarker: number;
     label: string;
     notes?: string;
     createdAt: string;
     customColor?: string;
   }
   ```

4. Interactive Transcript
   ```typescript
   interface VideoTranscript {
     videoId: number;
     segments: {
       id: string;
       startTime: number;
       endTime: number;
       text: string;
       speaker?: string;
     }[];
     languages: string[]; // available languages
   }
   ```

## UI Components

1. Video Player Component
   ```tsx
   <VideoPlayer
     src={videoUrl}
     quizzes={quizzes}
     annotations={annotations}
     transcript={transcript}
     onTimeUpdate={(time) => trackVideoProgress(videoId, time)}
     onQuizAnswer={(quizId, answerId, isCorrect) => trackQuizAnswer(quizId, answerId, isCorrect)}
     onAnnotationView={(annotationId) => trackAnnotationView(annotationId)}
     allowPlaybackRateChange={true}
     allowQualityChange={true}
   />
   ```

2. Video Controls Panel
   ```tsx
   <VideoControlsPanel
     currentTime={currentTime}
     duration={duration}
     bookmarks={userBookmarks}
     onAddBookmark={() => addBookmark(currentTime)}
     playbackRate={playbackRate}
     onPlaybackRateChange={(rate) => setPlaybackRate(rate)}
     quality={quality}
     availableQualities={availableQualities}
     onQualityChange={(q) => setQuality(q)}
     showTranscript={showTranscript}
     onToggleTranscript={() => setShowTranscript(!showTranscript)}
   />
   ```

## Tracking Integration

```typescript
// Video interaction tracking methods to add to InteractionTrackerContext
interface VideoTracking {
  trackVideoStart: (videoId: number, metadata?: any) => void;
  trackVideoProgress: (videoId: number, timeMarker: number, percentWatched: number) => void;
  trackVideoPause: (videoId: number, timeMarker: number) => void;
  trackVideoSeek: (videoId: number, fromTime: number, toTime: number) => void;
  trackPlaybackRateChange: (videoId: number, newRate: number) => void;
  trackQualityChange: (videoId: number, newQuality: string) => void;
  trackVideoCompletion: (videoId: number, watchedSegments: [number, number][], totalWatchedTime: number) => void;
  trackInVideoQuizImpression: (videoId: number, quizId: string) => void;
  trackInVideoQuizAnswer: (videoId: number, quizId: string, questionId: string, userAnswer: string, isCorrect: boolean, timeToAnswer: number) => void;
  trackInVideoQuizSkip: (videoId: number, quizId: string) => void;
  trackBookmarkCreation: (videoId: number, timeMarker: number) => void;
  trackAnnotationInteraction: (videoId: number, annotationId: string, interactionType: 'view' | 'click' | 'dismiss') => void;
}
```

## Database Schema Updates

```sql
-- In-Video Quizzes
CREATE TABLE video_quizzes (
  id UUID PRIMARY KEY,
  video_id INTEGER REFERENCES videos(id),
  time_marker FLOAT,
  title TEXT,
  instructions TEXT,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE video_quiz_questions (
  id UUID PRIMARY KEY,
  quiz_id UUID REFERENCES video_quizzes(id) ON DELETE CASCADE,
  question_text TEXT,
  question_type TEXT CHECK (question_type IN ('multiple-choice', 'true-false', 'short-answer')),
  options JSONB,
  correct_answer JSONB,
  points INTEGER DEFAULT 1,
  position INTEGER
);

-- Video Annotations
CREATE TABLE video_annotations (
  id UUID PRIMARY KEY,
  video_id INTEGER REFERENCES videos(id),
  time_marker FLOAT,
  annotation_type TEXT,
  content TEXT,
  position JSONB,
  style JSONB,
  display_duration INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Bookmarks
CREATE TABLE video_bookmarks (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  time_marker FLOAT,
  label TEXT,
  notes TEXT,
  custom_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Transcript
CREATE TABLE video_transcripts (
  id UUID PRIMARY KEY,
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  language TEXT,
  is_default BOOLEAN DEFAULT false
);

CREATE TABLE video_transcript_segments (
  id UUID PRIMARY KEY,
  transcript_id UUID REFERENCES video_transcripts(id) ON DELETE CASCADE,
  start_time FLOAT,
  end_time FLOAT,
  text TEXT,
  speaker TEXT,
  position INTEGER
);
```

## Acceptance Criteria

- [ ] Implement enhanced video player component
- [ ] Add in-video quiz functionality
  - [ ] Create quiz creation interface for instructors
  - [ ] Implement quiz rendering at specified timestamps
  - [ ] Track quiz interactions and performance
- [ ] Add annotation system
  - [ ] Develop annotation creation interface
  - [ ] Display annotations at specified timestamps
  - [ ] Allow instructor and student annotations with permissions
- [ ] Implement bookmarking system
  - [ ] Add UI for creating/managing bookmarks
  - [ ] Create bookmark navigation interface
  - [ ] Sync bookmarks across devices
- [ ] Add interactive transcript
  - [ ] Highlight current segment during playback
  - [ ] Allow clicking on transcript to navigate video
  - [ ] Support multiple languages
- [ ] Enhance video controls
  - [ ] Add playback rate control
  - [ ] Add quality selection
  - [ ] Implement picture-in-picture support
  - [ ] Add keyboard shortcuts
- [ ] Implement comprehensive tracking
  - [ ] Track all video interactions
  - [ ] Generate analytics on viewing patterns
  - [ ] Track engagement with interactive elements
- [ ] Create database schema and migrations
- [ ] Mobile-responsive design

## Technical Requirements
- React 18+ with TypeScript
- Video.js or Shaka Player as base player
- WebVTT support for captions/transcripts
- IndexedDB for offline bookmarks
- Optimized mobile experience
- Accessibility compliance (WCAG 2.1 AA)

## Performance Requirements
- Video loading time < 2 seconds
- Quiz overlay rendering < 200ms
- Smooth seeking/scrubbing
- Support for adaptive bitrate streaming
- Minimal memory footprint for mobile devices

## Dependencies
- Video player core library
- InteractionTrackerContext updates
- Supabase database schema changes
- New API endpoints for interactive elements

## Estimated Effort
- Story Points: 21
- Time Estimate: 10-12 days

## Related Issues
- #002 - Enhance Event Tracking Capabilities
- #011 - Improve Caching in Data Access Layer

## Labels
- feature
- video
- interactive
- high-priority
- ui-components 