import { apiClient } from './client'
import type { Conversation, Message, MessageAnalysis, MessageTemplate, SmartCompose } from '../stores/MessagesStore'

export const messagesApi = {
  // GET /api/conversations
  getConversations: (params?: {
    filter?: 'all' | 'unread' | 'high-priority' | 'follow-up'
    search?: string
  }) => apiClient.get<Conversation[]>('/api/conversations', params),

  // GET /api/conversations/:id
  getConversation: (id: string) =>
    apiClient.get<Conversation>(`/api/conversations/${id}`),

  // POST /api/conversations/:conversation_id/messages
  sendMessage: (
    conversationId: string,
    data: {
      content: string
      type: 'email' | 'sms' | 'chat'
      subject?: string
    }
  ) => apiClient.post<Message>(`/api/conversations/${conversationId}/messages`, data),

  // PATCH /api/conversations/:conversation_id/priority
  updatePriority: (conversationId: string, priority: 'high' | 'medium' | 'low') =>
    apiClient.patch<Conversation>(`/api/conversations/${conversationId}/priority`, { priority }),

  // PATCH /api/conversations/:conversation_id/archive
  archiveConversation: (conversationId: string, archived: boolean) =>
    apiClient.patch<Conversation>(`/api/conversations/${conversationId}/archive`, { archived }),

  // POST /api/conversations/:conversation_id/tags
  addTag: (conversationId: string, tag: string) =>
    apiClient.post<Conversation>(`/api/conversations/${conversationId}/tags`, { tag }),

  // GET /api/messages/:id/ai-analysis
  getAIAnalysis: (messageId: string) =>
    apiClient.get<MessageAnalysis>(`/api/messages/${messageId}/ai-analysis`),

  // POST /api/messages/smart-compose
  smartCompose: (conversationId: string, draftContent: string) =>
    apiClient.post<SmartCompose>('/api/messages/smart-compose', { conversationId, draftContent }),

  // GET /api/messages/templates
  getTemplates: (category?: string) =>
    apiClient.get<MessageTemplate[]>('/api/messages/templates', category ? { category } : undefined),

  // GET /api/messages-stats
  getStats: () =>
    apiClient.get<{
      total: number
      unread: number
      highPriority: number
      needsFollowUp: number
      averageResponseTime: string
    }>('/api/messages-stats'),

  // GET /api/messages-sentiment-overview
  getSentimentOverview: () =>
    apiClient.get<{
      positive: number
      neutral: number
      negative: number
    }>('/api/messages-sentiment-overview'),
}

