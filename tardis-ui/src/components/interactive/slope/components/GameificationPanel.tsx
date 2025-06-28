import React, { useState, useEffect } from 'react'
import { Trophy, Star, Zap, Target, Award, Flame, Crown } from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  progress: number
  maxProgress: number
  unlocked: boolean
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  xp: number
}

interface GameificationPanelProps {
  userProgress: {
    correct: number
    incorrect: number
    difficulty: 'easy' | 'medium' | 'hard'
    streakCount: number
  }
  cognitiveState: {
    loadLevel: 'low' | 'medium' | 'high'
    errorCount: number
    hesitationSeconds: number
    idleTimeSeconds: number
  }
  onAchievementUnlocked: (achievement: Achievement) => void
}

const GameificationPanel: React.FC<GameificationPanelProps> = ({
  userProgress,
  cognitiveState,
  onAchievementUnlocked,
}) => {
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_problem',
      title: 'Getting Started',
      description: 'Solve your first slope problem',
      icon: '🎯',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rarity: 'common',
      xp: 10,
    },
    {
      id: 'streak_master',
      title: 'Streak Master',
      description: 'Get 5 problems correct in a row',
      icon: '🔥',
      progress: 0,
      maxProgress: 5,
      unlocked: false,
      rarity: 'rare',
      xp: 50,
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Solve a problem in under 30 seconds',
      icon: '⚡',
      progress: 0,
      maxProgress: 1,
      unlocked: false,
      rarity: 'epic',
      xp: 75,
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'Complete 10 problems without any errors',
      icon: '💎',
      progress: 0,
      maxProgress: 10,
      unlocked: false,
      rarity: 'legendary',
      xp: 150,
    },
    {
      id: 'persistent_learner',
      title: 'Persistent Learner',
      description: 'Practice for 30 minutes straight',
      icon: '🧠',
      progress: 0,
      maxProgress: 1800, // 30 minutes in seconds
      unlocked: false,
      rarity: 'rare',
      xp: 100,
    },
  ])
  
  const [streak, setStreak] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)

  // Calculate XP and level from progress
  useEffect(() => {
    const totalProblems = userProgress.correct + userProgress.incorrect
    const baseXP = userProgress.correct * 10 + userProgress.streakCount * 5
    const difficultyBonus = {
      easy: 1,
      medium: 1.5,
      hard: 2,
    }[userProgress.difficulty]
    
    const calculatedXP = Math.floor(baseXP * difficultyBonus)
    setXp(calculatedXP)
    setLevel(Math.floor(calculatedXP / 100) + 1)
  }, [userProgress])

  // Track session time
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Update achievements based on progress
  useEffect(() => {
    setAchievements(prev => prev.map(achievement => {
      let newProgress = achievement.progress
      let unlocked = achievement.unlocked

      switch (achievement.id) {
        case 'first_problem':
          newProgress = userProgress.correct > 0 ? 1 : 0
          break
        case 'streak_master':
          newProgress = Math.min(userProgress.streakCount, achievement.maxProgress)
          break
        case 'speed_demon':
          // This would be triggered from parent component when a fast solve occurs
          break
        case 'perfectionist':
          newProgress = cognitiveState.errorCount === 0 ? userProgress.correct : 0
          break
        case 'persistent_learner':
          newProgress = Math.min(sessionTime, achievement.maxProgress)
          break
      }

      if (newProgress >= achievement.maxProgress && !unlocked) {
        unlocked = true
        onAchievementUnlocked({ ...achievement, unlocked: true, progress: newProgress })
      }

      return { ...achievement, progress: newProgress, unlocked }
    }))
  }, [userProgress, cognitiveState, sessionTime, onAchievementUnlocked])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600'
      case 'rare': return 'from-blue-500 to-blue-600'
      case 'epic': return 'from-purple-500 to-purple-600'
      case 'legendary': return 'from-yellow-500 to-orange-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const xpToNextLevel = (level * 100) - xp
  const xpProgress = (xp % 100) / 100

  return (
    <div className="space-y-6">
      {/* Player Status */}
      <div className="p-4 rounded-xl backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-400/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Level {level}</h3>
              <p className="text-gray-300 text-sm">{xp} XP</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-cyan-400 text-sm font-medium">Next Level</div>
            <div className="text-white text-sm">{xpToNextLevel} XP</div>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 transition-all duration-500 ease-out relative"
            style={{ width: `${xpProgress * 100}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
      </div>

      {/* Current Streak */}
      {userProgress.streakCount > 0 && (
        <div className="p-3 rounded-lg bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-400/30">
          <div className="flex items-center space-x-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-white font-bold">
              {userProgress.streakCount} Problem Streak! 🔥
            </span>
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="space-y-3">
        <h4 className="text-white font-bold flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span>Achievements</span>
        </h4>
        
        {achievements.map(achievement => {
          const progressPercent = (achievement.progress / achievement.maxProgress) * 100
          
          return (
            <div 
              key={achievement.id}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                achievement.unlocked 
                  ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} border-white/30 shadow-lg` 
                  : 'bg-white/5 border-white/10 opacity-75'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`text-2xl ${achievement.unlocked ? 'animate-bounce' : 'grayscale'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="text-white font-medium text-sm">{achievement.title}</h5>
                    {achievement.unlocked && <Award className="w-4 h-4 text-yellow-400" />}
                  </div>
                  <p className="text-gray-300 text-xs">{achievement.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mt-2 w-full bg-black/30 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        achievement.unlocked 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400' 
                          : 'bg-gradient-to-r from-gray-600 to-gray-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                    <span className="text-xs text-cyan-400">+{achievement.xp} XP</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">Accuracy</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {userProgress.correct + userProgress.incorrect > 0 
              ? Math.round((userProgress.correct / (userProgress.correct + userProgress.incorrect)) * 100)
              : 0}%
          </div>
        </div>
        
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">Session</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {Math.floor(sessionTime / 60)}m {sessionTime % 60}s
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameificationPanel