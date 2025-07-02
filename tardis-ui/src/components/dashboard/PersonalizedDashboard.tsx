import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Award, 
  Users, 
  FileText, 
  BarChart3,
  ChevronRight,
  Plus,
  Calendar,
  Lightbulb
} from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { apiClient } from '@/services/api-client'

interface DashboardStats {
  totalCourses: number
  completedLessons: number
  studyTimeThisWeek: number
  achievementsEarned: number
}

interface RecentActivity {
  id: string
  type: 'lesson' | 'quiz' | 'upload'
  title: string
  timestamp: string
  progress?: number
}

interface PersonalizedDashboardProps {
  onNavigateToLearning: () => void
}

const PersonalizedDashboard: React.FC<PersonalizedDashboardProps> = ({ onNavigateToLearning }) => {
  const { user } = useUser()
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    completedLessons: 0,
    studyTimeThisWeek: 0,
    achievementsEarned: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock data for now - in a real app, fetch from API
        setStats({
          totalCourses: 3,
          completedLessons: 12,
          studyTimeThisWeek: 240, // minutes
          achievementsEarned: 5
        })

        setRecentActivity([
          {
            id: '1',
            type: 'lesson',
            title: 'Introduction to Mathematics',
            timestamp: '2 hours ago',
            progress: 85
          },
          {
            id: '2',
            type: 'quiz',
            title: 'Science Quiz Chapter 3',
            timestamp: '1 day ago',
            progress: 92
          },
          {
            id: '3',
            type: 'upload',
            title: 'Uploaded History textbook',
            timestamp: '2 days ago'
          }
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getPersonalizedMessage = () => {
    if (!user) return ''
    
    const role = user.role || 'student'
    const name = user.name || 'there'
    
    if (role === 'teacher') {
      return `Ready to create amazing learning experiences for your students?`
    } else {
      const subjects = user.subjects_of_interest || []
      if (subjects.length > 0) {
        return `Let's continue your journey in ${subjects.slice(0, 2).join(' and ')}!`
      }
      return `Ready to explore new topics and expand your knowledge?`
    }
  }

  const getRecommendedActions = () => {
    if (!user) return []
    
    const role = user.role || 'student'
    
    if (role === 'teacher') {
      return [
        { icon: Plus, title: 'Create New Course', description: 'Build engaging content for your students', action: 'create-course' },
        { icon: Users, title: 'Manage Students', description: 'View student progress and analytics', action: 'manage-students' },
        { icon: BarChart3, title: 'View Analytics', description: 'Analyze classroom performance', action: 'view-analytics' },
        { icon: FileText, title: 'Upload Materials', description: 'Add new learning resources', action: 'upload-materials' }
      ]
    } else {
      return [
        { icon: BookOpen, title: 'Continue Learning', description: 'Pick up where you left off', action: 'continue-learning' },
        { icon: Plus, title: 'Upload Content', description: 'Add your study materials', action: 'upload-content' },
        { icon: Target, title: 'Practice Quiz', description: 'Test your knowledge', action: 'practice-quiz' },
        { icon: Calendar, title: 'Study Plan', description: 'Organize your learning schedule', action: 'study-plan' }
      ]
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {user?.name || 'there'}! 👋
          </h1>
          <p className="text-xl text-gray-600">
            {getPersonalizedMessage()}
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalCourses}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Active Courses</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.completedLessons}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Lessons Completed</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{Math.floor(stats.studyTimeThisWeek / 60)}h</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Study Time This Week</h3>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.achievementsEarned}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Achievements</h3>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getRecommendedActions().map((action, index) => {
                const IconComponent = action.icon
                return (
                  <motion.div
                    key={action.action}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                    className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-200 cursor-pointer group"
                    onClick={() => {
                      if (action.action === 'continue-learning' || action.action === 'upload-content' || action.action === 'upload-materials') {
                        onNavigateToLearning()
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 group-hover:scale-110 transition-transform duration-200">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-gray-600">{action.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const getActivityIcon = () => {
                    switch (activity.type) {
                      case 'lesson': return <BookOpen className="h-5 w-5 text-blue-600" />
                      case 'quiz': return <Target className="h-5 w-5 text-green-600" />
                      case 'upload': return <FileText className="h-5 w-5 text-purple-600" />
                      default: return <Lightbulb className="h-5 w-5 text-orange-600" />
                    }
                  }

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                        {getActivityIcon()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        {activity.progress && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-medium text-gray-900">{activity.progress}%</span>
                            </div>
                            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${activity.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              
              {recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-sm text-gray-400 mt-1">Start learning to see your progress here!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Personalized Recommendations */}
        {user?.subjects_of_interest && user.subjects_of_interest.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.subjects_of_interest.slice(0, 3).map((subject, index) => (
                  <motion.div
                    key={subject}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 cursor-pointer hover:shadow-md transition-all duration-200"
                    onClick={onNavigateToLearning}
                  >
                    <h3 className="font-semibold text-gray-900 mb-2">{subject}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Continue exploring {subject.toLowerCase()} concepts
                    </p>
                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      <span>Start Learning</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default PersonalizedDashboard