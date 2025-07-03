import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Hourglass,
  BrainCircuit,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

interface TopicProgress {
  topicId: string
  topicName: string
  masteryLevel: number // 0-100
  questionsAttempted: number
  questionsCorrect: number
  averageResponseTime: number // in seconds
  lastPracticed: string // ISO date string
  isGeneratedContent?: boolean
  generationDate?: string
  chaptersCompleted?: number
  totalChapters?: number
}

interface TimeSpentData {
  date: string
  minutes: number
}

interface ProgressTrackingProps {
  userId: string
  topicsData?: TopicProgress[]
  timeSpentData?: TimeSpentData[]
  generatedContentProgress?: Array<{
    knowledge_id: string
    topic: string
    chaptersCompleted: number
    totalChapters: number
    timeSpent: number
    lastAccessed: string
  }>
  className?: string
  compact?: boolean
}

export const ProgressTracking: React.FC<ProgressTrackingProps> = ({
  userId,
  topicsData = [],
  timeSpentData = [],
  generatedContentProgress = [],
  className = '',
  compact = false,
}) => {
  const [topTopics, setTopTopics] = useState<TopicProgress[]>([])
  const [improvementAreas, setImprovementAreas] = useState<TopicProgress[]>([])
  const [totalTimeSpent, setTotalTimeSpent] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [generatedContentStats, setGeneratedContentStats] = useState({
    totalContent: 0,
    completedContent: 0,
    inProgressContent: 0
  })

  useEffect(() => {
    // Process the data to identify strengths and improvement areas
    if (topicsData.length > 0) {
      // Sort by mastery level to find top topics
      const sortedByMastery = [...topicsData].sort(
        (a, b) => b.masteryLevel - a.masteryLevel
      )
      setTopTopics(sortedByMastery.slice(0, 3))

      // Find topics that need improvement (low mastery, high attempts)
      const needsImprovement = topicsData
        .filter(
          topic => topic.masteryLevel < 70 && topic.questionsAttempted > 5
        )
        .sort((a, b) => a.masteryLevel - b.masteryLevel)
      setImprovementAreas(needsImprovement.slice(0, 3))

      setIsLoading(false)
    }

    // Calculate total time spent
    if (timeSpentData.length > 0) {
      const total = timeSpentData.reduce((sum, data) => sum + data.minutes, 0)
      setTotalTimeSpent(total)
    }

    // Process generated content progress
    if (generatedContentProgress.length > 0) {
      const stats = generatedContentProgress.reduce((acc, content) => {
        acc.totalContent++
        if (content.chaptersCompleted === content.totalChapters) {
          acc.completedContent++
        } else if (content.chaptersCompleted > 0) {
          acc.inProgressContent++
        }
        return acc
      }, { totalContent: 0, completedContent: 0, inProgressContent: 0 })
      
      setGeneratedContentStats(stats)
    }
  }, [topicsData, timeSpentData, generatedContentProgress])

  const formatTime = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`
  }

  // Function to render mastery level bar
  const renderMasteryBar = (level: number) => (
    <div className='h-2 w-full overflow-hidden rounded-full bg-gray-700'>
      <div
        className={`h-full ${
          level >= 80
            ? 'bg-green-500'
            : level >= 60
              ? 'bg-yellow-500'
              : 'bg-red-500'
        }`}
        style={{ width: `${level}%` }}
      ></div>
    </div>
  )

  if (isLoading && topicsData.length === 0) {
    return (
      <div className='flex h-40 items-center justify-center p-4'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500'></div>
      </div>
    )
  }

  // Compact view for smaller spaces
  if (compact) {
    return (
      <div className={`rounded-lg bg-gray-900 p-3 ${className}`}>
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='font-medium text-white'>Progress Summary</h3>
          <div className='flex items-center text-sm text-gray-400'>
            <Hourglass size={14} className='mr-1' />
            <span>{formatTime(totalTimeSpent)}</span>
          </div>
        </div>

        {topTopics.length > 0 ? (
          <div className='mb-3'>
            <h4 className='mb-2 text-xs uppercase text-gray-400'>
              Strongest Topics
            </h4>
            <div className='space-y-2'>
              {topTopics.map(topic => (
                <div
                  key={topic.topicId}
                  className='flex items-center justify-between'
                >
                  <span className='truncate text-sm text-white'>
                    {topic.topicName}
                  </span>
                  <span className='text-xs text-green-400'>
                    {topic.masteryLevel}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className='mb-3 text-sm text-gray-500'>
            No topic data available
          </div>
        )}

        {improvementAreas.length > 0 && (
          <div>
            <h4 className='mb-2 text-xs uppercase text-gray-400'>
              Needs Improvement
            </h4>
            <div className='space-y-2'>
              {improvementAreas.map(topic => (
                <div
                  key={topic.topicId}
                  className='flex items-center justify-between'
                >
                  <span className='truncate text-sm text-white'>
                    {topic.topicName}
                  </span>
                  <span className='text-xs text-red-400'>
                    {topic.masteryLevel}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full view
  return (
    <div
      className={`overflow-hidden rounded-lg bg-gray-900 shadow-xl ${className}`}
    >
      <div className='bg-gray-800 p-4'>
        <h2 className='flex items-center text-lg font-medium text-white'>
          <BarChart size={20} className='mr-2' />
          Learning Progress
        </h2>
      </div>

      <div className='grid grid-cols-1 gap-4 p-4 md:grid-cols-3'>
        {/* Generated Content Progress */}
        {generatedContentProgress.length > 0 && (
          <div className='rounded-lg bg-gray-800 p-4'>
            <h3 className='mb-3 flex items-center font-medium text-white'>
              <BrainCircuit size={18} className='mr-2' />
              Generated Content
            </h3>
            
            <div className='space-y-3'>
              <div className='grid grid-cols-3 gap-2 text-center'>
                <div>
                  <div className='text-lg font-bold text-blue-400'>{generatedContentStats.totalContent}</div>
                  <div className='text-xs text-gray-400'>Total</div>
                </div>
                <div>
                  <div className='text-lg font-bold text-green-400'>{generatedContentStats.completedContent}</div>
                  <div className='text-xs text-gray-400'>Completed</div>
                </div>
                <div>
                  <div className='text-lg font-bold text-yellow-400'>{generatedContentStats.inProgressContent}</div>
                  <div className='text-xs text-gray-400'>In Progress</div>
                </div>
              </div>

              <div className='mt-4'>
                <h4 className='mb-2 text-sm text-gray-400'>Recent Content</h4>
                <div className='space-y-2'>
                  {generatedContentProgress.slice(0, 3).map((content) => (
                    <div key={content.knowledge_id} className='flex items-center justify-between'>
                      <span className='truncate text-sm text-gray-300'>{content.topic}</span>
                      <span className='text-xs text-gray-400'>
                        {content.chaptersCompleted}/{content.totalChapters}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time stats */}
        <div className='rounded-lg bg-gray-800 p-4'>
          <h3 className='mb-3 flex items-center font-medium text-white'>
            <Hourglass size={18} className='mr-2' />
            Time Metrics
          </h3>

          <div className='space-y-3'>
            <div>
              <div className='mb-1 flex justify-between'>
                <span className='text-sm text-gray-400'>
                  Total Practice Time
                </span>
                <span className='text-sm text-white'>
                  {formatTime(totalTimeSpent)}
                </span>
              </div>
              <div className='h-2 w-full overflow-hidden rounded-full bg-gray-700'>
                <div
                  className='h-full bg-indigo-500'
                  style={{ width: `${Math.min(totalTimeSpent / 10, 100)}%` }}
                ></div>
              </div>
            </div>

            {timeSpentData.length > 0 && (
              <div className='mt-4'>
                <h4 className='mb-2 text-sm text-gray-400'>
                  Recent Practice Sessions
                </h4>
                <div className='space-y-2'>
                  {timeSpentData.slice(-5).map((data, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between'
                    >
                      <span className='text-sm text-gray-300'>
                        {new Date(data.date).toLocaleDateString()}
                      </span>
                      <span className='rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-300'>
                        {formatTime(data.minutes)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Topic mastery */}
        <div className='rounded-lg bg-gray-800 p-4'>
          <h3 className='mb-3 flex items-center font-medium text-white'>
            <BrainCircuit size={18} className='mr-2' />
            Topic Mastery
          </h3>

          {topicsData.length > 0 ? (
            <div className='space-y-4'>
              {topTopics.length > 0 && (
                <div>
                  <h4 className='mb-2 flex items-center text-sm text-gray-400'>
                    <TrendingUp size={14} className='mr-1' />
                    Strongest Topics
                  </h4>
                  <div className='space-y-3'>
                    {topTopics.map(topic => (
                      <div key={topic.topicId}>
                        <div className='mb-1 flex justify-between'>
                          <span className='text-sm text-gray-300'>
                            {topic.topicName}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-xs ${
                              topic.masteryLevel >= 80
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {topic.masteryLevel}%
                          </span>
                        </div>
                        {renderMasteryBar(topic.masteryLevel)}
                        <div className='mt-1 flex justify-between text-xs text-gray-500'>
                          <span>
                            {topic.questionsCorrect}/{topic.questionsAttempted}{' '}
                            correct
                          </span>
                          <span>
                            Last:{' '}
                            {new Date(topic.lastPracticed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {improvementAreas.length > 0 && (
                <div className='mt-4'>
                  <h4 className='mb-2 flex items-center text-sm text-gray-400'>
                    <AlertCircle size={14} className='mr-1' />
                    Areas for Improvement
                  </h4>
                  <div className='space-y-3'>
                    {improvementAreas.map(topic => (
                      <div key={topic.topicId}>
                        <div className='mb-1 flex justify-between'>
                          <span className='text-sm text-gray-300'>
                            {topic.topicName}
                          </span>
                          <span className='rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300'>
                            {topic.masteryLevel}%
                          </span>
                        </div>
                        {renderMasteryBar(topic.masteryLevel)}
                        <div className='mt-1 flex justify-between text-xs text-gray-500'>
                          <span>
                            {topic.questionsCorrect}/{topic.questionsAttempted}{' '}
                            correct
                          </span>
                          <span>
                            Avg time: {Math.round(topic.averageResponseTime)}s
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className='py-8 text-center text-gray-500'>
              <p>No topic data available yet.</p>
              <p className='mt-2 text-sm'>
                Complete practice sessions to see your progress.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
