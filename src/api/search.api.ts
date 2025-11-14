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

// Natural language search response types
export interface SearchContact {
  id: string
  name: string
  title: string
  user_id: string
  tags: Array<{
    id: string
    name: string
    color: string
    inserted_at: string
  }>
  inserted_at: string
  updated_at: string
  email: string
  avatar_url: string | null
  sentiment: 'positive' | 'neutral' | 'negative'
  health_score: number
  churn_risk: number
  relationship_health: 'high' | 'medium' | 'low'
  last_contact_at: string | null
  next_follow_up_at: string | null
  company: string
  deleted_at: string | null
  notes: string | null
  phone: string
  total_deals_count: number
  total_deals_value: string
  search_score: number
  search_reason: string
}

export interface SearchDeal {
  // Add deal fields based on API response structure
  [key: string]: any
}

export interface SearchEvent {
  // Add event fields based on API response structure
  [key: string]: any
}

export interface NaturalLanguageSearchResponse {
  events: SearchEvent[]
  metadata: {
    query: string
    duration_ms: number
    entities_matched: {
      events: number
      contacts: number
      deals: number
    }
    entities_searched: {
      events: number
      contacts: number
      deals: number
    }
  }
  cached: boolean
  query: string
  contacts: SearchContact[]
  deals: SearchDeal[]
  query_interpretation: string
}

export const searchApi = {
  // GET /api/search
  search: (params: {
    q: string
    type?: SearchResult['type']
    limit?: number
  }) => apiClient.get<SearchResponse>('/api/search', params),
  
  // POST /api/search/natural-language
  naturalLanguageSearch: (query: string) => 
    apiClient.post<NaturalLanguageSearchResponse>('/api/search/natural-language', { query }),
}

