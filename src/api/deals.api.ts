import { apiClient } from './client'
import type { Deal, DealActivity, DealInsight, DealStage, StageStats } from '../stores/DealsStore'

export const dealsApi = {
  // GET /api/deals
  getDeals: (params?: {
    filter?: 'all' | 'hot' | 'at-risk' | 'closing-soon'
    search?: string
  }) => apiClient.get<Deal[]>('/api/deals', params),

  // GET /api/deals/:id
  getDeal: (id: string) =>
    apiClient.get<Deal>(`/api/deals/${id}`),

  // POST /api/deals
  createDeal: (data: Omit<Deal, 'id' | 'probability' | 'confidence' | 'riskFactors' | 'positiveSignals' | 'aiInsights'>) =>
    apiClient.post<Deal>('/api/deals', data),

  // PUT /api/deals/:id
  updateDeal: (id: string, data: Partial<Deal>) =>
    apiClient.put<Deal>(`/api/deals/${id}`, data),

  // DELETE /api/deals/:id
  deleteDeal: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/deals/${id}`),

  // PATCH /api/deals/:id/stage
  updateDealStage: (id: string, stage: DealStage) =>
    apiClient.patch<Deal>(`/api/deals/${id}/stage`, { stage }),

  // POST /api/deals/:id/activities
  addActivity: (
    id: string,
    data: {
      type: DealActivity['type']
      date: Date
      description: string
      outcome?: string
      nextStep?: string
    }
  ) => apiClient.post<DealActivity>(`/api/deals/${id}/activities`, data),

  // GET /api/deals/forecast
  getForecast: () =>
    apiClient.get<{
      totalPipeline: number
      weightedForecast: number
      dealsClosingThisMonth: number
      monthlyForecast: number
    }>('/api/deals/forecast'),

  // GET /api/deals/stage-stats
  getStageStats: () =>
    apiClient.get<StageStats[]>('/api/deals/stage-stats'),
}

