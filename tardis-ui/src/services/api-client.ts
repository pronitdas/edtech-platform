// Mock responses for sandbox mode
interface MockResponses {
  [key: string]: any
}

const mockResponses: MockResponses = {
  // Auth endpoints
  'POST:/v2/auth/login': {
    token: 'mock_token_' + Date.now(),
    user: {
      id: 'mock_user_123',
      email: 'user@example.com',
      name: 'John Doe',
      created_at: new Date().toISOString()
    }
  },
  'POST:/v2/auth/register': {
    token: 'mock_token_' + Date.now(),
    user: {
      id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
      email: 'newuser@example.com',
      name: 'New User',
      created_at: new Date().toISOString()
    }
  },
  'POST:/v2/auth/logout': { success: true },
  'GET:/v2/auth/profile': {
    id: 'mock_user_123',
    email: 'user@example.com',
    name: 'John Doe',
    created_at: new Date().toISOString()
  },
  'PUT:/v2/auth/profile': {
    id: 'mock_user_123',
    email: 'user@example.com',
    name: 'Updated Name',
    created_at: new Date().toISOString()
  },

  // Knowledge endpoints
  'GET:/v2/knowledge': [
    {
      id: 'knowledge_1',
      title: 'Sample Knowledge Base 1',
      description: 'A sample knowledge base for testing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'knowledge_2',
      title: 'Sample Knowledge Base 2',
      description: 'Another sample knowledge base',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  'GET:/v2/knowledge/([^/]+)': {
    id: 'knowledge_1',
    title: 'Sample Knowledge Base',
    description: 'A sample knowledge base for testing',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'POST:/v2/knowledge': {
    id: 'knowledge_' + Math.random().toString(36).substr(2, 9),
    title: 'New Knowledge Base',
    description: 'A newly created knowledge base',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'DELETE:/v2/knowledge/([^/]+)': { success: true },

  // Chapter endpoints
  'GET:/v2/chapters/([^/]+)': [
    {
      id: 'chapter_1',
      title: 'Introduction',
      content: 'This is the introduction chapter...',
      order: 1
    },
    {
      id: 'chapter_2',
      title: 'Getting Started',
      content: 'This chapter covers the basics...',
      order: 2
    }
  ],
  'PUT:/v2/chapters/([^/]+)/([^/]+)': {
    id: 'chapter_1',
    title: 'Updated Chapter',
    content: 'Updated content...',
    order: 1
  }
}

class ApiClient {
  private baseURL: string
  private sandboxMode: boolean

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    // Check for sandbox mode from environment variable or localStorage
    this.sandboxMode = import.meta.env.VITE_SANDBOX_MODE === 'true' ||
      localStorage.getItem('api_sandbox_mode') === 'true'
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
      data: null
    } as unknown as T
  }

  private async simulateNetworkDelay(): Promise<void> {
    if (this.sandboxMode) {
      // Simulate network delay between 100-500ms
      const delay = Math.random() * 400 + 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error: ${response.status} - ${error}`)
    }
    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    // Check for mock response first
    const mockResponse = this.getMockResponse<T>('GET', endpoint)
    if (mockResponse !== null) {
      await this.simulateNetworkDelay()
      console.log(`[SANDBOX] GET ${endpoint}:`, mockResponse)
      return mockResponse
    }

    const response = await fetch(`${this.baseURL}/v2${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    })
    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    // Check for mock response first
    const mockResponse = this.getMockResponse<T>('POST', endpoint)
    if (mockResponse !== null) {
      await this.simulateNetworkDelay()
      console.log(`[SANDBOX] POST ${endpoint}:`, mockResponse)
      return mockResponse
    }

    const response = await fetch(`${this.baseURL}/v2${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : null,
    })
    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    // Check for mock response first
    const mockResponse = this.getMockResponse<T>('PUT', endpoint)
    if (mockResponse !== null) {
      await this.simulateNetworkDelay()
      console.log(`[SANDBOX] PUT ${endpoint}:`, mockResponse)
      return mockResponse
    }

    const response = await fetch(`${this.baseURL}/v2${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: data ? JSON.stringify(data) : null,
    })
    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string): Promise<T> {
    // Check for mock response first
    const mockResponse = this.getMockResponse<T>('DELETE', endpoint)
    if (mockResponse !== null) {
      await this.simulateNetworkDelay()
      console.log(`[SANDBOX] DELETE ${endpoint}:`, mockResponse)
      return mockResponse
    }

    const response = await fetch(`${this.baseURL}/v2${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    return this.handleResponse<T>(response)
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    // Check for mock response first
    const mockResponse = this.getMockResponse<T>('POST', endpoint)
    if (mockResponse !== null) {
      await this.simulateNetworkDelay()
      console.log(`[SANDBOX] UPLOAD ${endpoint}:`, mockResponse)
      return mockResponse
    }

    const response = await fetch(`${this.baseURL}/v2${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData,
    })
    return this.handleResponse<T>(response)
  }

  createWebSocket(endpoint: string): WebSocket {
    if (this.sandboxMode) {
      console.log(`[SANDBOX] WebSocket ${endpoint}: Creating mock WebSocket`)
      // Return a mock WebSocket-like object for sandbox mode
      return {
        readyState: WebSocket.OPEN,
        send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
          console.log(`[SANDBOX] WebSocket send:`, data)
        },
        close: () => {
          console.log(`[SANDBOX] WebSocket closed`)
        },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
        binaryType: 'blob',
        bufferedAmount: 0,
        extensions: '',
        onclose: null,
        onerror: null,
        onmessage: null,
        onopen: null,
        protocol: '',
        url: `ws://sandbox${endpoint}`,
        CLOSED: WebSocket.CLOSED,
        CLOSING: WebSocket.CLOSING,
        CONNECTING: WebSocket.CONNECTING,
        OPEN: WebSocket.OPEN,
      } as unknown as WebSocket
    }

    const wsUrl = this.baseURL.replace('http', 'ws')
    return new WebSocket(`${wsUrl}/ws${endpoint}`)
  }
}

export const apiClient = new ApiClient()
