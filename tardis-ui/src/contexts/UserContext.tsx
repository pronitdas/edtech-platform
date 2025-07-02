import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient, AuthResponse } from '../services/api'

interface User {
  id: string | number
  email: string
  name?: string
  created_at?: string
  role?: string
  onboarding_completed?: boolean
  // Student fields
  grade_level?: string
  subjects_of_interest?: string[]
  learning_goals?: string
  preferred_difficulty?: string
  // Teacher fields
  school_name?: string
  subjects_taught?: string[]
  grade_levels_taught?: string[]
  years_experience?: number
  classroom_size?: number
}

interface UserContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          // Use the v2 profile endpoint
          const response = await fetch(`http://localhost:8000/v2/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          
          if (response.ok) {
            const profile = await response.json()
            setUser(profile as User)
          } else {
            // Token invalid, clear it
            localStorage.removeItem('auth_token')
          }
        } catch (error) {
          console.warn('Invalid token, clearing session:', error)
          localStorage.removeItem('auth_token')
        }
      }
      setLoading(false)
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await apiClient.login(email, password)

      apiClient.setToken(response.token)
      setUser(response.user)
    } catch (error) {
      console.error('Login error:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Invalid email or password'
      )
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response: AuthResponse = await apiClient.register(
        email,
        password,
        name
      )

      apiClient.setToken(response.token)
      setUser(response.user)
    } catch (error) {
      console.error('Registration error:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Registration failed'
      )
    }
  }

  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error)
    } finally {
      apiClient.setToken(null)
      localStorage.removeItem('auth_token')
      setUser(null)
    }
  }

  const updateProfile = async (data: { name?: string; email?: string }) => {
    if (!user) throw new Error('No user logged in')

    try {
      const updatedUser = await apiClient.updateProfile(data)
      setUser(updatedUser as User)
    } catch (error) {
      console.error('Profile update error:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to update profile'
      )
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
        updateProfile,
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
