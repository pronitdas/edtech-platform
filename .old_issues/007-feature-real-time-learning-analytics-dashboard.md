# [Feature] Real-Time Learning Analytics Dashboard

## Overview
Develop a comprehensive real-time analytics dashboard for students and instructors that visualizes learning progress, engagement metrics, and personalized recommendations based on interaction data.

## Background
Our platform collects rich interaction data, but currently lacks an intuitive way to visualize this information for both students and instructors. A real-time dashboard will help students understand their learning patterns and help instructors identify intervention opportunities.

## Technical Details

### Dashboard Components

#### 1. Student Dashboard
```typescript
interface StudentDashboardProps {
  userId: string;
  courseId?: string;
  timeRange: 'day' | 'week' | 'month' | 'all';
  onFilterChange: (filters: DashboardFilters) => void;
}

interface StudentMetrics {
  progressMetrics: {
    completedLessons: number;
    totalLessons: number;
    completedQuizzes: number;
    totalQuizzes: number;
    averageScore: number;
    timeSpent: number; // minutes
    completionTrend: [string, number][]; // [date, completion percentage]
  };
  engagementMetrics: {
    videosWatched: number;
    videosCompleted: number;
    averageWatchTime: number; // minutes
    pauseFrequency: number;
    rewindFrequency: number;
    notesTaken: number;
    resourcesAccessed: number;
    participationScore: number; // 0-100
  };
  performanceMetrics: {
    quizScores: [string, number][]; // [quiz name, score]
    strengthAreas: {topic: string, score: number}[];
    weaknessAreas: {topic: string, score: number}[];
    improvementTrend: [string, number][]; // [date, improvement score]
  };
  learningPatterns: {
    preferredStudyTimes: [string, number][]; // [hour, frequency]
    contentTypePreference: Record<string, number>; // {video: 60, quiz: 20, text: 20}
    attentionSpan: number; // minutes
    consistencyScore: number; // 0-100
  };
}
```

#### 2. Instructor Dashboard
```typescript
interface InstructorDashboardProps {
  instructorId: string;
  courseId?: string;
  studentId?: string;
  timeRange: 'day' | 'week' | 'month' | 'all';
  onFilterChange: (filters: DashboardFilters) => void;
}

interface CourseMetrics {
  overallEngagement: {
    activeStudents: number;
    totalStudents: number;
    averageTimeSpent: number; // minutes per student
    completionRate: number; // 0-100
    dropoffPoints: {lessonId: string, dropoffCount: number}[];
  };
  contentEffectiveness: {
    mostWatchedVideos: {videoId: string, title: string, views: number}[];
    leastWatchedVideos: {videoId: string, title: string, views: number}[];
    hardestQuizzes: {quizId: string, title: string, averageScore: number}[];
    easiestQuizzes: {quizId: string, title: string, averageScore: number}[];
    contentHeatmap: Record<string, number>; // {contentId: engagement score}
  };
  studentPerformance: {
    topPerformers: {userId: string, name: string, score: number}[];
    needingAttention: {userId: string, name: string, score: number}[];
    performanceDistribution: [number, number][]; // [score range, count]
    progressDistribution: [number, number][]; // [progress percentage, count]
  };
  interactionInsights: {
    peakEngagementTimes: [string, number][]; // [hour, engagement score]
    deviceUsage: Record<string, number>; // {mobile: 40, desktop: 60}
    averageSessionLength: number; // minutes
    repeatVisitRate: number; // 0-100
  };
}
```

### UI Components

#### 1. Dashboard Layout
```tsx
<DashboardLayout
  sidebar={<DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />}
  header={
    <DashboardHeader
      title={title}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      filters={filters}
      onFilterChange={setFilters}
    />
  }
>
  <DashboardContent>
    {activeTab === 'progress' && <ProgressDashboard metrics={progressMetrics} />}
    {activeTab === 'engagement' && <EngagementDashboard metrics={engagementMetrics} />}
    {activeTab === 'performance' && <PerformanceDashboard metrics={performanceMetrics} />}
    {activeTab === 'patterns' && <PatternsDashboard metrics={learningPatterns} />}
  </DashboardContent>
</DashboardLayout>
```

#### 2. Visualization Components
```tsx
// Progress Chart
<ProgressChart
  data={progressMetrics.completionTrend}
  goal={85}
  title="Course Completion Progress"
  subtitle="Track your progress over time"
/>

// Heatmap
<ActivityHeatmap
  data={learningPatterns.preferredStudyTimes}
  title="Study Time Patterns"
  subtitle="When you're most active"
/>

// Strength/Weakness Comparison
<RadarChart
  data={[
    {area: 'Math', score: 85},
    {area: 'Science', score: 67},
    {area: 'History', score: 92},
    {area: 'Language', score: 78},
    {area: 'Arts', score: 63}
  ]}
  title="Knowledge Area Breakdown"
  colorScale={['#FF5252', '#FFAB40', '#66BB6A']}
/>

// Engagement Timeline
<EngagementTimeline
  data={engagementMetrics.sessionData}
  title="Weekly Engagement"
  subtitle="Minutes spent studying"
/>
```

### Data Service Integration

```typescript
class AnalyticsDashboardService {
  // Student dashboard methods
  async getStudentDashboardData(
    userId: string, 
    courseId?: string, 
    timeRange: TimeRange = 'week'
  ): Promise<StudentMetrics> {
    // Fetch data from multiple sources
    const [progressData, engagementData, performanceData, patternsData] = await Promise.all([
      this.getProgressMetrics(userId, courseId, timeRange),
      this.getEngagementMetrics(userId, courseId, timeRange),
      this.getPerformanceMetrics(userId, courseId, timeRange),
      this.getLearningPatterns(userId, courseId, timeRange)
    ]);
    
    // Process and return combined metrics
    return {
      progressMetrics: progressData,
      engagementMetrics: engagementData,
      performanceMetrics: performanceData,
      learningPatterns: patternsData
    };
  }
  
  // Instructor dashboard methods
  async getCourseAnalytics(
    courseId: string,
    instructorId: string,
    timeRange: TimeRange = 'week'
  ): Promise<CourseMetrics> {
    // Implementation
  }
  
  async getStudentPerformanceComparison(
    courseId: string,
    metric: 'progress' | 'engagement' | 'quiz_scores'
  ): Promise<{studentId: string, name: string, value: number}[]> {
    // Implementation
  }
  
  // Analytics processing methods
  private calculateEngagementScore(interactions: InteractionEvent[]): number {
    // Algorithm for calculating engagement score
  }
  
  private identifyStrengthsAndWeaknesses(
    quizResults: QuizResult[]
  ): {strengths: string[], weaknesses: string[]} {
    // Algorithm for identifying strengths and weaknesses
  }
  
  private generateRecommendations(
    metrics: StudentMetrics
  ): Recommendation[] {
    // Algorithm for generating personalized recommendations
  }
}
```

### Database Schema Updates

```sql
-- Dashboard precomputed metrics
CREATE TABLE student_dashboard_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  time_range TEXT CHECK (time_range IN ('day', 'week', 'month', 'all')),
  metrics JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_student_metrics_lookup ON student_dashboard_metrics (user_id, course_id, time_range);

-- Course level analytics
CREATE TABLE course_analytics (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  time_range TEXT CHECK (time_range IN ('day', 'week', 'month', 'all')),
  metrics JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE
);

-- Content effectiveness metrics
CREATE TABLE content_effectiveness_metrics (
  id UUID PRIMARY KEY,
  content_id UUID,
  content_type TEXT CHECK (content_type IN ('video', 'quiz', 'reading', 'exercise')),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  engagement_score FLOAT,
  completion_rate FLOAT,
  average_time_spent INTEGER, -- seconds
  difficulty_score FLOAT,
  effectiveness_score FLOAT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time counters (for dashboard indicators)
CREATE TABLE real_time_counters (
  id UUID PRIMARY KEY,
  entity_id UUID, -- course_id or content_id
  entity_type TEXT CHECK (entity_type IN ('course', 'video', 'quiz', 'reading', 'exercise')),
  counter_name TEXT,
  counter_value INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Acceptance Criteria

### Student Dashboard
- [ ] Implement student progress visualization
  - [ ] Course completion progress
  - [ ] Lesson/module completion tracking
  - [ ] Time spent metrics
- [ ] Create engagement metrics visualization
  - [ ] Video watch patterns
  - [ ] Quiz attempt patterns
  - [ ] Resource usage statistics
- [ ] Develop performance analytics
  - [ ] Quiz scores visualization
  - [ ] Strengths and weaknesses identification
  - [ ] Performance trends over time
- [ ] Add learning pattern insights
  - [ ] Study time patterns
  - [ ] Content type preferences
  - [ ] Attention span metrics
- [ ] Implement personalized recommendations
  - [ ] Based on performance
  - [ ] Based on engagement
  - [ ] Next steps suggestions

### Instructor Dashboard
- [ ] Create course overview dashboard
  - [ ] Student engagement summary
  - [ ] Content effectiveness metrics
  - [ ] Completion and dropout visualization
- [ ] Implement student comparison views
  - [ ] Performance distribution
  - [ ] Engagement distribution
  - [ ] Students at risk identification
- [ ] Add content effectiveness analysis
  - [ ] Most/least engaging content
  - [ ] Difficulty assessment
  - [ ] Content improvement recommendations
- [ ] Develop real-time monitoring
  - [ ] Active students tracking
  - [ ] Live engagement metrics
  - [ ] Real-time quiz performance
- [ ] Create intervention tools
  - [ ] Targeted message system
  - [ ] Custom assignment creation
  - [ ] Support flag system

### Technical Implementation
- [ ] Design and implement dashboard UI components
- [ ] Develop data processing services
- [ ] Create API endpoints for dashboard data
- [ ] Implement data caching strategy
- [ ] Set up real-time update system
- [ ] Add export functionality for reports
- [ ] Ensure responsive design for all screen sizes

## Technical Requirements
- React 18+ with TypeScript
- Visualization libraries (D3.js, Recharts, or Nivo)
- Real-time updates via WebSockets
- Server-side data aggregation
- Responsive design implementation
- Performance optimization for large datasets
- Accessibility compliance (WCAG 2.1 AA)
- Exportable reports (PDF, CSV)

## Performance Requirements
- Initial dashboard load < 2 seconds
- Real-time updates < 500ms
- Support for courses with 10,000+ students
- Efficient data caching strategy
- Optimized for mobile devices
- Smooth transitions between views

## Dependencies
- Analytics Service
- InteractionTrackerContext
- Database schema updates
- API endpoint development
- Authentication integration

## Estimated Effort
- Story Points: 34
- Time Estimate: 15-18 days

## Related Issues
- #002 - Enhance Event Tracking Capabilities
- #008 - Modularize Analytics Generation Logic
- #011 - Improve Caching in Data Access Layer

## Labels
- feature
- dashboard
- analytics
- ui
- high-priority 