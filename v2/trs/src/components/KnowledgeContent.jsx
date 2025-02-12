import React, { useState, useEffect } from 'react'
import { supabase } from '@/services/supabase'
import Quiz from '@/components/Quiz'

const KnowledgeContent = ({ knowledge, onBack, updateProgress, progress }) => {
  const [chapters, setChapters] = useState([])
  const [currentChapter, setCurrentChapter] = useState(null)
  const [quizzes, setQuizzes] = useState([])
  const [currentQuiz, setCurrentQuiz] = useState(null)

  useEffect(() => {
    fetchChapters()
    fetchQuizzes()
  }, [knowledge.id])

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('knowledge_id', knowledge.id)
      .order('order', { ascending: true })
    
    if (error) console.error('Error fetching chapters:', error)
    else {
      setChapters(data)
      if (data.length > 0) setCurrentChapter(data[0])
    }
  }

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('course_id', knowledge.id)
    
    if (error) console.error('Error fetching quizzes:', error)
    else setQuizzes(data)
  }

  const handleChapterComplete = () => {
    updateProgress(knowledge.id, currentChapter.id, 'completed')
  }

  const handleQuizComplete = (score) => {
    console.log(`Quiz completed with score: ${score}`)
    handleChapterComplete()
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-blue-500 hover:text-blue-600">
        &larr; Back to list
      </button>
      <h2 className="text-2xl font-bold mb-4">{knowledge.title}</h2>
      <div className="flex">
        <div className="w-1/4 pr-4">
          <h3 className="text-lg font-semibold mb-2">Chapters</h3>
          <ul>
            {chapters.map((chapter) => {
              const chapterProgress = progress?.find(p => p.chapter_id === chapter.id)
              return (
                <li 
                  key={chapter.id} 
                  className={`cursor-pointer ${currentChapter?.id === chapter.id ? 'font-bold' : ''} ${chapterProgress?.status === 'completed' ? 'text-green-500' : ''}`}
                  onClick={() => setCurrentChapter(chapter)}
                >
                  {chapter.title}
                  {chapterProgress?.status === 'completed' && ' ✓'}
                </li>
              )
            })}
          </ul>
        </div>
        <div className="w-3/4">
          {currentChapter && (
            <>
              <h3 className="text-xl font-semibold mb-2">{currentChapter.title}</h3>
              <p>{currentChapter.content}</p>
              <button 
                onClick={handleChapterComplete}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Mark as Completed
              </button>
            </>
          )}
          {quizzes.length > 0 && !currentQuiz && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-2">Quizzes</h3>
              <ul>
                {quizzes.map((quiz) => (
                  <li 
                    key={quiz.id}
                    className="cursor-pointer text-blue-500 hover:text-blue-600"
                    onClick={() => setCurrentQuiz(quiz)}
                  >
                    {quiz.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {currentQuiz && (
            <Quiz 
              quiz={currentQuiz} 
              onComplete={handleQuizComplete}
              onBack={() => setCurrentQuiz(null)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default KnowledgeContent

