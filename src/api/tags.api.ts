import { apiClient } from './client'

export interface Tag {
  id: string
  name: string
  color?: string
  category?: string
  count?: number
}

export const tagsApi = {
  // GET /api/tags
  getTags: (params?: {
    category?: string
  }) => apiClient.get<Tag[]>('/api/tags', params),

  // POST /api/tags
  createTag: (data: {
    name: string
    color?: string
    category?: string
  }) => apiClient.post<Tag>('/api/tags', data),

  // DELETE /api/tags/:id
  deleteTag: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/tags/${id}`),
}

