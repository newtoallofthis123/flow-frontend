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
  total_pipeline: number
  weighted_forecast: number
  deals_closing_this_month: number
  monthly_forecast: number
}

export class DashboardStore extends BaseStore {
  forecastData: ForecastData = {
    total_pipeline: 0,
    weighted_forecast: 0,
    deals_closing_this_month: 0,
    monthly_forecast: 0
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
          this.generateForecastActionItems(forecast)
        },
      }
    )
  }

  private generateForecastActionItems(forecast: ForecastData) {
    const forecastActionItems: ActionItem[] = []

    // Check if there are deals closing this month
    if (forecast.deals_closing_this_month > 0) {
      forecastActionItems.push({
        id: 'forecast-deals-closing',
        icon: 'target',
        title: `${forecast.deals_closing_this_month} deal${forecast.deals_closing_this_month > 1 ? 's' : ''} closing this month. Total forecast: $${(forecast.monthly_forecast / 1000).toFixed(1)}K`,
        type: 'opportunity',
        timestamp: new Date(),
        actions: [
          { label: 'View Deals', type: 'primary' },
          { label: 'Dismiss', type: 'dismiss' }
        ]
      })
    }

    // Check pipeline health
    const pipelineRatio = forecast.total_pipeline / forecast.monthly_forecast
    if (pipelineRatio < 2) {
      forecastActionItems.push({
        id: 'forecast-low-pipeline',
        icon: 'alert-triangle',
        title: `Pipeline is only ${pipelineRatio.toFixed(1)}x your monthly forecast ($${(forecast.total_pipeline / 1000).toFixed(1)}K). Consider generating more opportunities.`,
        type: 'warning',
        timestamp: new Date(),
        actions: [
          { label: 'Add Deal', type: 'primary' },
          { label: 'Dismiss', type: 'dismiss' }
        ]
      })
    }

    // Strong pipeline indicator
    if (pipelineRatio >= 3 && forecast.deals_closing_this_month >= 2) {
      forecastActionItems.push({
        id: 'forecast-strong-pipeline',
        icon: 'trending-up',
        title: `Strong pipeline! ${pipelineRatio.toFixed(1)}x coverage with $${(forecast.total_pipeline / 1000).toFixed(1)}K in opportunities.`,
        type: 'success',
        timestamp: new Date(),
        actions: [
          { label: 'View Pipeline', type: 'primary' },
          { label: 'Dismiss', type: 'dismiss' }
        ]
      })
    }

    // Low deals closing warning
    if (forecast.deals_closing_this_month === 0) {
      forecastActionItems.push({
        id: 'forecast-no-deals',
        icon: 'alert-triangle',
        title: 'No deals expected to close this month. Review your pipeline and move deals forward.',
        type: 'warning',
        timestamp: new Date(),
        actions: [
          { label: 'Review Pipeline', type: 'primary' },
          { label: 'Dismiss', type: 'dismiss' }
        ]
      })
    }

    // Merge with existing action items, removing old forecast items
    this.actionItems = [
      ...forecastActionItems,
      ...this.actionItems.filter(item => !item.id.startsWith('forecast-'))
    ]
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