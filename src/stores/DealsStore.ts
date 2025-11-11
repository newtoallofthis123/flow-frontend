import { makeAutoObservable } from 'mobx'

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

export class DealsStore {
  deals: Deal[] = []
  selectedDeal: Deal | null = null
  viewMode: 'kanban' | 'list' | 'forecast' = 'kanban'
  filterBy: 'all' | 'hot' | 'at-risk' | 'closing-soon' = 'all'
  searchQuery = ''
  isLoading = false
  draggedDeal: Deal | null = null

  constructor() {
    makeAutoObservable(this)
    this.loadMockData()
  }

  get dealsByStage() {
    const stages: DealStage[] = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']

    return stages.reduce((acc, stage) => {
      acc[stage] = this.filteredDeals.filter(deal => deal.stage === stage)
      return acc
    }, {} as Record<DealStage, Deal[]>)
  }

  get stageStats(): StageStats[] {
    const stages: DealStage[] = ['prospect', 'qualified', 'proposal', 'negotiation']

    return stages.map(stage => {
      const stageDeals = this.deals.filter(deal => deal.stage === stage)
      const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)
      const avgProbability = stageDeals.length > 0
        ? stageDeals.reduce((sum, deal) => sum + deal.probability, 0) / stageDeals.length
        : 0

      // Calculate average days in stage (mock calculation)
      const avgDaysInStage = this.getAvgDaysInStage(stage)

      return {
        stage,
        count: stageDeals.length,
        totalValue,
        avgProbability: Math.round(avgProbability),
        avgDaysInStage
      }
    })
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

  get forecastData() {
    const activeDeals = this.deals.filter(deal =>
      deal.stage !== 'closed-won' && deal.stage !== 'closed-lost'
    )

    const totalPipeline = activeDeals.reduce((sum, deal) => sum + deal.value, 0)
    const weightedForecast = activeDeals.reduce((sum, deal) =>
      sum + (deal.value * deal.probability / 100), 0
    )

    const thisMonth = new Date()
    thisMonth.setDate(1)
    const nextMonth = new Date(thisMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const closingThisMonth = activeDeals.filter(deal =>
      deal.expectedCloseDate >= thisMonth && deal.expectedCloseDate < nextMonth
    )

    return {
      totalPipeline,
      weightedForecast,
      dealsClosingThisMonth: closingThisMonth.length,
      monthlyForecast: closingThisMonth.reduce((sum, deal) =>
        sum + (deal.value * deal.probability / 100), 0
      )
    }
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

  updateDealStage = (dealId: string, newStage: DealStage) => {
    const deal = this.deals.find(d => d.id === dealId)
    if (deal) {
      deal.stage = newStage
      deal.lastActivity = new Date()

      // Update probability based on stage
      deal.probability = this.calculateProbabilityForStage(newStage, deal)
      deal.confidence = this.calculateConfidence(deal)
    }
  }

  addDealActivity = (dealId: string, activity: Omit<DealActivity, 'id'>) => {
    const deal = this.deals.find(d => d.id === dealId)
    if (deal) {
      deal.activities.unshift({
        ...activity,
        id: Date.now().toString()
      })
      deal.lastActivity = activity.date

      // Recalculate AI insights based on new activity
      this.updateDealInsights(deal)
    }
  }

  setDraggedDeal = (deal: Deal | null) => {
    this.draggedDeal = deal
  }

  private calculateProbabilityForStage = (stage: DealStage, deal: Deal): number => {
    const baseProbability = {
      prospect: 20,
      qualified: 40,
      proposal: 65,
      negotiation: 85,
      'closed-won': 100,
      'closed-lost': 0
    }[stage]

    // Adjust based on deal characteristics
    let adjustment = 0

    if (deal.positiveSignals.length > deal.riskFactors.length) {
      adjustment += 10
    } else if (deal.riskFactors.length > deal.positiveSignals.length) {
      adjustment -= 15
    }

    if (deal.competitorMentioned) {
      adjustment -= 10
    }

    return Math.max(0, Math.min(100, baseProbability + adjustment))
  }

  private calculateConfidence = (deal: Deal): 'high' | 'medium' | 'low' => {
    const recentActivity = deal.activities.filter(activity => {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      return activity.date > oneWeekAgo
    }).length

    const hasPositiveSignals = deal.positiveSignals.length > 0
    const hasLowRisk = deal.riskFactors.length <= 1

    if (recentActivity >= 2 && hasPositiveSignals && hasLowRisk) {
      return 'high'
    } else if (recentActivity >= 1 && (hasPositiveSignals || hasLowRisk)) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  private updateDealInsights = (deal: Deal) => {
    // Simple AI insight generation based on deal activity
    const newInsights: DealInsight[] = []

    if (deal.stage === 'proposal' && deal.activities.length > 0) {
      const lastActivity = deal.activities[0]
      if (lastActivity.type === 'demo' && lastActivity.outcome?.includes('positive')) {
        newInsights.push({
          id: `insight-${Date.now()}`,
          type: 'opportunity',
          title: 'Strong Demo Response',
          description: 'Positive response to demo indicates high interest level',
          impact: 'high',
          actionable: true,
          suggestedAction: 'Send proposal within 24 hours while interest is high',
          confidence: 85,
          date: new Date()
        })
      }
    }

    // Add insights to deal (keep only latest 5)
    deal.aiInsights = [...newInsights, ...deal.aiInsights].slice(0, 5)
  }

  private getAvgDaysInStage = (stage: DealStage): number => {
    // Mock calculation - in real app, would calculate from historical data
    const avgDays = {
      prospect: 14,
      qualified: 21,
      proposal: 10,
      negotiation: 7,
      'closed-won': 0,
      'closed-lost': 0
    }
    return avgDays[stage]
  }

  private loadMockData = () => {
    this.deals = [
      {
        id: '1',
        title: 'Enterprise Package - TechCorp',
        contactId: '1',
        contactName: 'Sarah Williams',
        company: 'TechCorp Solutions',
        value: 75000,
        stage: 'proposal',
        probability: 89,
        confidence: 'high',
        expectedCloseDate: new Date('2024-02-15'),
        createdDate: new Date('2024-01-01'),
        lastActivity: new Date('2024-01-15'),
        description: 'Enterprise package for 150 users with advanced analytics',
        tags: ['enterprise', 'high-value', 'technical'],
        activities: [
          {
            id: '1',
            type: 'demo',
            date: new Date('2024-01-15'),
            description: 'Product demo with technical team',
            outcome: 'Very positive feedback, asked about enterprise features',
            nextStep: 'Send formal proposal by Friday'
          }
        ],
        aiInsights: [
          {
            id: '1',
            type: 'opportunity',
            title: 'High Close Probability',
            description: 'Technical team very engaged, budget confirmed, decision timeline clear',
            impact: 'high',
            actionable: true,
            suggestedAction: 'Schedule follow-up call with procurement team',
            confidence: 89,
            date: new Date('2024-01-16')
          }
        ],
        riskFactors: [],
        positiveSignals: ['Budget confirmed', 'Technical buy-in', 'Clear timeline', 'Champion identified'],
        priority: 'high'
      },
      {
        id: '2',
        title: 'Starter Plan - Startup.io',
        contactId: '2',
        contactName: 'Mike Chen',
        company: 'Startup.io',
        value: 15000,
        stage: 'qualified',
        probability: 45,
        confidence: 'medium',
        expectedCloseDate: new Date('2024-02-28'),
        createdDate: new Date('2024-01-05'),
        lastActivity: new Date('2024-01-12'),
        description: 'Starter plan for growing engineering team',
        tags: ['startup', 'cost-sensitive', 'growth'],
        activities: [
          {
            id: '2',
            type: 'call',
            date: new Date('2024-01-12'),
            description: 'Discovery call about team needs and budget',
            outcome: 'Interested but concerned about pricing for scaling team',
            nextStep: 'Prepare ROI analysis and flexible pricing options'
          }
        ],
        aiInsights: [
          {
            id: '2',
            type: 'risk',
            title: 'Price Sensitivity Risk',
            description: 'Multiple pricing concerns raised, may need custom package',
            impact: 'medium',
            actionable: true,
            suggestedAction: 'Prepare startup-friendly pricing presentation',
            confidence: 72,
            date: new Date('2024-01-16')
          }
        ],
        riskFactors: ['Budget constraints', 'Price sensitivity'],
        positiveSignals: ['Growing team', 'Product fit confirmed'],
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Platform Migration - GlobalCorp',
        contactId: '3',
        contactName: 'Emma Rodriguez',
        company: 'GlobalCorp',
        value: 120000,
        stage: 'negotiation',
        probability: 25,
        confidence: 'low',
        expectedCloseDate: new Date('2024-01-30'),
        createdDate: new Date('2023-11-15'),
        lastActivity: new Date('2023-12-20'),
        description: 'Large migration project with integration requirements',
        tags: ['enterprise', 'migration', 'at-risk'],
        activities: [
          {
            id: '3',
            type: 'meeting',
            date: new Date('2023-12-20'),
            description: 'Escalation meeting about service issues',
            outcome: 'Concerns about reliability and support response times',
            nextStep: 'Executive escalation needed - schedule CTO call'
          }
        ],
        aiInsights: [
          {
            id: '3',
            type: 'risk',
            title: 'Deal at High Risk',
            description: 'Service issues have damaged relationship, competitor evaluation mentioned',
            impact: 'high',
            actionable: true,
            suggestedAction: 'Immediate executive intervention required',
            confidence: 94,
            date: new Date('2024-01-16')
          }
        ],
        competitorMentioned: 'Competitor X',
        riskFactors: ['Service issues', 'Support concerns', 'Competitor evaluation', 'Relationship damage'],
        positiveSignals: ['Large deal size', 'Existing relationship'],
        priority: 'high'
      },
      {
        id: '4',
        title: 'Team Expansion - InnovateTech',
        contactId: '4',
        contactName: 'David Park',
        company: 'InnovateTech',
        value: 95000,
        stage: 'qualified',
        probability: 78,
        confidence: 'high',
        expectedCloseDate: new Date('2024-02-05'),
        createdDate: new Date('2024-01-08'),
        lastActivity: new Date('2024-01-14'),
        description: 'Expansion to 3 additional teams based on current success',
        tags: ['expansion', 'existing-customer', 'champion'],
        activities: [
          {
            id: '4',
            type: 'meeting',
            date: new Date('2024-01-14'),
            description: 'Quarterly business review and expansion discussion',
            outcome: 'Excellent results presented, ready to expand to 3 more teams',
            nextStep: 'Prepare expansion proposal with volume discounts'
          }
        ],
        aiInsights: [
          {
            id: '4',
            type: 'opportunity',
            title: 'Expansion Opportunity',
            description: 'Strong champion, proven ROI, ready to expand immediately',
            impact: 'high',
            actionable: true,
            suggestedAction: 'Fast-track expansion proposal to close by month-end',
            confidence: 91,
            date: new Date('2024-01-16')
          }
        ],
        riskFactors: [],
        positiveSignals: ['Proven ROI', 'Internal champion', 'Budget approved', 'Expansion ready', 'Strong relationship'],
        priority: 'high'
      },
      {
        id: '5',
        title: 'Integration Package - DevCorp',
        contactId: '5',
        contactName: 'Alex Johnson',
        company: 'DevCorp',
        value: 45000,
        stage: 'prospect',
        probability: 35,
        confidence: 'medium',
        expectedCloseDate: new Date('2024-03-15'),
        createdDate: new Date('2024-01-10'),
        lastActivity: new Date('2024-01-11'),
        description: 'Custom integration package for existing workflow',
        tags: ['integration', 'custom', 'technical'],
        activities: [
          {
            id: '5',
            type: 'email',
            date: new Date('2024-01-11'),
            description: 'Initial inquiry about integration capabilities',
            outcome: 'Interested in custom integrations, technical evaluation needed',
            nextStep: 'Schedule technical deep-dive demo'
          }
        ],
        aiInsights: [
          {
            id: '5',
            type: 'suggestion',
            title: 'Technical Demo Needed',
            description: 'Integration requirements need technical validation',
            impact: 'medium',
            actionable: true,
            suggestedAction: 'Schedule demo with technical team and solutions architect',
            confidence: 68,
            date: new Date('2024-01-16')
          }
        ],
        riskFactors: ['Complex integration requirements', 'Custom development needed'],
        positiveSignals: ['Clear use case', 'Technical interest'],
        priority: 'medium'
      }
    ]
  }
}
