import { apiClient } from './client'
import type { Contact, CommunicationEvent, AIInsight } from '../stores/ContactsStore'

export const contactsApi = {
  // GET /api/contacts
  getContacts: (params?: {
    search?: string
    filter?: 'all' | 'high-value' | 'at-risk' | 'recent'
    sort?: string
  }) => apiClient.get<Contact[]>('/api/contacts', params),

  // GET /api/contacts/:id
  getContact: (id: string) => 
    apiClient.get<Contact>(`/api/contacts/${id}`),

  // POST /api/contacts
  createContact: (data: Omit<Contact, 'id' | 'healthScore' | 'churnRisk'>) =>
    apiClient.post<Contact>('/api/contacts', data),

  // PUT /api/contacts/:id
  updateContact: (id: string, data: Partial<Contact>) =>
    apiClient.put<Contact>(`/api/contacts/${id}`, data),

  // DELETE /api/contacts/:id
  deleteContact: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/contacts/${id}`),

  // POST /api/contacts/:contact_id/communication
  addCommunication: (
    contactId: string,
    data: {
      subject: string
      summary: string
      occurred_at: string // ISO datetime string
    }
  ) => apiClient.post<CommunicationEvent>(`/api/contacts/${contactId}/communication`, data),

  // GET /api/contacts/:contact_id/ai-insights
  getAIInsights: (contactId: string) =>
    apiClient.get<AIInsight[]>(`/api/contacts/${contactId}/ai-insights`),

  // GET /api/contacts-stats
  getStats: () =>
    apiClient.get<{
      total: number
      highValue: number
      atRisk: number
      needsFollowUp: number
    }>('/api/contacts-stats'),
}

