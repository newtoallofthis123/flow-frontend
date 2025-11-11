import { makeObservable, observable, computed, action, runInAction } from 'mobx'
import { dealsApi } from '../api/deals.api'
import { BaseStore } from './BaseStore'
import { wsClient } from '../api/websocket'

export interface Deal {
  id: string
  title: string
  contactId: string
  contactName: string
  company: string
  value: number
  stage: DealStage
  probability: number // 0-100, AI calculated
  confidence: 'high' | 'medium' | 'low'
  expectedCloseDate: Date
  createdDate: Date
  lastActivity: Date
  description: string
  tags: string[]
  activities: DealActivity[]
  aiInsights: DealInsight[]
  competitorMentioned?: string
  riskFactors: string[]
  positiveSignals: string[]
  priority: 'high' | 'medium' | 'low'
}

export type DealStage =
  | 'prospect'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed-won'
  | 'closed-lost'

export interface DealActivity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'demo' | 'note'
  date: Date
  description: string
  outcome?: string
  nextStep?: string
}

export interface DealInsight {
  id: string
  type: 'opportunity' | 'risk' | 'suggestion' | 'competitor'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  suggestedAction?: string
  confidence: number
  date: Date
}

export interface StageStats {
  stage: DealStage
  count: number
  totalValue: number
  avgProbability: number
  avgDaysInStage: number
}

export class DealsStore extends BaseStore {
  deals: Deal[] = []
  selectedDeal: Deal | null = null
  viewMode: 'kanban' | 'list' | 'forecast' = 'kanban'
  filterBy: 'all' | 'hot' | 'at-risk' | 'closing-soon' = 'all'
  searchQuery = ''
  draggedDeal: Deal | null = null
  stageStats: StageStats[] = []
  forecastData: {
    totalPipeline: number
    weightedForecast: number
    dealsClosingThisMonth: number
    monthlyForecast: number
  } = {
    totalPipeline: 0,
    weightedForecast: 0,
    dealsClosingThisMonth: 0,
    monthlyForecast: 0,
  }

  constructor() {
    super()
    makeObservable(this, {
      deals: observable,
      selectedDeal: observable,
      viewMode: observable,
      filterBy: observable,
      searchQuery: observable,
      draggedDeal: observable,
      stageStats: observable,
      forecastData: observable,
      dealsByStage: computed,
      stageStatsComputed: computed,
      filteredDeals: computed,
      forecastDataComputed: computed,
      setViewMode: action,
      setFilter: action,
      setSearchQuery: action,
      selectDeal: action,
      setDraggedDeal: action,
    })
    this.setupWebSocket()
  }

  private setupWebSocket() {
    wsClient.on('deal:created', (deal: Deal) => {
      runInAction(() => {
        this.deals.unshift(deal)
      })
    })

    wsClient.on('deal:updated', (data: { id: string; changes: Partial<Deal> }) => {
      runInAction(() => {
        const deal = this.deals.find(d => d.id === data.id)
        if (deal) {
          Object.assign(deal, data.changes)
        }
        if (this.selectedDeal?.id === data.id) {
          Object.assign(this.selectedDeal, data.changes)
        }
      })
    })

    wsClient.on('deal:stage_changed', (data: { id: string; stage: DealStage; probability: number }) => {
      runInAction(() => {
        const deal = this.deals.find(d => d.id === data.id)
        if (deal) {
          deal.stage = data.stage
          deal.probability = data.probability
        }
      })
    })

    wsClient.on('deal:activity_added', (data: { dealId: string; activity: DealActivity }) => {
      runInAction(() => {
        const deal = this.deals.find(d => d.id === data.dealId)
        if (deal) {
          deal.activities.unshift(data.activity)
          deal.lastActivity = data.activity.date
        }
      })
    })
  }

  get dealsByStage() {
    const stages: DealStage[] = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']

    return stages.reduce((acc, stage) => {
      acc[stage] = this.filteredDeals.filter(deal => deal.stage === stage)
      return acc
    }, {} as Record<DealStage, Deal[]>)
  }

  // Computed values
  get stageStatsComputed(): StageStats[] {
    return this.stageStats
  }

  get filteredDeals() {
    let filtered = this.deals.filter(deal =>
      deal.stage !== 'closed-won' && deal.stage !== 'closed-lost'
    )

    switch (this.filterBy) {
      case 'hot':
        filtered = filtered.filter(deal => deal.probability > 70)
        break
      case 'at-risk':
        filtered = filtered.filter(deal =>
          deal.riskFactors.length > 0 || deal.competitorMentioned
        )
        break
      case 'closing-soon':
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
        filtered = filtered.filter(deal => deal.expectedCloseDate <= thirtyDaysFromNow)
        break
    }

    return filtered.sort((a, b) => b.probability - a.probability)
  }

  get forecastDataComputed() {
    return this.forecastData
  }

  setViewMode = (mode: typeof this.viewMode) => {
    this.viewMode = mode
  }

  setFilter = (filter: typeof this.filterBy) => {
    this.filterBy = filter
  }

  setSearchQuery = (query: string) => {
    this.searchQuery = query
  }

  selectDeal = (deal: Deal) => {
    this.selectedDeal = deal
  }

  // Actions
  async fetchDeals() {
    return this.executeAsync(
      async () => {
        const deals = await dealsApi.getDeals({
          filter: this.filterBy,
          search: this.searchQuery || undefined,
        })
        return deals
      },
      {
        onSuccess: (deals) => {
          this.deals = deals
        },
      }
    )
  }

  async fetchDeal(id: string) {
    return this.executeAsync(
      async () => {
        const deal = await dealsApi.getDeal(id)
        return deal
      },
      {
        onSuccess: (deal) => {
          this.selectedDeal = deal
          const index = this.deals.findIndex(d => d.id === id)
          if (index !== -1) {
            this.deals[index] = deal
          }
        },
      }
    )
  }

  async createDeal(data: Omit<Deal, 'id' | 'probability' | 'confidence' | 'riskFactors' | 'positiveSignals' | 'aiInsights'>) {
    return this.executeAsync(
      async () => {
        const deal = await dealsApi.createDeal(data)
        return deal
      },
      {
        onSuccess: (deal) => {
          this.deals.unshift(deal)
        },
      }
    )
  }

  async updateDeal(id: string, data: Partial<Deal>) {
    return this.executeAsync(
      async () => {
        const deal = await dealsApi.updateDeal(id, data)
        return deal
      },
      {
        onSuccess: (deal) => {
          const index = this.deals.findIndex(d => d.id === id)
          if (index !== -1) {
            this.deals[index] = deal
          }
          if (this.selectedDeal?.id === id) {
            this.selectedDeal = deal
          }
        },
      }
    )
  }

  async deleteDeal(id: string) {
    return this.executeAsync(
      async () => {
        await dealsApi.deleteDeal(id)
      },
      {
        onSuccess: () => {
          this.deals = this.deals.filter(d => d.id !== id)
          if (this.selectedDeal?.id === id) {
            this.selectedDeal = null
          }
        },
      }
    )
  }

  async updateDealStage(dealId: string, newStage: DealStage) {
    return this.executeAsync(
      async () => {
        const deal = await dealsApi.updateDealStage(dealId, newStage)
        return deal
      },
      {
        onSuccess: (deal) => {
          const index = this.deals.findIndex(d => d.id === dealId)
          if (index !== -1) {
            this.deals[index] = deal
          }
          if (this.selectedDeal?.id === dealId) {
            this.selectedDeal = deal
          }
        },
      }
    )
  }

  async addActivity(dealId: string, activity: {
    type: DealActivity['type']
    date: Date
    description: string
    outcome?: string
    nextStep?: string
  }) {
    return this.executeAsync(
      async () => {
        const newActivity = await dealsApi.addActivity(dealId, activity)
        return newActivity
      },
      {
        onSuccess: (newActivity) => {
          const deal = this.deals.find(d => d.id === dealId)
          if (deal) {
            deal.activities.unshift(newActivity)
            deal.lastActivity = newActivity.date
          }
          if (this.selectedDeal?.id === dealId) {
            this.selectedDeal.activities.unshift(newActivity)
            this.selectedDeal.lastActivity = newActivity.date
          }
        },
      }
    )
  }

  async fetchForecast() {
    return this.executeAsync(
      async () => {
        const forecast = await dealsApi.getForecast()
        return forecast
      },
      {
        onSuccess: (forecast) => {
          this.forecastData = forecast
        },
        showLoading: false,
      }
    )
  }

  async fetchStageStats() {
    return this.executeAsync(
      async () => {
        const stats = await dealsApi.getStageStats()
        return stats
      },
      {
        onSuccess: (stats) => {
          this.stageStats = stats
        },
        showLoading: false,
      }
    )
  }

  setDraggedDeal = (deal: Deal | null) => {
    this.draggedDeal = deal
  }

  // Local state actions
  setViewMode = (mode: typeof this.viewMode) => {
    this.viewMode = mode
  }

  setFilter = (filter: typeof this.filterBy) => {
    this.filterBy = filter
  }

  setSearchQuery = (query: string) => {
    this.searchQuery = query
  }

  selectDeal = (deal: Deal | null) => {
    this.selectedDeal = deal
  }

  setDraggedDeal = (deal: Deal | null) => {
    this.draggedDeal = deal
  }
}
