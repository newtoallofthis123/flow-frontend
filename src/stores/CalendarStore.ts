import { makeObservable, observable, computed, action, runInAction, reaction } from 'mobx'
import { calendarApi } from '../api/calendar.api'
import { BaseStore } from './BaseStore'
import { wsClient } from '../api/websocket'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  type: 'meeting' | 'call' | 'demo' | 'follow-up' | 'internal' | 'personal'
  contactId?: string
  contactName?: string
  contactCompany?: string
  dealId?: string
  location?: string
  meetingLink?: string
  attendees: Attendee[]
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  aiInsights: MeetingInsight[]
  preparation: MeetingPreparation
  outcome?: MeetingOutcome
  priority: 'high' | 'medium' | 'low'
  tags: string[]
}

export interface Attendee {
  id: string
  name: string
  email: string
  role: string
  status: 'accepted' | 'declined' | 'pending' | 'tentative'
}

export interface MeetingInsight {
  id: string
  type: 'opportunity' | 'risk' | 'preparation' | 'follow-up'
  title: string
  description: string
  confidence: number
  actionable: boolean
  suggestedAction?: string
}

export interface MeetingPreparation {
  suggestedTalkingPoints: string[]
  recentInteractions: string[]
  dealContext?: string
  competitorIntel?: string[]
  personalNotes: string[]
  documentsToShare: string[]
}

export interface MeetingOutcome {
  summary: string
  nextSteps: string[]
  sentimentScore: number // -100 to 100
  keyDecisions: string[]
  followUpRequired: boolean
  followUpDate?: Date
  meetingRating: 1 | 2 | 3 | 4 | 5
}

export interface SmartScheduling {
  suggestedTimes: ScheduleSuggestion[]
  conflictWarnings: ConflictWarning[]
  travelTimeEstimate?: number
  preparationTimeNeeded: number
}

export interface ScheduleSuggestion {
  startTime: Date
  endTime: Date
  reason: string
  confidence: number
}

export interface ConflictWarning {
  type: 'double-booking' | 'travel-time' | 'preparation' | 'back-to-back'
  message: string
  severity: 'high' | 'medium' | 'low'
}

export class CalendarStore extends BaseStore {
  events: CalendarEvent[] = []
  selectedEvent: CalendarEvent | null = null
  currentView: 'day' | 'week' | 'month' | 'agenda' = 'week'
  currentDate = new Date()
  searchQuery = ''
  filterBy: 'all' | 'meetings' | 'high-priority' | 'this-week' | 'follow-ups' = 'all'
  smartScheduling: SmartScheduling | null = null
  calendarStats: {
    totalThisWeek: number
    meetingsThisWeek: number
    highPriorityThisWeek: number
    followUpsNeeded: number
  } = {
    totalThisWeek: 0,
    meetingsThisWeek: 0,
    highPriorityThisWeek: 0,
    followUpsNeeded: 0,
  }

  private _initialized = false

  constructor() {
    super()
    makeObservable(this, {
      events: observable,
      selectedEvent: observable,
      currentView: observable,
      currentDate: observable,
      searchQuery: observable,
      filterBy: observable,
      smartScheduling: observable,
      calendarStats: observable,
      filteredEvents: computed,
      todayEvents: computed,
      upcomingEvents: computed,
      setCurrentView: action,
      setCurrentDate: action,
      setSearchQuery: action,
      setFilter: action,
      selectEvent: action,
    })
    this.setupReactions()
    this.setupWebSocket()
  }

  private setupReactions() {
    // Auto-fetch when filter changes
    reaction(
      () => this.filterBy,
      () => {
        if (this._initialized) {
          this.fetchEvents()
        }
      }
    )

    // Debounced search
    let searchTimeout: ReturnType<typeof setTimeout>
    reaction(
      () => this.searchQuery,
      () => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
          if (this._initialized) {
            this.fetchEvents()
          }
        }, 300)
      }
    )
  }

  async initialize() {
    if (this._initialized) return
    this._initialized = true
    
    await Promise.all([
      this.fetchEvents(),
      this.fetchStats(),
    ])
  }

  private setupWebSocket() {
    wsClient.on('calendar:created', (event: CalendarEvent) => {
      runInAction(() => {
        this.events.unshift(event)
      })
    })

    wsClient.on('calendar:updated', (data: { id: string; changes: Partial<CalendarEvent> }) => {
      runInAction(() => {
        const event = this.events.find(e => e.id === data.id)
        if (event) {
          Object.assign(event, data.changes)
        }
        if (this.selectedEvent?.id === data.id) {
          Object.assign(this.selectedEvent, data.changes)
        }
      })
    })

    wsClient.on('calendar:deleted', (id: string) => {
      runInAction(() => {
        this.events = this.events.filter(e => e.id !== id)
        if (this.selectedEvent?.id === id) {
          this.selectedEvent = null
        }
      })
    })

    wsClient.on('event:preparation_ready', (data: { eventId: string; preparation: any }) => {
      runInAction(() => {
        const transformedPreparation = this.transformPreparation(data.preparation)
        const event = this.events.find(e => e.id === data.eventId)
        if (event) {
          event.preparation = transformedPreparation
        }
        if (this.selectedEvent?.id === data.eventId) {
          this.selectedEvent.preparation = transformedPreparation
        }
      })
    })

    wsClient.on('event:post_meeting_insights', (data: { eventId: string; insights: MeetingInsight[] }) => {
      runInAction(() => {
        const event = this.events.find(e => e.id === data.eventId)
        if (event) {
          event.aiInsights = data.insights
        }
        if (this.selectedEvent?.id === data.eventId) {
          this.selectedEvent.aiInsights = data.insights
        }
      })
    })
  }

  get filteredEvents() {
    let filtered = this.events

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.contactName?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query)
      )
    }

    // Category filter
    const now = new Date()
    const oneWeekFromNow = new Date()
    oneWeekFromNow.setDate(now.getDate() + 7)

    switch (this.filterBy) {
      case 'meetings':
        filtered = filtered.filter(event =>
          event.type === 'meeting' || event.type === 'call' || event.type === 'demo'
        )
        break
      case 'high-priority':
        filtered = filtered.filter(event => event.priority === 'high')
        break
      case 'this-week':
        filtered = filtered.filter(event =>
          event.startTime >= now && event.startTime <= oneWeekFromNow
        )
        break
      case 'follow-ups':
        filtered = filtered.filter(event => event.type === 'follow-up')
        break
    }

    return filtered.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  get todayEvents() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.events.filter(event =>
      event.startTime >= today && event.startTime < tomorrow
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  get upcomingEvents() {
    const now = new Date()
    const oneWeekFromNow = new Date()
    oneWeekFromNow.setDate(now.getDate() + 7)

    return this.events.filter(event =>
      event.startTime >= now && event.startTime <= oneWeekFromNow
    ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }


  setCurrentView = (view: typeof this.currentView) => {
    this.currentView = view
  }

  setCurrentDate = (date: Date) => {
    this.currentDate = date
  }

  setSearchQuery = (query: string) => {
    this.searchQuery = query
  }

  setFilter = (filter: typeof this.filterBy) => {
    this.filterBy = filter
  }

  selectEvent = (event: CalendarEvent) => {
    this.selectedEvent = event
  }

  // Helper function to extract tag names from tag objects or strings
  private extractTagNames(tags: any[]): string[] {
    if (!Array.isArray(tags)) return []
    return tags.map(tag => {
      // If tag is already a string, return it
      if (typeof tag === 'string') return tag
      // If tag is an object, extract the name property
      if (tag && typeof tag === 'object' && 'name' in tag) return tag.name
      // Fallback: try to convert to string
      return String(tag)
    }).filter(Boolean)
  }

  // Transform API response to CalendarEvent interface
  private transformEvent(apiEvent: any): CalendarEvent {
    return {
      id: apiEvent.id,
      title: apiEvent.title,
      description: apiEvent.description,
      // Handle both camelCase and snake_case date fields
      startTime: new Date(apiEvent.startTime || apiEvent.start_time || Date.now()),
      endTime: new Date(apiEvent.endTime || apiEvent.end_time || Date.now()),
      type: apiEvent.type || 'meeting',
      // Handle contact information - check both formats
      contactId: apiEvent.contactId || apiEvent.contact_id,
      contactName: apiEvent.contactName || apiEvent.contact_name,
      contactCompany: apiEvent.contactCompany || apiEvent.contact_company,
      dealId: apiEvent.dealId || apiEvent.deal_id,
      location: apiEvent.location || null,
      // Handle meeting_link field
      meetingLink: apiEvent.meetingLink || apiEvent.meeting_link || null,
      // Extract tag names from tag objects or strings
      tags: this.extractTagNames(apiEvent.tags || []),
      status: apiEvent.status || 'scheduled',
      priority: apiEvent.priority || 'medium',
      // Provide defaults for fields that might not be in backend response
      attendees: Array.isArray(apiEvent.attendees) ? apiEvent.attendees : [],
      aiInsights: Array.isArray(apiEvent.aiInsights) ? apiEvent.aiInsights : [],
      preparation: apiEvent.preparation ? this.transformPreparation(apiEvent.preparation) : {
        suggestedTalkingPoints: [],
        recentInteractions: [],
        personalNotes: [],
        documentsToShare: [],
      },
      outcome: apiEvent.outcome,
    }
  }

  async fetchEvents() {
    return this.executeAsync(
      async () => {
        const events = await calendarApi.getEvents({
          filter: this.filterBy,
        })
        // Transform events including tag extraction
        return events.map(event => this.transformEvent(event))
      },
      {
        onSuccess: (events) => {
          this.events = events
        },
      }
    )
  }

  async fetchEvent(id: string) {
    return this.executeAsync(
      async () => {
        const event = await calendarApi.getEvent(id)
        // Transform event including tag extraction
        return this.transformEvent(event)
      },
      {
        onSuccess: (event) => {
          this.selectedEvent = event
          const index = this.events.findIndex(e => e.id === id)
          if (index !== -1) {
            this.events[index] = event
          }
        },
      }
    )
  }

  async fetchStats() {
    return this.executeAsync(
      async () => {
        const stats = await calendarApi.getStats()
        return stats
      },
      {
        onSuccess: (stats) => {
          this.calendarStats = stats
        },
        showLoading: false,
      }
    )
  }

  // Transform event data from camelCase to snake_case for API
  private transformEventForApi(eventData: Omit<CalendarEvent, 'id' | 'aiInsights' | 'preparation'>): any {
    return {
      title: eventData.title,
      description: eventData.description,
      start_time: eventData.startTime.toISOString(),
      end_time: eventData.endTime.toISOString(),
      type: eventData.type,
      contact_id: eventData.contactId,
      deal_id: eventData.dealId,
      location: eventData.location,
      meeting_link: eventData.meetingLink,
      attendees: eventData.attendees,
      status: eventData.status,
      priority: eventData.priority,
      tags: eventData.tags,
    }
  }

  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'aiInsights' | 'preparation'>) {
    return this.executeAsync(
      async () => {
        // Transform to snake_case for API
        const apiData = this.transformEventForApi(eventData)
        const event = await calendarApi.createEvent(apiData)
        // Transform event including tag extraction
        return this.transformEvent(event)
      },
      {
        onSuccess: (event) => {
          this.events.unshift(event)
        },
      }
    )
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>) {
    return this.executeAsync(
      async () => {
        const event = await calendarApi.updateEvent(eventId, updates)
        // Transform event including tag extraction
        return this.transformEvent(event)
      },
      {
        onSuccess: (event) => {
          const index = this.events.findIndex(e => e.id === eventId)
          if (index !== -1) {
            this.events[index] = event
          }
          if (this.selectedEvent?.id === eventId) {
            this.selectedEvent = event
          }
        },
      }
    )
  }

  async deleteEvent(eventId: string) {
    return this.executeAsync(
      async () => {
        await calendarApi.deleteEvent(eventId)
      },
      {
        onSuccess: () => {
          this.events = this.events.filter(e => e.id !== eventId)
          if (this.selectedEvent?.id === eventId) {
            this.selectedEvent = null
          }
        },
      }
    )
  }

  async updateEventStatus(calendarId: string, status: CalendarEvent['status']) {
    return this.executeAsync(
      async () => {
        const event = await calendarApi.updateEventStatus(calendarId, status)
        // Transform event including tag extraction
        return this.transformEvent(event)
      },
      {
        onSuccess: (event) => {
          const index = this.events.findIndex(e => e.id === calendarId)
          if (index !== -1) {
            this.events[index] = event
          }
          if (this.selectedEvent?.id === calendarId) {
            this.selectedEvent = event
          }
        },
      }
    )
  }

  async addOutcome(calendarId: string, outcome: MeetingOutcome) {
    return this.executeAsync(
      async () => {
        const event = await calendarApi.addOutcome(calendarId, outcome)
        // Transform event including tag extraction
        return this.transformEvent(event)
      },
      {
        onSuccess: (event) => {
          const index = this.events.findIndex(e => e.id === calendarId)
          if (index !== -1) {
            this.events[index] = event
          }
          if (this.selectedEvent?.id === calendarId) {
            this.selectedEvent = event
          }
        },
      }
    )
  }

  // Transform API response to MeetingPreparation interface
  private transformPreparation(apiPreparation: any): MeetingPreparation {
    const competitorIntel = Array.isArray(apiPreparation.competitorIntel || apiPreparation.competitor_intel) 
      ? (apiPreparation.competitorIntel || apiPreparation.competitor_intel).filter((item: string) => item && item.trim().toLowerCase() !== 'none')
      : undefined
    
    return {
      suggestedTalkingPoints: Array.isArray(apiPreparation.suggestedTalkingPoints || apiPreparation.suggested_talking_points) 
        ? (apiPreparation.suggestedTalkingPoints || apiPreparation.suggested_talking_points) 
        : [],
      recentInteractions: Array.isArray(apiPreparation.recentInteractions || apiPreparation.recent_interactions) 
        ? (apiPreparation.recentInteractions || apiPreparation.recent_interactions) 
        : [],
      dealContext: apiPreparation.dealContext || apiPreparation.deal_context || undefined,
      competitorIntel: competitorIntel && competitorIntel.length > 0 ? competitorIntel : undefined,
      personalNotes: Array.isArray(apiPreparation.personalNotes || apiPreparation.personal_notes) 
        ? (apiPreparation.personalNotes || apiPreparation.personal_notes) 
        : [],
      documentsToShare: Array.isArray(apiPreparation.documentsToShare || apiPreparation.documents_to_share) 
        ? (apiPreparation.documentsToShare || apiPreparation.documents_to_share) 
        : [],
    }
  }

  async fetchPreparation(calendarId: string) {
    return this.executeAsync(
      async () => {
        console.log('Fetching preparation for calendarId:', calendarId)
        const rawPreparation = await calendarApi.getPreparation(calendarId)
        console.log('Raw preparation response:', rawPreparation)
        const transformed = this.transformPreparation(rawPreparation)
        console.log('Transformed preparation:', transformed)
        return transformed
      },
      {
        onSuccess: (preparation) => {
          runInAction(() => {
            if (this.selectedEvent && this.selectedEvent.id === calendarId) {
              this.selectedEvent.preparation = preparation
            }
            const event = this.events.find(e => e.id === calendarId)
            if (event) {
              event.preparation = preparation
            }
          })
        },
        showLoading: false,
      }
    )
  }

  async generateSmartScheduling(eventData: {
    contactId?: string
    dealId?: string
    duration: number
    preferredTimes?: Date[]
  }) {
    return this.executeAsync(
      async () => {
        const scheduling = await calendarApi.smartScheduling(eventData)
        // Convert date strings to Date objects
        return {
          ...scheduling,
          suggestedTimes: scheduling.suggestedTimes.map(s => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
          })),
        }
      },
      {
        onSuccess: (scheduling) => {
          this.smartScheduling = scheduling
        },
      }
    )
  }

  completeEvent = async (eventId: string, outcome: MeetingOutcome) => {
    await this.addOutcome(eventId, outcome)
  }

}