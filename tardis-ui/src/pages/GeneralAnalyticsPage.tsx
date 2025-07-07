import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { BarChart3, TrendingUp, Users, Clock, Brain, Target, Award, Zap } from 'lucide-react'

interface GeneralAnalyticsData {
  overview: {
    totalKnowledge: number
    totalLearningTime: number // minutes
    totalSessions: number
    averageScore: number
    currentStreak: number
    bestStreak: number
  }
  learningProgress: {
    coursesStarted: number
    coursesCompleted: number
    averageProgress: number
    totalChaptersViewed: number
  }
  recentActivity: Array<{
    type: 'video_watch' | 'quiz_attempt' | 'chapter_complete' | 'practice_session'
    knowledge_name: string
    chapter_name?: string
    timestamp: string
    duration?: number
    score?: number
  }>
  topPerformance: {
    bestKnowledge: Array<{
      name: string
      progress: number
      score: number
    }>
    strongSubjects: string[]
    improvementAreas: string[]
  }
  weeklyStats: {
    sessionsThisWeek: number
    minutesThisWeek: number
    goalProgress: number // 0-1
    weeklyGoal: number // minutes per week
  }
}

export default function GeneralAnalyticsPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [analytics, setAnalytics] = useState<GeneralAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchGeneralAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        // Try to fetch from API first
        try {
          const response = await fetch(`/v2/analytics/user/${user.id}/general`)
          if (response.ok) {
            const data = await response.json()
            setAnalytics(data)
            return
          }
        } catch (apiError) {
          console.log('API not available, using mock data')
        }

        // Fallback to mock data for development
        const mockData: GeneralAnalyticsData = {
          overview: {
            totalKnowledge: 12,
            totalLearningTime: 1450, // minutes
            totalSessions: 89,
            averageScore: 78,
            currentStreak: 5,
            bestStreak: 12
          },
          learningProgress: {
            coursesStarted: 12,
            coursesCompleted: 7,
            averageProgress: 65,
            totalChaptersViewed: 142
          },
          recentActivity: [
            {
              type: 'practice_session',
              knowledge_name: 'Advanced Mathematics',
              chapter_name: 'Calculus Fundamentals',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              duration: 25,
              score: 85
            },
            {
              type: 'video_watch',
              knowledge_name: 'Physics Concepts',
              chapter_name: 'Quantum Mechanics',
              timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
              duration: 18
            },
            {
              type: 'quiz_attempt',
              knowledge_name: 'Biology Basics',
              chapter_name: 'Cell Structure',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              score: 92
            },
            {
              type: 'chapter_complete',
              knowledge_name: 'Chemistry',
              chapter_name: 'Organic Chemistry',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
          ],
          topPerformance: {
            bestKnowledge: [
              { name: 'Mathematics', progress: 95, score: 88 },
              { name: 'Physics', progress: 78, score: 85 },
              { name: 'Chemistry', progress: 82, score: 79 }
            ],
            strongSubjects: ['Algebra', 'Calculus', 'Quantum Physics', 'Organic Chemistry'],
            improvementAreas: ['Statistics', 'Thermodynamics', 'Biology']
          },
          weeklyStats: {
            sessionsThisWeek: 8,
            minutesThisWeek: 240,
            goalProgress: 0.68,
            weeklyGoal: 350
          }
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        setAnalytics(mockData)

      } catch (error) {
        console.error('Error fetching general analytics:', error)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchGeneralAnalytics()
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Analytics</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/app')}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-white mb-2">No Analytics Data</h2>
          <p className="text-gray-400 mb-4">Start learning to see your progress</p>
          <button
            onClick={() => navigate('/app')}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Start Learning
          </button>
        </div>
      </div>
    )
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'video_watch': return '🎥'
      case 'quiz_attempt': return '❓'
      case 'chapter_complete': return '✅'
      case 'practice_session': return '💪'
      default: return '📚'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'video_watch': return 'bg-blue-500'
      case 'quiz_attempt': return 'bg-yellow-500'
      case 'chapter_complete': return 'bg-green-500'
      case 'practice_session': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/app')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h1 className="text-xl font-semibold text-white flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-cyan-400" />
                  Learning Analytics
                </h1>
                <p className="text-sm text-gray-400">Your comprehensive learning overview</p>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Welcome back, {user?.first_name || 'Learner'}!
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Brain className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total Courses</p>
                <p className="text-2xl font-bold text-white">{analytics.overview.totalKnowledge}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Clock className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Learning Time</p>
                <p className="text-2xl font-bold text-white">
                  {formatTime(analytics.overview.totalLearningTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <Target className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Avg Score</p>
                <p className="text-2xl font-bold text-white">{analytics.overview.averageScore}%</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Current Streak</p>
                <p className="text-2xl font-bold text-white">{analytics.overview.currentStreak} days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Learning Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Goal Progress */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-cyan-400" />
                Weekly Learning Goal
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">
                    {analytics.weeklyStats.minutesThisWeek} / {analytics.weeklyStats.weeklyGoal} minutes
                  </span>
                  <span className="text-cyan-400 font-medium">
                    {Math.round(analytics.weeklyStats.goalProgress * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${analytics.weeklyStats.goalProgress * 100}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-400">Sessions</p>
                    <p className="text-lg font-medium text-white">{analytics.weeklyStats.sessionsThisWeek}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Minutes</p>
                    <p className="text-lg font-medium text-white">{analytics.weeklyStats.minutesThisWeek}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Goal</p>
                    <p className="text-lg font-medium text-white">{analytics.weeklyStats.weeklyGoal}m</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Progress */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Course Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{analytics.learningProgress.coursesCompleted}</p>
                  <p className="text-sm text-gray-400">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{analytics.learningProgress.coursesStarted}</p>
                  <p className="text-sm text-gray-400">Started</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{analytics.learningProgress.averageProgress}%</p>
                  <p className="text-sm text-gray-400">Avg Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{analytics.learningProgress.totalChaptersViewed}</p>
                  <p className="text-sm text-gray-400">Chapters</p>
                </div>
              </div>
            </div>

            {/* Top Performance */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Award className="h-5 w-5 mr-2 text-yellow-400" />
                Top Performance
              </h3>
              <div className="space-y-3">
                {analytics.topPerformance.bestKnowledge.map((course, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{course.name}</p>
                      <p className="text-sm text-gray-400">{course.progress}% complete</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">{course.score}%</p>
                      <p className="text-xs text-gray-400">Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {analytics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}/20`}>
                      <span className="text-sm">{getActivityIcon(activity.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.knowledge_name}
                      </p>
                      {activity.chapter_name && (
                        <p className="text-xs text-gray-400 truncate">{activity.chapter_name}</p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                        {activity.score && (
                          <span className="text-xs text-green-400">{activity.score}%</span>
                        )}
                        {activity.duration && (
                          <span className="text-xs text-blue-400">{activity.duration}m</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strong Subjects */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Strong Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {analytics.topPerformance.strongSubjects.map((subject, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            {/* Improvement Areas */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Focus Areas</h3>
              <div className="flex flex-wrap gap-2">
                {analytics.topPerformance.improvementAreas.map((area, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}