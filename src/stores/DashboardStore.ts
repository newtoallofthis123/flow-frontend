import { makeObservable, observable, computed } from 'mobx'
import { dashboardApi } from '../api/dashboard.api'
import { BaseStore } from './BaseStore'
import type { Deal } from './DealsStore'
import type { Contact } from './ContactsStore'

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

export class DashboardStore extends BaseStore {
  forecastData: ForecastData = {
    revenue: 0,
    period: '',
    confidence: 'low',
    breakdown: []
  }

  actionItems: ActionItem[] = []
  summary: {
    deals: Deal[]
    contacts: Contact[]
    totalDealsValue: number
    atRiskContacts: number
    highProbabilityDeals: number
  } = {
    deals: [],
    contacts: [],
    totalDealsValue: 0,
    atRiskContacts: 0,
    highProbabilityDeals: 0,
  }

  private _initialized = false

  constructor() {
    super()
    makeObservable(this, {
      forecastData: observable,
      actionItems: observable,
      summary: observable,
      totalDealsValue: computed,
      atRiskContacts: computed,
      highProbabilityDeals: computed,
    })
  }

  async initialize() {
    if (this._initialized) return
    this._initialized = true
    
    await Promise.all([
      this.fetchForecast(),
      this.fetchActionItems(),
      this.fetchSummary(),
    ])
  }

  async fetchForecast() {
    return this.executeAsync(
      async () => {
        const forecast = await dashboardApi.getForecast()
        return forecast
      },
      {
        onSuccess: (forecast) => {
          this.forecastData = forecast
        },
      }
    )
  }

  async fetchActionItems() {
    return this.executeAsync(
      async () => {
        const actionItems = await dashboardApi.getActionItems()
        // Convert date strings to Date objects
        return actionItems.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
      },
      {
        onSuccess: (actionItems) => {
          this.actionItems = actionItems
        },
      }
    )
  }

  async fetchSummary() {
    return this.executeAsync(
      async () => {
        const summary = await dashboardApi.getSummary()
        // Convert date strings to Date objects
        // API returns dates as strings, but Deal/Contact interfaces expect Date objects
        return {
          ...summary,
          deals: summary.deals.map(deal => ({
            ...deal,
            expectedCloseDate: new Date(deal.expectedCloseDate as unknown as string),
            createdDate: new Date(deal.createdDate as unknown as string),
            lastActivity: new Date(deal.lastActivity as unknown as string),
          })),
          contacts: summary.contacts.map(contact => ({
            ...contact,
            lastContact: new Date(contact.lastContact as unknown as string),
          })),
        }
      },
      {
        onSuccess: (summary) => {
          this.summary = summary
        },
      }
    )
  }

  async dismissActionItem(id: string) {
    return this.executeAsync(
      async () => {
        await dashboardApi.dismissActionItem(id)
      },
      {
        onSuccess: () => {
          this.actionItems = this.actionItems.filter(item => item.id !== id)
        },
      }
    )
  }

  // Computed values
  get totalDealsValue() {
    return this.summary.totalDealsValue
  }

  get atRiskContacts() {
    return this.summary.atRiskContacts
  }

  get highProbabilityDeals() {
    return this.summary.highProbabilityDeals
  }
}