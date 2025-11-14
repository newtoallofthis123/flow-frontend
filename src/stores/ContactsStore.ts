import { makeObservable, observable, computed, action, runInAction, reaction } from 'mobx'
import { contactsApi } from '../api/contacts.api'
import { BaseStore } from './BaseStore'
import { wsClient } from '../api/websocket'

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  title: string
  avatar?: string
  relationshipHealth: 'high' | 'medium' | 'low'
  healthScore: number // 0-100
  lastContact: Date
  nextFollowUp?: Date
  sentiment: 'positive' | 'neutral' | 'negative'
  churnRisk: number // 0-100
  totalDeals: number
  totalValue: number
  tags: string[]
  notes: string[]
  communicationHistory: CommunicationEvent[]
  aiInsights: AIInsight[]
}

export interface CommunicationEvent {
  id: string
  type: 'email' | 'call' | 'meeting' | 'note'
  date: Date
  subject?: string
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  aiAnalysis?: string
}

export interface AIInsight {
  id: string
  type: 'opportunity' | 'risk' | 'suggestion' | 'trend'
  title: string
  description: string
  confidence: number // 0-100
  actionable: boolean
  suggestedAction?: string
  date: Date
}

export class ContactsStore extends BaseStore {
  contacts: Contact[] = []
  selectedContact: Contact | null = null
  searchQuery = ''
  filterBy: 'all' | 'high-value' | 'at-risk' | 'recent' = 'all'
  stats = {
    total: 0,
    highValue: 0,
    atRisk: 0,
    needsFollowUp: 0,
  }
  private _initialized = false

  constructor() {
    super()
    makeObservable(this, {
      contacts: observable,
      selectedContact: observable,
      searchQuery: observable,
      filterBy: observable,
      stats: observable,
      filteredContacts: computed,
      contactStats: computed,
      setSearchQuery: action,
      setFilter: action,
      selectContact: action,
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
          this.fetchContacts()
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
            this.fetchContacts()
          }
        }, 300)
      }
    )
  }

  async initialize() {
    if (this._initialized) return
    this._initialized = true
    
    await Promise.all([
      this.fetchContacts(),
      this.fetchContactStats(),
    ])
  }

  private setupWebSocket() {
    wsClient.on('contact:updated', (data: { id: string; changes: Partial<Contact> }) => {
      runInAction(() => {
        const contact = this.contacts.find(c => c.id === data.id)
        if (contact) {
          Object.assign(contact, data.changes)
        }
        if (this.selectedContact?.id === data.id) {
          Object.assign(this.selectedContact, data.changes)
        }
      })
    })

    wsClient.on('contact:health_changed', (data: { id: string; oldScore: number; newScore: number }) => {
      runInAction(() => {
        const contact = this.contacts.find(c => c.id === data.id)
        if (contact) {
          contact.healthScore = data.newScore
          contact.relationshipHealth = 
            data.newScore > 70 ? 'high' : data.newScore > 40 ? 'medium' : 'low'
        }
      })
    })
  }

  // Computed values
  get filteredContacts() {
    // Ensure contacts is always an array
    if (!Array.isArray(this.contacts)) {
      return []
    }
    return this.contacts
      .filter(contact => {
        // Search filter
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase()
          return (
            contact.name.toLowerCase().includes(query) ||
            contact.company.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query)
          )
        }
        return true
      })
      .sort((a, b) => b.healthScore - a.healthScore)
  }

  get contactStats() {
    return this.stats
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

  // Transform API response to Contact interface
  private transformContact(apiContact: any): Contact {
    return {
      id: apiContact.id,
      name: apiContact.name,
      email: apiContact.email,
      phone: apiContact.phone,
      company: apiContact.company,
      title: apiContact.title,
      avatar: apiContact.avatar_url || undefined,
      relationshipHealth: apiContact.relationship_health || 'medium',
      healthScore: apiContact.health_score || 0,
      lastContact: new Date(apiContact.last_contact_at || apiContact.lastContact || Date.now()),
      nextFollowUp: apiContact.next_follow_up_at ? new Date(apiContact.next_follow_up_at) : undefined,
      sentiment: apiContact.sentiment || 'neutral',
      churnRisk: apiContact.churn_risk || 0,
      totalDeals: apiContact.total_deals_count || 0,
      totalValue: parseFloat(apiContact.total_deals_value || '0'),
      tags: this.extractTagNames(apiContact.tags),
      notes: apiContact.notes 
        ? (Array.isArray(apiContact.notes) ? apiContact.notes : [apiContact.notes])
        : [],
      communicationHistory: (() => {
        // Handle both camelCase and snake_case field names
        const events = apiContact.communicationHistory || apiContact.communication_events || []
        if (!Array.isArray(events)) return []
        
        return events.map((event: any) => ({
          id: event.id,
          type: event.type,
          // Handle both date formats: 'date' or 'occurred_at'
          date: new Date(event.date || event.occurred_at || Date.now()),
          subject: event.subject,
          summary: event.summary,
          sentiment: event.sentiment || 'neutral',
          // Handle both camelCase and snake_case for ai_analysis
          aiAnalysis: event.aiAnalysis || event.ai_analysis,
        }))
      })(),
      aiInsights: Array.isArray(apiContact.aiInsights) || Array.isArray(apiContact.ai_insights)
        ? (apiContact.aiInsights || apiContact.ai_insights || []).map((insight: any) => ({
            id: insight.id,
            type: insight.type || insight.insight_type,
            title: insight.title,
            description: insight.description,
            confidence: insight.confidence || 0,
            actionable: insight.actionable || false,
            suggestedAction: insight.suggestedAction || insight.suggested_action,
            date: insight.date ? new Date(insight.date) : (insight.inserted_at ? new Date(insight.inserted_at) : new Date()),
          }))
        : [],
    }
  }

  // Actions
  async fetchContacts() {
    return this.executeAsync(
      async () => {
        const contacts = await contactsApi.getContacts({
          search: this.searchQuery || undefined,
          filter: this.filterBy,
        })
        // Transform API response to match Contact interface
        return Array.isArray(contacts) 
          ? contacts.map(contact => this.transformContact(contact))
          : []
      },
      {
        onSuccess: (contacts) => {
          this.contacts = contacts
        },
      }
    )
  }

  async fetchContactStats() {
    return this.executeAsync(
      async () => {
        const stats = await contactsApi.getStats()
        return stats
      },
      {
        onSuccess: (stats) => {
          this.stats = stats
        },
        showLoading: false,
      }
    )
  }

  async fetchContact(id: string) {
    return this.executeAsync(
      async () => {
        const contact = await contactsApi.getContact(id)
        return this.transformContact(contact)
      },
      {
        onSuccess: (contact) => {
          this.selectedContact = contact
          // Update in list if exists
          const index = this.contacts.findIndex(c => c.id === contact.id)
          if (index !== -1) {
            this.contacts[index] = contact
          }
        },
      }
    )
  }

  async createContact(data: Omit<Contact, 'id' | 'healthScore' | 'churnRisk'>) {
    return this.executeAsync(
      async () => {
        const contact = await contactsApi.createContact(data)
        return this.transformContact(contact)
      },
      {
        onSuccess: (contact) => {
          this.contacts.unshift(contact)
          this.fetchContactStats()
        },
      }
    )
  }

  async updateContact(id: string, data: Partial<Contact>) {
    return this.executeAsync(
      async () => {
        const contact = await contactsApi.updateContact(id, data)
        return this.transformContact(contact)
      },
      {
        onSuccess: (contact) => {
          const index = this.contacts.findIndex(c => c.id === id)
          if (index !== -1) {
            this.contacts[index] = contact
          }
          if (this.selectedContact?.id === id) {
            this.selectedContact = contact
          }
        },
      }
    )
  }

  async deleteContact(id: string) {
    return this.executeAsync(
      async () => {
        await contactsApi.deleteContact(id)
      },
      {
        onSuccess: () => {
          this.contacts = this.contacts.filter(c => c.id !== id)
          if (this.selectedContact?.id === id) {
            this.selectedContact = null
          }
          this.fetchContactStats()
        },
      }
    )
  }

  async addCommunication(
    contactId: string,
    data: {
      type: 'email' | 'call' | 'meeting' | 'note'
      date: Date
      subject?: string
      summary: string
    }
  ) {
    return this.executeAsync(
      async () => {
        const event = await contactsApi.addCommunication(contactId, data)
        return event
      },
      {
        onSuccess: (event) => {
          const contact = this.contacts.find(c => c.id === contactId)
          if (contact) {
            contact.communicationHistory.unshift(event)
            contact.lastContact = event.date
          }
          if (this.selectedContact?.id === contactId) {
            this.selectedContact.communicationHistory.unshift(event)
            this.selectedContact.lastContact = event.date
          }
        },
      }
    )
  }

  async fetchAIInsights(contactId: string) {
    return this.executeAsync(
      async () => {
        const insights = await contactsApi.getAIInsights(contactId)
        return insights
      },
      {
        onSuccess: (insights) => {
          const contact = this.contacts.find(c => c.id === contactId)
          if (contact) {
            contact.aiInsights = insights
          }
          if (this.selectedContact?.id === contactId) {
            this.selectedContact.aiInsights = insights
          }
        },
        showLoading: false,
      }
    )
  }

  // Local state actions
  setSearchQuery = (query: string) => {
    this.searchQuery = query
  }

  setFilter = (filter: typeof this.filterBy) => {
    this.filterBy = filter
  }

  selectContact = (contact: Contact | null) => {
    this.selectedContact = contact
  }
}