import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

interface EngagementScoreCardProps {
  score: number | null
  isLoading?: boolean
}

export const EngagementScoreCard: React.FC<EngagementScoreCardProps> = ({
  score,
  isLoading = false,
}) => {
  // Determine color based on score
  const getScoreColor = (score: number | null) => {
    if (score === null) return 'bg-gray-500'
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Determine text based on score
  const getScoreText = (score: number | null) => {
    if (score === null) return 'Not available'
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs improvement'
  }

  return (
    <Card className='border-gray-700 bg-gray-800'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center text-lg text-white'>
          <Activity className='mr-2 h-5 w-5 text-indigo-400' />
          <span>Engagement Score</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-32 items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500'></div>
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center'>
            <div className='relative mb-4 h-32 w-32'>
              <svg className='h-full w-full' viewBox='0 0 36 36'>
                {/* Background circle */}
                <path
                  d='M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831'
                  fill='none'
                  stroke='#374151'
                  strokeWidth='3'
                />

                {/* Score circle */}
                <path
                  d='M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831'
                  fill='none'
                  stroke={getScoreColor(score)}
                  strokeWidth='3'
                  strokeDasharray={`${score || 0}, 100`}
                  strokeLinecap='round'
                />

                {/* Center text */}
                <text
                  x='18'
                  y='20.35'
                  className='text-2xl font-bold'
                  textAnchor='middle'
                  fill='white'
                >
                  {score !== null ? Math.round(score) : 'N/A'}
                </text>
              </svg>
            </div>
            <p className='text-center text-gray-300'>{getScoreText(score)}</p>
            <p className='mt-1 text-xs text-gray-400'>
              Based on your interactions with the content
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
