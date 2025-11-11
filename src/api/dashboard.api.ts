import { apiClient } from './client'
import type { ActionItem, ForecastData } from '../stores/DashboardStore'
import type { Deal } from '../stores/DealsStore'
import type { Contact } from '../stores/ContactsStore'

export const dashboardApi = {
  // GET /api/dashboard/forecast
  getForecast: () =>
    apiClient.get<ForecastData>('/api/dashboard/forecast'),

  // GET /api/dashboard/action-items
  getActionItems: () =>
    apiClient.get<ActionItem[]>('/api/dashboard/action-items'),

  // POST /api/dashboard/action-items/:id/dismiss
  dismissActionItem: (id: string) =>
    apiClient.post<{ success: boolean }>(`/api/dashboard/action-items/${id}/dismiss`),

  // GET /api/dashboard/summary
  getSummary: () =>
    apiClient.get<{
      deals: Deal[]
      contacts: Contact[]
      totalDealsValue: number
      atRiskContacts: number
      highProbabilityDeals: number
    }>('/api/dashboard/summary'),
}

