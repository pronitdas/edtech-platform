import { User } from '../types/api'

// Kratos session and identity types
interface KratosIdentity {
  id: string
  schema_id: string
  state: 'active' | 'inactive'
  traits: {
    email: string
    name?: string
    [key: string]: any
  }
  metadata_public?: any
  created_at: string
  updated_at: string
}

interface KratosSession {
  id: string
  active: boolean
  expires_at: string
  authenticated_at: string
  issued_at: string
  identity: KratosIdentity
  devices?: Array<{
    id: string
    ip_address: string
    user_agent: string
    location: string
  }>
}

interface KratosError {
  id: string
  code: number
  status: string
  reason: string
  message: string
}

// Kratos flow types for self-service
interface KratosLoginFlow {
  id: string
  type: 'browser' | 'api'
  expires_at: string
  issued_at: string
  request_url: string
  ui: {
    action: string
    method: string
    nodes: Array<{
      type: 'input' | 'img' | 'a' | 'script' | 'text'
      group: string
      attributes: any
      messages?: any[]
      meta?: any
    }>
    messages?: Array<{
      id: number
      text: string
      type: 'info' | 'error' | 'success'
      context?: any
    }>
  }
  created_at: string
  updated_at: string
  refresh: boolean
  requested_aal: string
}

interface KratosRegistrationFlow {
  id: string
  type: 'browser' | 'api'
  expires_at: string
  issued_at: string
  request_url: string
  ui: {
    action: string
    method: string
    nodes: Array<{
      type: 'input' | 'img' | 'a' | 'script' | 'text'
      group: string
      attributes: any
      messages?: any[]
      meta?: any
    }>
    messages?: Array<{
      id: number
      text: string
      type: 'info' | 'error' | 'success'
      context?: any
    }>
  }
  created_at: string
  updated_at: string
}

export class KratosAuthService {
  private kratosPublicUrl: string
  private apiBaseUrl: string

  constructor() {
    this.kratosPublicUrl = import.meta.env.VITE_KRATOS_PUBLIC_URL || 'http://localhost:4433'
    this.apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  }

  /**
   * Check if user is authenticated by calling Kratos whoami
   */
  async checkAuthentication(): Promise<{ session: KratosSession | null; user: User | null }> {
    try {
      // First try to get session from Kratos
      const kratosSession = await this.getKratosSession()
      
      if (kratosSession && kratosSession.active) {
        // Get user profile from our backend using the Kratos session
        const user = await this.getUserProfileFromKratos(kratosSession)
        return { session: kratosSession, user }
      }

      // Fallback to JWT token check for development
      const jwtUser = await this.checkJWTAuth()
      return { session: null, user: jwtUser }

    } catch (error) {
      console.warn('Authentication check failed:', error)
      return { session: null, user: null }
    }
  }

  /**
   * Get current Kratos session
   */
  private async getKratosSession(): Promise<KratosSession | null> {
    try {
      const response = await fetch(`${this.kratosPublicUrl}/sessions/whoami`, {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        return await response.json()
      }

      return null
    } catch (error) {
      console.warn('Kratos session check failed:', error)
      return null
    }
  }

  /**
   * Get user profile from our backend using Kratos session
   */
  private async getUserProfileFromKratos(kratosSession: KratosSession): Promise<User | null> {
    try {
      // Send the Kratos session ID to our backend to get user profile
      const response = await fetch(`${this.apiBaseUrl}/v2/auth/profile`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Kratos-Session': kratosSession.id
        }
      })

      if (response.ok) {
        return await response.json()
      }

      return null
    } catch (error) {
      console.warn('Failed to get user profile from backend:', error)
      return null
    }
  }

  /**
   * Fallback JWT authentication check
   */
  private async checkJWTAuth(): Promise<User | null> {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return null

      const response = await fetch(`${this.apiBaseUrl}/v2/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        return await response.json()
      }

      // Token invalid, remove it
      localStorage.removeItem('auth_token')
      return null
    } catch (error) {
      console.warn('JWT auth check failed:', error)
      localStorage.removeItem('auth_token')
      return null
    }
  }

  /**
   * Initialize login flow with Kratos
   */
  async initializeLoginFlow(): Promise<KratosLoginFlow> {
    const response = await fetch(`${this.kratosPublicUrl}/self-service/login/api`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to initialize login flow')
    }

    return await response.json()
  }

  /**
   * Submit login credentials to Kratos
   */
  async submitLogin(flowId: string, email: string, password: string): Promise<{ session: KratosSession; user: User }> {
    const response = await fetch(`${this.kratosPublicUrl}/self-service/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        flow: flowId,
        method: 'password',
        password_identifier: email,
        password: password
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.ui?.messages?.[0]?.text || 'Login failed')
    }

    const result = await response.json()
    
    // Get user profile from our backend
    const user = await this.getUserProfileFromKratos(result.session)
    if (!user) {
      throw new Error('Failed to get user profile after login')
    }

    return { session: result.session, user }
  }

  /**
   * Initialize registration flow with Kratos
   */
  async initializeRegistrationFlow(): Promise<KratosRegistrationFlow> {
    const response = await fetch(`${this.kratosPublicUrl}/self-service/registration/api`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to initialize registration flow')
    }

    return await response.json()
  }

  /**
   * Submit registration to Kratos
   */
  async submitRegistration(
    flowId: string, 
    email: string, 
    password: string, 
    name?: string
  ): Promise<{ session: KratosSession; user: User }> {
    const traits: any = { email }
    if (name) traits.name = name

    const response = await fetch(`${this.kratosPublicUrl}/self-service/registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        flow: flowId,
        method: 'password',
        password: password,
        traits
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.ui?.messages?.[0]?.text || 'Registration failed')
    }

    const result = await response.json()
    
    // Get user profile from our backend
    const user = await this.getUserProfileFromKratos(result.session)
    if (!user) {
      throw new Error('Failed to get user profile after registration')
    }

    return { session: result.session, user }
  }

  /**
   * Logout from Kratos
   */
  async logout(): Promise<void> {
    try {
      // Create logout flow
      const logoutResponse = await fetch(`${this.kratosPublicUrl}/self-service/logout/api`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (logoutResponse.ok) {
        const logoutFlow = await logoutResponse.json()
        
        // Submit logout
        await fetch(logoutFlow.logout_url, {
          method: 'GET',
          credentials: 'include'
        })
      }

      // Clear any local storage
      localStorage.removeItem('auth_token')
      
    } catch (error) {
      console.warn('Logout failed:', error)
      // Always clear local storage even if Kratos logout fails
      localStorage.removeItem('auth_token')
    }
  }

  /**
   * Simplified login method for backward compatibility
   */
  async login(credentials: { email: string; password: string }): Promise<User> {
    try {
      // Try Kratos flow first
      const loginFlow = await this.initializeLoginFlow()
      const result = await this.submitLogin(loginFlow.id, credentials.email, credentials.password)
      return result.user
    } catch (kratosError) {
      console.warn('Kratos login failed, trying JWT fallback:', kratosError)
      
      // Fallback to direct API login (JWT)
      const response = await fetch(`${this.apiBaseUrl}/v2/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Login failed')
      }

      const data = await response.json()
      if (data.access_token) {
        localStorage.setItem('auth_token', data.access_token)
      }
      
      return data.user
    }
  }

  /**
   * Simplified registration method for backward compatibility
   */
  async register(data: { email: string; password: string; name?: string }): Promise<User> {
    try {
      // Try Kratos flow first
      const registrationFlow = await this.initializeRegistrationFlow()
      const result = await this.submitRegistration(registrationFlow.id, data.email, data.password, data.name)
      return result.user
    } catch (kratosError) {
      console.warn('Kratos registration failed, trying JWT fallback:', kratosError)
      
      // Fallback to direct API registration (JWT)
      const response = await fetch(`${this.apiBaseUrl}/v2/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Registration failed')
      }

      const result = await response.json()
      if (result.access_token) {
        localStorage.setItem('auth_token', result.access_token)
      }
      
      return result.user
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const { user } = await this.checkAuthentication()
    if (!user) {
      throw new Error('Not authenticated')
    }
    return user
  }

  /**
   * Check if user is authenticated (synchronous for backward compatibility)
   */
  isAuthenticated(): boolean {
    // Quick check for JWT token as fallback
    return !!localStorage.getItem('auth_token')
  }

  /**
   * Async authentication check with full session validation
   */
  async isAuthenticatedAsync(): Promise<boolean> {
    const { user } = await this.checkAuthentication()
    return !!user
  }

  /**
   * Demo login method
   */
  async demoLogin(role: 'student' | 'teacher' = 'student'): Promise<User> {
    const endpoint = role === 'teacher' ? 'demo-teacher-login' : 'demo-login'
    
    const response = await fetch(`${this.apiBaseUrl}/v2/auth/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Demo login failed')
    }

    const data = await response.json()
    if (data.access_token) {
      localStorage.setItem('auth_token', data.access_token)
    }
    
    return data.user
  }
}

export const kratosAuthService = new KratosAuthService()