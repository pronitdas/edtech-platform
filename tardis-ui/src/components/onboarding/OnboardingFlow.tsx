import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle } from 'lucide-react'
import RoleSelection from './RoleSelection'
import StudentOnboarding from './StudentOnboarding'
import TeacherOnboarding from './TeacherOnboarding'
import ErrorBoundary from './ErrorBoundary'
import { apiClient } from '@/services/api-client'

type OnboardingStep = 'role-selection' | 'student-onboarding' | 'teacher-onboarding' | 'completion'

interface OnboardingFlowProps {
  onComplete?: () => void
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('role-selection')
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedUser, setCompletedUser] = useState<any>(null)
  const navigate = useNavigate()

  const handleRoleSelection = (role: 'student' | 'teacher') => {
    console.log('Role selected:', role) // Debug log
    setSelectedRole(role)
    setCurrentStep(role === 'student' ? 'student-onboarding' : 'teacher-onboarding')
    console.log('Current step set to:', role === 'student' ? 'student-onboarding' : 'teacher-onboarding') // Debug log
  }

  const handleBackToRoleSelection = () => {
    setCurrentStep('role-selection')
    setSelectedRole(null)
    setError(null)
  }

  const handleStudentOnboardingComplete = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<any>('/v2/auth/onboard/student', {
        email: data.email,
        password: data.password,
        name: data.name,
        grade_level: data.gradeLevel,
        subjects_of_interest: data.subjectsOfInterest,
        learning_goals: Array.isArray(data.learningGoals) ? data.learningGoals.join(', ') : data.learningGoals,
        preferred_difficulty: data.preferredDifficulty
      })

      // Store the auth token
      if (response?.access_token) {
        localStorage.setItem('auth_token', response.access_token)
      }

      setCompletedUser({
        ...response,
        role: 'student',
        name: data.name
      })
      setCurrentStep('completion')
    } catch (err: any) {
      console.error('Student onboarding error:', err)
      setError(err.message || 'Failed to complete student onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTeacherOnboardingComplete = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post<any>('/v2/auth/onboard/teacher', {
        email: data.email,
        password: data.password,
        name: data.name,
        school_name: data.schoolName,
        subjects_taught: data.subjectsTaught,
        grade_levels_taught: data.gradeLevelsTaught,
        years_experience: data.yearsExperience,
        classroom_size: data.classroomSize
      })

      // Store the auth token
      if (response?.access_token) {
        localStorage.setItem('auth_token', response.access_token)
      }

      setCompletedUser({
        ...response,
        role: 'teacher',
        name: data.name
      })
      setCurrentStep('completion')
    } catch (err: any) {
      console.error('Teacher onboarding error:', err)
      setError(err.message || 'Failed to complete teacher onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCompletionContinue = () => {
    if (onComplete) {
      onComplete()
    } else {
      navigate('/dashboard')
    }
  }

  const renderCompletionScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center"
        data-testid="onboarding-completion"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-teal-600 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to TARDIS!
            </h1>
            <p className="text-gray-600 mb-2">
              Hi {completedUser?.name}! Your {selectedRole} account has been successfully created.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              You're all set to start your AI-powered learning journey.
            </p>
          </motion.div>

          {/* Continue Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            onClick={handleCompletionContinue}
            data-testid="continue-to-dashboard-button"
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            Continue to Dashboard
          </motion.button>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-500 text-sm">
            You can always update your profile and preferences later
          </p>
        </motion.div>
      </motion.div>
    </div>
  )

  const renderErrorOverlay = () => {
    if (!error) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-6"
        data-testid="error-overlay"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="flex items-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mr-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Onboarding Error</h3>
          </div>

          <p className="text-gray-600 mb-6">{error}</p>

          <div className="flex space-x-3">
            <button
              onClick={() => setError(null)}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
              data-testid="dismiss-error-button"
            >
              Try Again
            </button>
            <button
              onClick={handleBackToRoleSelection}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
              data-testid="back-to-start-button"
            >
              Start Over
            </button>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  const renderLoadingOverlay = () => {
    if (!loading) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
        data-testid="loading-overlay"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Your Account</h3>
          <p className="text-gray-600">Please wait while we set up your profile...</p>
        </div>
      </motion.div>
    )
  }

  const renderCurrentStep = () => {
    console.log('Rendering step:', currentStep, 'Selected role:', selectedRole) // Debug log
    
    switch (currentStep) {
      case 'role-selection':
        console.log('Rendering RoleSelection component') // Debug log
        return <RoleSelection onRoleSelect={handleRoleSelection} />

      case 'student-onboarding':
        console.log('Rendering StudentOnboarding component') // Debug log
        return (
          <StudentOnboarding
            onComplete={handleStudentOnboardingComplete}
            onBack={handleBackToRoleSelection}
          />
        )

      case 'teacher-onboarding':
        console.log('Rendering TeacherOnboarding component') // Debug log
        return (
          <TeacherOnboarding
            onComplete={handleTeacherOnboardingComplete}
            onBack={handleBackToRoleSelection}
          />
        )

      case 'completion':
        console.log('Rendering completion screen') // Debug log
        return renderCompletionScreen()

      default:
        console.log('Rendering default RoleSelection component') // Debug log
        return <RoleSelection onRoleSelect={handleRoleSelection} />
    }
  }

  return (
    <ErrorBoundary>
      <div className="relative" data-testid="onboarding-flow">
        {/* Debug indicator (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg text-sm font-mono z-50">
            <div>Step: {currentStep}</div>
            <div>Role: {selectedRole || 'none'}</div>
          </div>
        )}
        {renderCurrentStep()}
        {renderLoadingOverlay()}
        {renderErrorOverlay()}
      </div>
    </ErrorBoundary>
  )
}

export default OnboardingFlow
