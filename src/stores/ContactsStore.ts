import { makeAutoObservable } from 'mobx'

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

export class ContactsStore {
  contacts: Contact[] = []
  selectedContact: Contact | null = null
  searchQuery = ''
  filterBy: 'all' | 'high-value' | 'at-risk' | 'recent' = 'all'
  isLoading = false

  constructor() {
    makeAutoObservable(this)
    this.loadMockData()
  }

  get filteredContacts() {
    let filtered = this.contacts

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(contact =>
        contact.name.toLowerCase().includes(query) ||
        contact.company.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
      )
    }

    // Category filter
    switch (this.filterBy) {
      case 'high-value':
        filtered = filtered.filter(contact => contact.totalValue > 50000)
        break
      case 'at-risk':
        filtered = filtered.filter(contact => contact.churnRisk > 60)
        break
      case 'recent':
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        filtered = filtered.filter(contact => contact.lastContact > oneWeekAgo)
        break
    }

    return filtered.sort((a, b) => b.healthScore - a.healthScore)
  }

  get contactStats() {
    return {
      total: this.contacts.length,
      highValue: this.contacts.filter(c => c.totalValue > 50000).length,
      atRisk: this.contacts.filter(c => c.churnRisk > 60).length,
      needsFollowUp: this.contacts.filter(c => c.nextFollowUp && c.nextFollowUp < new Date()).length
    }
  }

  setSearchQuery = (query: string) => {
    this.searchQuery = query
  }

  setFilter = (filter: typeof this.filterBy) => {
    this.filterBy = filter
  }

  selectContact = (contact: Contact) => {
    this.selectedContact = contact
  }

  updateContactHealth = (contactId: string, healthScore: number) => {
    const contact = this.contacts.find(c => c.id === contactId)
    if (contact) {
      contact.healthScore = healthScore
      contact.relationshipHealth = healthScore > 70 ? 'high' : healthScore > 40 ? 'medium' : 'low'
    }
  }

  addCommunicationEvent = (contactId: string, event: Omit<CommunicationEvent, 'id'>) => {
    const contact = this.contacts.find(c => c.id === contactId)
    if (contact) {
      contact.communicationHistory.unshift({
        ...event,
        id: Date.now().toString()
      })
      contact.lastContact = event.date
    }
  }

  private loadMockData = () => {
    this.contacts = [
      {
        id: '1',
        name: 'Sarah Williams',
        email: 'sarah.williams@techcorp.com',
        phone: '+1 (555) 123-4567',
        company: 'TechCorp Solutions',
        title: 'VP of Engineering',
        relationshipHealth: 'high',
        healthScore: 89,
        lastContact: new Date('2024-01-15'),
        nextFollowUp: new Date('2024-01-20'),
        sentiment: 'positive',
        churnRisk: 15,
        totalDeals: 3,
        totalValue: 125000,
        tags: ['enterprise', 'technical', 'decision-maker'],
        notes: ['Prefers technical deep-dives', 'Budget discussions in Q1'],
        communicationHistory: [
          {
            id: '1',
            type: 'email',
            date: new Date('2024-01-15'),
            subject: 'Q1 Budget Planning',
            summary: 'Discussed budget allocation for Q1 initiatives',
            sentiment: 'positive',
            aiAnalysis: 'Sarah is very engaged and mentioned specific budget figures. High probability of closing deal.'
          },
          {
            id: '2',
            type: 'call',
            date: new Date('2024-01-10'),
            summary: '30-min demo call - very positive feedback on new features',
            sentiment: 'positive',
            aiAnalysis: 'Enthusiastic about integration capabilities. Asked about enterprise pricing tiers.'
          }
        ],
        aiInsights: [
          {
            id: '1',
            type: 'opportunity',
            title: 'Ready to Expand',
            description: 'Recent communications indicate readiness to expand usage across additional teams',
            confidence: 87,
            actionable: true,
            suggestedAction: 'Propose enterprise package upgrade',
            date: new Date('2024-01-16')
          }
        ]
      },
      {
        id: '2',
        name: 'Mike Chen',
        email: 'mchen@startup.io',
        phone: '+1 (555) 234-5678',
        company: 'Startup.io',
        title: 'CTO',
        relationshipHealth: 'medium',
        healthScore: 65,
        lastContact: new Date('2024-01-05'),
        sentiment: 'neutral',
        churnRisk: 35,
        totalDeals: 1,
        totalValue: 25000,
        tags: ['startup', 'cost-conscious', 'technical'],
        notes: ['Price sensitive', 'Growing team rapidly'],
        communicationHistory: [
          {
            id: '3',
            type: 'email',
            date: new Date('2024-01-05'),
            subject: 'Pricing Questions',
            summary: 'Asked about volume discounts for growing team',
            sentiment: 'neutral',
            aiAnalysis: 'Concerned about scaling costs but interested in product. Mention ROI and cost per user benefits.'
          }
        ],
        aiInsights: [
          {
            id: '2',
            type: 'risk',
            title: 'Price Sensitivity',
            description: 'Multiple mentions of budget constraints and pricing concerns',
            confidence: 73,
            actionable: true,
            suggestedAction: 'Schedule call to discuss ROI and flexible pricing options',
            date: new Date('2024-01-16')
          }
        ]
      },
      {
        id: '3',
        name: 'Emma Rodriguez',
        email: 'emma@globalcorp.com',
        phone: '+1 (555) 345-6789',
        company: 'GlobalCorp',
        title: 'Director of Operations',
        relationshipHealth: 'low',
        healthScore: 32,
        lastContact: new Date('2023-12-20'),
        nextFollowUp: new Date('2024-01-10'),
        sentiment: 'negative',
        churnRisk: 78,
        totalDeals: 2,
        totalValue: 85000,
        tags: ['enterprise', 'at-risk', 'decision-maker'],
        notes: ['Mentioned competitor evaluation', 'Frustrated with recent issues'],
        communicationHistory: [
          {
            id: '4',
            type: 'call',
            date: new Date('2023-12-20'),
            summary: 'Support escalation call - discussed recent service issues',
            sentiment: 'negative',
            aiAnalysis: 'Frustrated with response times. Mentioned evaluating alternatives. Immediate attention needed.'
          }
        ],
        aiInsights: [
          {
            id: '3',
            type: 'risk',
            title: 'High Churn Risk',
            description: 'No recent positive interactions, mentioned competitors, past service issues',
            confidence: 92,
            actionable: true,
            suggestedAction: 'Urgent: Schedule executive-level call to address concerns',
            date: new Date('2024-01-16')
          }
        ]
      },
      {
        id: '4',
        name: 'David Park',
        email: 'dpark@innovatetech.com',
        phone: '+1 (555) 456-7890',
        company: 'InnovateTech',
        title: 'Head of Product',
        relationshipHealth: 'high',
        healthScore: 94,
        lastContact: new Date('2024-01-14'),
        sentiment: 'positive',
        churnRisk: 8,
        totalDeals: 4,
        totalValue: 200000,
        tags: ['enterprise', 'champion', 'product-focused'],
        notes: ['Internal champion', 'Drives adoption across org'],
        communicationHistory: [
          {
            id: '5',
            type: 'meeting',
            date: new Date('2024-01-14'),
            summary: 'Quarterly business review - excellent results, discussing expansion',
            sentiment: 'positive',
            aiAnalysis: 'Very satisfied with results. Ready to expand to 3 additional teams. Strong renewal likelihood.'
          }
        ],
        aiInsights: [
          {
            id: '4',
            type: 'opportunity',
            title: 'Expansion Ready',
            description: 'Quarterly review showed excellent ROI, discussing 3x team expansion',
            confidence: 96,
            actionable: true,
            suggestedAction: 'Prepare expansion proposal for 3 additional teams',
            date: new Date('2024-01-16')
          }
        ]
      }
    ]
  }
}