const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const SANDBOX_MODE = import.meta.env.VITE_SANDBOX_MODE === 'true'

// Mock responses for sandbox mode
const mockResponses: Record<string, any> = {
  'POST:/v2/auth/login': {
    token: 'mock_token_' + Date.now(),
    user: {
      id: 'mock_user_123',
      email: 'user@example.com',
      name: 'John Doe',
      created_at: new Date().toISOString(),
    },
  },
  'POST:/v2/auth/register': {
    token: 'mock_token_' + Date.now(),
    user: {
      id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
      email: 'newuser@example.com',
      name: 'New User',
      created_at: new Date().toISOString(),
    },
  },
  'POST:/v2/auth/logout': { success: true },
  'GET:/v2/auth/profile': {
    id: 'mock_user_123',
    email: 'user@example.com',
    name: 'John Doe',
    created_at: new Date().toISOString(),
  },
  'PUT:/v2/auth/profile': {
    id: 'mock_user_123',
    email: 'user@example.com',
    name: 'Updated Name',
    created_at: new Date().toISOString(),
  },
  'GET:/v2/knowledge': [
    {
      id: 'knowledge_1',
      title: 'Sample Knowledge Base 1',
      description: 'A sample knowledge base for testing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  'GET:/v2/knowledge/([^/]+)': {
    id: 'knowledge_1',
    title: 'Sample Knowledge Base',
    description: 'A sample knowledge base for testing',
    content: 'This is the content of the knowledge base...',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'POST:/v2/knowledge': {
    id: 'knowledge_' + Math.random().toString(36).substr(2, 9),
    title: 'New Knowledge Base',
    description: 'Successfully uploaded',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'DELETE:/v2/knowledge/([^/]+)': { success: true },
  'GET:/v2/chapters/([^/]+)': [
    {
      id: 'chapter_1',
      title: 'Introduction',
      content: 'This is the introduction chapter...',
      order: 1,
    },
  ],
  'PUT:/v2/chapters/([^/]+)/([^/]+)': {
    id: 'chapter_1',
    title: 'Updated Chapter',
    content: 'Updated content...',
    order: 1,
  },
}

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
  private sandboxMode: boolean

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.sandboxMode =
      SANDBOX_MODE || localStorage.getItem('api_sandbox_mode') === 'true'
    this.loadToken()
  }

  // Method to toggle sandbox mode
  setSandboxMode(enabled: boolean): void {
    this.sandboxMode = enabled
    localStorage.setItem('api_sandbox_mode', enabled.toString())
  }

  // Method to check if sandbox mode is enabled
  isSandboxMode(): boolean {
    return this.sandboxMode
  }

  private getMockResponse<T>(method: string, endpoint: string): T | null {
    if (!this.sandboxMode) return null

    const key = `${method}:${endpoint}`

    // First try exact match
    if (mockResponses[key]) {
      return mockResponses[key] as T
    }

    // Then try regex patterns for dynamic endpoints
    for (const pattern in mockResponses) {
      const [patternMethod, patternPath] = pattern.split(':')
      if (patternMethod === method) {
        const regex = new RegExp(`^${patternPath}$`)
        if (regex.test(endpoint)) {
          return mockResponses[pattern] as T
        }
      }
    }

    // Default fallback for unknown endpoints
    console.warn(`No mock response found for ${key}, returning default`)
    return {
      success: true,
      message: 'Mock response',
      data: null,
    } as unknown as T
  }

  private async simulateNetworkDelay(): Promise<void> {
    if (this.sandboxMode) {
      // Simulate network delay between 100-500ms
      const delay = 100 + Math.random() * 400
      await new Promise(resolve => setTimeout(resolve, delay))
    }
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
    // Check for mock response first
    const method = options.method || 'GET'
    const mockResponse = this.getMockResponse<T>(method, endpoint)
    if (mockResponse !== null) {
      await this.simulateNetworkDelay()
      console.log(`[SANDBOX] ${method} ${endpoint}:`, mockResponse)
      return mockResponse
    }

    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    try {
      // Sandbox mode - return mock response
      if (SANDBOX_MODE) {
        const mockKey = `${options.method?.toUpperCase()}:${endpoint}`
        if (mockResponses[mockKey]) {
          return new Promise(resolve =>
            setTimeout(() => resolve(mockResponses[mockKey]), 500)
          ) as Promise<T>
        }
      }

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
