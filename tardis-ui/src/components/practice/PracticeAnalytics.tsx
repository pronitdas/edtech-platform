import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Brain,
  Zap,
  Award,
  Calendar,
  Activity,
  BookOpen,
  Star,
  Trophy,
  Flame,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface PracticeSession {
  id: string
  mode: string
  date: Date
  duration: number
  questionsAnswered: number
  correctAnswers: number
  score: number
  averageResponseTime: number
  topicsStudied: string[]
  difficulty: string
  pointsEarned: number
}

interface TopicAnalytics {
  topic: string
  totalSessions: number
  averageScore: number
  improvement: number
  timeSpent: number
  strongestAreas: string[]
  weakestAreas: string[]
  lastPracticed: Date
}

interface LearningStreak {
  current: number
  longest: number
  lastActiveDate: Date
}

interface PracticeAnalyticsProps {
  sessions: PracticeSession[]
  timeRange: '7d' | '30d' | '90d' | 'all'
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | 'all') => void
}

const PracticeAnalytics: React.FC<PracticeAnalyticsProps> = ({
  sessions,
  timeRange,
  onTimeRangeChange
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'topics' | 'progress' | 'insights'>('overview')

  // Filter sessions by time range
  const filteredSessions = useMemo(() => {
    const now = new Date()
    const cutoffDate = new Date()

    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90d':
        cutoffDate.setDate(now.getDate() - 90)
        break
      case 'all':
        cutoffDate.setFullYear(1970)
        break
    }

    return sessions.filter(session => session.date >= cutoffDate)
  }, [sessions, timeRange])

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalSessions = filteredSessions.length
    const totalTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0)
    const totalQuestions = filteredSessions.reduce((sum, s) => sum + s.questionsAnswered, 0)
    const totalCorrect = filteredSessions.reduce((sum, s) => sum + s.correctAnswers, 0)
    const totalPoints = filteredSessions.reduce((sum, s) => sum + s.pointsEarned, 0)

    const averageScore = totalSessions > 0 ? totalCorrect / totalQuestions * 100 : 0
    const averageSessionTime = totalSessions > 0 ? totalTime / totalSessions : 0
    const averageResponseTime = filteredSessions.length > 0 
      ? filteredSessions.reduce((sum, s) => sum + s.averageResponseTime, 0) / filteredSessions.length 
      : 0

    // Topic analytics
    const topicStats = new Map<string, {
      sessions: number
      totalQuestions: number
      totalCorrect: number
      totalTime: number
      scores: number[]
    }>()

    filteredSessions.forEach(session => {
      session.topicsStudied.forEach(topic => {
        if (!topicStats.has(topic)) {
          topicStats.set(topic, {
            sessions: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            totalTime: 0,
            scores: []
          })
        }

        const stats = topicStats.get(topic)!
        stats.sessions++
        stats.totalQuestions += session.questionsAnswered
        stats.totalCorrect += session.correctAnswers
        stats.totalTime += session.duration
        stats.scores.push(session.score)
      })
    })

    const topicAnalytics: TopicAnalytics[] = Array.from(topicStats.entries()).map(([topic, stats]) => ({
      topic,
      totalSessions: stats.sessions,
      averageScore: stats.totalCorrect / stats.totalQuestions * 100,
      improvement: calculateImprovement(stats.scores),
      timeSpent: stats.totalTime,
      strongestAreas: [], // Would be calculated from detailed data
      weakestAreas: [], // Would be calculated from detailed data
      lastPracticed: getLastPracticeDate(topic, filteredSessions)
    }))

    // Learning streak
    const streak = calculateLearningStreak(sessions)

    // Mode performance
    const modeStats = new Map<string, { sessions: number; avgScore: number; totalTime: number }>()
    filteredSessions.forEach(session => {
      if (!modeStats.has(session.mode)) {
        modeStats.set(session.mode, { sessions: 0, avgScore: 0, totalTime: 0 })
      }
      const stats = modeStats.get(session.mode)!
      stats.sessions++
      stats.avgScore += session.score
      stats.totalTime += session.duration
    })

    modeStats.forEach((stats, mode) => {
      stats.avgScore = stats.avgScore / stats.sessions
    })

    return {
      totalSessions,
      totalTime,
      totalQuestions,
      totalCorrect,
      totalPoints,
      averageScore,
      averageSessionTime,
      averageResponseTime,
      topicAnalytics: topicAnalytics.sort((a, b) => b.averageScore - a.averageScore),
      streak,
      modeStats: Array.from(modeStats.entries()).map(([mode, stats]) => ({ mode, ...stats }))
    }
  }, [filteredSessions, sessions])

  const calculateImprovement = (scores: number[]): number => {
    if (scores.length < 2) return 0
    const firstHalf = scores.slice(0, Math.ceil(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length
    return secondAvg - firstAvg
  }

  const getLastPracticeDate = (topic: string, sessions: PracticeSession[]): Date => {
    const topicSessions = sessions.filter(s => s.topicsStudied.includes(topic))
    return topicSessions.length > 0 
      ? new Date(Math.max(...topicSessions.map(s => s.date.getTime())))
      : new Date(0)
  }

  const calculateLearningStreak = (allSessions: PracticeSession[]): LearningStreak => {
    if (allSessions.length === 0) {
      return { current: 0, longest: 0, lastActiveDate: new Date(0) }
    }

    const sortedSessions = [...allSessions].sort((a, b) => b.date.getTime() - a.date.getTime())
    const uniqueDays = new Set(sortedSessions.map(s => s.date.toDateString()))
    const daysSorted = Array.from(uniqueDays).sort().reverse()

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()

    // Calculate current streak
    if (daysSorted.includes(today) || daysSorted.includes(yesterday)) {
      let checkDate = new Date()
      for (const day of daysSorted) {
        const dayDate = new Date(day)
        const diffTime = checkDate.getTime() - dayDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays <= 1) {
          currentStreak++
          checkDate = dayDate
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    for (let i = 0; i < daysSorted.length; i++) {
      tempStreak = 1
      for (let j = i + 1; j < daysSorted.length; j++) {
        const current = new Date(daysSorted[j - 1])
        const next = new Date(daysSorted[j])
        const diffTime = current.getTime() - next.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
          tempStreak++
        } else {
          break
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    return {
      current: currentStreak,
      longest: longestStreak,
      lastActiveDate: sortedSessions[0].date
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num.toString()
  }

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 5) return <ArrowUp className="h-4 w-4 text-green-400" />
    if (improvement < -5) return <ArrowDown className="h-4 w-4 text-red-400" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-blue-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 60) return 'text-orange-400'
    return 'text-red-400'
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="h-5 w-5 text-blue-400" />
            <span className="text-2xl font-bold text-white">{analytics.totalSessions}</span>
          </div>
          <p className="text-sm text-gray-400">Practice Sessions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-green-400" />
            <span className="text-2xl font-bold text-white">{formatTime(analytics.totalTime)}</span>
          </div>
          <p className="text-sm text-gray-400">Time Practiced</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="h-5 w-5 text-purple-400" />
            <span className={`text-2xl font-bold ${getPerformanceColor(analytics.averageScore)}`}>
              {Math.round(analytics.averageScore)}%
            </span>
          </div>
          <p className="text-sm text-gray-400">Average Score</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <span className="text-2xl font-bold text-white">{analytics.streak.current}</span>
          </div>
          <p className="text-sm text-gray-400">Day Streak</p>
        </motion.div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Trend</h3>
        <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p>Performance chart would go here</p>
            <p className="text-sm">Shows score trends over time</p>
          </div>
        </div>
      </div>

      {/* Mode Performance */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Practice Mode Performance</h3>
        <div className="space-y-4">
          {analytics.modeStats.map((mode, index) => (
            <motion.div
              key={mode.mode}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-white capitalize">{mode.mode.replace('-', ' ')}</div>
                  <div className="text-sm text-gray-400">{mode.sessions} sessions</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${getPerformanceColor(mode.avgScore)}`}>
                  {Math.round(mode.avgScore)}%
                </div>
                <div className="text-sm text-gray-400">{formatTime(mode.totalTime)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTopics = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Topic Mastery</h3>
        <div className="space-y-4">
          {analytics.topicAnalytics.map((topic, index) => (
            <motion.div
              key={topic.topic}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    topic.averageScore >= 90 ? 'bg-green-400' :
                    topic.averageScore >= 80 ? 'bg-blue-400' :
                    topic.averageScore >= 70 ? 'bg-yellow-400' :
                    topic.averageScore >= 60 ? 'bg-orange-400' : 'bg-red-400'
                  }`} />
                  <h4 className="font-medium text-white">{topic.topic}</h4>
                </div>
                <div className="flex items-center space-x-2">
                  {getImprovementIcon(topic.improvement)}
                  <span className={`font-semibold ${getPerformanceColor(topic.averageScore)}`}>
                    {Math.round(topic.averageScore)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Sessions</div>
                  <div className="text-white font-medium">{topic.totalSessions}</div>
                </div>
                <div>
                  <div className="text-gray-400">Time Spent</div>
                  <div className="text-white font-medium">{formatTime(topic.timeSpent)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Last Practiced</div>
                  <div className="text-white font-medium">
                    {topic.lastPracticed.getTime() > 0 
                      ? topic.lastPracticed.toLocaleDateString()
                      : 'Never'
                    }
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      topic.averageScore >= 90 ? 'bg-green-400' :
                      topic.averageScore >= 80 ? 'bg-blue-400' :
                      topic.averageScore >= 70 ? 'bg-yellow-400' :
                      topic.averageScore >= 60 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, topic.averageScore)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderInsights = () => {
    const insights = []

    // Performance insights
    if (analytics.averageScore >= 90) {
      insights.push({
        type: 'success',
        icon: Trophy,
        title: 'Excellent Performance!',
        description: 'You\'re maintaining a high average score. Consider increasing difficulty or exploring new topics.',
        action: 'Try advanced practice modes'
      })
    } else if (analytics.averageScore < 70) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Focus on Fundamentals',
        description: 'Your average score suggests focusing on core concepts before advancing.',
        action: 'Review easier topics'
      })
    }

    // Streak insights
    if (analytics.streak.current >= 7) {
      insights.push({
        type: 'success',
        icon: Flame,
        title: 'Amazing Streak!',
        description: `You've been practicing for ${analytics.streak.current} days straight. Keep it up!`,
        action: 'Maintain consistency'
      })
    } else if (analytics.streak.current === 0) {
      insights.push({
        type: 'info',
        icon: Calendar,
        title: 'Start a New Streak',
        description: 'Consistent daily practice leads to better learning outcomes.',
        action: 'Practice today'
      })
    }

    // Time insights
    if (analytics.averageSessionTime < 300) { // Less than 5 minutes
      insights.push({
        type: 'info',
        icon: Clock,
        title: 'Consider Longer Sessions',
        description: 'Longer practice sessions can lead to deeper learning and better retention.',
        action: 'Try 10-15 minute sessions'
      })
    }

    // Topic diversity
    if (analytics.topicAnalytics.length === 1) {
      insights.push({
        type: 'info',
        icon: BookOpen,
        title: 'Explore More Topics',
        description: 'Practicing different topics can provide a more well-rounded education.',
        action: 'Try new subjects'
      })
    }

    return (
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                insight.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                'bg-blue-500/10 border-blue-500/20'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`h-5 w-5 mt-0.5 ${
                  insight.type === 'success' ? 'text-green-400' :
                  insight.type === 'warning' ? 'text-yellow-400' :
                  'text-blue-400'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                  <p className="text-gray-300 text-sm mb-2">{insight.description}</p>
                  <button className={`text-sm font-medium ${
                    insight.type === 'success' ? 'text-green-400' :
                    insight.type === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    {insight.action} →
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}

        {insights.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Practice more to get personalized insights!</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Practice Analytics</h2>
        
        {/* Time Range Selector */}
        <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'topics', label: 'Topics', icon: BookOpen },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'insights', label: 'Insights', icon: Brain }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'topics' && renderTopics()}
        {selectedTab === 'progress' && renderOverview()} {/* Could be separate progress view */}
        {selectedTab === 'insights' && renderInsights()}
      </div>
    </div>
  )
}

export default PracticeAnalytics