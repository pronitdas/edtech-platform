import React, { useState } from 'react'
import { AlertCircle, CheckCircle, HelpCircle, Eye } from 'lucide-react'

interface FeedbackSystemProps {
  correctAnswer: string
  hints: string[]
  onHintUsed?: () => void
  onSolutionRevealed?: () => void
  onValidationComplete?: (isCorrect: boolean) => void
  className?: string
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({
  correctAnswer,
  hints,
  onHintUsed,
  onSolutionRevealed,
  onValidationComplete,
  className = '',
}) => {
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'success' | 'info' | null
    message: string
  }>({ type: null, message: '' })
  const [usedHints, setUsedHints] = useState<number[]>([])
  const [solutionRevealed, setSolutionRevealed] = useState(false)

  // Validate the user's answer
  const validateAnswer = () => {
    if (!userAnswer.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please enter an answer before submitting.',
      })
      return
    }

    // Simple string comparison (can be extended for more complex validation)
    const isCorrect =
      userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: 'Great job! Your answer is correct.',
      })
    } else {
      setFeedback({
        type: 'error',
        message: 'Your answer is incorrect. Try again or use a hint.',
      })
    }

    // Notify parent component about validation
    onValidationComplete?.(isCorrect)
  }

  // Show a hint
  const showHint = () => {
    if (usedHints.length >= hints.length) {
      setFeedback({
        type: 'info',
        message: 'You have used all available hints.',
      })
      return
    }

    const nextHintIndex = usedHints.length
    setUsedHints([...usedHints, nextHintIndex])
    setFeedback({
      type: 'info',
      message: hints[nextHintIndex],
    })

    // Notify parent that a hint was used
    onHintUsed?.()
  }

  // Reveal the solution
  const revealSolution = () => {
    setSolutionRevealed(true)
    setFeedback({
      type: 'info',
      message: `The correct answer is: ${correctAnswer}`,
    })

    // Notify parent that solution was revealed
    onSolutionRevealed?.()
  }

  return (
    <div className={`rounded-lg bg-gray-800 p-4 ${className}`}>
      <div className='mb-4'>
        <label
          htmlFor='userAnswer'
          className='mb-1 block text-sm font-medium text-gray-300'
        >
          Your Answer
        </label>
        <div className='flex gap-2'>
          <input
            id='userAnswer'
            type='text'
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            className='flex-1 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'
            placeholder='Enter your answer...'
          />
          <button
            onClick={validateAnswer}
            className='rounded-md bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700'
          >
            Check
          </button>
        </div>
      </div>

      {feedback.type && (
        <div
          className={`mb-4 flex items-start gap-2 rounded-md p-3 ${
            feedback.type === 'error'
              ? 'bg-red-500/20 text-red-300'
              : feedback.type === 'success'
                ? 'bg-green-500/20 text-green-300'
                : 'bg-blue-500/20 text-blue-300'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle size={18} />
          ) : feedback.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <HelpCircle size={18} />
          )}
          <p className='text-sm'>{feedback.message}</p>
        </div>
      )}

      <div className='flex justify-between'>
        <div>
          <button
            onClick={showHint}
            disabled={usedHints.length >= hints.length}
            className='mr-2 rounded-md bg-gray-700 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <span className='flex items-center gap-1'>
              <HelpCircle size={14} />
              Hint ({usedHints.length}/{hints.length})
            </span>
          </button>
        </div>

        <button
          onClick={revealSolution}
          disabled={solutionRevealed}
          className='rounded-md bg-gray-700 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50'
        >
          <span className='flex items-center gap-1'>
            <Eye size={14} />
            {solutionRevealed ? 'Solution Revealed' : 'Reveal Solution'}
          </span>
        </button>
      </div>

      {usedHints.length > 0 && (
        <div className='mt-4'>
          <h4 className='mb-2 text-sm font-medium text-gray-300'>
            Used Hints:
          </h4>
          <ul className='space-y-1 text-sm text-gray-400'>
            {usedHints.map(index => (
              <li key={index} className='flex items-center gap-1'>
                <HelpCircle size={12} />
                <span>
                  Hint {index + 1}: {hints[index]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
