import React from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Target, 
  Zap, 
  Trophy, 
  BookOpen, 
  Clock, 
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Calendar,
  TrendingUp
} from 'lucide-react'

interface StudentOnboardingData {
  name: string
  gradeLevel: string
  subjectsOfInterest: string[]
  learningGoals: string
  preferredDifficulty: 'easy' | 'medium' | 'hard'
  preferredPracticeModes: string[]
  practiceGoals: string[]
  dailyPracticeTime: number
}

interface PracticeOnboardingCompleteProps {
  studentData: StudentOnboardingData
  onStartPractice: (mode: string) => void
  onGoToDashboard: () => void
}

const PracticeOnboardingComplete: React.FC<PracticeOnboardingCompleteProps> = ({
  studentData,
  onStartPractice,
  onGoToDashboard
}) => {
  const practiceModesConfig = {
    'adaptive-quiz': {
      name: 'Adaptive Quiz',
      icon: Brain,
      color: 'purple',
      description: 'Smart questions that adapt to your performance'
    },
    'flashcards': {
      name: 'Smart Flashcards',
      icon: BookOpen,
      color: 'blue',
      description: 'Spaced repetition for better memory'
    },
    'speed-drill': {
      name: 'Speed Training',
      icon: Zap,
      color: 'yellow',
      description: 'Fast-paced practice for fluency'
    },
    'deep-practice': {
      name: 'Deep Practice',
      icon: Target,
      color: 'green',
      description: 'Comprehensive problem-solving'
    },
    'challenge-mode': {
      name: 'Challenge Arena',
      icon: Trophy,
      color: 'orange',
      description: 'Gamified competitive practice'
    }
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      purple: 'bg-purple-500 hover:bg-purple-600 border-purple-300',
      blue: 'bg-blue-500 hover:bg-blue-600 border-blue-300',
      yellow: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-300 text-black',
      green: 'bg-green-500 hover:bg-green-600 border-green-300',
      orange: 'bg-orange-500 hover:bg-orange-600 border-orange-300'
    }
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-500 hover:bg-gray-600 border-gray-300'
  }

  const getRecommendedMode = () => {
    // Simple logic to recommend a practice mode based on user preferences
    if (studentData.practiceGoals.includes('Increase speed and fluency')) {
      return 'speed-drill'
    }
    if (studentData.practiceGoals.includes('Master fundamentals')) {
      return 'deep-practice'
    }
    if (studentData.practiceGoals.includes('Compete with others')) {
      return 'challenge-mode'
    }
    if (studentData.preferredDifficulty === 'easy') {
      return 'flashcards'
    }
    return 'adaptive-quiz' // Default recommendation
  }

  const recommendedMode = getRecommendedMode()
  const recommendedConfig = practiceModesConfig[recommendedMode as keyof typeof practiceModesConfig]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to your learning journey, {studentData.name}!
          </h1>
          <p className="text-gray-600 text-lg">
            Your personalized practice experience is ready
          </p>
        </motion.div>

        {/* Personalized Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
            Your Personalized Learning Plan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen className="h-5 w-5 text-blue-500 mr-2" />
                <span className="font-medium text-blue-800">Grade Level</span>
              </div>
              <p className="text-blue-700">{studentData.gradeLevel}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Target className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium text-green-800">Difficulty</span>
              </div>
              <p className="text-green-700 capitalize">{studentData.preferredDifficulty}</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="h-5 w-5 text-purple-500 mr-2" />
                <span className="font-medium text-purple-800">Daily Practice</span>
              </div>
              <p className="text-purple-700">{studentData.dailyPracticeTime} minutes</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Star className="h-5 w-5 text-orange-500 mr-2" />
                <span className="font-medium text-orange-800">Subjects</span>
              </div>
              <p className="text-orange-700">{studentData.subjectsOfInterest.length} topics</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Subjects of Interest:</h3>
              <div className="flex flex-wrap gap-2">
                {studentData.subjectsOfInterest.slice(0, 4).map((subject, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {subject}
                  </span>
                ))}
                {studentData.subjectsOfInterest.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    +{studentData.subjectsOfInterest.length - 4} more
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Practice Goals:</h3>
              <div className="flex flex-wrap gap-2">
                {studentData.practiceGoals.slice(0, 3).map((goal, index) => (
                  <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {goal}
                  </span>
                ))}
                {studentData.practiceGoals.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    +{studentData.practiceGoals.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recommended Practice Mode */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
            Recommended for You
          </h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-${recommendedConfig?.color}-500 bg-opacity-20`}>
                  {recommendedConfig && <recommendedConfig.icon className={`h-8 w-8 text-${recommendedConfig.color}-600`} />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{recommendedConfig?.name}</h3>
                  <p className="text-gray-600 text-sm">{recommendedConfig?.description}</p>
                  <p className="text-xs text-blue-600 mt-1">✨ Perfect match for your goals!</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStartPractice(recommendedMode)}
                className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${getColorClasses(recommendedConfig?.color || 'blue')}`}
              >
                Start Now
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* All Practice Modes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Practice Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentData.preferredPracticeModes.map((modeId, index) => {
              const config = practiceModesConfig[modeId as keyof typeof practiceModesConfig]
              if (!config) return null
              
              const Icon = config.icon
              const isRecommended = modeId === recommendedMode
              
              return (
                <motion.button
                  key={modeId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onStartPractice(modeId)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    isRecommended 
                      ? 'border-blue-400 bg-blue-50 shadow-md' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-lg ${isRecommended ? 'bg-blue-100' : 'bg-white'}`}>
                      <Icon className={`h-5 w-5 ${isRecommended ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>
                    <h3 className={`font-medium ${isRecommended ? 'text-blue-800' : 'text-gray-800'}`}>
                      {config.name}
                    </h3>
                    {isRecommended && (
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Recommended
                      </div>
                    )}
                  </div>
                  <p className={`text-sm ${isRecommended ? 'text-blue-700' : 'text-gray-600'}`}>
                    {config.description}
                  </p>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => onStartPractice(recommendedMode)}
            className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <Target className="h-5 w-5 mr-2" />
            Start Recommended Practice
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
          
          <button
            onClick={onGoToDashboard}
            className="flex items-center justify-center px-8 py-4 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Go to Dashboard
          </button>
        </motion.div>

        {/* Daily Schedule Suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 mb-1">🗓️ Your Daily Schedule</h3>
              <p className="text-green-700 text-sm mb-2">
                Based on your {studentData.dailyPracticeTime}-minute daily goal, here's your suggested routine:
              </p>
              <div className="space-y-1 text-sm text-green-600">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  <span>{Math.ceil(studentData.dailyPracticeTime * 0.4)}min - Main practice session ({recommendedConfig?.name})</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  <span>{Math.ceil(studentData.dailyPracticeTime * 0.3)}min - Quick review (Flashcards)</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  <span>{Math.floor(studentData.dailyPracticeTime * 0.3)}min - Challenge or fun activity</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default PracticeOnboardingComplete