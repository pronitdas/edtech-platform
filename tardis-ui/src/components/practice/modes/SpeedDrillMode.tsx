import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  Clock,
  Target,
  TrendingUp,
  Flame,
  Award,
  Timer,
  BarChart3,
  Gauge,
  CheckCircle,
  XCircle,
  Star,
  Trophy
} from 'lucide-react'

interface SpeedQuestion {
  id: string
  question: string
  answer: string
  options?: string[]
  type: 'quick-math' | 'vocabulary' | 'fact-recall' | 'calculation' | 'definition'
  difficulty: number // 1-5
  timeLimit: number // seconds
  points: number
}

interface SpeedDrillModeProps {
  questions: SpeedQuestion[]
  drillType: 'math' | 'vocabulary' | 'mixed' | 'custom'
  targetWPM?: number // Words/problems per minute
  duration?: number // seconds
  onComplete?: (results: SpeedDrillResults) => void
}

interface SpeedDrillResults {
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  averageResponseTime: number
  wpm: number // Words/problems per minute
  accuracy: number
  streakRecord: number
  pointsEarned: number
  speedRating: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Lightning'
}

const SpeedDrillMode: React.FC<SpeedDrillModeProps> = ({
  questions,
  drillType,
  targetWPM = 30,
  duration = 300, // 5 minutes
  onComplete
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [results, setResults] = useState<{
    correct: number
    wrong: number
    streak: number
    maxStreak: number
    responses: Array<{ correct: boolean; time: number; question: string }>
    points: number
  }>({
    correct: 0,
    wrong: 0,
    streak: 0,
    maxStreak: 0,
    responses: [],
    points: 0
  })
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [currentWPM, setCurrentWPM] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [difficulty, setDifficulty] = useState(3)

  const currentQuestion = questions[currentQuestionIndex]

  // Start session
  const startSession = () => {
    setIsActive(true)
    setSessionStartTime(new Date())
    setQuestionStartTime(new Date())
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

  // Calculate WPM
  useEffect(() => {
    if (sessionStartTime && results.responses.length > 0) {
      const timeElapsed = (Date.now() - sessionStartTime.getTime()) / 1000 / 60 // minutes
      const questionsAnswered = results.responses.length
      setCurrentWPM(Math.round(questionsAnswered / timeElapsed))
    }
  }, [results.responses, sessionStartTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSpeedRating = (wpm: number): SpeedDrillResults['speedRating'] => {
    if (wpm >= 60) return 'Lightning'
    if (wpm >= 45) return 'Expert'
    if (wpm >= 30) return 'Advanced'
    if (wpm >= 20) return 'Intermediate'
    return 'Beginner'
  }

  const getSpeedColor = (wpm: number) => {
    if (wpm >= 60) return 'text-purple-400'
    if (wpm >= 45) return 'text-yellow-400'
    if (wpm >= 30) return 'text-green-400'
    if (wpm >= 20) return 'text-blue-400'
    return 'text-gray-400'
  }

  const submitAnswer = useCallback(() => {
    if (!currentQuestion || !questionStartTime) return

    const responseTime = (Date.now() - questionStartTime.getTime()) / 1000
    const isCorrect = userAnswer.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()
    
    // Update results
    setResults(prev => {
      const newStreak = isCorrect ? prev.streak + 1 : 0
      const newPoints = isCorrect ? prev.points + currentQuestion.points + (prev.streak >= 5 ? 5 : 0) : prev.points

      return {
        correct: isCorrect ? prev.correct + 1 : prev.correct,
        wrong: isCorrect ? prev.wrong : prev.wrong + 1,
        streak: newStreak,
        maxStreak: Math.max(prev.maxStreak, newStreak),
        responses: [...prev.responses, { 
          correct: isCorrect, 
          time: responseTime, 
          question: currentQuestion.question 
        }],
        points: newPoints
      }
    })

    // Show feedback
    setShowFeedback(isCorrect ? 'correct' : 'wrong')
    
    // Move to next question after brief feedback
    setTimeout(() => {
      setShowFeedback(null)
      setUserAnswer('')
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setQuestionStartTime(new Date())
        
        // Adaptive difficulty
        if (isCorrect && results.streak >= 3) {
          setDifficulty(prev => Math.min(5, prev + 0.5))
        } else if (!isCorrect) {
          setDifficulty(prev => Math.max(1, prev - 0.5))
        }
      } else {
        completeSession()
      }
    }, 800)
  }, [userAnswer, currentQuestion, questionStartTime, currentQuestionIndex, questions.length, results.streak])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim()) {
      submitAnswer()
    }
  }

  const completeSession = () => {
    setIsActive(false)
    setSessionComplete(true)
    
    const totalTime = sessionStartTime ? (Date.now() - sessionStartTime.getTime()) / 1000 : duration
    const averageResponseTime = results.responses.length > 0 
      ? results.responses.reduce((sum, r) => sum + r.time, 0) / results.responses.length 
      : 0
    
    const wpm = (results.responses.length / (totalTime / 60))
    const accuracy = results.responses.length > 0 
      ? (results.correct / results.responses.length) * 100 
      : 0

    const sessionResults: SpeedDrillResults = {
      totalQuestions: results.responses.length,
      correctAnswers: results.correct,
      wrongAnswers: results.wrong,
      averageResponseTime,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      streakRecord: results.maxStreak,
      pointsEarned: results.points,
      speedRating: getSpeedRating(wpm)
    }

    onComplete?.(sessionResults)
  }

  // Render start screen
  if (!isActive && !sessionComplete) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="mb-6">
          <Zap className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Speed Training</h2>
          <p className="text-gray-400">Build fluency with rapid-fire practice</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-700 rounded-lg p-4">
            <Timer className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <div className="text-lg font-semibold text-white">{formatTime(duration)}</div>
            <div className="text-sm text-gray-400">Duration</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <div className="text-lg font-semibold text-white">{targetWPM} WPM</div>
            <div className="text-sm text-gray-400">Target Speed</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <BarChart3 className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <div className="text-lg font-semibold text-white">{questions.length}</div>
            <div className="text-sm text-gray-400">Questions</div>
          </div>
        </div>

        <button
          onClick={startSession}
          className="px-8 py-4 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-bold text-lg"
        >
          <Zap className="h-5 w-5 inline mr-2" />
          Start Speed Drill
        </button>
      </div>
    )
  }

  // Render completion screen
  if (sessionComplete) {
    const finalWPM = results.responses.length > 0 ? Math.round((results.responses.length / (duration / 60))) : 0
    const accuracy = results.responses.length > 0 ? (results.correct / results.responses.length) * 100 : 0

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-lg p-8 text-center"
      >
        <div className="mb-6">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-3xl font-bold text-white mb-2">Speed Drill Complete!</h2>
          <p className="text-gray-400">Lightning fast learning in action</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className={`text-2xl font-bold ${getSpeedColor(finalWPM)}`}>{finalWPM}</div>
            <div className="text-sm text-gray-400">WPM</div>
            <div className="text-xs text-gray-500">{getSpeedRating(finalWPM)}</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{Math.round(accuracy)}%</div>
            <div className="text-sm text-gray-400">Accuracy</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-400">{results.maxStreak}</div>
            <div className="text-sm text-gray-400">Best Streak</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{results.points}</div>
            <div className="text-sm text-gray-400">Points</div>
          </div>
        </div>

        {finalWPM >= targetWPM && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
            <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <h3 className="text-yellow-400 font-semibold">🎯 Target Achieved!</h3>
            <p className="text-yellow-300 text-sm">You reached your speed target of {targetWPM} WPM!</p>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-bold"
        >
          <Zap className="h-4 w-4 inline mr-2" />
          Start New Drill
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-400" />
            Speed Training
          </h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(timeRemaining)}
            </div>
            <div className="flex items-center text-yellow-400">
              <Gauge className="h-4 w-4 mr-1" />
              {currentWPM} WPM
            </div>
            {results.streak >= 5 && (
              <div className="flex items-center text-orange-400">
                <Flame className="h-4 w-4 mr-1" />
                {results.streak} streak!
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <motion.div
            className="bg-yellow-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>Target: {targetWPM} WPM</span>
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion?.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-2">{currentQuestion?.type?.toUpperCase()}</div>
              <h3 className="text-2xl font-medium text-white leading-relaxed">
                {currentQuestion?.question}
              </h3>
            </div>

            {/* Answer input */}
            <div className="mb-6">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                className="w-full max-w-md mx-auto px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-lg focus:border-yellow-500 focus:outline-none"
                autoFocus
                disabled={showFeedback !== null}
              />
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`text-4xl mb-4 ${showFeedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}
                >
                  {showFeedback === 'correct' ? (
                    <CheckCircle className="h-12 w-12 mx-auto" />
                  ) : (
                    <XCircle className="h-12 w-12 mx-auto" />
                  )}
                  <div className="text-lg mt-2">
                    {showFeedback === 'correct' ? 'Correct!' : `Correct answer: ${currentQuestion?.answer}`}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            {!showFeedback && (
              <button
                onClick={submitAnswer}
                disabled={!userAnswer.trim()}
                className="px-8 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 disabled:bg-gray-600 disabled:text-gray-400 transition-colors font-bold"
              >
                Submit
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-lg font-semibold text-green-400">{results.correct}</div>
          <div className="text-sm text-gray-400">Correct</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-lg font-semibold text-red-400">{results.wrong}</div>
          <div className="text-sm text-gray-400">Wrong</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-lg font-semibold text-orange-400">{results.streak}</div>
          <div className="text-sm text-gray-400">Streak</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-lg font-semibold text-purple-400">{results.points}</div>
          <div className="text-sm text-gray-400">Points</div>
        </div>
      </div>
    </div>
  )
}

export default SpeedDrillMode
