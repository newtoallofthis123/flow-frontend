import { apiClient } from './client'
import type { CalendarEvent, MeetingOutcome, MeetingPreparation, SmartScheduling } from '../stores/CalendarStore'

export const calendarApi = {
  // GET /api/calendar/events
  getEvents: (params?: {
    start?: Date
    end?: Date
    filter?: 'all' | 'meetings' | 'high-priority' | 'this-week' | 'follow-ups'
  }) => {
    const queryParams: Record<string, string> = {}
    if (params?.start) queryParams.start = params.start.toISOString()
    if (params?.end) queryParams.end = params.end.toISOString()
    if (params?.filter) queryParams.filter = params.filter
    return apiClient.get<CalendarEvent[]>('/api/calendar/events', queryParams)
  },

  // GET /api/calendar/events/:id
  getEvent: (id: string) =>
    apiClient.get<CalendarEvent>(`/api/calendar/events/${id}`),

  // POST /api/calendar/events
  createEvent: (data: Omit<CalendarEvent, 'id' | 'aiInsights' | 'preparation'>) =>
    apiClient.post<CalendarEvent>('/api/calendar/events', data),

  // PUT /api/calendar/events/:id
  updateEvent: (id: string, data: Partial<CalendarEvent>) =>
    apiClient.put<CalendarEvent>(`/api/calendar/events/${id}`, data),

  // DELETE /api/calendar/events/:id
  deleteEvent: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/calendar/events/${id}`),

  // PATCH /api/calendar/events/:calendar_id/status
  updateEventStatus: (calendarId: string, status: CalendarEvent['status']) =>
    apiClient.patch<CalendarEvent>(`/api/calendar/events/${calendarId}/status`, { status }),

  // POST /api/calendar/events/:calendar_id/outcome
  addOutcome: (calendarId: string, outcome: MeetingOutcome) =>
    apiClient.post<CalendarEvent>(`/api/calendar/events/${calendarId}/outcome`, outcome),

  // GET /api/calendar/events/:calendar_id/preparation
  getPreparation: (calendarId: string) =>
    apiClient.get<MeetingPreparation>(`/api/calendar/events/${calendarId}/preparation`),

  // POST /api/calendar/smart-scheduling
  smartScheduling: (data: {
    contactId?: string
    dealId?: string
    duration: number
    preferredTimes?: Date[]
  }) => apiClient.post<SmartScheduling>('/api/calendar/smart-scheduling', data),

  // GET /api/calendar-stats
  getStats: () =>
    apiClient.get<{
      totalThisWeek: number
      meetingsThisWeek: number
      highPriorityThisWeek: number
      followUpsNeeded: number
    }>('/api/calendar-stats'),
}

