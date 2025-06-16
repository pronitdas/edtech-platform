import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ThumbsUp, AlertTriangle } from 'lucide-react'

interface StrengthsWeaknessesPanelProps {
  strengths: string[] | null
  weaknesses: string[] | null
  isLoading?: boolean
}

export const StrengthsWeaknessesPanel: React.FC<
  StrengthsWeaknessesPanelProps
> = ({ strengths, weaknesses, isLoading = false }) => {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      {/* Strengths Card */}
      <Card className='border-gray-700 bg-gray-800'>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center text-lg text-white'>
            <ThumbsUp className='mr-2 h-5 w-5 text-green-500' />
            <span>Strengths</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex h-24 items-center justify-center'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500'></div>
            </div>
          ) : (
            <div>
              {strengths && strengths.length > 0 ? (
                <ul className='space-y-2'>
                  {strengths.map((strength, index) => (
                    <li key={index} className='flex items-start'>
                      <div className='mr-2 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500'></div>
                      <span className='text-gray-300'>{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='italic text-gray-400'>
                  No specific strengths identified yet.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weaknesses Card */}
      <Card className='border-gray-700 bg-gray-800'>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center text-lg text-white'>
            <AlertTriangle className='mr-2 h-5 w-5 text-yellow-500' />
            <span>Areas for Improvement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex h-24 items-center justify-center'>
              <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500'></div>
            </div>
          ) : (
            <div>
              {weaknesses && weaknesses.length > 0 ? (
                <ul className='space-y-2'>
                  {weaknesses.map((weakness, index) => (
                    <li key={index} className='flex items-start'>
                      <div className='mr-2 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-yellow-500'></div>
                      <span className='text-gray-300'>{weakness}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='italic text-gray-400'>Keep up the great work!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
