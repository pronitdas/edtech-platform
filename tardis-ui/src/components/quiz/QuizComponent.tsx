import React, { useState, useEffect } from 'react'
import { useInteractionTracker } from '@/contexts/InteractionTrackerContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: string
}

interface QuizProps {
  quizId: number
  title: string
  questions: QuizQuestion[]
}

export const QuizComponent: React.FC<QuizProps> = ({
  quizId,
  title,
  questions,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({})
  const [startTime, setStartTime] = useState<Record<string, number>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [score, setScore] = useState(0)

  const { trackQuizStart, trackQuizAnswer, trackQuizComplete } =
    useInteractionTracker()

  useEffect(() => {
    // Track quiz start when component mounts
    trackQuizStart(quizId, {
      quizId: quizId.toString(),
      quizTitle: 'Chapter Quiz',
      questionCount: questions.length,
      attemptNumber: 1,
      knowledgeId: '', // Will need to be passed as prop
      moduleId: quizId.toString(),
      timestamp: Date.now(),
    })

    // Initialize start time for first question
    if (questions[0]) {
      setStartTime({
        [questions[0].id]: Date.now(),
      })
    }
  }, [quizId, questions, trackQuizStart])

  const handleAnswerSelect = (questionId: string, answer: string) => {
    const currentTime = Date.now()
    const timeTaken =
      (currentTime - (startTime[questionId] || currentTime)) / 1000 // Convert to seconds
    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return
    const isCorrect = answer === currentQuestion.correctAnswer

    // Track the answer
    trackQuizAnswer(quizId, questionId, {
      quizId: quizId.toString(),
      questionId,
      questionType: 'multiple-choice',
      isCorrect,
      timeTaken,
      userAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      knowledgeId: '',
      moduleId: quizId.toString(),
      timestamp: currentTime,
      attemptId: `${quizId}-${Date.now()}`
    })

    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }))

    // If there are more questions, set up the next one
    if (currentQuestionIndex < questions.length - 1) {
      const nextQuestion = questions[currentQuestionIndex + 1]
      if (!nextQuestion) return
      const nextQuestionId = nextQuestion.id
      setStartTime(prev => ({
        ...prev,
        [nextQuestionId]: Date.now(),
      }))
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Calculate final score
      const totalCorrect = Object.entries(selectedAnswers).reduce(
        (count, [qId, answer]) => {
          const question = questions.find(q => q.id === qId)
          return count + (question?.correctAnswer === answer ? 1 : 0)
        },
        isCorrect ? 1 : 0 // Include current answer
      )
      const finalScore = (totalCorrect / questions.length) * 100
      setScore(finalScore)
      setIsCompleted(true)

      // Track quiz completion
      const durationSeconds = Object.values(startTime).reduce(
        (total, time) => total + (currentTime - time),
        0
      ) / 1000 // Convert to seconds
      
      trackQuizComplete(quizId, {
        quizId: quizId.toString(),
        quizTitle: 'Chapter Quiz',
        attemptId: `${quizId}-${Date.now()}`,
        score: finalScore,
        maxScore: 100,
        durationSeconds,
        correctAnswers: totalCorrect,
        totalQuestions: questions.length,
        attemptNumber: 1,
        knowledgeId: '',
        moduleId: quizId.toString(),
        timestamp: currentTime,
      })
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  if (isCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-center'>
            <p className='mb-4 text-2xl font-bold'>
              Your Score: {Math.round(score)}%
            </p>
            <p className='text-gray-600'>
              You answered {Math.round((score / 100) * questions.length)} out of{' '}
              {questions.length} questions correctly.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!currentQuestion) {
    return <div>No questions available</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className='text-sm text-gray-500'>
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          <div className='text-lg font-medium'>{currentQuestion.question}</div>
          <div className='space-y-2'>
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                className={`w-full rounded-lg p-4 text-left transition-colors ${
                  selectedAnswers[currentQuestion.id] === option
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
