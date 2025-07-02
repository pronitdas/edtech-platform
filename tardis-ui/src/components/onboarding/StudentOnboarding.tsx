import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, BookOpen, Target, Settings, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import OnboardingProgress from './OnboardingProgress'

interface StudentOnboardingData {
  email: string
  password: string
  name: string
  gradeLevel: string
  subjectsOfInterest: string[]
  learningGoals: string
  preferredDifficulty: 'easy' | 'medium' | 'hard'
}

interface StudentOnboardingProps {
  onComplete: (data: StudentOnboardingData) => void
  onBack: () => void
}

const StudentOnboarding: React.FC<StudentOnboardingProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<StudentOnboardingData>({
    email: '',
    password: '',
    name: '',
    gradeLevel: '',
    subjectsOfInterest: [],
    learningGoals: '',
    preferredDifficulty: 'medium'
  })

  const steps = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Tell us about yourself to create your account',
      icon: User
    },
    {
      id: 'academic-info',
      title: 'Academic Details',
      description: 'Help us understand your current academic level',
      icon: BookOpen
    },
    {
      id: 'interests',
      title: 'Learning Interests',
      description: 'What subjects are you most interested in learning?',
      icon: Target
    },
    {
      id: 'preferences',
      title: 'Learning Preferences',
      description: 'Customize your learning experience',
      icon: Settings
    }
  ]

  const gradeLevels = [
    'Elementary (K-5)', 'Middle School (6-8)', 'High School (9-12)',
    'College/University', 'Graduate School', 'Professional/Adult Learning'
  ]

  const subjects = [
    'Mathematics', 'Science', 'English/Literature', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art',
    'Music', 'Foreign Languages', 'Economics', 'Psychology', 'Philosophy'
  ]

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(formData)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      onBack()
    }
  }

  const updateFormData = (updates: Partial<StudentOnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const toggleSubject = (subject: string) => {
    const current = formData.subjectsOfInterest
    const updated = current.includes(subject)
      ? current.filter(s => s !== subject)
      : [...current, subject]
    updateFormData({ subjectsOfInterest: updated })
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.email && formData.password && formData.name
      case 2:
        return formData.gradeLevel
      case 3:
        return formData.subjectsOfInterest.length > 0
      case 4:
        return formData.learningGoals && formData.preferredDifficulty
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6" data-testid="student-basic-info-step">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                data-testid="student-name-input"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                data-testid="student-email-input"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  data-testid="student-password-input"
                  value={formData.password}
                  onChange={(e) => updateFormData({ password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Create a secure password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6" data-testid="student-academic-info-step">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What's your current academic level? *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gradeLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    data-testid={`grade-level-${level.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => updateFormData({ gradeLevel: level })}
                    className={`p-4 text-left border-2 rounded-xl transition-all duration-200 ${formData.gradeLevel === level
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="font-medium">{level}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6" data-testid="student-interests-step">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Which subjects interest you most? (Select all that apply) *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    data-testid={`subject-${subject.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => toggleSubject(subject)}
                    className={`p-3 text-sm text-left border-2 rounded-lg transition-all duration-200 ${formData.subjectsOfInterest.includes(subject)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {formData.subjectsOfInterest.length} subjects
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6" data-testid="student-preferences-step">
            <div>
              <label htmlFor="learningGoals" className="block text-sm font-medium text-gray-700 mb-2">
                What are your learning goals? *
              </label>
              <textarea
                id="learningGoals"
                data-testid="learning-goals-input"
                value={formData.learningGoals}
                onChange={(e) => updateFormData({ learningGoals: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Tell us what you hope to achieve with your learning..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Preferred difficulty level *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'easy', label: 'Easy', description: 'Gentle introduction to topics' },
                  { value: 'medium', label: 'Medium', description: 'Balanced challenge and support' },
                  { value: 'hard', label: 'Hard', description: 'Advanced and challenging content' }
                ].map((difficulty) => (
                  <button
                    key={difficulty.value}
                    type="button"
                    data-testid={`difficulty-${difficulty.value}`}
                    onClick={() => updateFormData({ preferredDifficulty: difficulty.value as any })}
                    className={`p-4 text-center border-2 rounded-xl transition-all duration-200 ${formData.preferredDifficulty === difficulty.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="font-medium">{difficulty.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{difficulty.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <OnboardingProgress
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
        role="student"
      />

      <div className="max-w-2xl mx-auto px-6 pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {steps[currentStep - 1]?.title}
              </h2>
              <p className="text-gray-600">
                {steps[currentStep - 1]?.description}
              </p>
            </div>

            {renderStepContent()}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                data-testid="previous-step-button"
                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {currentStep === 1 ? 'Back to Role Selection' : 'Previous'}
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                data-testid="next-step-button"
                className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === steps.length ? 'Complete Setup' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default StudentOnboarding
