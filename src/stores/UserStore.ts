import { makeObservable, observable, action, runInAction } from 'mobx'
import { authApi, type User } from '../api/auth.api'
import { apiClient } from '../api/client'
import { wsClient } from '../api/websocket'
import { BaseStore } from './BaseStore'

export class UserStore extends BaseStore {
  user: User | null = null
  isAuthenticated = false
  token: string | null = null

  constructor() {
    super()
    makeObservable(this, {
      user: observable,
      isAuthenticated: observable,
      token: observable,
      updatePreferences: action,
    })
    this.initializeAuth()
  }

  private initializeAuth() {
    const token = localStorage.getItem('auth_token')
    if (token) {
      this.token = token
      apiClient.setToken(token)
      this.fetchCurrentUser()
    }
  }

  async login(email: string, password: string) {
    return this.executeAsync(
      async () => {
        const response = await authApi.login({ email, password })
        return response
      },
      {
        onSuccess: (data) => {
          this.user = data.user
          this.token = data.token
          this.isAuthenticated = true
          apiClient.setToken(data.token)
          wsClient.connect(data.token)
          localStorage.setItem('refresh_token', data.refreshToken)
        },
      }
    )
  }

  async logout() {
    return this.executeAsync(
      async () => {
        await authApi.logout()
      },
      {
        onSuccess: () => {
          this.user = null
          this.token = null
          this.isAuthenticated = false
          apiClient.setToken(null)
          wsClient.disconnect()
          localStorage.removeItem('auth_token')
          localStorage.removeItem('refresh_token')
        },
      }
    )
  }

  async fetchCurrentUser() {
    return this.executeAsync(
      async () => {
        const user = await authApi.getCurrentUser()
        return user
      },
      {
        onSuccess: (user) => {
          this.user = user
          this.isAuthenticated = true
          if (this.token) {
            wsClient.connect(this.token)
          }
        },
        onError: () => {
          // Token invalid, clear auth
          this.logout()
        },
        showLoading: false,
      }
    )
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      this.logout()
      return
    }

    return this.executeAsync(
      async () => {
        const response = await authApi.refreshToken(refreshToken)
        return response
      },
      {
        onSuccess: (data) => {
          this.token = data.token
          apiClient.setToken(data.token)
          localStorage.setItem('refresh_token', data.refreshToken)
        },
        onError: () => {
          this.logout()
        },
        showLoading: false,
      }
    )
  }

  updatePreferences(preferences: Partial<User['preferences']>) {
    if (this.user) {
      runInAction(() => {
        this.user!.preferences = { ...this.user!.preferences, ...preferences }
      })
    }
  }
}

export type { User }