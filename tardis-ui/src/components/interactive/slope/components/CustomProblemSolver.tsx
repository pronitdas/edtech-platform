'use client'

import React, { useState, useCallback } from 'react'
import { OpenAIClient } from '@/services/openAi'
import { ProblemData } from './PracticeProblem'

export interface CustomProblemSolverProps {
  lineData?: {
    slope: number | null
    yIntercept: number | null
    equation: string
    point1: { x: number; y: number }
    point2: { x: number; y: number }
    rise: number
    run: number
  } | null
  onPointsChange: (points: Array<{ x: number; y: number }>) => void
  openaiClient?: OpenAIClient
  language?: string
}

const CustomProblemSolver: React.FC<CustomProblemSolverProps> = ({
  lineData,
  onPointsChange,
  openaiClient,
  language = 'en',
}) => {
  // State for custom problem
  const [userPrompt, setUserPrompt] = useState('')
  const [generatedProblem, setGeneratedProblem] = useState<ProblemData | null>(
    null
  )
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [solution, setShowSolution] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Generate a problem from user input using AI
  const generateProblem = useCallback(async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a problem description first')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedProblem(null)
    setShowSolution(false)
    setFeedback(null)
    setHasSubmitted(false)

    try {
      if (!openaiClient) {
        // Create a simple problem if no AI client
        const newProblem: ProblemData = {
          id: `custom-${Date.now()}`,
          question: userPrompt,
          difficulty: 'medium',
          expectedSlope: null,
          expectedIntercept: null,
          hints: ['Try drawing a line that represents the scenario.'],
          solution: 'Draw a line that fits the description.',
        }
        setGeneratedProblem(newProblem)
      } else {
        // Use AI to generate a problem based on user's description
        const prompt = `Generate a slope/linear equation problem based on this description: "${userPrompt}"
        
        Return a JSON object with these fields:
        - question: Detailed problem statement
        - difficulty: 'easy', 'medium', or 'hard'
        - hints: An array of helpful hints
        - expectedSlope: The correct slope value or null if undefined
        - expectedIntercept: The correct y-intercept or null if undefined  
        - targetPoints: An array of exact points to plot (optional)
        - solution: Step-by-step solution`

        const result = await openaiClient.chatCompletion(
          [
            {
              role: 'system',
              content:
                'You are a helpful math assistant specializing in slope problems.',
            },
            { role: 'user', content: prompt },
          ],
          'gpt-4o-mini',
          800
        )

        // Parse the AI response
        try {
          const parsedResult = JSON.parse(result)
          const newProblem: ProblemData = {
            id: `custom-${Date.now()}`,
            question: parsedResult.question,
            difficulty: parsedResult.difficulty || 'medium',
            expectedSlope: parsedResult.expectedSlope,
            expectedIntercept: parsedResult.expectedIntercept,
            hints: parsedResult.hints || [],
            targetPoints: parsedResult.targetPoints || [],
            solution: parsedResult.solution,
          }
          setGeneratedProblem(newProblem)

          // Set points if provided
          if (
            parsedResult.targetPoints &&
            parsedResult.targetPoints.length > 0
          ) {
            onPointsChange(parsedResult.targetPoints)
          }
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError)
          setError('Failed to parse the generated problem. Please try again.')
        }
      }
    } catch (e) {
      console.error('Error generating problem:', e)
      setError('Failed to generate problem. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [userPrompt, openaiClient, onPointsChange])

  // Check user's answer against the generated problem
  const checkAnswer = useCallback(async () => {
    if (!generatedProblem || !lineData) {
      return
    }

    setHasSubmitted(true)

    try {
      if (!openaiClient) {
        // Simple validation if no AI client
        const isCorrect = generatedProblem.expectedSlope === lineData.slope
        setFeedback(
          isCorrect
            ? 'Great job! Your answer looks correct.'
            : "That doesn't seem right. Try again!"
        )
      } else {
        // Use AI to validate the answer
        const prompt = `Problem: ${generatedProblem.question}
        
        User's solution:
        - Slope: ${lineData.slope !== null ? lineData.slope.toFixed(2) : 'undefined'}
        - Y-intercept: ${lineData.yIntercept !== null ? lineData.yIntercept.toFixed(2) : 'undefined'}
        - Equation: ${lineData.equation}
        - Points: (${lineData.point1.x.toFixed(1)}, ${lineData.point1.y.toFixed(1)}) and (${lineData.point2.x.toFixed(1)}, ${lineData.point2.y.toFixed(1)})
        
        Expected values:
        - Expected slope: ${generatedProblem.expectedSlope !== null ? generatedProblem.expectedSlope : 'undefined'}
        - Expected y-intercept: ${generatedProblem.expectedIntercept !== null ? generatedProblem.expectedIntercept : 'undefined'}
        
        Is the user's solution correct? If not, what's wrong with it? Provide specific, helpful feedback.`

        const result = await openaiClient.chatCompletion(
          [
            {
              role: 'system',
              content:
                'You are a helpful math tutor providing feedback on slope problems.',
            },
            { role: 'user', content: prompt },
          ],
          'gpt-4o-mini',
          300
        )

        setFeedback(result)
      }
    } catch (e) {
      console.error('Error checking answer:', e)
      setFeedback('Error evaluating your answer. Please try again.')
    }
  }, [generatedProblem, lineData, openaiClient])

  // Toggle solution visibility
  const toggleSolution = useCallback(() => {
    setShowSolution(prev => !prev)
  }, [])

  return (
    <div className='flex h-full flex-col rounded-md bg-gray-800 p-4'>
      <h3 className='mb-4 text-lg font-medium text-white'>
        Custom Problem Solver
      </h3>

      {/* Problem input section */}
      <div className='mb-4'>
        <label
          htmlFor='problem-input'
          className='mb-2 block text-sm font-medium text-gray-300'
        >
          Describe your problem:
        </label>
        <textarea
          id='problem-input'
          className='min-h-[120px] w-full rounded-md border border-gray-700 bg-gray-900 p-3 text-white'
          placeholder='Example: Find the slope of a line that passes through the points (3, 5) and (7, 9)'
          value={userPrompt}
          onChange={e => setUserPrompt(e.target.value)}
        />

        <button
          onClick={generateProblem}
          disabled={isGenerating || !userPrompt.trim()}
          className={`mt-2 rounded-md px-4 py-2 text-white ${
            isGenerating || !userPrompt.trim()
              ? 'cursor-not-allowed bg-gray-600'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isGenerating ? 'Generating...' : 'Generate Problem'}
        </button>

        {error && (
          <div className='mt-2 rounded-md bg-red-900/50 p-2 text-sm text-red-200'>
            {error}
          </div>
        )}
      </div>

      {/* Generated problem display */}
      {generatedProblem && (
        <div className='flex flex-grow flex-col'>
          <div className='mb-4 rounded-md bg-gray-900 p-3'>
            <h4 className='text-md mb-2 font-medium text-white'>Problem</h4>
            <p className='whitespace-pre-line text-gray-300'>
              {generatedProblem.question}
            </p>

            {generatedProblem.hints && generatedProblem.hints.length > 0 && (
              <div className='mt-4'>
                <p className='mb-1 text-sm font-medium text-purple-400'>
                  Hint:
                </p>
                <p className='text-sm text-gray-400'>
                  {generatedProblem.hints[0]}
                </p>
              </div>
            )}
          </div>

          {/* User's answer */}
          <div className='mb-4'>
            <h4 className='text-md mb-2 font-medium text-white'>Your Answer</h4>
            {lineData ? (
              <div className='rounded-md bg-gray-900 p-3'>
                <p className='text-gray-300'>
                  <span className='text-green-400'>Points:</span> (
                  {lineData.point1.x.toFixed(1)}, {lineData.point1.y.toFixed(1)}
                  ) and ({lineData.point2.x.toFixed(1)},{' '}
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
          <div className='mb-4 space-y-2'>
            <button
              onClick={checkAnswer}
              disabled={!lineData}
              className={`w-full rounded-md px-4 py-2 text-white ${
                !lineData
                  ? 'cursor-not-allowed bg-gray-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Check Answer
            </button>

            <button
              onClick={toggleSolution}
              className='w-full rounded-md bg-gray-700 px-4 py-2 text-white hover:bg-gray-600'
            >
              {solution ? 'Hide Solution' : 'Show Solution'}
            </button>
          </div>

          {/* Feedback and solution */}
          {hasSubmitted && feedback && (
            <div className='mb-4 rounded-md border-l-4 border-blue-500 bg-gray-900 p-3'>
              <h4 className='text-md mb-1 font-medium text-white'>Feedback</h4>
              <p className='whitespace-pre-line text-gray-300'>{feedback}</p>
            </div>
          )}

          {solution && generatedProblem.solution && (
            <div className='rounded-md border-l-4 border-green-500 bg-gray-900 p-3'>
              <h4 className='text-md mb-1 font-medium text-white'>Solution</h4>
              <p className='whitespace-pre-line text-gray-300'>
                {generatedProblem.solution}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CustomProblemSolver
