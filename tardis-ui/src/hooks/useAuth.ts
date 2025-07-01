import { useEffect, useState } from 'react'
import { authService } from '@/services/auth'
import { User } from '@/types/api'

const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
        // If token is invalid, remove it
        localStorage.removeItem('auth_token')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    const user = await authService.login({ email, password })
    setUser(user)
    return user
  }

  const register = async (email: string, password: string, name?: string) => {
    const registerData = { email, password, ...(name !== undefined && { name }) }
    const user = await authService.register(registerData)
    setUser(user)
    return user
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: authService.isAuthenticated(),
  }
}

export default useAuthState
