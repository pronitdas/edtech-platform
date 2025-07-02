import React from 'react'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { QuizComponent } from '@/components/quiz/QuizComponent'
import { LearningDashboard } from '@/components/analytics/LearningDashboard'

interface LearningModuleProps {
  videoContent: any
  quizContent: any
  userId: string
  knowledgeId: number | null
}

const LearningModule: React.FC<LearningModuleProps> = ({
  videoContent,
  quizContent,
  userId,
  knowledgeId
}) => {
  return (
    <div className='grid grid-cols-1 gap-4 p-3 sm:gap-8 sm:p-6 lg:grid-cols-3'>
      <div className='space-y-6 sm:space-y-8 lg:col-span-2'>
        {videoContent && (
          <section>
            <h2 className='mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl'>
              Video Lesson
            </h2>
            <div className='overflow-hidden rounded-lg bg-gray-800 shadow-lg'>
              <VideoPlayer
                contentId={videoContent.id}
                videoUrl={videoContent.url}
                title={videoContent.title}
                poster={videoContent.thumbnail}
              />
            </div>
          </section>
        )}

        {quizContent && (
          <section>
            <h2 className='mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl'>
              Knowledge Check
            </h2>
            <div className='overflow-hidden rounded-lg bg-gray-800 p-4 shadow-lg'>
              <QuizComponent
                quizId={quizContent.id}
                title={quizContent.title}
                questions={quizContent.questions}
              />
            </div>
          </section>
        )}
      </div>

      <div className='lg:col-span-1'>
        <h2 className='mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl'>
          Your Progress
        </h2>
        <div className='overflow-hidden rounded-lg bg-gray-800 shadow-lg'>
          <LearningDashboard
            userId={userId}
            courseId={knowledgeId?.toString() || ''}
            compact={window.innerWidth < 1024}
          />
        </div>
      </div>
    </div>
  )
}

export default LearningModule