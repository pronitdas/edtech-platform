import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Star,
  Flame,
  Award,
  Target,
  Zap,
  Crown,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Brain,
  BookOpen,
  CheckCircle,
  Lock,
  Gift,
  Gem
} from 'lucide-react'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  points: number
  progress: number
  total: number
  unlocked: boolean
  unlockedAt?: Date
  category: 'streak' | 'score' | 'time' | 'practice' | 'special'
}

interface Badge {
  id: string
  name: string
  icon: React.ElementType
  color: string
  requirement: string
  earned: boolean
  earnedAt?: Date
}

interface Level {
  level: number
  title: string
  xp: number
  xpRequired: number
  perks: string[]
  color: string
}

interface Reward {
  id: string
  type: 'xp' | 'badge' | 'achievement' | 'title' | 'unlock'
  title: string
  description: string
  value: number
  icon: React.ElementType
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface GamificationSystemProps {
  userLevel: Level
  achievements: Achievement[]
  badges: Badge[]
  totalXP: number
  currentStreak: number
  longestStreak: number
  practiceTime: number
  onClaimReward?: (reward: Reward) => void
  showNotifications?: boolean
}

const GamificationSystem: React.FC<GamificationSystemProps> = ({
  userLevel,
  achievements,
  badges,
  totalXP,
  currentStreak,
  longestStreak,
  practiceTime,
  onClaimReward,
  showNotifications = true
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements' | 'badges' | 'leaderboard'>('overview')
  const [newUnlocks, setNewUnlocks] = useState<(Achievement | Badge)[]>([])
  const [showLevelUp, setShowLevelUp] = useState(false)

  // Sample achievements
  const sampleAchievements: Achievement[] = [
    {
      id: 'first_session',
      title: 'Getting Started',
      description: 'Complete your first practice session',
      icon: Star,
      color: 'yellow',
      rarity: 'common',
      points: 10,
      progress: 1,
      total: 1,
      unlocked: true,
      unlockedAt: new Date(),
      category: 'practice'
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day practice streak',
      icon: Flame,
      color: 'orange',
      rarity: 'rare',
      points: 50,
      progress: Math.min(currentStreak, 7),
      total: 7,
      unlocked: currentStreak >= 7,
      unlockedAt: currentStreak >= 7 ? new Date() : undefined,
      category: 'streak'
    },
    {
      id: 'perfect_score',
      title: 'Perfectionist',
      description: 'Achieve 100% score in a practice session',
      icon: Trophy,
      color: 'gold',
      rarity: 'epic',
      points: 100,
      progress: 0,
      total: 1,
      unlocked: false,
      category: 'score'
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Complete 50 questions in under 5 minutes',
      icon: Zap,
      color: 'purple',
      rarity: 'legendary',
      points: 200,
      progress: 0,
      total: 50,
      unlocked: false,
      category: 'special'
    }
  ]

  // Sample badges
  const sampleBadges: Badge[] = [
    {
      id: 'early_bird',
      name: 'Early Bird',
      icon: Crown,
      color: 'blue',
      requirement: 'Practice before 8 AM',
      earned: false
    },
    {
      id: 'night_owl',
      name: 'Night Owl',
      icon: Shield,
      color: 'purple',
      requirement: 'Practice after 10 PM',
      earned: false
    },
    {
      id: 'consistent',
      name: 'Consistency King',
      icon: Calendar,
      color: 'green',
      requirement: '30-day practice streak',
      earned: currentStreak >= 30
    }
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-500/10'
      case 'rare': return 'border-blue-400 bg-blue-500/10'
      case 'epic': return 'border-purple-400 bg-purple-500/10'
      case 'legendary': return 'border-yellow-400 bg-yellow-500/10'
      default: return 'border-gray-400 bg-gray-500/10'
    }
  }

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      yellow: 'text-yellow-400 bg-yellow-500/20',
      orange: 'text-orange-400 bg-orange-500/20',
      gold: 'text-yellow-300 bg-yellow-500/30',
      purple: 'text-purple-400 bg-purple-500/20',
      blue: 'text-blue-400 bg-blue-500/20',
      green: 'text-green-400 bg-green-500/20',
      red: 'text-red-400 bg-red-500/20'
    }
    return colorMap[color] || 'text-gray-400 bg-gray-500/20'
  }

  // Calculate next level XP
  const nextLevelXP = userLevel.xpRequired
  const currentLevelProgress = (userLevel.xp / nextLevelXP) * 100

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Level Progress */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(userLevel.color)}`}>
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Level {userLevel.level}</h3>
              <p className="text-gray-400">{userLevel.title}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{totalXP.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total XP</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${currentLevelProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>{userLevel.xp} XP</span>
            <span>{nextLevelXP - userLevel.xp} XP to next level</span>
          </div>
        </div>

        {/* Level Perks */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Level Perks:</h4>
          <div className="flex flex-wrap gap-2">
            {userLevel.perks.map((perk, index) => (
              <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                {perk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <Flame className="h-8 w-8 text-orange-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{currentStreak}</div>
          <div className="text-sm text-gray-400">Current Streak</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{longestStreak}</div>
          <div className="text-sm text-gray-400">Best Streak</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <Clock className="h-8 w-8 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{Math.round(practiceTime / 3600)}h</div>
          <div className="text-sm text-gray-400">Practice Time</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
          <Award className="h-8 w-8 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{achievements.filter(a => a.unlocked).length}</div>
          <div className="text-sm text-gray-400">Achievements</div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Achievements</h3>
        <div className="space-y-3">
          {sampleAchievements.filter(a => a.unlocked).slice(0, 3).map((achievement) => {
            const Icon = achievement.icon
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${getRarityColor(achievement.rarity)}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(achievement.color)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{achievement.title}</h4>
                  <p className="text-sm text-gray-400">{achievement.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-yellow-400">+{achievement.points} XP</div>
                  <div className="text-xs text-gray-500">{achievement.rarity}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sampleAchievements.map((achievement) => {
          const Icon = achievement.icon
          const progressPercent = (achievement.progress / achievement.total) * 100
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg border transition-all ${
                achievement.unlocked 
                  ? getRarityColor(achievement.rarity)
                  : 'border-gray-600 bg-gray-700/50 opacity-75'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  achievement.unlocked 
                    ? getColorClasses(achievement.color)
                    : 'bg-gray-600 text-gray-400'
                }`}>
                  {achievement.unlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-medium ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                      {achievement.title}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <Gem className="h-3 w-3 text-yellow-400" />
                      <span className="text-sm text-yellow-400">{achievement.points}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.total}</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-r from-green-400 to-blue-400'
                            : 'bg-gray-500'
                        }`}
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      achievement.rarity === 'common' ? 'bg-gray-500/20 text-gray-400' :
                      achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                      achievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {achievement.rarity.toUpperCase()}
                    </span>
                    
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="text-xs text-green-400">
                        ✓ Unlocked {achievement.unlockedAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  const renderBadges = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sampleBadges.map((badge) => {
          const Icon = badge.icon
          
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              className={`p-4 rounded-lg border text-center transition-all ${
                badge.earned 
                  ? 'border-blue-400 bg-blue-500/10'
                  : 'border-gray-600 bg-gray-700/50'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                badge.earned 
                  ? getColorClasses(badge.color)
                  : 'bg-gray-600 text-gray-400'
              }`}>
                {badge.earned ? <Icon className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
              </div>
              
              <h4 className={`font-medium mb-1 ${badge.earned ? 'text-white' : 'text-gray-400'}`}>
                {badge.name}
              </h4>
              
              <p className="text-xs text-gray-400 mb-2">{badge.requirement}</p>
              
              {badge.earned && badge.earnedAt && (
                <span className="text-xs text-green-400">
                  Earned {badge.earnedAt.toLocaleDateString()}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Trophy className="h-6 w-6 mr-2 text-yellow-400" />
          Achievements & Progress
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'badges', label: 'Badges', icon: Award },
            { id: 'leaderboard', label: 'Leaderboard', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-yellow-500 text-yellow-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'achievements' && renderAchievements()}
        {selectedTab === 'badges' && renderBadges()}
        {selectedTab === 'leaderboard' && (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Leaderboard Coming Soon</h3>
            <p className="text-gray-400">Compete with other learners and climb the ranks!</p>
          </div>
        )}
      </div>

      {/* Level Up Animation */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowLevelUp(false)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-gray-800 rounded-lg p-8 text-center max-w-md mx-4"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-white mb-2">Level Up!</h2>
              <p className="text-gray-400 mb-4">You've reached Level {userLevel.level}!</p>
              <button
                onClick={() => setShowLevelUp(false)}
                className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GamificationSystem