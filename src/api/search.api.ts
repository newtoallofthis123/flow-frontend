import { apiClient } from './client'

export interface SearchResult {
  type: 'contact' | 'deal' | 'conversation' | 'calendar' | 'message'
  id: string
  title: string
  subtitle?: string
  metadata?: Record<string, any>
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

export const searchApi = {
  // GET /api/search
  search: (params: {
    q: string
    type?: SearchResult['type']
    limit?: number
  }) => apiClient.get<SearchResponse>('/api/search', params),
}

