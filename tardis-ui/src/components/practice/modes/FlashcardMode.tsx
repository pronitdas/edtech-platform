import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Eye,
  Brain,
  Clock,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  Shuffle
} from 'lucide-react'
import { useVoiceIntegration } from '@/hooks/useVoiceIntegration'
import VoiceControlBar from '../VoiceControlBar'

interface Flashcard {
  id: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  lastReviewed?: Date
  reviewCount: number
  successRate: number
  nextReviewDate?: Date
  spaceRepetitionLevel: number // 0-5, higher = longer intervals
}

interface FlashcardModeProps {
  flashcards: Flashcard[]
  onComplete?: (results: FlashcardSessionResults) => void
  onProgress?: (progress: any) => void
  sessionDuration?: number // minutes
}

interface FlashcardSessionResults {
  cardsReviewed: number
  correct: number
  incorrect: number
  timeSpent: number
  averageResponseTime: number
  improvementAreas: string[]
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({
  flashcards,
  onComplete,
  onProgress,
  sessionDuration = 15
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([])
  const [results, setResults] = useState<Record<string, 'correct' | 'incorrect' | null>>({})
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [cardStartTime, setCardStartTime] = useState<Date>(new Date())
  const [sessionComplete, setSessionComplete] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration * 60)
  const [isActive, setIsActive] = useState(true)

  // Initialize session
  useEffect(() => {
    // Sort flashcards by spaced repetition algorithm
    const sortedCards = [...flashcards].sort((a, b) => {
      // Prioritize cards due for review
      const aOverdue = a.nextReviewDate ? new Date(a.nextReviewDate) <= new Date() : true
      const bOverdue = b.nextReviewDate ? new Date(b.nextReviewDate) <= new Date() : true
      
      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1
      
      // Then by success rate (lower first)
      return a.successRate - b.successRate
    })
    
    setSessionCards(sortedCards.slice(0, Math.min(20, sortedCards.length))) // Max 20 cards per session
    setStartTime(new Date())
    setCardStartTime(new Date())
  }, [flashcards])

  // Timer
  useEffect(() => {
    if (!isActive) return

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
  }, [isActive])

  const currentCard = sessionCards[currentCardIndex]

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'hard': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
    if (!isFlipped) {
      setShowAnswer(true)
    }
  }

  const markCard = (correct: boolean) => {
    const responseTime = Date.now() - cardStartTime.getTime()
    const cardId = currentCard.id
    
    setResults(prev => ({
      ...prev,
      [cardId]: correct ? 'correct' : 'incorrect'
    }))

    // Move to next card
    if (currentCardIndex < sessionCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setIsFlipped(false)
      setShowAnswer(false)
      setCardStartTime(new Date())
    } else {
      completeSession()
    }
  }

  const skipCard = () => {
    if (currentCardIndex < sessionCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setIsFlipped(false)
      setShowAnswer(false)
      setCardStartTime(new Date())
    } else {
      completeSession()
    }
  }

  const shuffleCards = () => {
    const remaining = sessionCards.slice(currentCardIndex)
    const shuffled = remaining.sort(() => Math.random() - 0.5)
    setSessionCards([...sessionCards.slice(0, currentCardIndex), ...shuffled])
  }

  const completeSession = () => {
    setIsActive(false)
    setSessionComplete(true)
    
    const endTime = new Date()
    const timeSpent = (endTime.getTime() - startTime.getTime()) / 1000
    
    const correct = Object.values(results).filter(r => r === 'correct').length
    const incorrect = Object.values(results).filter(r => r === 'incorrect').length
    const cardsReviewed = correct + incorrect

    const sessionResults: FlashcardSessionResults = {
      cardsReviewed,
      correct,
      incorrect,
      timeSpent,
      averageResponseTime: timeSpent / cardsReviewed,
      improvementAreas: sessionCards
        .filter(card => results[card.id] === 'incorrect')
        .map(card => card.topic)
    }

    onComplete?.(sessionResults)
  }

  const getProgress = () => {
    const reviewed = Object.keys(results).length
    return (reviewed / sessionCards.length) * 100
  }

  if (sessionComplete) {
    const correct = Object.values(results).filter(r => r === 'correct').length
    const incorrect = Object.values(results).filter(r => r === 'incorrect').length
    const accuracy = correct + incorrect > 0 ? (correct / (correct + incorrect)) * 100 : 0

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-lg p-8 text-center"
      >
        <div className="mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
          <p className="text-gray-400">Great work on your flashcard review</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{correct + incorrect}</div>
            <div className="text-sm text-gray-400">Cards Reviewed</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{Math.round(accuracy)}%</div>
            <div className="text-sm text-gray-400">Accuracy</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{correct}</div>
            <div className="text-sm text-gray-400">Correct</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">{formatTime(Math.round((Date.now() - startTime.getTime()) / 1000))}</div>
            <div className="text-sm text-gray-400">Time Spent</div>
          </div>
        </div>

        {incorrect > 0 && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
            <h3 className="text-orange-400 font-semibold mb-2">📚 Areas to Review</h3>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(sessionCards
                .filter(card => results[card.id] === 'incorrect')
                .map(card => card.topic)
              )).map(topic => (
                <span key={topic} className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start New Session
        </button>
      </motion.div>
    )
  }

  if (!currentCard) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <div className="text-gray-400">No flashcards available</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Smart Flashcards
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-400">
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(timeRemaining)}
            </div>
            <button
              onClick={shuffleCards}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Shuffle remaining cards"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <motion.div
            className="bg-blue-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-400">
          <span>Card {currentCardIndex + 1} of {sessionCards.length}</span>
          <span>{Math.round(getProgress())}% Complete</span>
        </div>
      </div>

      {/* Flashcard */}
      <div className="relative h-80">
        <motion.div
          className="absolute inset-0 cursor-pointer"
          onClick={flipCard}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`h-full bg-gray-800 rounded-lg border-2 border-gray-700 p-8 flex flex-col justify-center items-center transition-all duration-300 ${
            isFlipped ? 'transform rotateY-180' : ''
          }`}>
            <AnimatePresence mode="wait">
              {!isFlipped ? (
                <motion.div
                  key="front"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center w-full"
                >
                  <div className="flex items-center justify-center mb-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${getDifficultyColor(currentCard.difficulty)}`}>
                      {currentCard.difficulty}
                    </span>
                  </div>
                  <h3 className="text-2xl font-medium text-white mb-4 leading-relaxed">
                    {currentCard.front}
                  </h3>
                  <div className="text-gray-400 text-sm mt-8">
                    <Eye className="h-4 w-4 inline mr-1" />
                    Click to reveal answer
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center w-full"
                >
                  <div className="text-gray-400 text-sm mb-4">{currentCard.topic}</div>
                  <h3 className="text-xl font-medium text-green-400 mb-6 leading-relaxed">
                    {currentCard.back}
                  </h3>
                  <div className="text-gray-400 text-sm">
                    How well did you know this?
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        {!showAnswer ? (
          <div className="text-center">
            <button
              onClick={flipCard}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Show Answer
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => markCard(false)}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Didn't Know
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={skipCard}
              className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Skip
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => markCard(true)}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Knew It!
            </motion.button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-lg font-semibold text-green-400">
            {Object.values(results).filter(r => r === 'correct').length}
          </div>
          <div className="text-sm text-gray-400">Correct</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-lg font-semibold text-red-400">
            {Object.values(results).filter(r => r === 'incorrect').length}
          </div>
          <div className="text-sm text-gray-400">Incorrect</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <div className="text-lg font-semibold text-blue-400">
            {sessionCards.length - currentCardIndex - 1}
          </div>
          <div className="text-sm text-gray-400">Remaining</div>
        </div>
      </div>
    </div>
  )
}

export default FlashcardMode