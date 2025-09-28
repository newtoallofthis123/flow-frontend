import { observer } from 'mobx-react-lite'
import { useStore } from '../stores'
import MainLayout from '../components/layout/MainLayout'
import SearchBar from '../components/ui/SearchBar'
import ProbabilityBadge from '../components/ui/ProbabilityBadge'
import AIInsight from '../components/ui/AIInsight'
import { Target, DollarSign, Calendar, Building, User, AlertTriangle, TrendingUp, Brain, Plus, MoreHorizontal, Users } from 'lucide-react'
import { useState } from 'react'
import { DealStage, Deal } from '../stores/DealsStore'

const Deals = observer(() => {
  const { dealsStore } = useStore()
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)

  const selectedDeal = selectedDealId
    ? dealsStore.deals.find(d => d.id === selectedDealId)
    : null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const searchFilters = [
    { id: 'all', label: 'All Deals', count: dealsStore.filteredDeals.length },
    { id: 'hot', label: 'Hot Deals', count: dealsStore.deals.filter(d => d.probability > 70).length },
    { id: 'at-risk', label: 'At Risk', count: dealsStore.deals.filter(d => d.riskFactors.length > 0).length },
    { id: 'closing-soon', label: 'Closing Soon', count: dealsStore.deals.filter(d => {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return d.expectedCloseDate <= thirtyDaysFromNow
    }).length }
  ]

  const aiSuggestions = [
    'high probability deals',
    'deals at risk',
    'closing this month',
    'competitor mentions'
  ]

  const getStageTitle = (stage: DealStage) => {
    switch (stage) {
      case 'prospect':
        return 'Prospect'
      case 'qualified':
        return 'Qualified'
      case 'proposal':
        return 'Proposal'
      case 'negotiation':
        return 'Negotiation'
      case 'closed-won':
        return 'Closed Won'
      case 'closed-lost':
        return 'Closed Lost'
    }
  }

  const getStageColor = (stage: DealStage) => {
    switch (stage) {
      case 'prospect':
        return 'text-slate-400'
      case 'qualified':
        return 'text-blue-400'
      case 'proposal':
        return 'text-yellow-400'
      case 'negotiation':
        return 'text-orange-400'
      case 'closed-won':
        return 'text-green-400'
      case 'closed-lost':
        return 'text-red-400'
    }
  }

  const DealCard = ({ deal }: { deal: Deal }) => (
    <div
      onClick={() => setSelectedDealId(deal.id)}
      className={`p-4 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-all ${
        selectedDealId === deal.id ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      {/* Deal Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm truncate mb-1">{deal.title}</h4>
          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <User className="w-3 h-3" />
            <span className="truncate">{deal.contactName}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-slate-500">
            <Building className="w-3 h-3" />
            <span className="truncate">{deal.company}</span>
          </div>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Deal Value and Probability */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-bold text-green-400">
          {formatCurrency(deal.value)}
        </div>
        <ProbabilityBadge
          probability={deal.probability}
          confidence={deal.confidence}
          size="sm"
        />
      </div>

      {/* Deal Info */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 text-slate-400">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(deal.expectedCloseDate)}</span>
          </div>
          {deal.priority === 'high' && (
            <div className="px-2 py-1 bg-red-900/20 border border-red-700/30 rounded text-red-400 text-xs">
              High Priority
            </div>
          )}
        </div>

        {/* Risk Factors */}
        {deal.riskFactors.length > 0 && (
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-400">
              {deal.riskFactors.length} risk factor{deal.riskFactors.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Competitor Warning */}
        {deal.competitorMentioned && (
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-yellow-400" />
            <span className="text-xs text-yellow-400">Competitor mentioned</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {deal.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
              {tag}
            </span>
          ))}
          {deal.tags.length > 2 && (
            <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
              +{deal.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  )

  const KanbanColumn = ({ stage, deals }: { stage: DealStage; deals: Deal[] }) => {
    const stageStats = dealsStore.stageStats.find(s => s.stage === stage)
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)

    return (
      <div className="flex-1 min-w-80">
        {/* Column Header */}
        <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold ${getStageColor(stage)}`}>
                {getStageTitle(stage)}
              </h3>
              <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                {deals.length}
              </span>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">{formatCurrency(totalValue)}</span>
            {stageStats && (
              <div className="flex items-center space-x-1">
                <Brain className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400">{stageStats.avgProbability}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Deal Cards */}
        <div className="space-y-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-white">Pipeline</h1>
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{dealsStore.filteredDeals.length} active deals</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(dealsStore.forecastData.totalPipeline)} pipeline</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(dealsStore.forecastData.weightedForecast)}
                </div>
                <div className="text-sm text-slate-400">Weighted Forecast</div>
              </div>
            </div>
          </div>

          <SearchBar
            value={dealsStore.searchQuery}
            onChange={dealsStore.setSearchQuery}
            placeholder="Search deals, companies, contacts..."
            showAI={true}
            showFilter={true}
            filters={searchFilters}
            selectedFilter={dealsStore.filterBy}
            onFilterChange={(filter) => dealsStore.setFilter(filter as typeof dealsStore.filterBy)}
            aiSuggestions={aiSuggestions}
          />
        </div>

        {/* Pipeline Stats */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/20">
          <div className="grid grid-cols-4 gap-6">
            {dealsStore.stageStats.map((stat) => (
              <div key={stat.stage} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${getStageColor(stat.stage)}`}>
                    {getStageTitle(stat.stage)}
                  </h4>
                  <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                    {stat.count}
                  </span>
                </div>
                <div className="text-lg font-bold text-white mb-1">
                  {formatCurrency(stat.totalValue)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Avg: {stat.avgDaysInStage}d</span>
                  <div className="flex items-center space-x-1">
                    <Brain className="w-3 h-3 text-purple-400" />
                    <span className="text-purple-400">{stat.avgProbability}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto">
          <div className="p-6 min-w-max">
            <div className="flex space-x-6 h-full">
              {(['prospect', 'qualified', 'proposal', 'negotiation'] as DealStage[]).map((stage) => (
                <KanbanColumn
                  key={stage}
                  stage={stage}
                  deals={dealsStore.dealsByStage[stage] || []}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deal Detail Sidebar */}
      {selectedDeal && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-slate-900 border-l border-slate-800 z-50 overflow-y-auto">
          <div className="p-6">
            {/* Deal Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-white mb-2">{selectedDeal.title}</h3>
                <div className="flex items-center space-x-2 text-slate-400 mb-2">
                  <User className="w-4 h-4" />
                  <span>{selectedDeal.contactName}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                  <Building className="w-4 h-4" />
                  <span>{selectedDeal.company}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDealId(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>

            {/* Deal Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {formatCurrency(selectedDeal.value)}
                </div>
                <div className="text-sm text-slate-400">Deal Value</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <ProbabilityBadge
                    probability={selectedDeal.probability}
                    confidence={selectedDeal.confidence}
                    size="sm"
                    showIcon={false}
                  />
                </div>
                <div className="text-sm text-slate-400">Close Probability</div>
              </div>
            </div>

            {/* Expected Close Date */}
            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-white">Expected Close</span>
              </div>
              <div className="text-lg text-white">
                {formatDate(selectedDeal.expectedCloseDate)}
              </div>
            </div>

            {/* AI Insights */}
            <div className="mb-6">
              <h4 className="font-semibold text-white mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <span>AI Insights</span>
              </h4>
              <div className="space-y-4">
                {selectedDeal.aiInsights.map((insight) => (
                  <AIInsight
                    key={insight.id}
                    type={insight.type}
                    title={insight.title}
                    description={insight.description}
                    confidence={insight.confidence}
                    impact={insight.impact}
                    actionable={insight.actionable}
                    suggestedAction={insight.suggestedAction}
                    size="sm"
                    variant="card"
                  />
                ))}
              </div>
            </div>

            {/* Positive Signals */}
            {selectedDeal.positiveSignals.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span>Positive Signals</span>
                </h4>
                <div className="space-y-2">
                  {selectedDeal.positiveSignals.map((signal, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-slate-300">{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {selectedDeal.riskFactors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Risk Factors</span>
                </h4>
                <div className="space-y-2">
                  {selectedDeal.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-slate-300">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activities */}
            <div className="mb-6">
              <h4 className="font-semibold text-white mb-3">Recent Activities</h4>
              <div className="space-y-3">
                {selectedDeal.activities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white capitalize">
                        {activity.type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{activity.description}</p>
                    {activity.outcome && (
                      <p className="text-xs text-slate-500 mt-1">{activity.outcome}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
})

export default Deals
