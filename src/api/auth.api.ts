import { apiClient } from './client'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'sales' | 'manager'
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
    timezone: string
  }
  createdAt: Date
  lastLogin: Date
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/api/auth/login', data),

  logout: () =>
    apiClient.post<{ success: boolean }>('/api/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post<RefreshTokenResponse>('/api/auth/refresh', { refreshToken }),

  getCurrentUser: () =>
    apiClient.get<User>('/api/auth/me'),
}

