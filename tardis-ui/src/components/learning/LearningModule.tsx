import React, { useState } from 'react'
import { Search, Brain, BookOpen } from 'lucide-react'
import { VideoPlayer } from '@/components/video/VideoPlayer'
import { QuizComponent } from '@/components/quiz/QuizComponent'
import UnifiedQuizInterface from '@/components/quiz/UnifiedQuizInterface'
import { LearningDashboard } from '@/components/analytics/LearningDashboard'
import SemanticSearchInterface from '@/components/search/SemanticSearchInterface'

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
  const [showSemanticSearch, setShowSemanticSearch] = useState(false)

  return (
    <div className='relative'>
      {/* Header with Search */}
      <div className="flex items-center justify-between mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-blue-500" />
          <h1 className="text-xl font-bold text-white">Learning Module</h1>
        </div>
        <button
          onClick={() => setShowSemanticSearch(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Search size={16} />
          <span>Find Related Content</span>
        </button>
      </div>

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

        <section>
          <h2 className='mb-3 text-xl font-bold text-white sm:mb-4 sm:text-2xl'>
            Knowledge Assessment
          </h2>
          <div className='overflow-hidden rounded-lg bg-gray-800 p-4 shadow-lg'>
            <UnifiedQuizInterface
              knowledgeId={knowledgeId?.toString() || ''}
              chapterId={videoContent?.chapter_id}
              showGeneratedQuizzes={true}
              showLegacyQuizzes={true}
              onQuizComplete={(score, totalScore, quizType) => {
                console.log(`Quiz completed: ${score}/${totalScore} (${quizType})`);
                // Handle quiz completion - could update progress, analytics, etc.
              }}
            />
          </div>
        </section>
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

      {/* Semantic Search Interface */}
      <SemanticSearchInterface
        isOpen={showSemanticSearch}
        onClose={() => setShowSemanticSearch(false)}
        onResultSelect={(result) => {
          console.log('Related content selected:', result);
          // Navigate to or display the related content
          setShowSemanticSearch(false);
        }}
        contentFilter={['video', 'quiz', 'interactive']}
        showFilters={true}
      />
    </div>
  )
}

export default LearningModule