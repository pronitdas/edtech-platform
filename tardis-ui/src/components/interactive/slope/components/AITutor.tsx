import React, { useState, useEffect, useCallback } from 'react'
import { Brain, Lightbulb, Target, TrendingUp, Zap, MessageCircle } from 'lucide-react'

interface AITutorProps {
  cognitiveState: {
    loadLevel: 'low' | 'medium' | 'high'
    errorCount: number
    hesitationSeconds: number
    idleTimeSeconds: number
  }
  currentProblem?: any
  userProgress: {
    correct: number
    incorrect: number
    difficulty: 'easy' | 'medium' | 'hard'
  }
  onHint: (hint: string) => void
  onDifficultyAdjust: (newDifficulty: 'easy' | 'medium' | 'hard') => void
  onGenerateExplanation: (concept: string) => void
}

interface AIInsight {
  id: string
  type: 'hint' | 'encouragement' | 'difficulty_adjust' | 'concept_explanation'
  message: string
  action?: () => void
  priority: 'low' | 'medium' | 'high'
  timestamp: number
}

const AITutor: React.FC<AITutorProps> = ({
  cognitiveState,
  currentProblem,
  userProgress,
  onHint,
  onDifficultyAdjust,
  onGenerateExplanation,
}) => {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null)

  // AI decision-making algorithm
  const generateInsights = useCallback(() => {
    const newInsights: AIInsight[] = []
    const now = Date.now()

    // Analyze cognitive load
    if (cognitiveState.loadLevel === 'high') {
      newInsights.push({
        id: `cognitive-${now}`,
        type: 'encouragement',
        message: "I notice you're working hard! Let me suggest a simpler approach to this problem.",
        action: () => onDifficultyAdjust('easy'),
        priority: 'high',
        timestamp: now,
      })
    }

    // Error pattern analysis
    if (cognitiveState.errorCount > 3) {
      newInsights.push({
        id: `error-${now}`,
        type: 'concept_explanation',
        message: "I see you're struggling with this concept. Would you like me to break down the fundamentals?",
        action: () => onGenerateExplanation('slope-basics'),
        priority: 'high',
        timestamp: now,
      })
    }

    // Hesitation detection
    if (cognitiveState.hesitationSeconds > 60) {
      newInsights.push({
        id: `hesitation-${now}`,
        type: 'hint',
        message: "Stuck? Remember: slope = rise/run. Try finding the vertical and horizontal distances between your points.",
        action: () => onHint("Look for the change in y-values divided by the change in x-values"),
        priority: 'medium',
        timestamp: now,
      })
    }

    // Success pattern recognition
    if (userProgress.correct > userProgress.incorrect && userProgress.difficulty === 'easy') {
      newInsights.push({
        id: `progress-${now}`,
        type: 'difficulty_adjust',
        message: "Excellent work! You're mastering this level. Ready for a greater challenge?",
        action: () => onDifficultyAdjust('medium'),
        priority: 'medium',
        timestamp: now,
      })
    }

    // Engagement maintenance
    if (cognitiveState.idleTimeSeconds > 120) {
      newInsights.push({
        id: `engagement-${now}`,
        type: 'encouragement',
        message: "Take your time! Learning happens at your own pace. Would you like a different type of problem?",
        priority: 'low',
        timestamp: now,
      })
    }

    return newInsights
  }, [cognitiveState, userProgress, onHint, onDifficultyAdjust, onGenerateExplanation])

  // Update insights periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsThinking(true)
      setTimeout(() => {
        const newInsights = generateInsights()
        setInsights(prev => {
          // Keep only recent insights and add new ones
          const recent = prev.filter(insight => Date.now() - insight.timestamp < 300000) // 5 minutes
          return [...recent, ...newInsights]
        })
        setIsThinking(false)
      }, 1000) // Simulate AI thinking time
    }, 15000) // Check every 15 seconds

    return () => clearInterval(interval)
  }, [generateInsights])

  // Select most relevant insight
  useEffect(() => {
    if (insights.length > 0) {
      const sortedInsights = [...insights].sort((a, b) => {
        const priorityWeights = { high: 3, medium: 2, low: 1 }
        return priorityWeights[b.priority] - priorityWeights[a.priority]
      })
      setCurrentInsight(sortedInsights[0])
    }
  }, [insights])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'hint': return <Lightbulb className="w-5 h-5 text-yellow-400" />
      case 'encouragement': return <TrendingUp className="w-5 h-5 text-green-400" />
      case 'difficulty_adjust': return <Target className="w-5 h-5 text-blue-400" />
      case 'concept_explanation': return <Brain className="w-5 h-5 text-purple-400" />
      default: return <MessageCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-400/50 bg-red-500/10'
      case 'medium': return 'border-yellow-400/50 bg-yellow-500/10'
      case 'low': return 'border-blue-400/50 bg-blue-500/10'
      default: return 'border-gray-400/50 bg-gray-500/10'
    }
  }

  if (!currentInsight && !isThinking) {
    return (
      <div className="p-4 rounded-xl backdrop-blur-xl bg-black/20 border border-white/10">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Brain className="w-5 h-5" />
          <span className="text-sm font-medium">AI Tutor Monitoring</span>
        </div>
        <p className="text-gray-300 text-sm mt-2">Analyzing your learning patterns...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* AI Status */}
      <div className="flex items-center space-x-2 text-cyan-400">
        <Brain className="w-6 h-6" />
        <span className="font-bold">🤖 AI Learning Assistant</span>
        {isThinking && <Zap className="w-4 h-4 animate-pulse text-yellow-400" />}
      </div>

      {/* Current Insight */}
      {currentInsight && (
        <div className={`p-4 rounded-xl backdrop-blur-xl border ${getPriorityStyle(currentInsight.priority)} relative overflow-hidden`}>
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 animate-pulse" />
          
          <div className="relative z-10">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getInsightIcon(currentInsight.type)}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium mb-3">
                  {currentInsight.message}
                </p>
                
                {currentInsight.action && (
                  <button
                    onClick={() => {
                      currentInsight.action?.()
                      setInsights(prev => prev.filter(i => i.id !== currentInsight.id))
                      setCurrentInsight(null)
                    }}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium text-sm hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105"
                  >
                    Accept Suggestion
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setInsights(prev => prev.filter(i => i.id !== currentInsight.id))
                    setCurrentInsight(null)
                  }}
                  className="ml-2 px-3 py-2 rounded-lg bg-white/10 text-gray-300 text-sm hover:bg-white/20 transition-all duration-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learning Analytics Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-green-400 text-sm font-medium">Success Rate</div>
          <div className="text-2xl font-bold text-white">
            {userProgress.correct + userProgress.incorrect > 0 
              ? Math.round((userProgress.correct / (userProgress.correct + userProgress.incorrect)) * 100)
              : 0}%
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="text-blue-400 text-sm font-medium">AI Confidence</div>
          <div className="text-2xl font-bold text-white">
            {cognitiveState.loadLevel === 'low' ? '95%' :
             cognitiveState.loadLevel === 'medium' ? '75%' : '45%'}
          </div>
        </div>
      </div>

      {/* AI Thinking Indicator */}
      {isThinking && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-400/30">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse animation-delay-200" />
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-400" />
            <span className="text-purple-300 text-sm ml-2">AI analyzing your learning patterns...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AITutor