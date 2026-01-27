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
  Search,
} from 'lucide-react'
import { LearningDashboard } from './analytics/LearningDashboard'
import { ProgressTracking } from './ProgressTracking'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { apiClient } from '@/services/api-client'
import TopicContentGenerator from './ContentGeneration/TopicContentGenerator'
import SemanticSearchInterface from './search/SemanticSearchInterface'
import GeneratedContentTutor from './ai-tutor/GeneratedContentTutor'
import type { 
  DashboardStats, 
  PracticeToolResponse, 
  RecentActivityResponse, 
  TopicDataResponse, 
  TimeSpentDataResponse,
  ApiResponse
} from '@/types/dashboard'

interface PracticeCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  lastUsed?: string | undefined
  topicIds: string[]
}

type ApiDataResponse<T> = {
  data: T
}

interface DashboardProps {
  userId: string
  courseId?: string
  userName?: string
  className?: string
  onNavigateToLearning?: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({
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
  const [generatedContent, setGeneratedContent] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTopicGenerator, setShowTopicGenerator] = useState(false)
  const [showSemanticSearch, setShowSemanticSearch] = useState(false)
  const [showAITutor, setShowAITutor] = useState(false)
  const [selectedContentForTutor, setSelectedContentForTutor] = useState<any>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch dashboard statistics
        const statsResponse = await apiClient.get<ApiResponse<DashboardStats>>(`/dashboard/user/${userId}/dashboard-stats`)
        if (statsResponse.success && statsResponse.data) {
          setDashboardStats(statsResponse.data)
        }

        // Fetch practice tools/modules
        const practiceResponse = await apiClient.get<ApiResponse<PracticeToolResponse[]>>('/learning/practice-tools')
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
        const activityResponse = await apiClient.get<ApiResponse<RecentActivityResponse[]>>(`/dashboard/user/${userId}/recent-activity`)
        if (activityResponse.success) {
          setRecentActivity(activityResponse.data)
        }

        // Fetch topic mastery data
        const topicsResponse = await apiClient.get<ApiResponse<TopicDataResponse[]>>(`/learning/topics/${userId}`)
        if (topicsResponse.success) {
          setTopicsData(topicsResponse.data)
        }

        // Fetch time spent data
        const timeResponse = await apiClient.get<ApiResponse<TimeSpentDataResponse[]>>(`/analytics/user/${userId}/time-tracking`)
        if (timeResponse.success) {
          setTimeSpentData(timeResponse.data)
        }

        // Fetch generated content
        try {
          const generatedResponse = await apiClient.get<ApiDataResponse<{ generated_content: any[] }>>('/api/v2/topic-generation/my-generated-content')
          if (generatedResponse.data?.generated_content) {
            setGeneratedContent(generatedResponse.data.generated_content)
          }
        } catch (err) {
          console.log('No generated content available yet')
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

  // Get difficulty badge color
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
        <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500'></div>
      </div>
    )
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Action buttons moved to top right */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className='mb-2 text-2xl font-bold text-white'>
            Welcome back, {userName}!
          </h1>
          <p className='text-gray-400'>
            Track your progress and continue your learning journey
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
          <button
            onClick={() => setShowTopicGenerator(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center space-x-2"
          >
            <span>✨</span>
            <span>Generate New Content</span>
          </button>
        </div>
      </div>

      <div className='mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Learning Dashboard (Course Progress) */}
        <div className='lg:col-span-2'>
          <LearningDashboard
            userId={userId}
            {...(courseId !== undefined && { courseId })}
          />
        </div>

        {/* Recent Activity */}
        <div>
          <Card className='h-full border-gray-700 bg-gray-800'>
            <CardHeader className='pb-2'>
              <CardTitle className='flex items-center text-lg text-white'>
                <Clock size={18} className='mr-2' />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className='space-y-3'>
                  {recentActivity.map((activity, index) => (
                    <div key={index} className='rounded-lg bg-gray-700 p-3'>
                      <div className='mb-1 flex items-start justify-between'>
                        <h4 className='text-sm font-medium text-white'>
                          {activity.activity}
                        </h4>
                        <span className='text-xs text-gray-400'>
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className='flex items-center space-x-4 text-xs text-gray-400'>
                        {activity.timeSpent && (
                          <div className='flex items-center'>
                            <Clock size={12} className='mr-1' />
                            <span>{activity.timeSpent} min</span>
                          </div>
                        )}
                        {activity.score && (
                          <div className='flex items-center'>
                            <BarChart size={12} className='mr-1' />
                            <span>{activity.score}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-8 text-center text-gray-500'>
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generated Content Section */}
      {generatedContent.length > 0 && (
        <section className='mb-8'>
          <h2 className='mb-4 flex items-center text-xl font-bold text-white'>
            <Lightbulb size={20} className='mr-2' />
            Your Generated Content
          </h2>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {generatedContent.slice(0, 6).map(content => (
              <Card
                key={content.knowledge_id}
                className='cursor-pointer border-gray-700 bg-gray-800 transition-colors hover:border-purple-500'
              >
                <CardContent className='pt-6'>
                  <div className='mb-3 flex items-start justify-between'>
                    <div className='rounded-lg bg-purple-600/20 p-3 text-purple-400'>
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
                  <h3 className='mb-2 font-medium text-white line-clamp-1'>{content.topic}</h3>
                  <p className='mb-4 line-clamp-2 text-sm text-gray-400'>
                    {content.summary}
                  </p>
                  <div className='flex items-center justify-between text-xs text-gray-500'>
                    <span className='flex items-center'>
                      <Clock size={12} className='mr-1' />
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
          {generatedContent.length > 6 && (
            <div className="text-center mt-4">
              <button 
                onClick={() => setShowTopicGenerator(true)}
                className="px-4 py-2 text-purple-400 hover:text-purple-300 text-sm"
              >
                View all {generatedContent.length} generated content items →
              </button>
            </div>
          )}
        </section>
      )}

      {/* Practice Tools */}
      <section className='mb-8'>
        <h2 className='mb-4 flex items-center text-xl font-bold text-white'>
          <GraduationCap size={20} className='mr-2' />
          Practice Tools
        </h2>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2'>
          {practiceTools.map(tool => (
            <Card
              key={tool.id}
              className='cursor-pointer border-gray-700 bg-gray-800 transition-colors hover:border-indigo-500'
            >
              <CardContent className='pt-6'>
                <div className='mb-3 flex items-start justify-between'>
                  <div className='rounded-lg bg-indigo-600/20 p-3 text-indigo-400'>
                    {tool.icon}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${getDifficultyColor(tool.difficulty)}`}
                  >
                    {tool.difficulty.charAt(0).toUpperCase() +
                      tool.difficulty.slice(1)}
                  </span>
                </div>
                <h3 className='mb-2 font-medium text-white'>{tool.title}</h3>
                <p className='mb-4 line-clamp-2 text-sm text-gray-400'>
                  {tool.description}
                </p>
                <div className='flex items-center justify-between text-xs text-gray-500'>
                  <span className='flex items-center'>
                    <Clock size={12} className='mr-1' />
                    {tool.estimatedTime}
                  </span>
                  {tool.lastUsed && (
                    <span>
                      Last used: {new Date(tool.lastUsed).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Progress Tracking */}
      <section>
        <h2 className='mb-4 flex items-center text-xl font-bold text-white'>
          <LineChart size={20} className='mr-2' />
          Your Progress
        </h2>

        <ProgressTracking
          userId={userId}
          topicsData={topicsData}
          timeSpentData={timeSpentData}
          generatedContentProgress={generatedContent.map(content => ({
            knowledge_id: content.knowledge_id,
            topic: content.topic,
            chaptersCompleted: content.metadata?.chapters_completed || 0,
            totalChapters: content.metadata?.chapters_count || 1,
            timeSpent: 0, // Would need to track this
            lastAccessed: content.created_at
          }))}
        />
      </section>

      {/* Topic Generator Modal */}
      {showTopicGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Generate New Content</h2>
                <button
                  onClick={() => setShowTopicGenerator(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="text-gray-600 mb-6">
                Create comprehensive educational content from any topic using AI
              </div>
              
              <TopicContentGenerator
                onContentGenerated={(contentId) => {
                  console.log('New content generated:', contentId);
                  setShowTopicGenerator(false);
                  // Refresh the generated content list
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Semantic Search Interface */}
      <SemanticSearchInterface
        isOpen={showSemanticSearch}
        onClose={() => setShowSemanticSearch(false)}
        onResultSelect={(result) => {
          console.log('Selected search result:', result);
          // Navigate to the selected content
          // This would integrate with your routing system
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
  )
}
