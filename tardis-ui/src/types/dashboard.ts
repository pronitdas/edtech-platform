// Dashboard-specific TypeScript interfaces

export interface DashboardStats {
  total_courses: number
  completed_lessons: number
  study_time_this_week: number
  achievements_earned: number
  total_time_spent: number
  completion_rate: number
  average_score: number
  streak_days: number
  total_activities: number
  current_level: number
}

export interface PracticeToolResponse {
  id: string
  title: string
  description: string
  type: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimated_time: string
  last_used?: string
  topic_ids: string[]
}

export interface RecentActivityResponse {
  id: string
  type: 'lesson' | 'quiz' | 'upload'
  title: string
  timestamp: string
  progress?: number
  timeSpent?: number
}

export interface TopicDataResponse {
  topicId: string
  topicName: string
  masteryLevel: number
  questionsAttempted: number
  questionsCorrect: number
  averageResponseTime: number
  lastPracticed: string
}

export interface TimeSpentDataResponse {
  date: string
  minutes: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface DashboardApiResponses {
  stats: ApiResponse<DashboardStats>
  practiceTools: ApiResponse<PracticeToolResponse[]>
  recentActivity: ApiResponse<RecentActivityResponse[]>
  topicsData: ApiResponse<TopicDataResponse[]>
  timeSpentData: ApiResponse<TimeSpentDataResponse[]>
}