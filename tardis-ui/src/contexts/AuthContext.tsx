import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { User } from '../types/api'
import { createApiClient, DynamicApiClient } from '../services/dynamic-api-client'

interface AuthContextType {
  user: User | null
  loading: boolean
  apiClient: DynamicApiClient | null
  login: (flowId: string) => Promise<void>
  register: (flowId: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiClient, setApiClient] = useState<DynamicApiClient | null>(null)

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Initialize API client
        const client = await createApiClient()
        setApiClient(client)
        
        // Check for existing auth token
        const token = localStorage.getItem('auth_token')
        if (token) {
          client.setAuthToken(token)
          
          // Validate token and get user info
          try {
            // You might want to add a /me endpoint to validate the token
            // For now, we'll construct user from token payload
            const tokenPayload = token.split('.')[1]
            if (!tokenPayload) {
              throw new Error('Invalid auth token payload')
            }
            const parsedPayload = JSON.parse(atob(tokenPayload))
            const payloadRecord: Record<string, unknown> =
              typeof parsedPayload === 'object' && parsedPayload !== null
                ? parsedPayload
                : {}
            const idValue = payloadRecord.user_id
            const id = typeof idValue === 'number'
              ? idValue
              : typeof idValue === 'string' && idValue.trim() !== ''
                ? Number(idValue)
                : 0
            const email = typeof payloadRecord.email === 'string'
              ? payloadRecord.email
              : ''
            const nameValue = typeof payloadRecord.name === 'string'
              ? payloadRecord.name
              : typeof payloadRecord.display_name === 'string'
                ? payloadRecord.display_name
                : undefined
            const roleValue = payloadRecord.role
            const role =
              roleValue === 'student' ||
              roleValue === 'teacher' ||
              roleValue === 'content_creator'
                ? roleValue
                : undefined
            const createdAt = typeof payloadRecord.created_at === 'string'
              ? payloadRecord.created_at
              : new Date().toISOString()
            const onboardingCompleted =
              typeof payloadRecord.onboarding_completed === 'boolean'
                ? payloadRecord.onboarding_completed
                : undefined
            const subjectsOfInterest = Array.isArray(payloadRecord.subjects_of_interest)
              ? payloadRecord.subjects_of_interest.filter((subject): subject is string => typeof subject === 'string')
              : undefined
            const tokenUser: User = {
              id,
              email,
              created_at: createdAt,
              ...(nameValue ? { name: nameValue } : {}),
              ...(role ? { role } : {}),
              ...(typeof onboardingCompleted === 'boolean'
                ? { onboarding_completed: onboardingCompleted }
                : {}),
              ...(subjectsOfInterest ? { subjects_of_interest: subjectsOfInterest } : {})
            }
            setUser(tokenUser)
          } catch (tokenError) {
            console.error('Invalid token, clearing auth:', tokenError)
            localStorage.removeItem('auth_token')
            client.clearAuth()
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (flowId: string) => {
    if (!apiClient) throw new Error('API client not initialized')
    
    try {
      const result = await (apiClient as any).loginUserAuthLoginPost({ flow_id: flowId })
      
      // Store token and set user
      localStorage.setItem('auth_token', result.access_token)
      apiClient.setAuthToken(result.access_token)
      setUser(result.user)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (flowId: string) => {
    if (!apiClient) throw new Error('API client not initialized')
    
    try {
      const result = await (apiClient as any).registerUserAuthRegisterPost({ flow_id: flowId })
      
      // Store token and set user
      localStorage.setItem('auth_token', result.access_token)
      apiClient.setAuthToken(result.access_token)
      setUser(result.user)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = async () => {
    // Clear local storage and API client auth
    localStorage.removeItem('auth_token')
    if (apiClient) {
      apiClient.clearAuth()
    }
    setUser(null)
  }

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      apiClient, 
      login, 
      register, 
      logout, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Return a default context when used outside of AuthProvider
    console.warn('useAuth called outside of AuthProvider, returning default values')
    return {
      user: null,
      loading: false,
      apiClient: null,
      login: async () => { throw new Error('AuthProvider not available') },
      register: async () => { throw new Error('AuthProvider not available') },
      logout: async () => { throw new Error('AuthProvider not available') },
      isAuthenticated: () => false
    }
  }
  return context
}
