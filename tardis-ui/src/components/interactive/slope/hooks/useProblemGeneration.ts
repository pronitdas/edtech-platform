import { Problem } from '@/types/interactive'

import { useState, useCallback, useEffect } from 'react'

import {
  LearningContext,
  ProblemGenerationConfig,
  ProblemGenerationStats,
  ProblemDifficulty,
  SolutionResult,
} from '../types' // Import types from index.ts

export function useProblemGeneration({
  initialDifficulty = 'easy',
  initialProblems = [],
  predefinedProblems = [],
  maxHistoryLength = 10,
  learningContext, // Add learningContext parameter
  setStats, // Add setStats parameter
  setProblemHistory, // Add setProblemHistory parameter
}: ProblemGenerationConfig & {
  learningContext?: LearningContext
  setStats: React.Dispatch<React.SetStateAction<ProblemGenerationStats>>
  setProblemHistory: React.Dispatch<React.SetStateAction<any[]>>
}) {
  // Update type definition and add setStats and setProblemHistory
  // State
  const [problems, setProblems] = useState<Problem[]>(
    initialProblems.length > 0 ? initialProblems : predefinedProblems
  )
  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null)
  const [difficulty, setDifficulty] =
    useState<ProblemDifficulty>(initialDifficulty)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showSolution, setShowSolution] = useState(false)
  // Remove internal stats state, it's managed by the provider now
  // const [stats, setStats] = useState<ProblemGenerationStats>({
  //   correct: 0,
  //   incorrect: 0,
  //   attempted: 0,
  //   streakCount: 0,
  //   history: [],
  //   difficultyStats: {
  //     easy: { attempted: 0, correct: 0 },
  //     medium: { attempted: 0, correct: 0 },
  //     hard: { attempted: 0, correct: 0 },
  //   }
  // });

  // Get current problem
  const currentProblem = problems.find(p => p.id === currentProblemId) || null

  // Generate a random problem based on difficulty and learning context
  const generateProblem = useCallback(() => {
    // Use learningContext to influence problem generation
    console.log('Generating problem with Learning Context:', learningContext) // Log context

    // Determine problem type based on learning context history
    let problemType:
      | 'slope'
      | 'undefined-slope'
      | 'zero-slope'
      | 'fractional-coordinates' = 'slope' // Default to general slope problem
    const recentHistory = learningContext?.stats.history.slice(-5) // Look at the last 5 problems

    if (recentHistory && recentHistory.length > 0) {
      const incorrectAttempts = recentHistory.filter(item => !item.isCorrect)
      const undefinedSlopeAttempts = incorrectAttempts.filter(item => {
        const problem = problems.find(p => p.id === item.problemId)
        return problem?.categories?.includes('undefined-slope') || false
      }).length
      const zeroSlopeAttempts = incorrectAttempts.filter(item => {
        const problem = problems.find(p => p.id === item.problemId)
        return problem?.categories?.includes('zero-slope') || false
      }).length
      const fractionalCoordinateAttempts = incorrectAttempts.filter(item => {
        const problem = problems.find(p => p.id === item.problemId)
        return problem?.categories?.includes('fractional-coordinates')
      }).length

      // If the user is struggling with a specific type, generate more of that type
      if (
        undefinedSlopeAttempts > 0 &&
        undefinedSlopeAttempts >= incorrectAttempts.length * 0.5
      ) {
        problemType = 'undefined-slope'
      } else if (
        zeroSlopeAttempts > 0 &&
        zeroSlopeAttempts >= incorrectAttempts.length * 0.5
      ) {
        problemType = 'zero-slope'
      } else if (
        fractionalCoordinateAttempts > 0 &&
        fractionalCoordinateAttempts >= incorrectAttempts.length * 0.5
      ) {
        problemType = 'fractional-coordinates'
      }
      // Add more conditions for other problem types as needed
    }

    // Generate random points based on difficulty, determined problem type, and learning context
    const generatePoints = (
      diff: ProblemDifficulty,
      type: typeof problemType,
      context?: LearningContext
    ) => {
      let range, offset
      let allowFractions = false
      const minAttemptsForAdaptation = 5 // Minimum attempts at a difficulty before adapting

      // Base range and offset based on difficulty
      switch (diff) {
        case 'easy':
          range = 10
          offset = 0
          break
        case 'medium':
          range = 15
          offset = -5
          break
        case 'hard':
          range = 20
          offset = -10
          break
      }

      // Adaptive logic based on learning context stats for the current difficulty
      if (
        context &&
        context.stats.difficultyStats[diff].attempted >=
        minAttemptsForAdaptation
      ) {
        const difficultyStats = context.stats.difficultyStats[diff]
        const successRate = difficultyStats.correct / difficultyStats.attempted

        if (successRate > 0.7) {
          // If doing well, slightly increase range and potentially allow fractions
          range = Math.min(range + 5, 30) // Increase range, cap at 30
          allowFractions = diff !== 'easy' // Allow fractions on medium/hard
        } else if (successRate < 0.5) {
          // If struggling, slightly decrease range and ensure no fractions
          range = Math.max(range - 5, 5) // Decrease range, minimum 5
          allowFractions = false
        }
      }

      // Helper to generate coordinate (integer or fractional)
      const generateCoordinate = (
        currentRange: number,
        currentOffset: number,
        fractions: boolean
      ) => {
        if (fractions && Math.random() > 0.5) {
          // 50% chance of fractional coordinate if allowed
          const integerPart = Math.floor(
            Math.random() * currentRange + currentOffset
          )
          const fractionalPart = Math.random() > 0.5 ? 0.5 : -0.5 // Simple 0.5 or -0.5 for now
          return integerPart + fractionalPart
        } else {
          return Math.floor(Math.random() * currentRange + currentOffset)
        }
      }

      let x1, y1, x2, y2

      // Generate points based on problem type
      switch (type) {
        case 'undefined-slope':
          x1 = generateCoordinate(range, offset, false) // x-coordinates must be integers for vertical lines
          x2 = x1
          y1 = generateCoordinate(range, offset, allowFractions)
          y2 = y1
          while (Math.abs(y2 - y1) < 0.001) {
            // Ensure y1 and y2 are distinct
            y2 = generateCoordinate(range, offset, allowFractions)
          }
          break
        case 'zero-slope':
          y1 = generateCoordinate(range, offset, false) // y-coordinates must be integers for horizontal lines
          y2 = y1
          x1 = generateCoordinate(range, offset, allowFractions)
          x2 = x1
          while (Math.abs(x2 - x1) < 0.001) {
            // Ensure x1 and x2 are distinct
            x2 = generateCoordinate(range, offset, allowFractions)
          }
          break
        case 'fractional-coordinates':
          // Ensure at least one coordinate is fractional
          do {
            x1 = generateCoordinate(range, offset, true)
            y1 = generateCoordinate(range, offset, true)
            x2 = generateCoordinate(range, offset, true)
            y2 = generateCoordinate(range, offset, true)
          } while (
            (Number.isInteger(x1) &&
              Number.isInteger(y1) &&
              Number.isInteger(x2) &&
              Number.isInteger(y2)) ||
            Math.abs(x2 - x1) < 0.001
          ) // Ensure distinct x values

          break
        case 'slope':
        default:
          // Generate distinct x values
          x1 = generateCoordinate(range, offset, allowFractions)
          x2 = x1
          // Ensure x1 and x2 are distinct, considering potential floating point inaccuracies
          while (Math.abs(x2 - x1) < 0.001) {
            x2 = generateCoordinate(range, offset, allowFractions)
          }

          // Generate y values
          y1 = generateCoordinate(range, offset, allowFractions)
          y2 = generateCoordinate(range, offset, allowFractions)
          break
      }

      return { x1, y1, x2, y2 }
    }

    // Generate problem ID
    const problemId = `gen-${Date.now()}`

    // Generate problem points using difficulty and learning context
    const { x1, y1, x2, y2 } = generatePoints(
      difficulty,
      problemType,
      learningContext
    )

    // Calculate expected slope
    const expectedSlope = x2 === x1 ? null : (y2 - y1) / (x2 - x1)

    // Calculate expected y-intercept
    const expectedIntercept =
      expectedSlope !== null ? y1 - expectedSlope * x1 : null

    // Determine categories
    const categories: string[] = []
    if (expectedSlope === null) {
      categories.push('undefined-slope')
    } else {
      // Slope is a number (not null)
      if (expectedSlope > 0) {
        categories.push('positive-slope')
      } else if (expectedSlope < 0) {
        categories.push('negative-slope')
      } else if (expectedSlope === 0) {
        categories.push('zero-slope')
      }

      if (Number.isInteger(expectedSlope)) {
        categories.push('integer-slope')
      } else {
        categories.push('fractional-slope')
      }
    }

    if (
      Number.isInteger(x1) &&
      Number.isInteger(y1) &&
      Number.isInteger(x2) &&
      Number.isInteger(y2)
    ) {
      categories.push('integer-coordinates')
    } else {
      categories.push('fractional-coordinates')
    }

    // Create problem data
    const newProblem: Problem = {
      id: problemId,
      difficulty,
      question: `Find the slope of the line passing through (${x1}, ${y1}) and (${x2}, ${y2}).`,
      hints: [
        'Remember, slope = (y₂ - y₁) / (x₂ - x₁)',
        `For this problem: (${y2} - ${y1}) / (${x2} - ${x1})`,
      ],
      expectedSlope,
      expectedIntercept,
      startPoints: [],
      targetPoints: [
        { x: x1, y: y1 },
        { x: x2, y: y2 },
      ],
      solution: createSolutionText(x1, y1, x2, y2, expectedSlope),
      categories, // Add categories here
    }

    // Add the new problem to the problems array
    setProblems(prev => [...prev, newProblem])

    // Set it as the current problem
    setCurrentProblemId(problemId)

    // Reset states
    setIsCorrect(null)
    setShowSolution(false)

    // Add problem to history
    setProblemHistory(prevHistory => [
      ...prevHistory,
      {
        type: 'problem_generated',
        timestamp: new Date().toISOString(),
        problem: newProblem,
      },
    ])

    return newProblem
  }, [difficulty, learningContext, setProblemHistory, problems]) // Add problems to dependencies

  // Helper to create solution text
  const createSolutionText = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    slope: number | null
  ): string => {
    if (slope === null) {
      return `The slope is undefined because the x-coordinates are the same (${x1}), making this a vertical line.

For vertical lines, we write the equation as x = ${x1}.`
    }

    const rise = y2 - y1
    const run = x2 - x1

    const slopeText =
      slope === Math.round(slope)
        ? `${slope}`
        : `${rise}/${run} = ${slope.toFixed(2)}`

    let equationText = ''
    if (slope === 0) {
      equationText = `y = ${y1}`
    } else {
      const b = y1 - slope * x1
      const bText = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`
      equationText = `y = ${slopeText}x${bText}`
    }

    return `Step 1: Identify the two points: (${x1}, ${y1}) and (${x2}, ${y2})

Step 2: Calculate the slope using the formula: slope = (y₂ - y₁) / (x₂ - x₁)

Step 3: Substitute the values:
slope = (${y2} - ${y1}) / (${x2} - ${x1})
slope = ${rise} / ${run}
slope = ${slopeText}

Step 4: The equation of the line is ${equationText}`
  }

  // Check answer against expected solution
  const checkSolution = useCallback(
    (lineData: { slope: number | null; point1: any; point2: any }) => {
      if (!currentProblem || !lineData) return

      // If expected slope is null (vertical line), check if user's slope is also null/undefined
      if (currentProblem.expectedSlope === null) {
        const isAnswerCorrect = lineData.slope === null
        setIsCorrect(isAnswerCorrect)

        // Update stats
        setStats(prev => {
          // Use setStats from provider
          // Add to history, keeping only maxHistoryLength records
          const newHistory: SolutionResult[] = [
            ...prev.history,
            {
              problemId: currentProblem?.id || '',
              isCorrect: isAnswerCorrect,
              timeSpent: 0,
              difficulty: currentProblem?.difficulty || 'easy',
            },
          ]
          if (newHistory.length > maxHistoryLength) {
            newHistory.shift() // Remove oldest entry
          }

          // Update difficulty stats
          const difficultyStats = { ...prev.difficultyStats }
          const currentProblemDifficulty = currentProblem?.difficulty || 'easy'
          difficultyStats[currentProblemDifficulty].attempted += 1
          if (isAnswerCorrect) {
            difficultyStats[currentProblemDifficulty].correct += 1
          }

          const newStats = {
            attempted: prev.attempted + 1,
            correct: isAnswerCorrect ? prev.correct + 1 : prev.correct,
            incorrect: isAnswerCorrect ? prev.incorrect : prev.incorrect + 1,
            streakCount: isAnswerCorrect ? prev.streakCount + 1 : 0,
            history: newHistory,
            difficultyStats,
          }
          return newStats
        })

        // Add attempt to history
        setProblemHistory(prevHistory => [
          ...prevHistory,
          {
            type: 'problem_attempted',
            timestamp: new Date().toISOString(),
            problemId: currentProblem?.id || '',
            userAttempt: lineData, // Use userAttempt as defined in SolutionResult
            isCorrect: isAnswerCorrect,
            difficulty: currentProblem?.difficulty || 'easy',
            // Add other relevant info like categories, time spent if available
          },
        ])

        return isAnswerCorrect
      }

      // For regular slopes, check within a tolerance
      const tolerance = 0.01
      const isAnswerCorrect =
        Math.abs((lineData.slope || 0) - (currentProblem.expectedSlope || 0)) <
        tolerance
      setIsCorrect(isAnswerCorrect)

      // Update stats
      setStats(prev => {
        // Use setStats from provider
        // Add to history, keeping only maxHistoryLength records
        const newHistory: SolutionResult[] = [
          ...prev.history,
          {
            problemId: currentProblem?.id || '',
            isCorrect: isAnswerCorrect,
            timeSpent: 0,
            difficulty: currentProblem?.difficulty || 'easy',
          },
        ]
        if (newHistory.length > maxHistoryLength) {
          newHistory.shift() // Remove oldest entry
        }

        // Update difficulty stats
        const difficultyStats = { ...prev.difficultyStats }
        const currentProblemDifficulty = currentProblem?.difficulty || 'easy'
        difficultyStats[currentProblemDifficulty].attempted += 1
        if (isAnswerCorrect) {
          difficultyStats[currentProblemDifficulty].correct += 1
        }

        const newStats = {
          attempted: prev.attempted + 1,
          correct: isAnswerCorrect ? prev.correct + 1 : prev.correct,
          incorrect: isAnswerCorrect ? prev.incorrect : prev.incorrect + 1,
          streakCount: isAnswerCorrect ? prev.streakCount + 1 : 0,
          history: newHistory,
          difficultyStats,
        }
        return newStats
      })

      // Add attempt to history
      setProblemHistory(prevHistory => [
        ...prevHistory,
        {
          type: 'problem_attempted',
          timestamp: new Date().toISOString(),
          problemId: currentProblem?.id || '',
          userAttempt: lineData, // Use userAttempt as defined in SolutionResult
          isCorrect: isAnswerCorrect,
          difficulty: currentProblem?.difficulty || 'easy',
          // Add other relevant info like categories, time spent if available
        },
      ])

      return isAnswerCorrect
    },
    [currentProblem, maxHistoryLength, setStats, setProblemHistory]
  ) // Add setStats and setProblemHistory to dependencies

  // Toggle solution visibility
  const toggleSolution = useCallback(() => {
    setShowSolution(prev => !prev)
  }, [])

  // Move to the next problem
  const nextProblem = useCallback(() => {
    generateProblem()
  }, [generateProblem])

  // Reset stats
  const resetStats = useCallback(() => {
    setStats({
      correct: 0,
      incorrect: 0,
      attempted: 0,
      streakCount: 0,
      history: [],
      difficultyStats: {
        easy: { attempted: 0, correct: 0 },
        medium: { attempted: 0, correct: 0 },
        hard: { attempted: 0, correct: 0 },
      },
    })
  }, [setStats])

  // Change difficulty
  const changeDifficulty = useCallback(
    (newDifficulty: ProblemDifficulty) => {
      setDifficulty(newDifficulty)
      // Optionally generate a new problem immediately when difficulty changes
      if (newDifficulty !== difficulty) {
        setTimeout(() => generateProblem(), 0)
      }
    },
    [difficulty, generateProblem, setDifficulty]
  )

  // Effect to adapt difficulty based on performance
  // Effect to adapt difficulty based on performance
  useEffect(() => {
    const adaptDifficulty = () => {
      if (!learningContext) return

      const currentDifficultyStats =
        learningContext.stats.difficultyStats[difficulty]
      const minAttemptsForAdaptation = 3 // Minimum attempts at current difficulty before adapting

      if (currentDifficultyStats.attempted < minAttemptsForAdaptation) {
        return // Not enough attempts at this difficulty level yet
      }

      const successRate =
        currentDifficultyStats.correct / currentDifficultyStats.attempted

      // Thresholds for difficulty change
      const increaseThreshold = 0.7 // Increase difficulty if success rate > 70%
      const decreaseThreshold = 0.5 // Decrease difficulty if success rate < 50%

      if (successRate > increaseThreshold && difficulty !== 'hard') {
        // If doing well at the current difficulty, increase difficulty
        const newDifficulty = difficulty === 'easy' ? 'medium' : 'hard'
        console.log(
          `Adapting difficulty: Increasing from ${difficulty} to ${newDifficulty}`
        )
        changeDifficulty(newDifficulty)
      } else if (successRate < decreaseThreshold && difficulty !== 'easy') {
        // If struggling at the current difficulty, decrease difficulty
        const newDifficulty = difficulty === 'hard' ? 'medium' : 'easy'
        console.log(
          `Adapting difficulty: Decreasing from ${difficulty} to ${newDifficulty}`
        )
        changeDifficulty(newDifficulty)
      }
    }

    // Adapt difficulty every time the learning context stats for the current difficulty change significantly
    // or periodically based on overall attempts. Let's check every 3 attempts at the current difficulty.
    const currentDifficultyStats =
      learningContext?.stats.difficultyStats[difficulty]
    if (
      learningContext &&
      currentDifficultyStats &&
      currentDifficultyStats.attempted > 0 &&
      currentDifficultyStats.attempted % 3 === 0
    ) {
      adaptDifficulty()
    }
  }, [learningContext, difficulty, changeDifficulty]) // Dependencies include learningContext and difficulty

  // Effect to generate initial problem
  useEffect(() => {
    if (problems.length === 0) {
      generateProblem()
    } else if (!currentProblemId && problems.length > 0 && problems[0]) {
      // If problems are loaded (e.g., from predefined), set the first one as current
      setCurrentProblemId(problems[0].id)
    }
  }, [
    problems.length,
    currentProblemId,
    generateProblem,
    setCurrentProblemId,
    problems,
  ]) // Add problems and setCurrentProblemId to dependencies

  // Return values
  return {
    problems,
    currentProblemId,
    currentProblem,
    difficulty,
    isCorrect,
    showSolution,
    generateProblem,
    checkSolution,
    toggleSolution,
    nextProblem,
    resetStats,
    changeDifficulty,
  }
}
