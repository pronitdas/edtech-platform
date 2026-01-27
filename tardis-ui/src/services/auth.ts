import { apiClient } from './api-client'
import { User } from '../types/api'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData extends LoginCredentials {
  name?: string
}

interface AuthResponse {
  token: string
  user: User
}

export class AuthService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  async login(credentials: LoginCredentials): Promise<User> {
    // Use the v2 auth endpoints that support direct email/password auth
    const response = await fetch(`${this.baseUrl}/v2/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Login failed: ${error}`)
    }

    const data = await response.json()
    localStorage.setItem('auth_token', data.access_token)
    
    // Transform v2 response to match expected User interface
    return {
      id: data.user_id,
      email: data.email,
      name: data.display_name || data.email.split('@')[0],
      created_at: new Date().toISOString(),
      role: 'student', // Default role, will be updated from profile
      onboarding_completed: true // V2 auth endpoints handle onboarding automatically
    }
  }

  async register(data: RegisterData): Promise<User> {
    // Use the v2 auth endpoints that support direct email/password registration
    const registerPayload = {
      email: data.email,
      password: data.password,
      display_name: data.name || data.email.split('@')[0]
    }
    
    const response = await fetch(`${this.baseUrl}/v2/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerPayload),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Registration failed: ${error}`)
    }

    const result = await response.json()
    localStorage.setItem('auth_token', result.access_token)
    
    // Transform v2 response to match expected User interface
    const userName = registerPayload.display_name || 'User';
    return {
      id: result.user_id,
      email: result.email,
      name: userName,
      created_at: new Date().toISOString(),
      role: 'student' as const,
      onboarding_completed: true
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token')
    // Optional: call logout endpoint if needed
  }

  async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('No auth token')
    }

    const response = await fetch(`${this.baseUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user profile')
    }

    const data = await response.json()
    
    // Transform backend response to match expected User interface
    let role = 'student' // default
    if (data.roles) {
      try {
        const rolesArray = typeof data.roles === 'string' ? JSON.parse(data.roles) : data.roles
        if (rolesArray.length > 0) {
          role = rolesArray[0] // Take the first role
        }
      } catch (e) {
        console.warn('Failed to parse roles:', data.roles)
      }
    }
    
    return {
      id: data.id,
      email: data.email,
      name: data.display_name || data.email.split('@')[0],
      created_at: data.created_at,
      role: role as 'student' | 'teacher' | 'content_creator',
      onboarding_completed: true // If they can call /auth/me, they've completed onboarding
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  }
}

export const authService = new AuthService()
