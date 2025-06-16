import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'

interface RecommendationsSectionProps {
  recommendations: string[] | null
  isLoading?: boolean
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  recommendations,
  isLoading = false,
}) => {
  return (
    <Card className='border-gray-700 bg-gray-800'>
      <CardHeader className='pb-2'>
        <CardTitle className='flex items-center text-lg text-white'>
          <Lightbulb className='mr-2 h-5 w-5 text-blue-500' />
          <span>Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-24 items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500'></div>
          </div>
        ) : (
          <div>
            {recommendations && recommendations.length > 0 ? (
              <ul className='space-y-3'>
                {recommendations.map((recommendation, index) => (
                  <li key={index} className='flex items-start'>
                    <div className='mr-2 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500'></div>
                    <span className='text-gray-300'>{recommendation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='italic text-gray-400'>
                No specific recommendations at this time.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
