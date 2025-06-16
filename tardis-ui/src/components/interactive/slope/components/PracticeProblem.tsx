import { Problem } from '@/types/interactive'
;('use client')

import React, { useState } from 'react'
import { LineData } from '@/types/geometry'

// Define LineData interface to match what's returned from useGraphManagement

export interface PracticeProblemProps {
  problems: Problem[]
  currentProblemId: string | null
  difficulty: 'easy' | 'medium' | 'hard'
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void
  onSelectProblem: (problemId: string) => void
  onGenerateNewProblem: () => void
  lineData?: import('@/types/geometry').LineData | null
  onSubmitAnswer: () => void
  isCorrect: boolean | null
  showSolution: boolean
  onToggleSolution: () => void
  onNextProblem: () => void
  stats: {
    correct: number
    incorrect: number
    attempted: number
    streakCount: number
    history?: Array<import('../types').SolutionResult>
    difficultyStats?: {
      easy: { attempted: number; correct: number }
      medium: { attempted: number; correct: number }
      hard: { attempted: number; correct: number }
    }
  }
  onHintRequest?: () => void
}

const PracticeProblem: React.FC<PracticeProblemProps> = ({
  problems,
  currentProblemId,
  difficulty,
  setDifficulty,
  onSelectProblem,
  onGenerateNewProblem,
  lineData,
  onSubmitAnswer,
  isCorrect,
  showSolution,
  onToggleSolution,
  onNextProblem,
  stats,
  onHintRequest,
}) => {
  const [showHint, setShowHint] = useState(false)
  const [hintIndex, setHintIndex] = useState<number>(-1)

  // Get current problem
  const currentProblem = problems.find(p => p.id === currentProblemId) || null

  // Filter problems by difficulty
  const filteredProblems = problems.filter(p => p.difficulty === difficulty)

  const handleSubmit = () => {
    onSubmitAnswer()
  }

  // Handle showing hints with cognitive load tracking
  const handleShowHint = () => {
    setShowHint(!showHint)
    // Call onHintRequest if it exists to track cognitive load
    if (!showHint && onHintRequest) {
      onHintRequest()
    }
  }

  return (
    <div className='flex h-full flex-col rounded-md bg-gray-800 p-4'>
      {/* Fixed top controls */}
      <div className='flex-shrink-0'>
        {/* Difficulty selector */}
        <div className='mb-4'>
          <label
            htmlFor='difficulty-select'
            className='mb-2 block text-sm font-medium text-gray-300'
          >
            Difficulty:
          </label>
          <div className='flex space-x-2'>
            <button
              onClick={() => setDifficulty('easy')}
              className={`rounded-md px-3 py-1 text-sm ${
                difficulty === 'easy'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              Easy
            </button>
            <button
              onClick={() => setDifficulty('medium')}
              className={`rounded-md px-3 py-1 text-sm ${
                difficulty === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setDifficulty('hard')}
              className={`rounded-md px-3 py-1 text-sm ${
                difficulty === 'hard'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-200'
              }`}
            >
              Hard
            </button>
          </div>
        </div>

        {/* Problem selector */}
        <div className='mb-4'>
          <div className='mb-2 flex items-center justify-between'>
            <label
              htmlFor='problem-select'
              className='block text-sm font-medium text-gray-300'
            >
              Select a problem:
            </label>
            <button
              onClick={onGenerateNewProblem}
              className='rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700'
            >
              Generate New
            </button>
          </div>
          <select
            id='problem-select'
            className='w-full rounded-md border border-gray-700 bg-gray-900 p-2 text-white'
            value={currentProblemId || ''}
            onChange={e => onSelectProblem(e.target.value)}
          >
            <option value=''>--Select a problem--</option>
            {filteredProblems.map(problem => (
              <option key={problem.id} value={problem.id}>
                Problem #{problem.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className='flex-1 overflow-y-auto pr-1'>
        {/* Current problem display */}
        {currentProblem ? (
          <div className='flex flex-col'>
            <div className='mb-4 rounded-md bg-gray-900 p-3'>
              <h3 className='text-md mb-2 font-medium text-white'>Problem</h3>
              <p className='whitespace-pre-line text-gray-300'>
                {currentProblem.question}
              </p>
            </div>

            {/* Hints section */}
            <div className='mb-4'>
              <button
                onClick={handleShowHint}
                className='rounded-md bg-purple-600 px-3 py-1 text-sm text-white hover:bg-purple-700'
              >
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>

              {showHint && (
                <div className='mt-2 rounded-md border-l-4 border-purple-500 bg-gray-900 p-3'>
                  <p className='text-gray-300'>{currentProblem.hints[0]}</p>
                </div>
              )}
            </div>

            {/* User answer section */}
            <div className='mb-4'>
              <h3 className='text-md mb-2 font-medium text-white'>
                Your Answer
              </h3>
              {lineData ? (
                <div className='rounded-md bg-gray-900 p-3'>
                  <p className='text-gray-300'>
                    <span className='text-green-400'>Points:</span> (
                    {lineData.point1.x.toFixed(1)},{' '}
                    {lineData.point1.y.toFixed(1)}) and (
                    {lineData.point2.x.toFixed(1)},{' '}
                    {lineData.point2.y.toFixed(1)})
                  </p>
                  <p className='text-gray-300'>
                    <span className='text-green-400'>Slope:</span>{' '}
                    {lineData.slope !== null
                      ? lineData.slope.toFixed(2)
                      : 'Undefined'}
                  </p>
                  <p className='text-gray-300'>
                    <span className='text-green-400'>Equation:</span>{' '}
                    {lineData.equation}
                  </p>
                </div>
              ) : (
                <div className='rounded-md bg-gray-900 p-3'>
                  <p className='italic text-gray-400'>
                    Place two points on the graph to define your answer.
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className='mb-4 flex space-x-2'>
              <button
                onClick={handleSubmit}
                disabled={!lineData}
                className={`rounded-md px-4 py-2 text-white ${
                  !lineData
                    ? 'cursor-not-allowed bg-gray-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Submit Answer
              </button>

              <button
                onClick={onToggleSolution}
                className='rounded-md bg-gray-700 px-4 py-2 text-white hover:bg-gray-600'
              >
                {showSolution ? 'Hide Solution' : 'Show Solution'}
              </button>
            </div>

            {/* Feedback */}
            {isCorrect !== null && (
              <div
                className={`mb-4 rounded-md p-3 ${
                  isCorrect
                    ? 'border-l-4 border-green-500 bg-green-900'
                    : 'border-l-4 border-red-500 bg-red-900'
                }`}
              >
                <p className='font-medium text-white'>
                  {isCorrect ? 'Correct! Well done!' : 'Incorrect. Try again!'}
                </p>
              </div>
            )}

            {/* Solution */}
            {showSolution && (
              <div className='mt-2 rounded-md bg-gray-900 p-3'>
                <h5 className='text-md mb-1 font-medium text-white'>
                  Solution:
                </h5>
                <div className='text-gray-300'>
                  {typeof currentProblem.solution === 'string' ? (
                    <p>{currentProblem.solution}</p>
                  ) : currentProblem.solution ? (
                    <>
                      <p>Slope: {currentProblem.solution.slope}</p>
                      <p>Y-Intercept: {currentProblem.solution.yIntercept}</p>
                      <p>
                        Equation: y = {currentProblem.solution.slope}x +{' '}
                        {currentProblem.solution.yIntercept}
                      </p>
                    </>
                  ) : (
                    <p>No solution available</p>
                  )}
                </div>
              </div>
            )}

            {/* Next problem button (only shown when current problem is solved correctly) */}
            {isCorrect && (
              <button
                onClick={onNextProblem}
                className='w-full rounded-md bg-green-600 py-2 text-white hover:bg-green-700'
              >
                Next Problem
              </button>
            )}
          </div>
        ) : (
          <div className='flex items-center justify-center rounded-md bg-gray-900 p-8'>
            <p className='text-center text-gray-400'>
              Select a problem or generate a new one to get started.
            </p>
          </div>
        )}
      </div>

      {/* Fixed stats display at bottom */}
      <div className='mt-4 grid flex-shrink-0 grid-cols-4 gap-2 rounded-md bg-gray-900 p-3 text-center'>
        <div>
          <p className='text-xs text-gray-400'>Attempted</p>
          <p className='text-lg font-medium text-white'>{stats.attempted}</p>
        </div>
        <div>
          <p className='text-xs text-gray-400'>Correct</p>
          <p className='text-lg font-medium text-green-400'>{stats.correct}</p>
        </div>
        <div>
          <p className='text-xs text-gray-400'>Incorrect</p>
          <p className='text-lg font-medium text-red-400'>{stats.incorrect}</p>
        </div>
        <div>
          <p className='text-xs text-gray-400'>Streak</p>
          <p className='text-lg font-medium text-yellow-400'>
            {stats.streakCount}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PracticeProblem
