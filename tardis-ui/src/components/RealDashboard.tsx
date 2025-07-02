import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  BookOpen,
  LineChart,
  Clock,
  Brain,
  BarChart,
  Lightbulb,
  Dumbbell,
} from 'lucide-react'
import { LearningDashboard } from './analytics/LearningDashboard'
import { ProgressTracking } from './ProgressTracking'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { apiClient } from '@/services/api-client'
import type { 
  DashboardStats, 
  PracticeToolResponse, 
  RecentActivityResponse, 
  TopicDataResponse, 
  TimeSpentDataResponse 
} from '@/types/dashboard'
import type { ApiResponse } from '@/types/api-types'

interface PracticeCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  lastUsed?: string
  topicIds: string[]
}

// Use the imported types instead of duplicating interfaces

interface DashboardProps {
  userId: string
  courseId?: string
  userName?: string
  className?: string
  onNavigateToLearning?: () => void
}

export const RealDashboard: React.FC<DashboardProps> = ({
  userId,
  courseId,
  userName = 'Student',
  className = '',
  onNavigateToLearning,
}) => {
  const [practiceTools, setPracticeTools] = useState<PracticeCard[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivityResponse[]>([])
  const [topicsData, setTopicsData] = useState<TopicDataResponse[]>([])
  const [timeSpentData, setTimeSpentData] = useState<TimeSpentDataResponse[]>([])
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch dashboard statistics
        const statsResponse = await apiClient.get<DashboardStats>(`/dashboard/user/${userId}/dashboard-stats`)
        if (statsResponse.success && statsResponse.data) {
          setDashboardStats(statsResponse.data)
        }

        // Fetch practice tools/modules
        const practiceResponse = await apiClient.get<PracticeToolResponse[]>('/learning/practice-tools')
        if (practiceResponse.success) {
          const tools: PracticeCard[] = practiceResponse.data.map((tool: PracticeToolResponse) => ({
            id: tool.id,
            title: tool.title,
            description: tool.description,
            icon: getIconForTool(tool.type),
            difficulty: tool.difficulty,
            estimatedTime: tool.estimated_time,
            lastUsed: tool.last_used,
            topicIds: tool.topic_ids
          }))
          setPracticeTools(tools)
        }

        // Fetch recent activity
        const activityResponse = await apiClient.get<RecentActivityResponse[]>(`/dashboard/user/${userId}/recent-activity`)
        if (activityResponse.success) {
          setRecentActivity(activityResponse.data)
        }

        // Fetch topic mastery data
        const topicsResponse = await apiClient.get<TopicDataResponse[]>(`/learning/topics/${userId}`)
        if (topicsResponse.success) {
          setTopicsData(topicsResponse.data)
        }

        // Fetch time spent data
        const timeResponse = await apiClient.get<TimeSpentDataResponse[]>(`/analytics/user/${userId}/time-tracking`)
        if (timeResponse.success) {
          setTimeSpentData(timeResponse.data)
        }

      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data. Please try again.')
        
        // Fallback to minimal demo data for development
        setDashboardStats({
          total_courses: 0,
          completed_lessons: 0,
          study_time_this_week: 0,
          achievements_earned: 0,
          total_time_spent: 0,
          completion_rate: 0,
          average_score: 0,
          streak_days: 0,
          total_activities: 0,
          current_level: 1
        })
        setPracticeTools(getDefaultPracticeTools())
        setRecentActivity([])
        setTopicsData([])
        setTimeSpentData([])
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchDashboardData()
    }
  }, [userId, courseId])

  const getIconForTool = (type: string): React.ReactNode => {
    switch (type) {
      case 'quiz':
        return <BookOpen />
      case 'problem-solving':
        return <Brain />
      case 'coding':
        return <Dumbbell />
      case 'flashcards':
        return <Lightbulb />
      case 'analytics':
        return <BarChart />
      default:
        return <GraduationCap />
    }
  }

  const getDefaultPracticeTools = (): PracticeCard[] => [
    {
      id: 'interactive-practice',
      title: 'Interactive Practice',
      description: 'Practice with interactive tools and visualizations',
      icon: <Brain />,
      difficulty: 'intermediate',
      estimatedTime: '10-15 min',
      topicIds: []
    },
    {
      id: 'knowledge-quiz',
      title: 'Knowledge Assessment',
      description: 'Test your understanding with adaptive quizzes',
      icon: <BookOpen />,
      difficulty: 'beginner',
      estimatedTime: '5-10 min',
      topicIds: []
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400'
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400'
      case 'advanced':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-96 items-center justify-center p-8'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500'></div>
          <p className='text-gray-400'>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 ${className}`}>
      {error && (
        <div className='mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4'>
          <p className='text-red-400'>{error}</p>
        </div>
      )}

      <header className='mb-6'>
        <h1 className='mb-2 text-2xl font-bold text-white'>
          Welcome back, {userName}!
        </h1>
        <div className='flex items-center justify-between'>
          <p className='text-gray-400'>
            Track your learning progress and continue your educational journey.
          </p>
          {onNavigateToLearning && (
            <button
              onClick={onNavigateToLearning}
              className='flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700'
            >
              <BookOpen className='h-4 w-4' />
              <span>Start Learning</span>
            </button>
          )}
        </div>
      </header>

      {/* Dashboard Statistics */}
      {dashboardStats && (
        <div className='mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <Card className='bg-gray-800 border-gray-700'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-400'>Total Time</p>
                  <p className='text-2xl font-bold text-white'>
                    {Math.round(dashboardStats.total_time_spent / 60)}h
                  </p>
                </div>
                <Clock className='h-8 w-8 text-blue-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gray-800 border-gray-700'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-400'>Completion Rate</p>
                  <p className='text-2xl font-bold text-white'>
                    {dashboardStats.completion_rate}%
                  </p>
                </div>
                <BarChart className='h-8 w-8 text-green-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gray-800 border-gray-700'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-400'>Average Score</p>
                  <p className='text-2xl font-bold text-white'>
                    {dashboardStats.average_score}%
                  </p>
                </div>
                <LineChart className='h-8 w-8 text-yellow-400' />
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gray-800 border-gray-700'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-400'>Current Level</p>
                  <p className='text-2xl font-bold text-white'>
                    {dashboardStats.current_level}
                  </p>
                </div>
                <GraduationCap className='h-8 w-8 text-purple-400' />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Practice Tools */}
        <div className='lg:col-span-2'>
          <Card className='bg-gray-800 border-gray-700'>
            <CardHeader>
              <CardTitle className='text-white'>Practice Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {practiceTools.map((tool) => (
                  <div
                    key={tool.id}
                    className='group cursor-pointer rounded-lg border border-gray-600 bg-gray-700/50 p-4 transition-all hover:border-indigo-500 hover:bg-gray-700'
                  >
                    <div className='mb-3 flex items-center justify-between'>
                      <div className='text-indigo-400'>{tool.icon}</div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(
                          tool.difficulty
                        )}`}
                      >
                        {tool.difficulty}
                      </span>
                    </div>
                    <h3 className='mb-2 font-semibold text-white'>{tool.title}</h3>
                    <p className='mb-3 text-sm text-gray-400'>{tool.description}</p>
                    <div className='flex items-center justify-between text-xs text-gray-500'>
                      <span>{tool.estimatedTime}</span>
                      {tool.lastUsed && (
                        <span>
                          Last used: {new Date(tool.lastUsed).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card className='bg-gray-800 border-gray-700'>
            <CardHeader>
              <CardTitle className='text-white'>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className='space-y-4'>
                  {recentActivity.map((activity, index) => (
                    <div key={index} className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-white'>
                          {activity.activity}
                        </p>
                        <p className='text-xs text-gray-400'>
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className='text-right'>
                        {activity.score && (
                          <p className='text-sm text-green-400'>{activity.score}%</p>
                        )}
                        {activity.timeSpent && (
                          <p className='text-xs text-gray-400'>{activity.timeSpent}m</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-400 text-center py-4'>
                  No recent activity. Start learning to see your progress here!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Learning Analytics */}
      {courseId && (
        <div className='mt-6'>
          <LearningDashboard userId={userId} courseId={courseId} />
        </div>
      )}

      {/* Progress Tracking */}
      {topicsData.length > 0 && (
        <div className='mt-6'>
          <ProgressTracking
            userId={userId}
            topicsData={topicsData}
            timeSpentData={timeSpentData}
          />
        </div>
      )}
    </div>
  )
}

export default RealDashboard