import { observer } from 'mobx-react-lite'
import { useState, useRef } from 'react'
import { useStore } from '../stores'
import MainLayout from '../components/layout/MainLayout'
import SearchBar from '../components/ui/SearchBar'
import ProbabilityBadge from '../components/ui/ProbabilityBadge'
import AIInsight from '../components/ui/AIInsight'
import AddDealModal from '../components/ui/AddDealModal'
import { Target, DollarSign, Calendar, Building, User, AlertTriangle, TrendingUp, Brain, Plus, MoreHorizontal, Users } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { DealStage, Deal } from '../stores/DealsStore'

const Deals = observer(() => {
  const { dealsStore } = useStore()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false)

  const selectedDeal = id
    ? dealsStore.deals.find(d => d.id === id)
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
    { id: 'all', label: 'All Deals', count: dealsStore.filteredDeals?.length || 0 },
    { id: 'hot', label: 'Hot Deals', count: (dealsStore.deals || []).filter(d => d.probability > 70).length },
    { id: 'at-risk', label: 'At Risk', count: (dealsStore.deals || []).filter(d => (d.riskFactors && d.riskFactors.length > 0)).length },
    { id: 'closing-soon', label: 'Closing Soon', count: (dealsStore.deals || []).filter(d => {
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

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartPosRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDealId(deal.id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', deal.id)
  }

  const handleDragEnd = () => {
    setDraggedDealId(null)
    setDragOverStage(null)
    dragStartPosRef.current = null
  }

  const handleDragOver = (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stage)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault()
    const dealId = e.dataTransfer.getData('text/plain')
    
    if (!dealId) {
      setDragOverStage(null)
      setDraggedDealId(null)
      return
    }

    const deal = dealsStore.deals.find(d => d.id === dealId)
    if (!deal || deal.stage === targetStage) {
      setDragOverStage(null)
      setDraggedDealId(null)
      return
    }

    try {
      // Update backend - the store will handle the UI update
      await dealsStore.updateDealStage(dealId, targetStage)
      // Refresh stats after stage change
      await dealsStore.fetchStageStats()
      await dealsStore.fetchForecast()
    } catch (error) {
      console.error('Failed to update deal stage:', error)
    } finally {
      setDragOverStage(null)
      setDraggedDealId(null)
    }
  }

  const handleAddDeal = async (data: {
    title: string
    contactId: string
    contactName: string
    company: string
    value: number
    stage: DealStage
    expectedCloseDate: Date
    description: string
    tags?: string[]
    priority: 'high' | 'medium' | 'low'
  }) => {
    try {
      const now = new Date()
      const newDeal = await dealsStore.createDeal({
        title: data.title,
        contactId: data.contactId,
        contactName: data.contactName,
        company: data.company,
        value: data.value,
        stage: data.stage,
        expectedCloseDate: data.expectedCloseDate,
        createdDate: now,
        lastActivity: now,
        description: data.description || '',
        tags: data.tags || [],
        activities: [],
        competitorMentioned: undefined,
        priority: data.priority,
      })
      // Navigate to the new deal
      navigate(`/deals/${newDeal.id}`)
      // Refresh stats
      await dealsStore.fetchStageStats()
      await dealsStore.fetchForecast()
    } catch (error) {
      console.error('Error adding deal:', error)
      throw error
    }
  }

  const handleCardClick = (e: React.MouseEvent, deal: Deal) => {
    // Only navigate if this was a click (not a drag)
    // Check if mouse moved significantly from initial position
    if (dragStartPosRef.current) {
      const dx = Math.abs(e.clientX - dragStartPosRef.current.x)
      const dy = Math.abs(e.clientY - dragStartPosRef.current.y)
      // If moved more than 5px, it was a drag, not a click
      if (dx > 5 || dy > 5) {
        return
      }
    }
    navigate(`/deals/${deal.id}`)
  }

  const DealCard = ({ deal }: { deal: Deal }) => (
    <div
      draggable={true}
      onMouseDown={handleMouseDown}
      onDragStart={(e) => handleDragStart(e, deal)}
      onDragEnd={handleDragEnd}
      onClick={(e) => handleCardClick(e, deal)}
      className={`p-4 bg-card border border-border rounded-lg cursor-move hover:bg-accent/50 transition-all ${
        id === deal.id ? 'ring-2 ring-primary' : ''
      } ${
        draggedDealId === deal.id ? 'opacity-50 scale-95' : ''
      }`}
    >
      {/* Deal Header */}
      <div className="flex items-start justify-between mb-3" style={{ pointerEvents: 'none' }}>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-card-foreground text-sm truncate mb-1">{deal.title}</h4>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="truncate">{deal.contactName}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground/70">
            <Building className="w-3 h-3" />
            <span className="truncate">{deal.company}</span>
          </div>
        </div>
        <button 
          className="text-muted-foreground hover:text-foreground transition-colors"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Deal Value and Probability */}
      <div className="flex items-center justify-between mb-3" style={{ pointerEvents: 'none' }}>
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
      <div className="space-y-2 mb-3" style={{ pointerEvents: 'none' }}>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 text-muted-foreground">
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
        {deal.riskFactors && deal.riskFactors.length > 0 && (
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
      {deal.tags && deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1" style={{ pointerEvents: 'none' }}>
          {deal.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded">
              {tag}
            </span>
          ))}
          {deal.tags.length > 2 && (
            <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded">
              +{deal.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  )

  const KanbanColumn = ({ stage, deals }: { stage: DealStage; deals: Deal[] }) => {
    const stageStats = Array.isArray(dealsStore.stageStats) 
      ? dealsStore.stageStats.find(s => s.stage === stage)
      : undefined
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)
    const isDragOver = dragOverStage === stage

    return (
      <div 
        className="flex-1 min-w-80"
        onDragOver={(e) => handleDragOver(e, stage)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, stage)}
      >
        {/* Column Header */}
        <div className={`bg-card rounded-lg p-4 mb-4 border border-border transition-all ${
          isDragOver ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <h3 className={`font-semibold ${getStageColor(stage)}`}>
                {getStageTitle(stage)}
              </h3>
              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                {deals.length}
              </span>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{formatCurrency(totalValue)}</span>
            {stageStats && (
              <div className="flex items-center space-x-1">
                <Brain className="w-3 h-3 text-primary" />
                <span className="text-primary">{stageStats.avgProbability}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Deal Cards */}
        <div className={`space-y-3 min-h-[200px] transition-all ${
          isDragOver ? 'bg-primary/5 rounded-lg p-2 border-2 border-dashed border-primary' : ''
        }`}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
          {isDragOver && draggedDealId && !deals.find(d => d.id === draggedDealId) && (
            <div className="p-4 bg-primary/10 border-2 border-dashed border-primary rounded-lg text-center text-sm text-muted-foreground">
              Drop here to move deal
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-foreground">Pipeline</h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Target className="w-4 h-4" />
                  <span>{dealsStore.filteredDeals?.length || 0} active deals</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(dealsStore.forecastData.totalPipeline)} pipeline</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsAddDealModalOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors"
                aria-label="Add new deal"
              >
                <Plus className="w-4 h-4" />
                <span>Add Deal</span>
              </button>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(dealsStore.forecastData.weightedForecast)}
                </div>
                <div className="text-sm text-muted-foreground">Weighted Forecast</div>
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
        <div className="p-6 border-b border-border bg-card/20">
          <div className="grid grid-cols-4 gap-6">
            {(Array.isArray(dealsStore.stageStats) ? dealsStore.stageStats : []).map((stat) => (
              <div key={stat.stage} className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${getStageColor(stat.stage)}`}>
                    {getStageTitle(stat.stage)}
                  </h4>
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                    {stat.count}
                  </span>
                </div>
                <div className="text-lg font-bold text-card-foreground mb-1">
                  {formatCurrency(stat.totalValue)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg: {stat.avgDaysInStage}d</span>
                  <div className="flex items-center space-x-1">
                    <Brain className="w-3 h-3 text-primary" />
                    <span className="text-primary">{stat.avgProbability}%</span>
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
                  deals={(dealsStore.dealsByStage && dealsStore.dealsByStage[stage]) || []}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deal Detail Sidebar */}
      {selectedDeal && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-sidebar border-l border-sidebar-border z-50 overflow-y-auto">
          <div className="p-6">
            {/* Deal Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-sidebar-foreground mb-2">{selectedDeal.title}</h3>
                <div className="flex items-center space-x-2 text-muted-foreground mb-2">
                  <User className="w-4 h-4" />
                  <span>{selectedDeal.contactName}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground/70">
                  <Building className="w-4 h-4" />
                  <span>{selectedDeal.company}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/deals')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>

            {/* Deal Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {formatCurrency(selectedDeal.value)}
                </div>
                <div className="text-sm text-muted-foreground">Deal Value</div>
              </div>
              <div className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center space-x-2 mb-1">
                  <ProbabilityBadge
                    probability={selectedDeal.probability}
                    confidence={selectedDeal.confidence}
                    size="sm"
                    showIcon={false}
                  />
                </div>
                <div className="text-sm text-muted-foreground">Close Probability</div>
              </div>
            </div>

            {/* Expected Close Date */}
            <div className="bg-card rounded-lg p-4 mb-6 border border-border">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="font-semibold text-card-foreground">Expected Close</span>
              </div>
              <div className="text-lg text-card-foreground">
                {formatDate(selectedDeal.expectedCloseDate)}
              </div>
            </div>

            {/* AI Insights */}
            <div className="mb-6">
              <h4 className="font-semibold text-sidebar-foreground mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primary" />
                <span>AI Insights</span>
              </h4>
              <div className="space-y-4">
                {(selectedDeal.aiInsights || []).map((insight) => (
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
            {selectedDeal.positiveSignals && selectedDeal.positiveSignals.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-sidebar-foreground mb-3 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span>Positive Signals</span>
                </h4>
                <div className="space-y-2">
                  {selectedDeal.positiveSignals.map((signal, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-card-foreground">{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {selectedDeal.riskFactors && selectedDeal.riskFactors.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-sidebar-foreground mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Risk Factors</span>
                </h4>
                <div className="space-y-2">
                  {selectedDeal.riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      <span className="text-card-foreground">{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activities */}
            <div className="mb-6">
              <h4 className="font-semibold text-sidebar-foreground mb-3">Recent Activities</h4>
              <div className="space-y-3">
                {(selectedDeal.activities || []).slice(0, 3).map((activity) => (
                  <div key={activity.id} className="p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-card-foreground capitalize">
                        {activity.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(activity.date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    {activity.outcome && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{activity.outcome}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
        onSubmit={handleAddDeal}
      />
    </MainLayout>
  )
})

export default Deals
