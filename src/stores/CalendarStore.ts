import { makeAutoObservable } from 'mobx'

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

export class CalendarStore {
  events: CalendarEvent[] = []
  selectedEvent: CalendarEvent | null = null
  currentView: 'day' | 'week' | 'month' | 'agenda' = 'week'
  currentDate = new Date()
  searchQuery = ''
  filterBy: 'all' | 'meetings' | 'high-priority' | 'this-week' | 'follow-ups' = 'all'
  isLoading = false
  smartScheduling: SmartScheduling | null = null

  constructor() {
    makeAutoObservable(this)
    this.loadMockData()
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

  get calendarStats() {
    const now = new Date()
    const thisWeek = this.events.filter(event => {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      return event.startTime >= weekStart && event.startTime < weekEnd
    })

    return {
      totalThisWeek: thisWeek.length,
      meetingsThisWeek: thisWeek.filter(e => e.type === 'meeting').length,
      highPriorityThisWeek: thisWeek.filter(e => e.priority === 'high').length,
      followUpsNeeded: this.events.filter(e => e.outcome?.followUpRequired).length
    }
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

  createEvent = (eventData: Omit<CalendarEvent, 'id' | 'aiInsights' | 'preparation'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: Date.now().toString(),
      aiInsights: [],
      preparation: this.generateMeetingPreparation(eventData)
    }

    // Generate AI insights for the new event
    newEvent.aiInsights = this.generateMeetingInsights(newEvent)

    this.events.push(newEvent)
    return newEvent
  }

  updateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    const event = this.events.find(e => e.id === eventId)
    if (event) {
      Object.assign(event, updates)
      // Regenerate preparation if contact or deal changed
      if (updates.contactId || updates.dealId) {
        event.preparation = this.generateMeetingPreparation(event)
      }
    }
  }

  completeEvent = (eventId: string, outcome: MeetingOutcome) => {
    const event = this.events.find(e => e.id === eventId)
    if (event) {
      event.status = 'completed'
      event.outcome = outcome

      // Create follow-up event if needed
      if (outcome.followUpRequired && outcome.followUpDate) {
        this.createEvent({
          title: `Follow-up: ${event.title}`,
          startTime: outcome.followUpDate,
          endTime: new Date(outcome.followUpDate.getTime() + 30 * 60 * 1000), // 30 minutes
          type: 'follow-up',
          contactId: event.contactId,
          contactName: event.contactName,
          contactCompany: event.contactCompany,
          dealId: event.dealId,
          attendees: event.attendees,
          status: 'scheduled',
          priority: 'medium',
          tags: ['follow-up', 'ai-generated']
        })
      }
    }
  }

  generateSmartScheduling = (_eventData: Partial<CalendarEvent>): SmartScheduling => {
    const now = new Date()
    const suggestions: ScheduleSuggestion[] = []

    // Generate time suggestions based on availability and preferences
    for (let i = 1; i <= 7; i++) {
      const suggestedDate = new Date(now)
      suggestedDate.setDate(now.getDate() + i)
      suggestedDate.setHours(14, 0, 0, 0) // 2 PM default

      suggestions.push({
        startTime: suggestedDate,
        endTime: new Date(suggestedDate.getTime() + 60 * 60 * 1000), // 1 hour
        reason: 'Optimal time based on both parties\' availability patterns',
        confidence: 85 - (i * 5) // Decreasing confidence for later dates
      })
    }

    const conflicts: ConflictWarning[] = []

    // Check for potential conflicts
    const existingEvents = this.events.filter(e =>
      e.startTime.getDate() === suggestions[0].startTime.getDate()
    )

    if (existingEvents.length > 3) {
      conflicts.push({
        type: 'back-to-back',
        message: 'You have multiple meetings scheduled this day',
        severity: 'medium'
      })
    }

    return {
      suggestedTimes: suggestions,
      conflictWarnings: conflicts,
      preparationTimeNeeded: 15 // minutes
    }
  }

  private generateMeetingPreparation = (event: Partial<CalendarEvent>): MeetingPreparation => {
    const preparation: MeetingPreparation = {
      suggestedTalkingPoints: [],
      recentInteractions: [],
      personalNotes: [],
      documentsToShare: []
    }

    // Generate talking points based on event type
    switch (event.type) {
      case 'demo':
        preparation.suggestedTalkingPoints = [
          'Product overview and key benefits',
          'Specific use cases relevant to their industry',
          'Integration capabilities',
          'Pricing and implementation timeline'
        ]
        break
      case 'follow-up':
        preparation.suggestedTalkingPoints = [
          'Recap previous meeting outcomes',
          'Address any outstanding questions',
          'Discuss next steps and timeline',
          'Confirm decision-making process'
        ]
        break
      case 'meeting':
        preparation.suggestedTalkingPoints = [
          'Current business challenges',
          'Goals and objectives',
          'Budget and timeline',
          'Decision criteria and process'
        ]
        break
    }

    if (event.contactId) {
      preparation.recentInteractions = [
        'Last email exchange about budget approval',
        'Previous demo feedback was very positive',
        'Mentioned expanding to additional teams'
      ]
    }

    return preparation
  }

  private generateMeetingInsights = (event: CalendarEvent): MeetingInsight[] => {
    const insights: MeetingInsight[] = []

    // Generate insights based on event characteristics
    if (event.priority === 'high' && event.type === 'meeting') {
      insights.push({
        id: `insight-${Date.now()}`,
        type: 'opportunity',
        title: 'High-Value Meeting',
        description: 'This high-priority meeting could significantly impact your pipeline',
        confidence: 90,
        actionable: true,
        suggestedAction: 'Prepare comprehensive value proposition and ROI analysis'
      })
    }

    if (event.type === 'demo') {
      insights.push({
        id: `insight-${Date.now() + 1}`,
        type: 'preparation',
        title: 'Demo Preparation',
        description: 'Customize demo to highlight features most relevant to their use case',
        confidence: 85,
        actionable: true,
        suggestedAction: 'Review their industry challenges and prepare targeted demo flow'
      })
    }

    return insights
  }

  private loadMockData = () => {
    const now = new Date()

    this.events = [
      {
        id: '1',
        title: 'Enterprise Package Demo - TechCorp',
        description: 'Product demonstration for Sarah Williams and the TechCorp technical team',
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hour
        type: 'demo',
        contactId: '1',
        contactName: 'Sarah Williams',
        contactCompany: 'TechCorp Solutions',
        dealId: '1',
        meetingLink: 'https://zoom.us/j/123456789',
        attendees: [
          {
            id: '1',
            name: 'Sarah Williams',
            email: 'sarah.williams@techcorp.com',
            role: 'VP of Engineering',
            status: 'accepted'
          },
          {
            id: '2',
            name: 'Tech Team',
            email: 'tech@techcorp.com',
            role: 'Technical Evaluators',
            status: 'pending'
          }
        ],
        status: 'confirmed',
        priority: 'high',
        tags: ['enterprise', 'demo', 'high-value'],
        aiInsights: [
          {
            id: '1',
            type: 'opportunity',
            title: 'High Close Probability',
            description: 'Sarah has budget approval and technical team is engaged. Focus on enterprise features.',
            confidence: 92,
            actionable: true,
            suggestedAction: 'Prepare enterprise security and integration deep-dive'
          }
        ],
        preparation: {
          suggestedTalkingPoints: [
            'Enterprise security features',
            'Advanced analytics and reporting',
            'API integrations and customizations',
            'Implementation timeline and support'
          ],
          recentInteractions: [
            'Budget approval confirmed via email',
            'Technical requirements discussed in previous call',
            'Team expansion plans mentioned'
          ],
          dealContext: '$75K enterprise package, 89% close probability',
          personalNotes: [
            'Sarah prefers technical deep-dives',
            'Team is growing rapidly - highlight scalability'
          ],
          documentsToShare: [
            'Enterprise feature comparison',
            'Security compliance documentation',
            'Implementation timeline'
          ]
        }
      },
      {
        id: '2',
        title: 'Follow-up Call - Startup.io',
        description: 'ROI discussion and pricing options for Mike Chen',
        startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow
        endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000), // +30 minutes
        type: 'follow-up',
        contactId: '2',
        contactName: 'Mike Chen',
        contactCompany: 'Startup.io',
        dealId: '2',
        meetingLink: 'https://zoom.us/j/987654321',
        attendees: [
          {
            id: '3',
            name: 'Mike Chen',
            email: 'mchen@startup.io',
            role: 'CTO',
            status: 'accepted'
          }
        ],
        status: 'scheduled',
        priority: 'medium',
        tags: ['startup', 'pricing', 'roi'],
        aiInsights: [
          {
            id: '2',
            type: 'risk',
            title: 'Price Sensitivity',
            description: 'Mike is concerned about scaling costs. Focus on ROI and value proposition.',
            confidence: 78,
            actionable: true,
            suggestedAction: 'Prepare ROI calculator and startup success stories'
          }
        ],
        preparation: {
          suggestedTalkingPoints: [
            'ROI analysis and payback period',
            'Startup-friendly pricing options',
            'Success stories from similar companies',
            'Gradual implementation approach'
          ],
          recentInteractions: [
            'Expressed interest but price concerns',
            'Growing team rapidly',
            'Technical fit confirmed'
          ],
          dealContext: '$15K starter plan, 45% close probability, price-sensitive',
          personalNotes: [
            'Very cost-conscious due to startup stage',
            'Technical background - appreciate detailed explanations'
          ],
          documentsToShare: [
            'ROI calculator',
            'Startup customer case studies',
            'Flexible pricing options'
          ]
        }
      },
      {
        id: '3',
        title: 'Executive Escalation - GlobalCorp',
        description: 'Emergency meeting to address service issues and retain Emma Rodriguez',
        startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000), // In 4 hours
        endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000 + 45 * 60 * 1000), // +45 minutes
        type: 'meeting',
        contactId: '3',
        contactName: 'Emma Rodriguez',
        contactCompany: 'GlobalCorp',
        dealId: '3',
        location: 'Customer Success Conference Room',
        attendees: [
          {
            id: '4',
            name: 'Emma Rodriguez',
            email: 'emma@globalcorp.com',
            role: 'Director of Operations',
            status: 'accepted'
          },
          {
            id: '5',
            name: 'Our CEO',
            email: 'ceo@ourcompany.com',
            role: 'Chief Executive Officer',
            status: 'accepted'
          },
          {
            id: '6',
            name: 'Customer Success VP',
            email: 'cs-vp@ourcompany.com',
            role: 'VP Customer Success',
            status: 'accepted'
          }
        ],
        status: 'confirmed',
        priority: 'high',
        tags: ['at-risk', 'executive', 'urgent'],
        aiInsights: [
          {
            id: '3',
            type: 'risk',
            title: 'Account at Critical Risk',
            description: 'Relationship severely damaged by service issues. Competitor evaluation in progress.',
            confidence: 95,
            actionable: true,
            suggestedAction: 'Present comprehensive recovery plan with timeline and guarantees'
          }
        ],
        preparation: {
          suggestedTalkingPoints: [
            'Acknowledge service failures and take responsibility',
            'Present detailed recovery and improvement plan',
            'Offer service credits and guarantees',
            'Outline preventive measures for future'
          ],
          recentInteractions: [
            'Frustrated email about service issues',
            'Mentioned evaluating competitors',
            'Team confidence severely impacted'
          ],
          dealContext: '$120K platform migration, 25% close probability, high churn risk',
          competitorIntel: [
            'Competitor X mentioned as alternative',
            'Evaluating migration costs',
            'Service reliability is key concern'
          ],
          personalNotes: [
            'Very direct communication style',
            'Results-oriented, needs concrete guarantees',
            'Under pressure from her leadership'
          ],
          documentsToShare: [
            'Service improvement roadmap',
            'Recovery plan timeline',
            'Service level guarantees'
          ]
        }
      },
      {
        id: '4',
        title: 'Expansion Planning - InnovateTech',
        description: 'Discuss team expansion and volume pricing with David Park',
        startTime: new Date(now.getTime() + 72 * 60 * 60 * 1000), // In 3 days
        endTime: new Date(now.getTime() + 72 * 60 * 60 * 1000 + 60 * 60 * 1000), // +1 hour
        type: 'meeting',
        contactId: '4',
        contactName: 'David Park',
        contactCompany: 'InnovateTech',
        dealId: '4',
        meetingLink: 'https://zoom.us/j/555666777',
        attendees: [
          {
            id: '7',
            name: 'David Park',
            email: 'dpark@innovatetech.com',
            role: 'Head of Product',
            status: 'accepted'
          }
        ],
        status: 'scheduled',
        priority: 'high',
        tags: ['expansion', 'existing-customer', 'high-value'],
        aiInsights: [
          {
            id: '4',
            type: 'opportunity',
            title: 'Expansion Ready',
            description: 'David is thrilled with results and ready to expand to 3 additional teams immediately.',
            confidence: 96,
            actionable: true,
            suggestedAction: 'Prepare expansion proposal with attractive volume pricing'
          }
        ],
        preparation: {
          suggestedTalkingPoints: [
            'Celebrate current success and ROI achieved',
            'Discuss expansion timeline and team requirements',
            'Present volume pricing and discounts',
            'Plan implementation and onboarding approach'
          ],
          recentInteractions: [
            'Q4 results exceeded expectations',
            'Team thrilled with productivity gains',
            'Ready to expand to 3 additional teams'
          ],
          dealContext: '$95K expansion deal, 78% close probability, strong champion',
          personalNotes: [
            'Internal champion, drives adoption',
            'Product-focused, appreciates feature discussions',
            'Very satisfied with current experience'
          ],
          documentsToShare: [
            'Expansion proposal with volume pricing',
            'Implementation timeline',
            'Success metrics from current deployment'
          ]
        }
      }
    ]
  }
}