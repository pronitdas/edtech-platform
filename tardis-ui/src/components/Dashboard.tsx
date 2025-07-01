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

interface DashboardProps {
  userId: string
  courseId?: string
  userName?: string
  className?: string
}

export const Dashboard: React.FC<DashboardProps> = ({
  userId,
  courseId,
  userName = 'Student',
  className = '',
}) => {
  const [practiceTools, setPracticeTools] = useState<PracticeCard[]>([])
  const [recentActivity, setRecentActivity] = useState<
    {
      date: string
      activity: string
      score?: number
      timeSpent?: number
    }[]
  >([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - in a real app, this would be fetched from an API
    const mockPracticeTools: PracticeCard[] = [
      {
        id: 'quiz-practice',
        title: 'Concept Quizzes',
        description:
          'Test your understanding with multiple-choice questions about key concepts',
        icon: <BookOpen />,
        difficulty: 'beginner',
        estimatedTime: '5-10 min',
        lastUsed: '2023-06-15T14:30:00',
        topicIds: ['concept-1', 'concept-2', 'concept-3'],
      },
      {
        id: 'problem-solving',
        title: 'Problem Solving',
        description:
          'Apply your knowledge to solve real-world problems and scenarios',
        icon: <Brain />,
        difficulty: 'intermediate',
        estimatedTime: '15-20 min',
        lastUsed: '2023-06-10T09:15:00',
        topicIds: ['problem-1', 'problem-2'],
      },
      {
        id: 'coding-practice',
        title: 'Coding Challenges',
        description:
          'Practice implementing algorithms and solving coding problems',
        icon: <Dumbbell />,
        difficulty: 'advanced',
        estimatedTime: '20-30 min',
        topicIds: ['coding-1', 'coding-2', 'coding-3'],
      },
      {
        id: 'flashcards',
        title: 'Flashcards',
        description: 'Quick review of key terms, definitions, and concepts',
        icon: <Lightbulb />,
        difficulty: 'beginner',
        estimatedTime: '5 min',
        lastUsed: '2023-06-12T11:45:00',
        topicIds: ['flash-1', 'flash-2', 'flash-3', 'flash-4'],
      },
    ]

    const mockRecentActivity = [
      {
        date: '2023-06-15T14:30:00',
        activity: 'Completed Concept Quiz',
        score: 85,
        timeSpent: 8,
      },
      {
        date: '2023-06-12T11:45:00',
        activity: 'Flashcard Session',
        timeSpent: 5,
      },
      {
        date: '2023-06-10T09:15:00',
        activity: 'Problem Solving Session',
        score: 70,
        timeSpent: 18,
      },
    ]

    setPracticeTools(mockPracticeTools)
    setRecentActivity(mockRecentActivity)
    setIsLoading(false)
  }, [])

  // Mock data for progress tracking
  const mockTopicsData = [
    {
      topicId: 'concept-1',
      topicName: 'Basic Principles',
      masteryLevel: 85,
      questionsAttempted: 12,
      questionsCorrect: 10,
      averageResponseTime: 45,
      lastPracticed: '2023-06-15T14:30:00',
    },
    {
      topicId: 'problem-1',
      topicName: 'Problem Analysis',
      masteryLevel: 70,
      questionsAttempted: 8,
      questionsCorrect: 6,
      averageResponseTime: 90,
      lastPracticed: '2023-06-10T09:15:00',
    },
    {
      topicId: 'coding-1',
      topicName: 'Basic Algorithms',
      masteryLevel: 60,
      questionsAttempted: 6,
      questionsCorrect: 4,
      averageResponseTime: 120,
      lastPracticed: '2023-06-05T16:20:00',
    },
    {
      topicId: 'concept-3',
      topicName: 'Advanced Concepts',
      masteryLevel: 45,
      questionsAttempted: 10,
      questionsCorrect: 5,
      averageResponseTime: 105,
      lastPracticed: '2023-06-02T13:10:00',
    },
  ]

  const mockTimeSpentData = [
    { date: '2023-06-01', minutes: 25 },
    { date: '2023-06-05', minutes: 40 },
    { date: '2023-06-10', minutes: 18 },
    { date: '2023-06-12', minutes: 5 },
    { date: '2023-06-15', minutes: 8 },
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
      <header className='mb-6'>
        <h1 className='mb-2 text-2xl font-bold text-white'>
          Welcome back, {userName}!
        </h1>
        <p className='text-gray-400'>
          Track your progress and continue your learning journey
        </p>
      </header>

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

      {/* Practice Tools */}
      <section className='mb-8'>
        <h2 className='mb-4 flex items-center text-xl font-bold text-white'>
          <GraduationCap size={20} className='mr-2' />
          Practice Tools
        </h2>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
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
          topicsData={mockTopicsData}
          timeSpentData={mockTimeSpentData}
        />
      </section>
    </div>
  )
}
