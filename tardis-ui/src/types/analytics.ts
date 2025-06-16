// Standardized Analytics Event Type Definitions

// Base Event Interface (all events should extend this)
export interface BaseAnalyticsEvent {
  knowledgeId: string // Link to curriculum knowledge
  moduleId: string // Module containing this content
  timestamp?: number // When event occurred (set automatically if not provided)
}

// Video Events
export interface VideoPlayEvent extends BaseAnalyticsEvent {
  currentTime: number // Current playback position in seconds
  totalDuration: number // Total video duration in seconds
  progressPercent: number // Percentage of video watched (0-100)
  videoId: string // Identifier for the specific video
  videoTitle?: string // Title of the video
  quality?: string // Video quality (e.g., "720p", "1080p")
}

export interface VideoPauseEvent extends VideoPlayEvent {
  pauseReason?: string // Reason for pausing (e.g., "user", "buffer", "visibility")
  timeWatched: number // Time watched since last play event
}

export interface VideoCompleteEvent extends BaseAnalyticsEvent {
  videoId: string // Identifier for the specific video
  videoTitle?: string // Title of the video
  watchedSegments: [number, number][] // Segments of video watched [[start1, end1], [start2, end2], ...]
  totalWatchedTime: number // Total time watched in seconds
  completePercent: number // Percentage of video watched in total (0-100)
  watchCount: number // Number of times video was started
}

export interface VideoProgressEvent extends VideoPlayEvent {
  milestone: number // Percentage milestone reached (25, 50, 75, 100)
}

// Quiz Events
export interface QuizStartEvent extends BaseAnalyticsEvent {
  quizId: string // Identifier for the quiz
  quizTitle?: string // Title of the quiz
  questionCount: number // Total number of questions
  difficulty?: string // Quiz difficulty level
  timeLimit?: number // Time limit in seconds (if applicable)
  attemptNumber: number // Which attempt this is (1, 2, 3, etc.)
}

export interface QuizQuestionAnswerEvent extends BaseAnalyticsEvent {
  quizId: string // Identifier for the quiz
  attemptId: string // Unique identifier for this attempt
  questionId: string // Question identifier
  questionType: string // Type of question (multiple-choice, fill-blank, etc)
  isCorrect: boolean // Whether the answer was correct
  timeTaken: number // Time taken to answer in seconds
  userAnswer: any // The answer provided by the user
  correctAnswer?: any // The correct answer
}

export interface QuizSubmitEvent extends BaseAnalyticsEvent {
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

// Content View Events
export interface ContentViewEvent extends BaseAnalyticsEvent {
  contentId: string // Identifier for the content
  contentType: string // Type of content (article, video, mindmap, etc.)
  contentTitle?: string // Title of the content
  viewDuration?: number // How long the content was viewed (in seconds)
  referrer?: string // Where the user came from
}

// Navigation Events
export interface NavigationEvent extends BaseAnalyticsEvent {
  fromRoute: string // Previous route
  toRoute: string // Current route
  navigationMethod: string // How navigation occurred (link, button, back, etc.)
  durationOnPreviousPage?: number // Time spent on previous page in seconds
}

// MindMap Events
export interface MindMapInteractionEvent extends BaseAnalyticsEvent {
  mapId: string // Identifier for the mind map
  interactionType: string // Type of interaction (zoom, pan, click, expand, collapse)
  nodeId?: string // Identifier for the node being interacted with
  nodeTitle?: string // Title of the node
  zoomLevel?: number // Current zoom level
  expandedNodes?: number // Number of expanded nodes
}
