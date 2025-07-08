import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  Target,
  Clock,
  Trophy,
  Settings,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Zap,
  Users,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Star,
  ChevronRight,
  Timer,
  BarChart3,
  Lightbulb,
  RefreshCw
} from 'lucide-react'
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration'
import VoiceControlBar from './VoiceControlBar'

// Move lazy loading outside the component to prevent infinite suspension
const InteractiveGeometryMode = React.lazy(() => import('./modes/InteractiveGeometryMode'))

// Types
interface PracticeQuestion {
  id: string
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer' | 'matching' | 'ordering'
  question: string
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  hints?: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  topic: string
  subtopic?: string
  estimatedTime: number // seconds
  points: number
}

interface PracticeSession {
  id: string
  mode: PracticeMode
  questions: PracticeQuestion[]
  startTime?: Date
  endTime?: Date
  score: number
  totalQuestions: number
  timeSpent: number
  hintsUsed: number
  difficulty: string
}

interface PracticeStats {
  totalSessions: number
  totalTimeSpent: number
  averageScore: number
  strengthAreas: string[]
  weaknessAreas: string[]
  currentStreak: number
  bestStreak: number
  totalPoints: number
  level: number
  practiceHistory: PracticeSession[]
}

type PracticeMode = 
  | 'adaptive-quiz'     // AI-driven questions that adapt to performance
  | 'flashcards'        // Spaced repetition flashcard system
  | 'speed-drill'       // Fast-paced practice for fluency
  | 'interactive-geometry' // Visual slope drawing and coordinate geometry
  | 'deep-practice'     // Comprehensive problem-solving
  | 'weakness-focus'    // Targeted practice on weak areas
  | 'review-mode'       // Review previously learned content
  | 'challenge-mode'    // Gamified competitive practice
  | 'explanation-mode'  // Practice with detailed explanations

interface UnifiedPracticeModuleProps {
  topicId?: string
  knowledgeId?: string
  availableContent?: any[]
  onComplete?: (session: PracticeSession) => void
  onProgress?: (progress: any) => void
}

const UnifiedPracticeModule: React.FC<UnifiedPracticeModuleProps> = ({
  topicId,
  knowledgeId,
  availableContent = [],
  onComplete,
  onProgress
}) => {
  // State management
  const [currentView, setCurrentView] = useState<'home' | 'practice' | 'results' | 'stats'>('home')
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null)
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  
  // Voice integration
  const voice = useVoiceIntegration({
    autoRead: true,
    language: 'english',
    enableCommands: true,
    voiceRate: 0.9
  })
  const [practiceStats, setPracticeStats] = useState<PracticeStats>({
    totalSessions: 0,
    totalTimeSpent: 0,
    averageScore: 0,
    strengthAreas: [],
    weaknessAreas: [],
    currentStreak: 0,
    bestStreak: 0,
    totalPoints: 0,
    level: 1,
    practiceHistory: []
  })

  // Setup voice commands for practice
  useEffect(() => {
    voice.addCommonPracticeCommands({
      onNext: () => handleNextQuestion(),
      onPrevious: () => handlePreviousQuestion(),
      onHint: () => setShowHint(true),
      onRepeat: () => readCurrentQuestion(),
      onSubmit: () => handleSubmitAnswer(),
      onPause: () => togglePause()
    })
  }, [currentSession, currentQuestionIndex])

  // Voice functions
  const readCurrentQuestion = () => {
    if (currentSession && currentSession.questions[currentQuestionIndex]) {
      const question = currentSession.questions[currentQuestionIndex]
      voice.speak(question.question)
    }
  }

  const announceScore = (score: number, total: number) => {
    voice.speak(`You scored ${score} out of ${total} questions correct!`)
  }

  const announceHint = (hint: string) => {
    voice.speak(`Here's a hint: ${hint}`)
  }

  // Practice navigation functions
  const handleNextQuestion = () => {
    if (currentSession && currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowHint(false)
      setShowExplanation(false)
      // Auto-read next question after a brief delay
      setTimeout(() => {
        if (voice.voiceEnabled) {
          readCurrentQuestion()
        }
      }, 500)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setShowHint(false)
      setShowExplanation(false)
    }
  }

  const handleSubmitAnswer = () => {
    if (currentSession && userAnswers[currentSession.questions[currentQuestionIndex].id]) {
      const isCorrect = userAnswers[currentSession.questions[currentQuestionIndex].id] === 
                       currentSession.questions[currentQuestionIndex].correctAnswer
      
      if (isCorrect) {
        voice.speak('Correct!')
      } else {
        voice.speak('Incorrect. Let me show you the explanation.')
        setShowExplanation(true)
      }
      
      // Move to next question or finish
      setTimeout(() => {
        if (currentQuestionIndex === currentSession.questions.length - 1) {
          finishSession()
        } else {
          handleNextQuestion()
        }
      }, 2000)
    }
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    voice.speak(isPaused ? 'Resuming practice' : 'Practice paused')
  }

  const finishSession = () => {
    if (currentSession) {
      const correctAnswers = currentSession.questions.filter(q => 
        userAnswers[q.id] === q.correctAnswer
      ).length
      
      setCurrentSession(prev => ({
        ...prev!,
        score: correctAnswers,
        endTime: new Date()
      }))
      
      announceScore(correctAnswers, currentSession.questions.length)
      setCurrentView('results')
    }
  }

  // Practice modes configuration
  const practiceModesConfig = {
    'adaptive-quiz': {
      title: 'Adaptive Quiz',
      description: 'Smart questions that adapt to your performance in real-time',
      icon: Brain,
      color: 'purple',
      estimatedTime: '15-30 min',
      difficulty: 'Adaptive',
      features: ['Real-time difficulty adjustment', 'Personalized questions', 'Progress tracking']
    },
    'flashcards': {
      title: 'Smart Flashcards',
      description: 'Spaced repetition system for optimal memory retention',
      icon: BookOpen,
      color: 'blue',
      estimatedTime: '10-20 min',
      difficulty: 'All levels',
      features: ['Spaced repetition', 'Memory optimization', 'Quick reviews']
    },
    'speed-drill': {
      title: 'Speed Training',
      description: 'Fast-paced practice to build fluency and quick recall',
      icon: Zap,
      color: 'yellow',
      estimatedTime: '5-15 min',
      difficulty: 'Intermediate+',
      features: ['Timed challenges', 'Fluency building', 'Quick thinking']
    },
    'interactive-geometry': {
      title: 'Interactive Geometry',
      description: 'Visual slope drawing and coordinate geometry practice',
      icon: Target,
      color: 'cyan',
      estimatedTime: '20-40 min',
      difficulty: 'Visual Learning',
      features: ['Interactive drawing', 'Slope visualization', 'Coordinate geometry', 'Real-time feedback']
    },
    'deep-practice': {
      title: 'Deep Practice',
      description: 'Comprehensive problem-solving with detailed explanations',
      icon: Target,
      color: 'green',
      estimatedTime: '20-45 min',
      difficulty: 'Advanced',
      features: ['Step-by-step solutions', 'Detailed explanations', 'Concept mastery']
    },
    'weakness-focus': {
      title: 'Weakness Hunter',
      description: 'Targeted practice on your specific weak areas',
      icon: TrendingUp,
      color: 'red',
      estimatedTime: '15-25 min',
      difficulty: 'Personalized',
      features: ['Personalized content', 'Weakness identification', 'Focused improvement']
    },
    'review-mode': {
      title: 'Smart Review',
      description: 'Review previously learned content with intelligent scheduling',
      icon: RefreshCw,
      color: 'indigo',
      estimatedTime: '10-20 min',
      difficulty: 'Review',
      features: ['Intelligent scheduling', 'Retention optimization', 'Memory reinforcement']
    },
    'challenge-mode': {
      title: 'Challenge Arena',
      description: 'Gamified practice with achievements and leaderboards',
      icon: Trophy,
      color: 'orange',
      estimatedTime: '15-30 min',
      difficulty: 'Competitive',
      features: ['Achievements', 'Leaderboards', 'Gamification', 'Challenges']
    },
    'explanation-mode': {
      title: 'Guided Learning',
      description: 'Practice with immediate explanations and teaching moments',
      icon: Lightbulb,
      color: 'pink',
      estimatedTime: '20-40 min',
      difficulty: 'Learning',
      features: ['Immediate feedback', 'Teaching moments', 'Concept building']
    }
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: 'bg-purple-500 text-white border-purple-600 hover:bg-purple-600',
      blue: 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600',
      yellow: 'bg-yellow-500 text-black border-yellow-600 hover:bg-yellow-600',
      cyan: 'bg-cyan-500 text-white border-cyan-600 hover:bg-cyan-600',
      green: 'bg-green-500 text-white border-green-600 hover:bg-green-600',
      red: 'bg-red-500 text-white border-red-600 hover:bg-red-600',
      indigo: 'bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-600',
      orange: 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600',
      pink: 'bg-pink-500 text-white border-pink-600 hover:bg-pink-600'
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500 text-white border-gray-600 hover:bg-gray-600'
  }

  // Sample practice data (will be replaced with real data)
  const sampleQuestions: PracticeQuestion[] = [
    {
      id: '1',
      type: 'multiple-choice',
      question: 'What is the slope of a line that passes through points (2, 3) and (4, 7)?',
      options: ['2', '1', '0.5', '4'],
      correctAnswer: '2',
      explanation: 'Slope = (y2 - y1) / (x2 - x1) = (7 - 3) / (4 - 2) = 4 / 2 = 2',
      hints: ['Remember the slope formula: (y2 - y1) / (x2 - x1)', 'Substitute the given points into the formula'],
      difficulty: 'intermediate',
      topic: 'Linear Functions',
      subtopic: 'Slope Calculation',
      estimatedTime: 120,
      points: 10
    }
  ]

  // Practice mode selection view
  const renderModeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Choose Your Practice Mode</h2>
        <p className="text-gray-400">Select the practice style that matches your learning goals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {Object.entries(practiceModesConfig).map(([mode, config]) => {
          const Icon = config.icon
          return (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200 cursor-pointer"
              onClick={() => startPracticeMode(mode as PracticeMode)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getColorClasses(config.color).split(' ')[0]} bg-opacity-20`}>
                    <Icon className={`h-6 w-6 text-${config.color}-400`} />
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{config.estimatedTime}</div>
                    <div className="text-xs text-gray-500">{config.difficulty}</div>
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">{config.title}</h3>
                <p className="text-gray-400 mb-4">{config.description}</p>

                <div className="space-y-2">
                  {config.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${getColorClasses(config.color)}`}
                >
                  Start Practice
                </motion.button>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Your Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{practiceStats.level}</div>
            <div className="text-sm text-gray-400">Level</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{practiceStats.totalPoints}</div>
            <div className="text-sm text-gray-400">Points</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{practiceStats.currentStreak}</div>
            <div className="text-sm text-gray-400">Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{practiceStats.totalSessions}</div>
            <div className="text-sm text-gray-400">Sessions</div>
          </div>
        </div>
      </div>
    </div>
  )

  // Start practice mode
  const startPracticeMode = (mode: PracticeMode) => {
    setSelectedMode(mode)
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      mode,
      questions: sampleQuestions, // This will be dynamically generated
      startTime: new Date(),
      score: 0,
      totalQuestions: sampleQuestions.length,
      timeSpent: 0,
      hintsUsed: 0,
      difficulty: 'intermediate'
    }
    setCurrentSession(newSession)
    setCurrentQuestionIndex(0)
    setUserAnswers({})
    setTimeRemaining(900) // 15 minutes default
    setIsActive(true)
    setCurrentView('practice')
  }

  // Render practice interface
  const renderPracticeInterface = () => {
    if (!currentSession) return null

    // Special handling for interactive geometry mode
    if (selectedMode === 'interactive-geometry') {
      return (
        <React.Suspense fallback={<div className="text-white">Loading interactive geometry...</div>}>
          <InteractiveGeometryMode
            onComplete={(results) => {
              // Update session with geometry results
              const updatedSession = {
                ...currentSession!,
                score: results.accuracy,
                timeSpent: results.totalTime,
                endTime: new Date()
              }
              setCurrentSession(updatedSession)
              onComplete?.(updatedSession)
              setCurrentView('home')
            }}
            onProgress={onProgress}
            userId={topicId}
            knowledgeId={knowledgeId}
          />
        </React.Suspense>
      )
    }

    if (!currentSession.questions.length) return null

    const currentQuestion = currentSession.questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / currentSession.questions.length) * 100

    return (
      <div className="space-y-6">
        {/* Voice Control Bar */}
        <VoiceControlBar
          isListening={voice.isListening}
          isSpeaking={voice.isSpeaking}
          voiceEnabled={voice.voiceEnabled}
          isSupported={voice.isSupported}
          onToggleListening={voice.startListening}
          onToggleSpeaking={() => {
            if (voice.isSpeaking) {
              voice.stopSpeaking()
            } else {
              readCurrentQuestion()
            }
          }}
          onToggleVoiceEnabled={(enabled) => voice.setVoiceEnabled(!voice.voiceEnabled)}
          onShowHelp={() => {
            voice.speak('Voice commands available: Say next for next question, hint for help, repeat to read question again, submit to check answer, or pause to take a break.')
          }}
        />

        {/* Header */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-white">
                {practiceModesConfig[selectedMode!].title}
              </h2>
              <div className="flex items-center text-gray-400">
                <Timer className="h-4 w-4 mr-1" />
                <span>{Math.floor(timeRemaining! / 60)}:{(timeRemaining! % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
              </button>
              <button
                onClick={() => setCurrentView('home')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>Question {currentQuestionIndex + 1} of {currentSession.questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs ${
                currentQuestion.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                currentQuestion.difficulty === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {currentQuestion.difficulty}
              </span>
              <span className="text-sm text-gray-400">{currentQuestion.topic}</span>
            </div>
            <div className="flex items-center text-sm text-gray-400">
              <Star className="h-4 w-4 mr-1" />
              {currentQuestion.points} points
            </div>
          </div>

          <h3 className="text-lg font-medium text-white mb-6">{currentQuestion.question}</h3>

          {/* Answer options */}
          {currentQuestion.type === 'multiple-choice' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => selectAnswer(currentQuestion.id, option)}
                  className={`w-full p-4 text-left rounded-lg border transition-all ${
                    userAnswers[currentQuestion.id] === option
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      userAnswers[currentQuestion.id] === option
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400'
                    }`}>
                      {userAnswers[currentQuestion.id] === option && (
                        <div className="w-2 h-2 rounded-full bg-white m-0.5" />
                      )}
                    </div>
                    {option}
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowHint(!showHint)
                  if (!showHint && currentQuestion.hints && currentQuestion.hints.length > 0) {
                    announceHint(currentQuestion.hints[0])
                  }
                }}
                className="flex items-center px-3 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Lightbulb className="h-4 w-4 mr-1" />
                Hint
              </button>
              <button
                onClick={() => {
                  setShowExplanation(!showExplanation)
                  if (!showExplanation && currentQuestion.explanation) {
                    voice.speak(currentQuestion.explanation)
                  }
                }}
                className="flex items-center px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Explain
              </button>
            </div>
            
            <button
              onClick={submitAnswer}
              disabled={!userAnswers[currentQuestion.id]}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {currentQuestionIndex === currentSession.questions.length - 1 ? 'Finish' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>

          {/* Hints and explanations */}
          <AnimatePresence>
            {showHint && currentQuestion.hints && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
              >
                <h4 className="text-yellow-400 font-medium mb-2">💡 Hint</h4>
                {currentQuestion.hints.map((hint, index) => (
                  <p key={index} className="text-yellow-300 text-sm">{hint}</p>
                ))}
              </motion.div>
            )}

            {showExplanation && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg"
              >
                <h4 className="text-purple-400 font-medium mb-2">📚 Explanation</h4>
                <p className="text-purple-300 text-sm">{currentQuestion.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Helper functions
  const selectAnswer = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const submitAnswer = () => {
    if (currentQuestionIndex < currentSession!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
      setShowHint(false)
      setShowExplanation(false)
    } else {
      // Complete session
      completeSession()
    }
  }

  const completeSession = () => {
    setCurrentView('results')
    setIsActive(false)
  }

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive && !isPaused && timeRemaining! > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev! - 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isActive, isPaused, timeRemaining])

  // Main render
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {currentView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderModeSelection()}
            </motion.div>
          )}

          {currentView === 'practice' && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {renderPracticeInterface()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default UnifiedPracticeModule