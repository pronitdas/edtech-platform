'use client'

import React, { useState, useEffect } from 'react'

interface Question {
  question: string
  options: string[]
  answer: string
  points?: number // Optional points per question
}

interface QuizProps {
  questions: Question[]
  negativeMarking?: number // Fraction of points deducted for wrong answers (0.25 = 25%)
}

const Quiz: React.FC<QuizProps> = ({
  questions,
  negativeMarking = 0.25, // Default to 25% negative marking
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{
    [key: number]: string
  }>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState<number>(0)
  const [maxScore, setMaxScore] = useState<number>(0)
  const [attempted, setAttempted] = useState<number>(0)
  const [correctAnswers, setCorrectAnswers] = useState<number>(0)
  const [incorrectAnswers, setIncorrectAnswers] = useState<number>(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)

  // Calculate maximum possible score
  useEffect(() => {
    const total = questions.reduce(
      (sum, question) => sum + (question.points || 1),
      0
    )
    setMaxScore(total)
  }, [questions])

  // Handle answer selection
  const handleAnswerSelect = (questionIndex: number, option: string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: option }))
  }

  // Calculate score and show results with negative marking
  const handleSubmit = () => {
    let newScore = 0
    let correct = 0
    let incorrect = 0
    let attempted = 0

    questions.forEach((question, index) => {
      const pointsForQuestion = question.points || 1

      // If question was attempted
      if (selectedAnswers[index]) {
        attempted++

        if (selectedAnswers[index] === question.answer) {
          // Correct answer
          newScore += pointsForQuestion
          correct++
        } else {
          // Incorrect answer - apply negative marking
          newScore -= pointsForQuestion * negativeMarking
          incorrect++
        }
      }
    })

    // Ensure score doesn't go below zero
    newScore = Math.max(0, newScore)

    setScore(newScore)
    setShowResults(true)
    setAttempted(attempted)
    setCorrectAnswers(correct)
    setIncorrectAnswers(incorrect)
  }

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  // Reset quiz
  const handleReset = () => {
    setSelectedAnswers({})
    setShowResults(false)
    setScore(0)
    setAttempted(0)
    setCorrectAnswers(0)
    setIncorrectAnswers(0)
    setCurrentQuestionIndex(0)
  }

  // Calculate percentage score
  const percentageScore = Math.round((score / maxScore) * 100)

  return (
    <div className='mx-auto mt-6 flex min-h-[600px] max-w-xl flex-col rounded-lg bg-gray-800 p-6 text-white shadow-lg'>
      <h2 className='mb-4 text-center text-2xl font-bold'>Interactive Quiz</h2>

      {!showResults ? (
        <>
          {/* Progress indicator */}
          <div className='mb-4'>
            <div className='mb-1 flex justify-between text-sm text-gray-300'>
              <span>
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span>{Object.keys(selectedAnswers).length} answered</span>
            </div>
            <div className='h-2.5 w-full rounded-full bg-gray-700'>
              <div
                className='h-2.5 rounded-full bg-blue-500 transition-all duration-300'
                style={{
                  width: `${(Object.keys(selectedAnswers).length / questions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Current Question */}
          <div className='flex flex-grow flex-col'>
            <div className='mb-4 flex-grow rounded-lg bg-gray-700 p-4'>
              <p className='mb-4 text-lg font-semibold'>
                {questions[currentQuestionIndex]?.question}
                <span className='ml-2 text-sm text-gray-300'>
                  ({questions[currentQuestionIndex]?.points || 1} point
                  {(questions[currentQuestionIndex]?.points || 1) !== 1
                    ? 's'
                    : ''}
                  )
                </span>
              </p>
              <div className='space-y-3'>
                {questions[currentQuestionIndex]?.options?.map((option, i) => {
                  const isSelected =
                    selectedAnswers[currentQuestionIndex] === option
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        handleAnswerSelect(currentQuestionIndex, option)
                      }
                      className={`w-full rounded-md p-3 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border border-blue-400 bg-blue-600'
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className='mt-auto flex items-center justify-between'>
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className='rounded-lg bg-gray-600 px-4 py-2 hover:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50'
              >
                Previous
              </button>
              {currentQuestionIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  className='rounded-lg bg-blue-500 px-6 py-2 font-semibold hover:bg-blue-600'
                >
                  Submit Quiz
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  className='rounded-lg bg-gray-600 px-4 py-2 hover:bg-gray-500'
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </>
      ) : (
        // Results view
        <div className='flex flex-grow flex-col'>
          <div className='mb-6 rounded-lg bg-gray-700 p-6'>
            <h3 className='mb-4 text-center text-2xl font-bold'>
              Quiz Results
            </h3>
            <div className='grid grid-cols-2 gap-6'>
              <div className='rounded-lg bg-gray-600 p-4 text-center'>
                <p className='mb-1 text-3xl font-bold text-blue-300'>
                  {percentageScore}%
                </p>
                <p className='text-sm'>Score</p>
              </div>
              <div className='rounded-lg bg-gray-600 p-4 text-center'>
                <p className='mb-1 text-3xl font-bold'>
                  {score.toFixed(1)}/{maxScore}
                </p>
                <p className='text-sm'>Points</p>
              </div>
              <div className='rounded-lg bg-gray-600 p-4 text-center'>
                <p className='mb-1 text-3xl font-bold text-green-400'>
                  {correctAnswers}
                </p>
                <p className='text-sm'>Correct</p>
              </div>
              <div className='rounded-lg bg-gray-600 p-4 text-center'>
                <p className='mb-1 text-3xl font-bold text-red-400'>
                  {incorrectAnswers}
                </p>
                <p className='text-sm'>Incorrect</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleReset}
            className='w-full rounded-lg bg-green-500 px-6 py-3 font-semibold text-white transition duration-150 hover:bg-green-600'
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}

export default Quiz
