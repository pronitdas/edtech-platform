import React, { createContext, useContext, useState, useEffect } from 'react'
import { kratosAuthService } from '../services/kratos-auth'
import { authService } from '../services/auth'

type UserRole = 'student' | 'teacher' | 'content_creator'

type TeacherContentGenerationPreferences = {
  complexity_level: 'beginner' | 'intermediate' | 'advanced'
  content_style: 'formal' | 'conversational' | 'interactive'
  assessment_frequency: 'low' | 'medium' | 'high'
}

// Base user interface with common fields
interface BaseUser {
  id: string | number
  email: string
  name?: string
  created_at?: string
  role: UserRole
  onboarding_completed?: boolean
}

// Student-specific profile fields
interface StudentProfile {
  grade_level?: string
  subjects_of_interest?: string[]
  learning_goals?: string[]
  preferred_difficulty?: 'beginner' | 'intermediate' | 'advanced'
  learning_interests?: string[]
  knowledge_gaps?: string[]
  preferred_learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  current_knowledge_level?: Record<string, 'beginner' | 'intermediate' | 'advanced'>
  learning_streak?: number
  total_study_time?: number
}

// Teacher-specific profile fields
interface TeacherProfile {
  school_name?: string
  subjects_of_interest?: string[]
  subjects_taught?: string[]
  grade_levels_taught?: string[]
  years_experience?: number
  classroom_size?: number
  topics_to_teach?: string[]
  content_generation_preferences?: TeacherContentGenerationPreferences
  curriculum_standards?: string[]
  teaching_style?: 'traditional' | 'progressive' | 'montessori' | 'waldorf'
  classroom_management_preferences?: {
    assessment_frequency: 'low' | 'medium' | 'high'
    feedback_style: 'immediate' | 'weekly' | 'end_of_unit'
    collaboration_level: 'individual' | 'small_groups' | 'whole_class'
  }
}

// Content Creator-specific profile fields
interface ContentCreatorProfile {
  subjects_of_interest?: string[]
  content_specialties?: string[]
  target_audiences?: ('elementary' | 'middle_school' | 'high_school' | 'college' | 'adult')[]
  content_types?: ('video' | 'interactive' | 'quiz' | 'simulation' | 'text' | 'audio')[]
  publishing_platforms?: string[]
  content_generation_preferences?: {
    complexity_level: 'beginner' | 'intermediate' | 'advanced'
    content_style: 'formal' | 'conversational' | 'interactive'
    visual_style: 'minimal' | 'rich' | 'gamified'
    length_preference: 'short' | 'medium' | 'comprehensive'
  }
  collaboration_settings?: {
    accepts_collaborations: boolean
    content_sharing_level: 'private' | 'organization' | 'public'
    feedback_preferences: 'open' | 'curated' | 'private'
  }
}

// Discriminated union for different user types
type User = 
  | (BaseUser & { role: 'student' } & StudentProfile)
  | (BaseUser & { role: 'teacher' } & TeacherProfile)
  | (BaseUser & { role: 'content_creator' } & ContentCreatorProfile)

interface UserContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  demoLogin: (role?: 'student' | 'teacher') => Promise<void>
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>
  completeOnboarding: (onboardingData: Partial<User>) => Promise<void>
  isTeacher: () => boolean
  isStudent: () => boolean
  isContentCreator: () => boolean
  getUserRole: () => UserRole | null
  switchRole: (newRole: UserRole) => Promise<void>
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      try {
        // First try traditional auth service (more reliable)
        if (authService.isAuthenticated()) {
          try {
            const profile = await authService.getCurrentUser()
            setUser(profile as User)
          } catch (error) {
            console.warn('JWT token invalid, trying Kratos fallback:', error)
            // Try Kratos as fallback
            const { user } = await kratosAuthService.checkAuthentication()
            if (user) {
              setUser(user as User)
            } else {
              // Clear invalid token
              localStorage.removeItem('auth_token')
            }
          }
        } else {
          // No JWT token, try Kratos
          const { user } = await kratosAuthService.checkAuthentication()
          if (user) {
            setUser(user as User)
          }
        }
      } catch (error) {
        console.warn('Session check failed:', error)
        // Clear any stored tokens
        localStorage.removeItem('auth_token')
      }
      setLoading(false)
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Try traditional auth service first (more reliable)
      const user = await authService.login({ email, password })
      setUser(user as User)
    } catch (authError) {
      console.warn('Traditional login failed, trying Kratos:', authError)
      try {
        // Fallback to Kratos
        const user = await kratosAuthService.login({ email, password })
        setUser(user as User)
      } catch (kratosError) {
        console.error('Both login methods failed:', { authError, kratosError })
        throw new Error(
          kratosError instanceof Error ? kratosError.message : 'Invalid email or password'
        )
      }
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    const registerData = name ? { email, password, name } : { email, password }

    try {
      // Try traditional auth service first (more reliable)
      const user = await authService.register(registerData)
      setUser(user as User)
    } catch (authError) {
      console.warn('Traditional registration failed, trying Kratos:', authError)
      try {
        // Fallback to Kratos
        const user = await kratosAuthService.register(registerData)
        setUser(user as User)
      } catch (kratosError) {
        console.error('Both registration methods failed:', { authError, kratosError })
        throw new Error(
          kratosError instanceof Error ? kratosError.message : 'Registration failed'
        )
      }
    }
  }

  const logout = async () => {
    try {
      // Try both logout methods
      await Promise.allSettled([
        authService.logout(),
        kratosAuthService.logout()
      ])
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      setUser(null)
    }
  }

  const demoLogin = async (role: 'student' | 'teacher' = 'student') => {
    try {
      const user = await kratosAuthService.demoLogin(role)
      setUser(user as User)
    } catch (error) {
      console.error('Demo login error:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Demo login failed'
      )
    }
  }

  const refreshUser = async () => {
    try {
      // Try traditional auth first
      if (authService.isAuthenticated()) {
        try {
          const profile = await authService.getCurrentUser()
          setUser(profile as User)
          return
        } catch (error) {
          console.warn('JWT refresh failed, trying Kratos:', error)
        }
      }
      
      // Fallback to Kratos
      const { user } = await kratosAuthService.checkAuthentication()
      setUser(user as User)
    } catch (error) {
      console.error('Refresh user error:', error)
      setUser(null)
    }
  }

  const updateProfile = async (data: { name?: string; email?: string }) => {
    if (!user) throw new Error('No user logged in')

    try {
      // Use a simple fetch call since we don't have apiClient imported
      const token = localStorage.getItem('auth_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/v2/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedUser = await response.json()
      setUser(updatedUser as User)
    } catch (error) {
      console.error('Profile update error:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update profile'
      )
    }
  }

  const completeOnboarding = async (onboardingData: Partial<User>) => {
    if (!user) throw new Error('No user logged in')

    try {
      const sanitizedOnboardingData = Object.fromEntries(
        Object.entries(onboardingData).filter(([, value]) => value !== undefined)
      ) as Partial<User>

      // Update user with onboarding data
      const nextRole = sanitizedOnboardingData.role ?? user.role
      const updatedUserBase = {
        ...user,
        ...sanitizedOnboardingData,
        onboarding_completed: true,
        role: nextRole
      }
      const updatedUser =
        nextRole === 'student'
          ? { ...updatedUserBase, role: 'student' }
          : nextRole === 'teacher'
            ? { ...updatedUserBase, role: 'teacher' }
            : { ...updatedUserBase, role: 'content_creator' }
      setUser(updatedUser as User)

      // Send to backend
      const token = localStorage.getItem('auth_token')
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const response = await fetch(`${baseUrl}/v2/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify({
          ...sanitizedOnboardingData,
          onboarding_completed: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding completion error:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to complete onboarding'
      )
    }
  }

  const isTeacher = () => user?.role === 'teacher'
  const isStudent = () => user?.role === 'student'
  const isContentCreator = () => user?.role === 'content_creator'
  const getUserRole = () => user?.role || null
  
  const switchRole = async (newRole: UserRole) => {
    if (!user) throw new Error('No user logged in')
    
    try {
      // Update user role (this would need backend support)
      const updatedUser = { ...user, role: newRole } as User
      setUser(updatedUser)
      
      // In production, send role change to backend
      // await apiClient.updateUserRole(newRole)
    } catch (error) {
      console.error('Role switch error:', error)
      throw new Error('Failed to switch role')
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        demoLogin,
        updateProfile,
        completeOnboarding,
        isTeacher,
        isStudent,
        isContentCreator,
        getUserRole,
        switchRole,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
