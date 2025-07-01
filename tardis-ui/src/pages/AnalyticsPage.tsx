import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useKnowledgeData } from '../hooks/useKnowledgeData'
import { useUser } from '../contexts/UserContext'

interface AnalyticsData {
  progress: {
    chapters_viewed: number
    progress_percent: number
    last_access: string
  }
  interactions: Array<{
    event_type: string
    timestamp: string
    chapter_id?: string
    content_id?: string
    data?: any
  }>
  videoStats: {
    total_watch_time: number
    completion_rate: number
    average_session_duration: number
  }
  quizStats: {
    attempts: number
    average_score: number
    best_score: number
  }
}

export default function AnalyticsPage() {
  const { knowledgeId } = useParams<{ knowledgeId: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const { knowledge, loading: knowledgeLoading } = useKnowledgeData(knowledgeId)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!knowledgeId || !user) return

    const fetchAnalytics = async () => {
      try {
        const [progressRes, interactionsRes, videoRes, quizRes] =
          await Promise.all([
            fetch(
              `/v2/analytics/user/${user.id}/progress?knowledge_id=${knowledgeId}`
            ),
            fetch(`/v2/analytics/knowledge/${knowledgeId}/interactions`),
            fetch(`/v2/analytics/knowledge/${knowledgeId}/video-stats`),
            fetch(`/v2/analytics/knowledge/${knowledgeId}/quiz-stats`),
          ])

        const [progress, interactions, videoStats, quizStats] =
          await Promise.all([
            progressRes.json(),
            interactionsRes.json(),
            videoRes.json(),
            quizRes.json(),
          ])

        setAnalytics({
          progress,
          interactions,
          videoStats,
          quizStats,
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [knowledgeId, user])

  if (loading || knowledgeLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-32 w-32 animate-spin rounded-full border-b-2 border-indigo-600'></div>
      </div>
    )
  }

  if (!knowledge || !analytics) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Analytics not available
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='border-b bg-white shadow-sm'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <button
                onClick={() => navigate('/app')}
                className='text-gray-500 hover:text-gray-700'
              >
                ← Back to Knowledge
              </button>
              <div>
                <h1 className='text-xl font-semibold text-gray-900'>
                  Analytics: {knowledge.find(k => k.id.toString() === knowledgeId)?.name || 'Unknown'}
                </h1>
                <p className='text-sm text-gray-500'>
                  Learning progress and insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {/* Progress Card */}
          <div className='overflow-hidden rounded-lg bg-white shadow'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500'>
                    <span className='text-sm font-medium text-white'>📊</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='truncate text-sm font-medium text-gray-500'>
                      Progress
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {analytics.progress.progress_percent.toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Chapters Viewed */}
          <div className='overflow-hidden rounded-lg bg-white shadow'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-md bg-green-500'>
                    <span className='text-sm font-medium text-white'>📖</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='truncate text-sm font-medium text-gray-500'>
                      Chapters Viewed
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {analytics.progress.chapters_viewed}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Video Completion */}
          <div className='overflow-hidden rounded-lg bg-white shadow'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-md bg-purple-500'>
                    <span className='text-sm font-medium text-white'>🎥</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='truncate text-sm font-medium text-gray-500'>
                      Video Completion
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {(analytics.videoStats.completion_rate * 100).toFixed(1)}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Quiz Score */}
          <div className='overflow-hidden rounded-lg bg-white shadow'>
            <div className='p-5'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500'>
                    <span className='text-sm font-medium text-white'>❓</span>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='truncate text-sm font-medium text-gray-500'>
                      Best Quiz Score
                    </dt>
                    <dd className='text-lg font-medium text-gray-900'>
                      {analytics.quizStats.best_score}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
          {/* Recent Activity */}
          <div className='rounded-lg bg-white shadow'>
            <div className='border-b border-gray-200 px-6 py-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Recent Activity
              </h3>
            </div>
            <div className='p-6'>
              <div className='flow-root'>
                <ul className='-mb-8'>
                  {analytics.interactions
                    .slice(0, 10)
                    .map((interaction, idx) => (
                      <li key={idx}>
                        <div className='relative pb-8'>
                          {idx !==
                            analytics.interactions.slice(0, 10).length - 1 && (
                              <span className='absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200' />
                            )}
                          <div className='relative flex space-x-3'>
                            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-400'>
                              <span className='text-xs text-white'>
                                {interaction.event_type === 'video_watch'
                                  ? '🎥'
                                  : interaction.event_type === 'quiz_attempt'
                                    ? '❓'
                                    : interaction.event_type === 'chapter_view'
                                      ? '📖'
                                      : '📊'}
                              </span>
                            </div>
                            <div className='min-w-0 flex-1'>
                              <div>
                                <p className='text-sm text-gray-900'>
                                  {interaction.event_type
                                    .replace('_', ' ')
                                    .replace(/\b\w/g, l => l.toUpperCase())}
                                  {interaction.chapter_id &&
                                    ` - Chapter ${interaction.chapter_id}`}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  {new Date(
                                    interaction.timestamp
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className='rounded-lg bg-white shadow'>
            <div className='border-b border-gray-200 px-6 py-4'>
              <h3 className='text-lg font-medium text-gray-900'>
                Performance Summary
              </h3>
            </div>
            <div className='space-y-6 p-6'>
              <div>
                <h4 className='mb-2 text-sm font-medium text-gray-900'>
                  Video Engagement
                </h4>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Total Watch Time</span>
                    <span>
                      {Math.round(analytics.videoStats.total_watch_time / 60)}{' '}
                      minutes
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>Average Session</span>
                    <span>
                      {Math.round(
                        analytics.videoStats.average_session_duration / 60
                      )}{' '}
                      minutes
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className='mb-2 text-sm font-medium text-gray-900'>
                  Quiz Performance
                </h4>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Total Attempts</span>
                    <span>{analytics.quizStats.attempts}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>Average Score</span>
                    <span>{analytics.quizStats.average_score}%</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className='mb-2 text-sm font-medium text-gray-900'>
                  Learning Pattern
                </h4>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Last Access</span>
                    <span>
                      {new Date(
                        analytics.progress.last_access
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span>Completion Rate</span>
                    <span>
                      {analytics.progress.progress_percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
