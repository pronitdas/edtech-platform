import React from 'react'
import { motion } from 'framer-motion'
import { Check, User, BookOpen, Target, Settings } from 'lucide-react'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
}

interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  steps: OnboardingStep[]
  role: 'student' | 'teacher'
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  steps,
  role
}) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100

  const roleColors = {
    student: {
      primary: 'from-blue-500 to-purple-600',
      secondary: 'bg-blue-100',
      accent: 'text-blue-600',
      border: 'border-blue-200'
    },
    teacher: {
      primary: 'from-green-500 to-teal-600',
      secondary: 'bg-green-100',
      accent: 'text-green-600',
      border: 'border-green-200'
    }
  }

  const colors = roleColors[role]

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8" data-testid="onboarding-progress">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {role === 'student' ? 'Student' : 'Teacher'} Onboarding
        </h2>
        <p className="text-gray-600">
          Step {currentStep} of {totalSteps} - Let's get you set up!
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${colors.primary} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            data-testid="progress-bar-fill"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gray-200 -z-10"></div>
        <motion.div
          className={`absolute left-8 top-8 w-0.5 bg-gradient-to-b ${colors.primary} -z-10`}
          initial={{ height: 0 }}
          animate={{ 
            height: `${(currentStep - 1) / (totalSteps - 1) * 100}%` 
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        <div className="space-y-8">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep
            const isUpcoming = stepNumber > currentStep
            const IconComponent = step.icon

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start"
                data-testid={`step-${stepNumber}`}
              >
                {/* Step Icon */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`
                      flex h-16 w-16 items-center justify-center rounded-full border-4 transition-all duration-300
                      ${isCompleted 
                        ? `bg-gradient-to-r ${colors.primary} border-transparent shadow-lg` 
                        : isCurrent
                        ? `${colors.secondary} ${colors.border} shadow-md`
                        : 'bg-gray-100 border-gray-200'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-8 w-8 text-white" />
                    ) : (
                      <IconComponent 
                        className={`h-8 w-8 ${
                          isCurrent ? colors.accent : 'text-gray-400'
                        }`} 
                      />
                    )}
                  </div>
                  
                  {/* Step Number Badge */}
                  <div
                    className={`
                      absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                      ${isCompleted 
                        ? `bg-gradient-to-r ${colors.primary} text-white` 
                        : isCurrent
                        ? `${colors.secondary} ${colors.accent} border-2 ${colors.border}`
                        : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {stepNumber}
                  </div>
                </div>

                {/* Step Content */}
                <div className="ml-6 flex-1 min-w-0">
                  <div
                    className={`
                      rounded-xl p-6 transition-all duration-300
                      ${isCurrent 
                        ? `${colors.secondary} ${colors.border} border-2 shadow-md` 
                        : isCompleted
                        ? 'bg-gray-50 border border-gray-200'
                        : 'bg-white border border-gray-100'
                      }
                    `}
                  >
                    <h3
                      className={`
                        text-lg font-semibold mb-2
                        ${isCurrent ? colors.accent : isCompleted ? 'text-gray-700' : 'text-gray-500'}
                      `}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={`
                        text-sm leading-relaxed
                        ${isCurrent ? 'text-gray-700' : isCompleted ? 'text-gray-600' : 'text-gray-400'}
                      `}
                    >
                      {step.description}
                    </p>
                    
                    {/* Status Indicator */}
                    <div className="mt-3 flex items-center">
                      <div
                        className={`
                          h-2 w-2 rounded-full mr-2
                          ${isCompleted 
                            ? `bg-gradient-to-r ${colors.primary}` 
                            : isCurrent
                            ? colors.accent.replace('text-', 'bg-')
                            : 'bg-gray-300'
                          }
                        `}
                      />
                      <span
                        className={`
                          text-xs font-medium
                          ${isCompleted 
                            ? colors.accent 
                            : isCurrent
                            ? colors.accent
                            : 'text-gray-400'
                          }
                        `}
                      >
                        {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default OnboardingProgress
