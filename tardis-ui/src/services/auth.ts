import { apiClient } from './api-client';
import { User } from '../types/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem('auth_token', response.token);
    return response.user;
  }

  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('auth_token', response.token);
    return response.user;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('auth_token');
  }

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/profile');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}

export const authService = new AuthService();