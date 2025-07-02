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
    // Use the v1 auth endpoints that integrate with Kratos
    const response = await fetch(`${this.baseUrl}/auth/login`, {
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
    return data.user
  }

  async register(data: RegisterData): Promise<User> {
    // Use the v1 auth endpoints that integrate with Kratos
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Registration failed: ${error}`)
    }

    const result = await response.json()
    localStorage.setItem('auth_token', result.access_token)
    return result.user
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

    return response.json()
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  }
}

export const authService = new AuthService()
