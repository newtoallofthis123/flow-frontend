import { makeObservable, observable, computed, action, runInAction, reaction } from 'mobx'
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

  private _initialized = false

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
    this.setupReactions()
    this.setupWebSocket()
  }

  private setupReactions() {
    // Auto-fetch when filter changes
    reaction(
      () => this.filterBy,
      () => {
        if (this._initialized) {
          this.fetchDeals()
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
            this.fetchDeals()
          }
        }, 300)
      }
    )
  }

  async initialize() {
    if (this._initialized) return
    this._initialized = true
    
    await Promise.all([
      this.fetchDeals(),
      this.fetchForecast(),
      this.fetchStageStats(),
    ])
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
    // Ensure stageStats is always an array
    return Array.isArray(this.stageStats) ? this.stageStats : []
  }

  get filteredDeals() {
    // Ensure deals is always an array
    if (!Array.isArray(this.deals)) {
      return []
    }
    let filtered = this.deals.filter(deal =>
      deal.stage !== 'closed-won' && deal.stage !== 'closed-lost'
    )

    switch (this.filterBy) {
      case 'hot':
        filtered = filtered.filter(deal => deal.probability > 70)
        break
      case 'at-risk':
        filtered = filtered.filter(deal =>
          (deal.riskFactors && deal.riskFactors.length > 0) || deal.competitorMentioned
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

  // Actions
  setViewMode(mode: typeof this.viewMode) {
    this.viewMode = mode
  }

  setFilter(filter: typeof this.filterBy) {
    this.filterBy = filter
  }

  setSearchQuery(query: string) {
    this.searchQuery = query
  }

  selectDeal(deal: Deal | null) {
    this.selectedDeal = deal
  }

  setDraggedDeal(deal: Deal | null) {
    this.draggedDeal = deal
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

  // Transform API response to Deal interface
  private transformDeal(apiDeal: any): Deal {
    // Handle date parsing - expected_close_date might be just a date string (YYYY-MM-DD)
    const parseDate = (dateStr: string | null | undefined, fallback?: Date): Date => {
      if (!dateStr) return fallback || new Date()
      // Handle both ISO datetime strings and date-only strings
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? (fallback || new Date()) : date
    }

    // Use inserted_at for createdDate, fallback to updated_at or now
    const createdDate = parseDate(
      apiDeal.inserted_at || apiDeal.created_date || apiDeal.createdDate,
      new Date()
    )

    // Use last_activity_at if available, otherwise fallback to inserted_at or now
    const lastActivity = parseDate(
      apiDeal.last_activity_at || apiDeal.last_activity || apiDeal.lastActivity,
      createdDate
    )

    return {
      id: apiDeal.id,
      title: apiDeal.title || apiDeal.name || '',
      contactId: apiDeal.contact_id || apiDeal.contactId || '',
      contactName: apiDeal.contact_name || apiDeal.contactName || '', // May need to fetch separately
      company: apiDeal.company || '',
      value: parseFloat(apiDeal.value || apiDeal.amount || '0'),
      stage: apiDeal.stage || 'prospect',
      probability: apiDeal.probability || 0,
      confidence: apiDeal.confidence || 'medium',
      expectedCloseDate: parseDate(apiDeal.expected_close_date || apiDeal.expectedCloseDate),
      createdDate,
      lastActivity,
      description: apiDeal.description || '',
      tags: this.extractTagNames(apiDeal.tags),
      activities: Array.isArray(apiDeal.activities)
        ? apiDeal.activities.map((activity: any) => ({
            id: activity.id,
            type: activity.type,
            date: parseDate(activity.date),
            description: activity.description || '',
            outcome: activity.outcome,
            nextStep: activity.nextStep || activity.next_step,
          }))
        : [],
      aiInsights: Array.isArray(apiDeal.aiInsights)
        ? apiDeal.aiInsights.map((insight: any) => ({
            id: insight.id,
            type: insight.type,
            title: insight.title,
            description: insight.description,
            impact: insight.impact || 'medium',
            actionable: insight.actionable || false,
            suggestedAction: insight.suggestedAction || insight.suggested_action,
            confidence: insight.confidence || 0,
            date: parseDate(insight.date),
          }))
        : [],
      competitorMentioned: apiDeal.competitor_mentioned || apiDeal.competitorMentioned || undefined,
      riskFactors: Array.isArray(apiDeal.risk_factors) 
        ? apiDeal.risk_factors 
        : Array.isArray(apiDeal.riskFactors) 
          ? apiDeal.riskFactors 
          : [],
      positiveSignals: Array.isArray(apiDeal.positive_signals)
        ? apiDeal.positive_signals
        : Array.isArray(apiDeal.positiveSignals)
          ? apiDeal.positiveSignals
          : [],
      priority: apiDeal.priority || 'medium',
    }
  }

  async fetchDeals() {
    return this.executeAsync(
      async () => {
        const deals = await dealsApi.getDeals({
          filter: this.filterBy,
          search: this.searchQuery || undefined,
        })
        // Transform API response to match Deal interface
        return Array.isArray(deals)
          ? deals.map(deal => this.transformDeal(deal))
          : []
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
        return this.transformDeal(deal)
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
        return this.transformDeal(deal)
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
        return this.transformDeal(deal)
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
        // Transform object response to array format
        return this.transformStageStats(stats)
      },
      {
        onSuccess: (stats) => {
          this.stageStats = stats
        },
        showLoading: false,
      }
    )
  }

  // Transform API response object to StageStats array
  private transformStageStats(apiStats: any): StageStats[] {
    // Handle both object and array formats
    if (Array.isArray(apiStats)) {
      return apiStats.map(stat => ({
        stage: this.normalizeStageName(stat.stage),
        count: stat.count || 0,
        totalValue: stat.totalValue || stat.total_value || 0,
        avgProbability: stat.avgProbability || stat.avg_probability || 0,
        avgDaysInStage: stat.avgDaysInStage || stat.avg_days_in_stage || 0,
      }))
    }

    // Transform object format: { prospect: 0, qualified: 1, closed_won: 0, ... }
    const stages: DealStage[] = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']
    
    return stages.map(stage => {
      // Map stage names (closed-won -> closed_won for API lookup)
      // Try both formats: closed_won (API) and closed-won (our format)
      const apiStageKey = stage.replace(/-/g, '_')
      const count = apiStats[apiStageKey] !== undefined ? apiStats[apiStageKey] : (apiStats[stage] || 0)
      
      // Calculate stats from deals array for this stage
      const dealsInStage = this.deals.filter(d => d.stage === stage)
      const totalValue = dealsInStage.reduce((sum, deal) => sum + deal.value, 0)
      const avgProbability = dealsInStage.length > 0
        ? dealsInStage.reduce((sum, deal) => sum + deal.probability, 0) / dealsInStage.length
        : 0
      
      // Calculate average days in stage (simplified - using createdDate as proxy)
      const avgDaysInStage = dealsInStage.length > 0
        ? dealsInStage.reduce((sum, deal) => {
            const daysInStage = Math.floor((Date.now() - deal.createdDate.getTime()) / (1000 * 60 * 60 * 24))
            return sum + daysInStage
          }, 0) / dealsInStage.length
        : 0

      return {
        stage,
        count,
        totalValue,
        avgProbability: Math.round(avgProbability),
        avgDaysInStage: Math.round(avgDaysInStage),
      }
    })
  }

  // Normalize stage names (closed_won -> closed-won)
  private normalizeStageName(stage: string): DealStage {
    const normalized = stage.replace(/_/g, '-')
    const validStages: DealStage[] = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']
    return validStages.includes(normalized as DealStage) ? (normalized as DealStage) : 'prospect'
  }
}
