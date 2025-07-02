import React from 'react'
import CourseMain from '@/components/course/CourseMain'
import Loader from '@/components/ui/Loader'
import { Chapter } from '@/types/api'

interface CourseContentProps {
  content: any
  language: string
  currentTopic: Chapter | null
}

const CourseContent: React.FC<CourseContentProps> = ({ 
  content, 
  language, 
  currentTopic 
}) => {
  return (
    <div className='flex h-full flex-col'>
      <div className='flex-grow'>
        {content && currentTopic ? (
          <CourseMain
            content={content}
            language={language}
            chapter={currentTopic}
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <Loader size='medium' color='green' />
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseContent