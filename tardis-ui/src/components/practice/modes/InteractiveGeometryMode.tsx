import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Brain,
  TrendingUp,
  BarChart3,
  Compass,
  Calculator,
  Eye,
  EyeOff,
  RotateCcw,
  CheckCircle,
  XCircle,
  Lightbulb,
  Trophy,
  Zap,
  Clock,
  Star
} from 'lucide-react'

// Import the existing slope drawing components
import SlopeDrawing from '../../interactive/slope/SlopeDrawing'
import type { SlopeDrawingProps } from '../../interactive/slope/types'
import type { InteractiveContent } from '@/types/api'

interface GeometryProblem {
  id: string
  type: 'slope' | 'line-equation' | 'coordinate-geometry' | 'graphing'
  title: string
  description: string
  problem: string
  solution: any
  targetPoints?: { x: number; y: number }[]
  startPoints?: { x: number; y: number }[]
  hints: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  topic: 'Linear Functions' | 'Coordinate Geometry' | 'Graphing' | 'Slope'
  estimatedTime: number
  points: number
}

interface InteractiveGeometryModeProps {
  problems?: GeometryProblem[]
  onComplete?: (results: GeometrySessionResults) => void
  onProgress?: (progress: any) => void
  sessionDuration?: number
  userId?: string
  knowledgeId?: string
}

interface GeometrySessionResults {
  problemsSolved: number
  correctSolutions: number
  totalTime: number
  averageTimePerProblem: number
  accuracy: number
  topicsStudied: string[]
  pointsEarned: number
  hintsUsed: number
}

const InteractiveGeometryMode: React.FC<InteractiveGeometryModeProps> = ({
  problems = [],
  onComplete,
  onProgress,
  sessionDuration = 1800, // 30 minutes
  userId,
  knowledgeId
}) => {
  const [currentView, setCurrentView] = useState<'selection' | 'practice' | 'results'>('selection')
  const [selectedProblemType, setSelectedProblemType] = useState<string | null>(null)
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [sessionResults, setSessionResults] = useState<{
    solved: number
    correct: number
    hints: number
    points: number
    topics: Set<string>
  }>({
    solved: 0,
    correct: 0,
    hints: 0,
    points: 0,
    topics: new Set()
  })

  const mapDifficulty = (difficulty: GeometryProblem['difficulty']): 'easy' | 'medium' | 'hard' => {
    switch (difficulty) {
      case 'beginner':
        return 'easy'
      case 'intermediate':
        return 'medium'
      case 'advanced':
      default:
        return 'hard'
    }
  }

  type InteractiveProblem = NonNullable<InteractiveContent['problems']>[number]
  type InteractiveProblemSolution = NonNullable<InteractiveProblem['solution']>

  const normalizeSolution = (solution: GeometryProblem['solution']): InteractiveProblemSolution => {
    if (typeof solution === 'string') return solution
    if (
      typeof solution === 'object' &&
      solution !== null &&
      'slope' in solution &&
      'yIntercept' in solution &&
      typeof solution.slope === 'number' &&
      typeof solution.yIntercept === 'number'
    ) {
      return { slope: solution.slope, yIntercept: solution.yIntercept }
    }
    return JSON.stringify(solution)
  }

  // Sample geometry problems
  const sampleProblems: GeometryProblem[] = [
    {
      id: 'slope-1',
      type: 'slope',
      title: 'Find the Slope',
      description: 'Calculate the slope between two points',
      problem: 'Find the slope of the line passing through points (2, 3) and (6, 11)',
      solution: { slope: 2, work: '(11-3)/(6-2) = 8/4 = 2' },
      targetPoints: [{ x: 2, y: 3 }, { x: 6, y: 11 }],
      startPoints: [{ x: 2, y: 3 }, { x: 6, y: 11 }],
      hints: [
        'Use the slope formula: m = (y₂ - y₁) / (x₂ - x₁)',
        'Substitute the coordinates: (6, 11) and (2, 3)',
        'Calculate: (11 - 3) / (6 - 2) = 8 / 4 = 2'
      ],
      difficulty: 'beginner',
      topic: 'Slope',
      estimatedTime: 300,
      points: 10
    },
    {
      id: 'slope-2',
      type: 'slope',
      title: 'Interactive Slope Drawing',
      description: 'Draw a line with a specific slope',
      problem: 'Draw a line with slope = 1/2 passing through the origin',
      solution: { slope: 0.5, points: [[0, 0], [2, 1], [4, 2]] },
      hints: [
        'Slope = rise/run = 1/2 means up 1, right 2',
        'Start at origin (0, 0)',
        'For every 2 units right, go 1 unit up'
      ],
      difficulty: 'intermediate',
      topic: 'Linear Functions',
      estimatedTime: 600,
      points: 15
    },
    {
      id: 'line-eq-1',
      type: 'line-equation',
      title: 'Line Equation',
      description: 'Find the equation of a line',
      problem: 'Find the equation of the line with slope 3 passing through point (1, 5)',
      solution: { equation: 'y = 3x + 2', work: 'y - 5 = 3(x - 1) → y = 3x + 2' },
      hints: [
        'Use point-slope form: y - y₁ = m(x - x₁)',
        'Substitute m = 3, point (1, 5)',
        'Simplify to slope-intercept form'
      ],
      difficulty: 'intermediate',
      topic: 'Linear Functions',
      estimatedTime: 400,
      points: 12
    }
  ]

  const allGeometryProblems= problems.length > 0 ? problems : sampleProblems

  const problemTypes = [
    {
      id: 'slope',
      name: 'Slope Practice',
      description: 'Master slope calculations and visualizations',
      icon: TrendingUp,
      color: 'blue',
      problems: problems.filter((p) => p.type === 'slope')
    },
    {
      id: 'line-equation',
      name: 'Line Equations',
      description: 'Practice finding equations of lines',
      icon: Calculator,
      color: 'green',
      problems: problems.filter((p) => p.type === 'line-equation')
    },
    {
      id: 'coordinate-geometry',
      name: 'Coordinate Geometry',
      description: 'Explore coordinate plane concepts',
      icon: Compass,
      color: 'purple',
      problems: problems.filter((p) => p.type === 'coordinate-geometry')
    },
    {
      id: 'interactive-drawing',
      name: 'Interactive Drawing',
      description: 'Draw and analyze geometric shapes',
      icon: Target,
      color: 'orange',
      problems: problems.filter((p) => p.type === 'slope') // Use slope problems for drawing
    }
  ]

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-300',
      green: 'bg-green-500 hover:bg-green-600 text-white border-green-300',
      purple: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-300',
      orange: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-300'
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500 hover:bg-gray-600 text-white border-gray-300'
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Timer effect
  useEffect(() => {
    if (!isActive || isPaused) return

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          completeSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isPaused])
allGeometryProblems
  const startPracticeType = (typeId: string) => {
    const type = problemTypes.find(t => t.id === typeId)
    if (!type || type.problems.length === 0) return

    setSelectedProblemType(typeId)
    setCurrentProblemIndex(0)
    setSessionStartTime(new Date())
    setIsActive(true)
    setCurrentView('practice')
  }

  const handleProblemComplete = (isCorrect: boolean, hintsUsed: number = 0) => {
    const currentProblem = getCurrentProblem()
    if (!currentProblem) return

    setSessionResults(prev => ({
      solved: prev.solved + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      hints: prev.hints + hintsUsed,
      points: prev.points + (isCorrect ? currentProblem.points : 0),
      topics: new Set([...prev.topics, currentProblem.topic])
    }))
allGeometryProblems
    // Move to next problem or complete session
    const typeProblems = problemTypes.find(t => t.id === selectedProblemType)?.problems || []
    if (currentProblemIndex < typeProblems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1)
    } else {
      completeSession()
    }
  }

  const completeSession = () => {
    setIsActive(false)
    setCurrentView('results')
    
    const endTime = new Date()
    const totalTime = sessionStartTime ? (endTime.getTime() - sessionStartTime.getTime()) / 1000 : 0
    
    const results: GeometrySessionResults = {
      problemsSolved: sessionResults.solved,
      correctSolutions: sessionResults.correct,
      totalTime,
      averageTimePerProblem: sessionResults.solved > 0 ? totalTime / sessionResults.solved : 0,
      accuracy: sessionResults.solved > 0 ? (sessionResults.correct / sessionResults.solved) * 100 : 0,
      topicsStudied: Array.from(sessionResults.topics),
      pointsEarned: sessionResults.points,
      hintsUsed: sessionResults.hints
    }

    onComplete?.(results)
  }
allGeometryProblems
  const getCurrentProblem = () => {
    const typeProblems = problemTypes.find(t => t.id === selectedProblemType)?.problems || []
    return typeProblems[currentProblemIndex]
  }

  // Problem Type Selection View
  const renderTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-6xl mb-4">📐</div>
        <h2 className="text-3xl font-bold text-white mb-2">Interactive Geometry Practice</h2>
        <p className="text-gray-400">Choose your geometry focus area</p>
      </div>
allGeometryProblems
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {problemTypes.map((type) => {
          const Icon = type.icon
          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer"
              onClick={() => startPracticeType(type.id)}
            >
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`p-3 rounded-lg ${type.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                    type.color === 'green' ? 'bg-green-500/20 text-green-400' :
                    type.color === 'purple' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-orange-500/20 text-orange-400'}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{type.name}</h3>
                    <p className="text-gray-400">{type.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{type.problems.length}</div>
                    <div className="text-xs text-gray-400">Problems</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-400">
                      {type.problems.reduce((sum: number, p: { points: number }) => sum + p.points, 0)}
                    </div>
                    <div className="text-xs text-gray-400">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">
                      {Math.round(type.problems.reduce((sum: number, p: { estimatedTime: number }) => sum + p.estimatedTime, 0) / 60)}m
                    </div>
                    <div className="text-xs text-gray-400">Est. Time</div>
                  </div>
                </div>

                <button
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${getColorClasses(type.color)}`}
                >
                  Start Practice
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  // Practice View with Slope Drawing Integration
  const renderPracticeView = () => {
    const currentProblem = getCurrentProblem()
    if (!currentProblem || problems.length === 0) return null;

    const typeConfig = problemTypes.find(t => t.id === selectedProblemType);
    const isInteractiveDrawing = selectedProblemType === 'interactive-drawing';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              {typeConfig && <typeConfig.icon className="h-5 w-5 mr-2" />}
              {typeConfig?.name}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(timeRemaining)}
              </div>
              <div className="flex items-center text-yellow-400">
                <Star className="h-4 w-4 mr-1" />
                {sessionResults.points} pts
              </div>
            </div>
          </div>

          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentProblemIndex + 1) / (typeConfig?.problems.length || 1)) * 100}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>Problem {currentProblemIndex + 1} of {typeConfig?.problems.length}</span>
            <span>{currentProblem.difficulty} • {currentProblem.points} points</span>
          </div>
        </div>

        {/* Problem Content */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">{currentProblem.title}</h3>
            <p className="text-gray-300 mb-4">{currentProblem.problem}</p>
          </div>

          {/* Interactive Drawing Area */}
          {isInteractiveDrawing ? (
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
              <div className="h-96 bg-white rounded-lg">
                {/* Integrate the existing SlopeDrawing component */}
                {(() => {
                  const normalizedSolution = normalizeSolution(currentProblem.solution)
                  const interactiveContent: InteractiveContent = {
                    type: 'slope-drawing',
                    config: {
                      title: currentProblem.title,
                      content: currentProblem.problem
                    },
                    problems: [{
                      id: currentProblem.id,
                      question: currentProblem.problem,
                      difficulty: mapDifficulty(currentProblem.difficulty),
                      hints: currentProblem.hints,
                      targetPoints: currentProblem.targetPoints ?? [],
                      startPoints: currentProblem.startPoints ?? [],
                      ...(normalizedSolution !== undefined ? { solution: normalizedSolution } : {})
                    }]
                  }

                  const slopeProps: SlopeDrawingProps = {
                    interactiveContent,
                    ...(userId ? { userId } : {}),
                    ...(knowledgeId ? { knowledgeId } : {}),
                    ...(onProgress ? { onUpdateProgress: onProgress } : {})
                  }

                  return <SlopeDrawing {...slopeProps} />
                })()}
              </div>
            </div>
          ) : (
            /* Regular Problem Interface */
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Solution Area</h4>
                <textarea
                  className="w-full h-32 bg-gray-600 text-white rounded-lg p-3 border border-gray-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Show your work here..."
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                    <Lightbulb className="h-4 w-4 mr-1" />
                    Hint
                  </button>
                  <button className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Eye className="h-4 w-4 mr-1" />
                    Solution
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleProblemComplete(false)}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Skip
                  </button>
                  <button
                    onClick={() => handleProblemComplete(true)}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
            <div className="text-lg font-semibold text-green-400">{sessionResults.correct}</div>
            <div className="text-sm text-gray-400">Correct</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
            <div className="text-lg font-semibold text-blue-400">{sessionResults.solved}</div>
            <div className="text-sm text-gray-400">Attempted</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
            <div className="text-lg font-semibold text-yellow-400">{sessionResults.hints}</div>
            <div className="text-sm text-gray-400">Hints Used</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
            <div className="text-lg font-semibold text-purple-400">{sessionResults.points}</div>
            <div className="text-sm text-gray-400">Points</div>
          </div>
        </div>
      </div>
    )
  }

  // Results View
  const renderResultsView = () => {
    const accuracy = sessionResults.solved > 0 ? (sessionResults.correct / sessionResults.solved) * 100 : 0

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-lg p-8 text-center"
      >
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold text-white mb-2">Geometry Session Complete!</h2>
        <p className="text-gray-400 mb-8">Excellent work on your geometry practice</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{sessionResults.solved}</div>
            <div className="text-sm text-gray-400">Problems Solved</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{Math.round(accuracy)}%</div>
            <div className="text-sm text-gray-400">Accuracy</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{sessionResults.points}</div>
            <div className="text-sm text-gray-400">Points Earned</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{sessionResults.topics.size}</div>
            <div className="text-sm text-gray-400">Topics Studied</div>
          </div>
        </div>

        <button
          onClick={() => setCurrentView('selection')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RotateCcw className="h-4 w-4 inline mr-2" />
          Practice Again
        </button>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {currentView === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderTypeSelection()}
            </motion.div>
          )}

          {currentView === 'practice' && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderPracticeView()}
            </motion.div>
          )}

          {currentView === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderResultsView()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default InteractiveGeometryMode
