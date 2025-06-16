import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain } from 'lucide-react'

interface UnderstandingLevelDisplayProps {
  level: string | null
  isLoading?: boolean
}

export const UnderstandingLevelDisplay: React.FC<
  UnderstandingLevelDisplayProps
> = ({ level, isLoading = false }) => {
  // Get color based on understanding level
  const getLevelColor = (level: string | null) => {
    if (!level) return 'bg-gray-500'

    switch (level.toLowerCase()) {
      case 'advanced':
        return 'bg-green-500'
      case 'proficient':
        return 'bg-blue-500'
      case 'intermediate':
        return 'bg-yellow-500'
      case 'basic':
        return 'bg-orange-500'
      case 'beginner':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get description based on understanding level
  const getLevelDescription = (level: string | null) => {
    if (!level) return 'Understanding level not available'

    switch (level.toLowerCase()) {
      case 'advanced':
        return 'You have mastered the core concepts and can apply them in complex scenarios.'
      case 'proficient':
        return 'You have a solid understanding of the material and can apply it in most situations.'
      case 'intermediate':
        return 'You understand the main concepts but may need more practice with applications.'
      case 'basic':
        return 'You have a foundational understanding but need more study to apply concepts.'
      case 'beginner':
        return 'You are just starting to learn these concepts and need more exposure.'
      default:
        return 'Understanding level not available'
    }
  }

  return (
    <Card className='border-gray-700 bg-gray-800'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center text-lg text-white'>
          <Brain className='mr-2 h-5 w-5 text-indigo-400' />
          <span>Understanding Level</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-24 items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500'></div>
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='flex items-center'>
              <div
                className={`h-3 w-3 rounded-full ${getLevelColor(level)} mr-2`}
              ></div>
              <span className='text-xl font-semibold text-white'>
                {level || 'Not available'}
              </span>
            </div>
            <p className='text-sm text-gray-300'>
              {getLevelDescription(level)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
