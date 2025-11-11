import { runInAction } from 'mobx'
import { ApiClientError } from '../api/client'

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export class BaseStore {
  isLoading = false
  error: string | null = null

  constructor() {
    // Note: Child classes should call makeAutoObservable(this) in their constructors
    // after calling super()
  }

  protected setLoading(loading: boolean) {
    this.isLoading = loading
  }

  protected setError(error: string | null) {
    this.error = error
  }

  protected async executeAsync<T>(
    action: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
      showLoading?: boolean
    }
  ): Promise<T | null> {
    const { onSuccess, onError, showLoading = true } = options || {}

    try {
      if (showLoading) {
        this.setLoading(true)
      }
      this.setError(null)

      const result = await action()

      runInAction(() => {
        if (onSuccess) {
          onSuccess(result)
        }
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.error.message
        : error instanceof Error
        ? error.message
        : 'An unknown error occurred'

      runInAction(() => {
        this.setError(errorMessage)
        if (onError) {
          onError(error as Error)
        }
      })

      return null
    } finally {
      if (showLoading) {
        runInAction(() => {
          this.isLoading = false
        })
      }
    }
  }

  clearError() {
    this.error = null
  }
}

