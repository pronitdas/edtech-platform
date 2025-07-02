import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, School, BookOpen, Users, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import OnboardingProgress from './OnboardingProgress'

interface TeacherOnboardingData {
  email: string
  password: string
  name: string
  schoolName: string
  subjectsTaught: string[]
  gradeLevelsTaught: string[]
  yearsExperience: number
  classroomSize: number
}

interface TeacherOnboardingProps {
  onComplete: (data: TeacherOnboardingData) => void
  onBack: () => void
}

const TeacherOnboarding: React.FC<TeacherOnboardingProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState<TeacherOnboardingData>({
    email: '',
    password: '',
    name: '',
    schoolName: '',
    subjectsTaught: [],
    gradeLevelsTaught: [],
    yearsExperience: 0,
    classroomSize: 0
  })

  const steps = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Tell us about yourself to create your account',
      icon: User
    },
    {
      id: 'school-info',
      title: 'School Information',
      description: 'Help us understand your teaching environment',
      icon: School
    },
    {
      id: 'subjects',
      title: 'Teaching Subjects',
      description: 'What subjects do you teach?',
      icon: BookOpen
    },
    {
      id: 'classroom',
      title: 'Classroom Details',
      description: 'Tell us about your teaching experience and classroom',
      icon: Users
    }
  ]

  const subjects = [
    'Mathematics', 'Science', 'English/Literature', 'History', 'Geography',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Art',
    'Music', 'Physical Education', 'Foreign Languages', 'Economics',
    'Psychology', 'Philosophy', 'Social Studies', 'Special Education'
  ]

  const gradeLevels = [
    'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
    '6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade',
    'College/University', 'Adult Education'
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

  const updateFormData = (updates: Partial<TeacherOnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const toggleSubject = (subject: string) => {
    const current = formData.subjectsTaught
    const updated = current.includes(subject)
      ? current.filter(s => s !== subject)
      : [...current, subject]
    updateFormData({ subjectsTaught: updated })
  }

  const toggleGradeLevel = (gradeLevel: string) => {
    const current = formData.gradeLevelsTaught
    const updated = current.includes(gradeLevel)
      ? current.filter(g => g !== gradeLevel)
      : [...current, gradeLevel]
    updateFormData({ gradeLevelsTaught: updated })
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.email && formData.password && formData.name
      case 2:
        return formData.schoolName
      case 3:
        return formData.subjectsTaught.length > 0
      case 4:
        return formData.gradeLevelsTaught.length > 0 && formData.yearsExperience >= 0 && formData.classroomSize > 0
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6" data-testid="teacher-basic-info-step">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                data-testid="teacher-name-input"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
                data-testid="teacher-email-input"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
                  data-testid="teacher-password-input"
                  value={formData.password}
                  onChange={(e) => updateFormData({ password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
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
          <div className="space-y-6" data-testid="teacher-school-info-step">
            <div>
              <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-2">
                School/Institution Name *
              </label>
              <input
                type="text"
                id="schoolName"
                data-testid="school-name-input"
                value={formData.schoolName}
                onChange={(e) => updateFormData({ schoolName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your school or institution name"
                required
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6" data-testid="teacher-subjects-step">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Which subjects do you teach? (Select all that apply) *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    data-testid={`subject-${subject.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => toggleSubject(subject)}
                    className={`p-3 text-sm text-left border-2 rounded-lg transition-all duration-200 ${formData.subjectsTaught.includes(subject)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {formData.subjectsTaught.length} subjects
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6" data-testid="teacher-classroom-step">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Which grade levels do you teach? (Select all that apply) *
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {gradeLevels.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    data-testid={`grade-level-${grade.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => toggleGradeLevel(grade)}
                    className={`p-2 text-xs text-center border-2 rounded-lg transition-all duration-200 ${formData.gradeLevelsTaught.includes(grade)
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected: {formData.gradeLevelsTaught.length} grade levels
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Teaching Experience *
                </label>
                <input
                  type="number"
                  id="yearsExperience"
                  data-testid="years-experience-input"
                  value={formData.yearsExperience || ''}
                  onChange={(e) => updateFormData({ yearsExperience: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label htmlFor="classroomSize" className="block text-sm font-medium text-gray-700 mb-2">
                  Average Classroom Size *
                </label>
                <input
                  type="number"
                  id="classroomSize"
                  data-testid="classroom-size-input"
                  value={formData.classroomSize || ''}
                  onChange={(e) => updateFormData({ classroomSize: parseInt(e.target.value) || 0 })}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="25"
                  required
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <OnboardingProgress
        currentStep={currentStep}
        totalSteps={steps.length}
        steps={steps}
        role="teacher"
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
                className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default TeacherOnboarding
