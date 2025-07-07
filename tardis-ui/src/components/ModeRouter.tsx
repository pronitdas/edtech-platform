import React from 'react'
import { useUser } from '@/contexts/UserContext'
import StudentDashboard from './dashboards/StudentDashboard'
import TeacherDashboard from './dashboards/TeacherDashboard'
import ContentCreatorDashboard from './dashboards/ContentCreatorDashboard'

/**
 * ModeRouter - Routes users to their appropriate mode-specific dashboard
 * Separates concerns by providing distinct experiences for each user role
 */
const ModeRouter: React.FC = () => {
  const { user, getUserRole } = useUser()
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const userRole = getUserRole()

  switch (userRole) {
    case 'student':
      return <StudentDashboard />
    
    case 'teacher':
      return <TeacherDashboard />
    
    case 'content_creator':
      return <ContentCreatorDashboard />
    
    default:
      // Fallback for users without a defined role
      return (
        <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Welcome to Tardis</h1>
            <p className="text-gray-400 mb-8">Please complete your profile to access your personalized dashboard.</p>
            <button 
              onClick={() => window.location.href = '/profile'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Complete Profile
            </button>
          </div>
        </div>
      )
  }
}

export default ModeRouter