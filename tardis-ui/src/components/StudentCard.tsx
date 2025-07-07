import React from 'react'
import { User, Target, Brain, Zap, Trophy, Clock, Star } from 'lucide-react'

// Assuming the Role interface is defined elsewhere and imported
// or defined inline if needed specifically here.
interface Role {
  name: string
  description: string
  icon: string
  practiceFeatures?: string[]
  benefits?: string[]
}

interface StudentCardProps {
  role: Role
  onClick: (roleName: string) => void
  showPracticeFeatures?: boolean
}

const StudentCard: React.FC<StudentCardProps> = ({ role, onClick, showPracticeFeatures = false }) => {
  const practiceIcons = {
    'Adaptive Quiz': Brain,
    'Smart Flashcards': Star,
    'Speed Training': Zap,
    'Challenge Arena': Trophy,
    'Progress Tracking': Target,
    'Personalized Learning': Brain
  }

  const renderIcon = () => {
    const isEmoji = /\p{Emoji}/u.test(role.icon)

    if (isEmoji) {
      return (
        <span className='text-2xl' role='img' aria-label={`${role.name} icon`}>
          {role.icon}
        </span>
      )
    } else {
      return <User className='h-6 w-6 text-indigo-300' />
    }
  }

  const getPracticeIcon = (feature: string) => {
    const IconComponent = practiceIcons[feature as keyof typeof practiceIcons] || Target
    return <IconComponent className="h-3 w-3" />
  }

  return (
    <button
      onClick={() => onClick(role.name)}
      className='flex h-full w-full flex-col justify-between rounded-lg border border-gray-600 bg-gray-700 p-4 text-left transition-colors hover:border-indigo-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500'
    >
      <div>
        <div className='mb-3 flex items-center gap-3'>
          <div className='flex items-center justify-center rounded-full bg-gray-800 p-2'>
            {renderIcon()}
          </div>
          <h5 className='text-lg font-semibold text-white'>{role.name}</h5>
        </div>
        <p className='line-clamp-3 text-sm text-gray-300 mb-3'>{role.description}</p>

        {/* Practice Features */}
        {showPracticeFeatures && role.practiceFeatures && role.practiceFeatures.length > 0 && (
          <div className="mb-3">
            <h6 className="text-xs font-medium text-indigo-400 mb-2">🎯 Practice Features:</h6>
            <div className="space-y-1">
              {role.practiceFeatures.slice(0, 3).map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs text-gray-400">
                  {getPracticeIcon(feature)}
                  <span>{feature}</span>
                </div>
              ))}
              {role.practiceFeatures.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{role.practiceFeatures.length - 3} more features
                </div>
              )}
            </div>
          </div>
        )}

        {/* Benefits */}
        {role.benefits && role.benefits.length > 0 && (
          <div className="mb-3">
            <h6 className="text-xs font-medium text-green-400 mb-2">✨ Benefits:</h6>
            <div className="space-y-1">
              {role.benefits.slice(0, 2).map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs text-gray-400">
                  <div className="w-1 h-1 rounded-full bg-green-400" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-xs text-indigo-400 mt-3 self-end flex items-center">
        <Target className="h-3 w-3 mr-1" />
        Select Role
      </div>
    </button>
  )
}

export default StudentCard
