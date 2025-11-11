import { env } from '../config/env'

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public error: ApiError
  ) {
    super(error.message)
    this.name = 'ApiClientError'
  }
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private refreshPromise: Promise<string | null> | null = null
  private onLogout?: () => void

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
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

  setOnLogout(callback: () => void) {
    this.onLogout = callback
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  private async refreshToken(): Promise<string | null> {
    // If already refreshing, wait for that promise
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      this.onLogout?.()
      return null
    }

    this.refreshPromise = (async () => {
      try {
        // Call refresh endpoint directly without going through handleResponse
        // to avoid infinite loop if refresh endpoint also returns 401
        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })

        if (!response.ok) {
          throw new Error('Refresh token failed')
        }

        const data = await response.json()
        this.setToken(data.token)
        localStorage.setItem('refresh_token', data.refreshToken)
        return data.token
      } catch (error) {
        // Refresh failed, logout user
        this.setToken(null)
        localStorage.removeItem('refresh_token')
        this.onLogout?.()
        return null
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  private async handleResponse<T>(response: Response, originalRequest?: () => Promise<Response>, skip401Retry = false): Promise<T> {
    if (!response.ok) {
      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && originalRequest && !skip401Retry) {
        const newToken = await this.refreshToken()
        if (newToken) {
          // Retry original request with new token
          const retryResponse = await originalRequest()
          return this.handleResponse<T>(retryResponse, originalRequest, true)
        }
        // Refresh failed, logout will be handled by refreshToken
      }

      const error = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      }))
      throw new ApiClientError(response.status, error.error || error)
    }

    const json = await response.json()
    // Unwrap { data: ... } format if present (all routes follow this format)
    if (json && typeof json === 'object' && 'data' in json) {
      return json.data as T
    }
    return json as T
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const makeRequest = () => fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    })

    const response = await makeRequest()
    return this.handleResponse<T>(response, makeRequest)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const makeRequest = () => fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    const response = await makeRequest()
    return this.handleResponse<T>(response, makeRequest)
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const makeRequest = () => fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    const response = await makeRequest()
    return this.handleResponse<T>(response, makeRequest)
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const makeRequest = () => fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    const response = await makeRequest()
    return this.handleResponse<T>(response, makeRequest)
  }

  async delete<T>(endpoint: string): Promise<T> {
    const makeRequest = () => fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    const response = await makeRequest()
    return this.handleResponse<T>(response, makeRequest)
  }
}

export const apiClient = new ApiClient(env.apiBaseUrl)

