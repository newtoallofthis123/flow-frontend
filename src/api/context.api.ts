import { apiClient } from './client'

export interface ContextRequest {
  route: string
  params?: Record<string, string>
}

export interface ContextResponse {
  context: string
  metadata?: Record<string, any>
}

export const contextApi = {
  /**
   * Fetch context for a given route
   */
  async getContext(request: ContextRequest): Promise<ContextResponse> {
    return apiClient.post<ContextResponse>('/api/context', request)
  },
}

