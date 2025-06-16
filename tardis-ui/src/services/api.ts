const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name?: string
    created_at?: string
  }
}

export class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.loadToken()
  }

  private loadToken() {
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } catch {
          errorMessage = (await response.text()) || errorMessage
        }
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return response.json()
      }

      return response.text() as unknown as T
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Unable to connect to server. Please check your connection.'
        )
      }
      throw error
    }
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/v2/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    return this.request<AuthResponse>('/v2/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async logout(): Promise<void> {
    return this.request('/v2/auth/logout', { method: 'POST' })
  }

  async getProfile() {
    return this.request('/v2/auth/profile')
  }

  async updateProfile(data: { name?: string; email?: string }) {
    return this.request('/v2/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Knowledge endpoints
  async getKnowledge(filters?: Record<string, any>) {
    const params = filters ? `?${new URLSearchParams(filters)}` : ''
    return this.request(`/v2/knowledge${params}`)
  }

  async getKnowledgeById(id: string) {
    return this.request(`/v2/knowledge/${id}`)
  }

  async uploadKnowledge(formData: FormData) {
    // Don't set Content-Type for FormData - let browser handle it
    return this.request('/v2/knowledge', {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: formData,
    })
  }

  async deleteKnowledge(id: string) {
    return this.request(`/v2/knowledge/${id}`, { method: 'DELETE' })
  }

  // Chapter endpoints
  async getChapters(knowledgeId: string) {
    return this.request(`/v2/chapters/${knowledgeId}`)
  }

  async updateChapter(knowledgeId: string, chapterId: string, data: any) {
    return this.request(`/v2/chapters/${knowledgeId}/${chapterId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // WebSocket helper
  createWebSocket(endpoint: string): WebSocket {
    const wsUrl = `${WS_BASE_URL}${endpoint}`
    const token = this.token
    const fullUrl = token
      ? `${wsUrl}?token=${encodeURIComponent(token)}`
      : wsUrl
    return new WebSocket(fullUrl)
  }
}

export const apiClient = new ApiClient()
export default apiClient
