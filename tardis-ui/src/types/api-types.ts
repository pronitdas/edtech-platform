// API Client TypeScript interfaces

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface ApiError {
  status: number
  message: string
  details?: string
}

export interface ApiClientMethods {
  get<T>(endpoint: string): Promise<ApiResponse<T>>
  post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>>
  put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>>
  delete<T>(endpoint: string): Promise<ApiResponse<T>>
  upload<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>>
}

// User-related interfaces
export interface UserProfile {
  id: number
  email: string
  name: string
  role: 'student' | 'teacher'
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: UserProfile
  token: string
  expires_at: string
}

// Generic API responses
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}