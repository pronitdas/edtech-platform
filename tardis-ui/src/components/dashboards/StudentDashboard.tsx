import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Target,
  TrendingUp,
  Award,
  Clock,
  Brain,
  Star,
  CheckCircle,
  Play,
  Calendar,
  BarChart3,
  Search,
  Lightbulb,
  LineChart,
  GraduationCap
} from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'
import { LearningDashboard } from '../analytics/LearningDashboard'
import { ProgressTracking } from '../ProgressTracking'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import SemanticSearchInterface from '../search/SemanticSearchInterface'
import GeneratedContentTutor from '../ai-tutor/GeneratedContentTutor'
import { apiClient } from '@/services/api-client'

interface LearningProgress {
  totalTopics: number
  completedTopics: number
  currentStreak: number
  totalStudyTime: number
  weeklyGoal: number
  achievedThisWeek: number
}

interface Assignment {
  id: string
  title: string
  subject: string
  dueDate: string
  progress: number
  priority: 'low' | 'medium' | 'high'
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: string
  category: 'learning' | 'streak' | 'practice' | 'social'
}

const StudentDashboard: React.FC = () => {
  const { user } = useUser()
  const { trackEvent } = useInteractionTracker()
  const [progress, setProgress] = useState<LearningProgress | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [generatedContent, setGeneratedContent] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [practiceTools, setPracticeTools] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showSemanticSearch, setShowSemanticSearch] = useState(false)
  const [showAITutor, setShowAITutor] = useState(false)
  const [selectedContentForTutor, setSelectedContentForTutor] = useState<any>(null)

  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true)
      try {
        // Fetch student progress
        const progressResponse = await fetch(`/api/v2/student/progress`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
        if (progressResponse.ok) {
          const contentType = progressResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            setProgress(await progressResponse.json())
          } else {
            console.warn('Progress endpoint returned non-JSON response')
          }
        }

        // Fetch assignments
        const assignmentsResponse = await fetch(`/api/v2/student/assignments`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
        if (assignmentsResponse.ok) {
          const contentType = assignmentsResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            setAssignments(await assignmentsResponse.json())
          } else {
            console.warn('Assignments endpoint returned non-JSON response')
          }
        }

        // Fetch achievements
        const achievementsResponse = await fetch(`/api/v2/student/achievements`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        })
        if (achievementsResponse.ok) {
          const contentType = achievementsResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            setAchievements(await achievementsResponse.json())
          } else {
            console.warn('Achievements endpoint returned non-JSON response')
          }
        }

        trackEvent({
          eventType: 'dashboard_view',
          contentId: 'student_dashboard',
          knowledgeId: 'dashboard',
          moduleId: 'student_mode',
          contentType: 'dashboard',
          timestamp: Date.now()
        })

        // Fetch generated content
        try {
          const generatedResponse = await fetch(`/api/v2/topic-generation/my-generated-content`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          })
          if (generatedResponse.ok) {
            const contentType = generatedResponse.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const data = await generatedResponse.json()
              if (data.generated_content) {
                setGeneratedContent(data.generated_content)
              }
            } else {
              console.warn('Generated content endpoint returned non-JSON response')
            }
          }
        } catch (error) {
          console.log('No generated content available yet')
        }

        // Fetch practice tools
        try {
          const practiceResponse = await fetch(`/learning/practice-tools`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          })
          if (practiceResponse.ok) {
            const contentType = practiceResponse.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
              const tools = await practiceResponse.json()
              setPracticeTools(tools || [])
            } else {
              console.warn('Practice tools endpoint returned non-JSON response')
            }
          }
        } catch (error) {
          console.log('No practice tools available')
        }

      } catch (error) {
        console.error('Error loading student data:', error)
        // Set fallback empty states
        setProgress({
          totalTopics: 0,
          completedTopics: 0,
          currentStreak: 0,
          totalStudyTime: 0,
          weeklyGoal: 300,
          achievedThisWeek: 0
        })
        setAssignments([])
        setAchievements([])
        setGeneratedContent([])
        setPracticeTools([])
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadStudentData()
    }
  }, [user, trackEvent])

  const getProgressPercentage = () => {
    if (!progress || progress.totalTopics === 0) return 0
    return Math.round((progress.completedTopics / progress.totalTopics) * 100)
  }

  const getWeeklyProgressPercentage = () => {
    if (!progress || progress.weeklyGoal === 0) return 0
    return Math.min(Math.round((progress.achievedThisWeek / progress.weeklyGoal) * 100), 100)
  }

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center">
        <div className="text-white">Loading your learning dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name || 'Student'}! 📚
            </h1>
            <p className="text-gray-400">
              Ready to continue your learning journey?
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSemanticSearch(true)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 flex items-center space-x-2"
            >
              <Search size={18} />
              <span>Smart Search</span>
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">
                {progress?.completedTopics || 0}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Topics Completed</h3>
            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-green-400" />
              <span className="text-2xl font-bold text-white">
                {progress?.currentStreak || 0}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Day Streak</h3>
            <p className="text-green-400 text-xs mt-2">Keep it up! 🔥</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">
                {formatStudyTime(progress?.totalStudyTime || 0)}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Total Study Time</h3>
            <p className="text-purple-400 text-xs mt-2">This week</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-900 rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Award className="h-8 w-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">
                {achievements.length}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm">Achievements</h3>
            <p className="text-yellow-400 text-xs mt-2">Well done! ⭐</p>
          </motion.div>
        </div>

        {/* Learning Dashboard Integration */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LearningDashboard
              userId={String(user?.id || '')}
            />
          </div>
          <div>
            <Card className="h-full border-gray-700 bg-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg text-white">
                  <Clock size={18} className="mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="rounded-lg bg-gray-700 p-3">
                        <div className="mb-1 flex items-start justify-between">
                          <h4 className="text-sm font-medium text-white">
                            {activity.activity}
                          </h4>
                          <span className="text-xs text-gray-400">
                            {new Date(activity.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generated Content Section */}
        {generatedContent.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 flex items-center text-xl font-bold text-white">
              <Lightbulb size={20} className="mr-2" />
              Your Learning Content
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {generatedContent.slice(0, 6).map(content => (
                <Card
                  key={content.knowledge_id}
                  className="cursor-pointer border-gray-700 bg-gray-800 transition-colors hover:border-purple-500"
                >
                  <CardContent className="pt-6">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="rounded-lg bg-purple-600/20 p-3 text-purple-400">
                        <BookOpen size={18} />
                      </div>
                      <div className="flex items-center space-x-2">
                        {content.status === 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContentForTutor(content);
                              setShowAITutor(true);
                            }}
                            className="p-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600/30 transition-colors"
                            title="Get AI Tutoring"
                          >
                            <Brain size={14} />
                          </button>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            content.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            content.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {content.status}
                        </span>
                      </div>
                    </div>
                    <h3 className="mb-2 font-medium text-white line-clamp-1">{content.topic}</h3>
                    <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                      {content.summary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock size={12} className="mr-1" />
                        {new Date(content.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        {content.metadata?.chapters_count || 0} chapters
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assignments */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Calendar className="h-6 w-6 mr-2" />
              Current Assignments
            </h2>
            <div className="space-y-4">
              {assignments.length > 0 ? assignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{assignment.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      assignment.priority === 'high' ? 'bg-red-900 text-red-400' :
                      assignment.priority === 'medium' ? 'bg-yellow-900 text-yellow-400' :
                      'bg-green-900 text-green-400'
                    }`}>
                      {assignment.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">{assignment.subject}</span>
                    <span className="text-gray-400 text-sm">Due: {assignment.dueDate}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${assignment.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400 text-xs">{assignment.progress}% complete</span>
                    <button className="text-blue-400 text-sm hover:text-blue-300 flex items-center">
                      <Play className="h-4 w-4 mr-1" />
                      Continue
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="bg-gray-900 rounded-lg p-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No assignments yet!</p>
                  <p className="text-gray-500 text-sm mt-2">Check back later for new learning content.</p>
                </div>
              )}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h2 className="text-xl font-bold text-white mb-6 flex items-center">
              <Star className="h-6 w-6 mr-2" />
              Recent Achievements
            </h2>
            <div className="space-y-4">
              {achievements.slice(0, 5).map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900 rounded-lg p-4"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                      <Award className="h-6 w-6 text-gray-900" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm">{achievement.title}</h3>
                      <p className="text-gray-400 text-xs">{achievement.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {achievements.length === 0 && (
                <div className="bg-gray-900 rounded-lg p-6 text-center">
                  <Award className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No achievements yet!</p>
                  <p className="text-gray-500 text-xs mt-1">Start learning to unlock your first achievement.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-6 text-white transition-colors"
            >
              <Brain className="h-8 w-8 mb-3" />
              <h3 className="font-semibold mb-2">Practice Mode</h3>
              <p className="text-blue-100 text-sm">Strengthen your skills with interactive exercises</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-green-600 hover:bg-green-700 rounded-lg p-6 text-white transition-colors"
            >
              <TrendingUp className="h-8 w-8 mb-3" />
              <h3 className="font-semibold mb-2">View Progress</h3>
              <p className="text-green-100 text-sm">See detailed analytics of your learning journey</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-purple-600 hover:bg-purple-700 rounded-lg p-6 text-white transition-colors"
            >
              <BarChart3 className="h-8 w-8 mb-3" />
              <h3 className="font-semibold mb-2">AI Tutor</h3>
              <p className="text-purple-100 text-sm">Get personalized help and explanations</p>
            </motion.button>
          </div>
        </div>

        {/* Semantic Search Interface */}
        <SemanticSearchInterface
          isOpen={showSemanticSearch}
          onClose={() => setShowSemanticSearch(false)}
          onResultSelect={(result) => {
            console.log('Selected search result:', result);
            setShowSemanticSearch(false);
          }}
          showFilters={true}
        />

        {/* AI Tutor for Generated Content */}
        {selectedContentForTutor && (
          <GeneratedContentTutor
            content={selectedContentForTutor}
            isOpen={showAITutor}
            onClose={() => {
              setShowAITutor(false);
              setSelectedContentForTutor(null);
            }}
            compact={true}
            enableVoice={true}
          />
        )}
      </div>
    </div>
  )
}

export default StudentDashboard