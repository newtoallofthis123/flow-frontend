import { makeAutoObservable } from 'mobx'

export interface ActionItem {
  id: string
  icon: string
  title: string
  type: 'suggestion' | 'opportunity' | 'warning'
  timestamp: Date
  actions: Array<{
    label: string
    type: 'primary' | 'secondary' | 'dismiss'
  }>
}

export interface Deal {
  id: string
  company: string
  value: number
  stage: string
  probability: number
  closeDate: Date
  contact: string
}

export interface Contact {
  id: string
  name: string
  company: string
  email: string
  lastContact: Date
  status: 'active' | 'at_risk' | 'closed'
  engagementScore: number
}

export interface ForecastData {
  revenue: number
  period: string
  confidence: 'high' | 'medium' | 'low'
  breakdown: Array<{
    source: string
    amount: number
    probability: number
  }>
}

export class DashboardStore {
  forecastData: ForecastData = {
    revenue: 47000,
    period: 'next 30 days',
    confidence: 'high',
    breakdown: [
      { source: 'TechCorp Deal', amount: 25000, probability: 89 },
      { source: 'ABC Company Renewal', amount: 15000, probability: 65 },
      { source: 'StartupX Contract', amount: 7000, probability: 78 }
    ]
  }

  actionItems: ActionItem[] = [
    {
      id: '1',
      icon: 'lightbulb',
      title: 'Sarah Williams hasn\'t responded in 5 days - send follow-up?',
      type: 'suggestion',
      timestamp: new Date(),
      actions: [
        { label: 'Do it', type: 'primary' },
        { label: 'Remind me later', type: 'secondary' }
      ]
    },
    {
      id: '2',
      icon: 'target',
      title: 'TechCorp deal is 89% likely to close - schedule final call',
      type: 'opportunity',
      timestamp: new Date(),
      actions: [
        { label: 'Do it', type: 'primary' },
        { label: 'Dismiss', type: 'dismiss' }
      ]
    },
    {
      id: '3',
      icon: 'alert-triangle',
      title: 'ABC Company sentiment trending negative - review recent interactions',
      type: 'warning',
      timestamp: new Date(),
      actions: [
        { label: 'Review now', type: 'primary' },
        { label: 'Dismiss', type: 'dismiss' }
      ]
    }
  ]

  deals: Deal[] = [
    {
      id: '1',
      company: 'TechCorp Inc.',
      value: 25000,
      stage: 'Proposal',
      probability: 89,
      closeDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      contact: 'John Smith'
    },
    {
      id: '2',
      company: 'ABC Company',
      value: 15000,
      stage: 'Negotiation',
      probability: 65,
      closeDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      contact: 'Sarah Williams'
    },
    {
      id: '3',
      company: 'StartupX',
      value: 7000,
      stage: 'Qualified',
      probability: 78,
      closeDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      contact: 'Mike Johnson'
    }
  ]

  contacts: Contact[] = [
    {
      id: '1',
      name: 'John Smith',
      company: 'TechCorp Inc.',
      email: 'john.smith@techcorp.com',
      lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      status: 'active',
      engagementScore: 85
    },
    {
      id: '2',
      name: 'Sarah Williams',
      company: 'ABC Company',
      email: 'sarah.williams@abc.com',
      lastContact: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      status: 'at_risk',
      engagementScore: 42
    },
    {
      id: '3',
      name: 'Mike Johnson',
      company: 'StartupX',
      email: 'mike@startupx.io',
      lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'active',
      engagementScore: 72
    }
  ]

  constructor() {
    makeAutoObservable(this)
  }

  // Actions
  dismissActionItem(id: string) {
    this.actionItems = this.actionItems.filter(item => item.id !== id)
  }

  updateDealProbability(dealId: string, probability: number) {
    const deal = this.deals.find(d => d.id === dealId)
    if (deal) {
      deal.probability = probability
    }
  }

  addActionItem(item: Omit<ActionItem, 'id'>) {
    const newItem: ActionItem = {
      ...item,
      id: Date.now().toString(),
    }
    this.actionItems.unshift(newItem)
  }

  // Computed values
  get totalDealsValue() {
    return this.deals.reduce((sum, deal) => sum + deal.value, 0)
  }

  get atRiskContacts() {
    return this.contacts.filter(contact => contact.status === 'at_risk')
  }

  get highProbabilityDeals() {
    return this.deals.filter(deal => deal.probability > 70)
  }
}