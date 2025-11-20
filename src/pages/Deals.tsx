import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { useStore } from '../stores'
import MainLayout from '../components/layout/MainLayout'
import SearchBar from '../components/ui/SearchBar'
import ProbabilityBadge from '../components/ui/ProbabilityBadge'
import AIInsight from '../components/ui/AIInsight'
import AddDealModal from '../components/ui/AddDealModal'
import { Target, DollarSign, Calendar, Building, User, AlertTriangle, TrendingUp, Brain, Plus, MoreHorizontal, Users } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { DealStage, Deal } from '../stores/DealsStore'
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
  closestCorners,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createPortal } from 'react-dom'

// Separate component for the card content to be reused in DragOverlay
const DealCardContent = ({ deal, isOverlay = false }: { deal: Deal; isOverlay?: boolean }) => {
  const { id } = useParams<{ id: string }>()
  
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

  return (
    <div
      className={`p-4 bg-card border border-border rounded-lg transition-all ${
        id === deal.id && !isOverlay ? 'ring-2 ring-primary' : ''
      } ${isOverlay ? 'shadow-2xl scale-105 cursor-grabbing' : 'cursor-grab hover:bg-accent/50'}`}
    >
      {/* Deal Header */}
      <div className="flex items-start justify-between mb-3">
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
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Deal Value and Probability */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-bold text-green-600 dark:text-green-400">
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
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(deal.expectedCloseDate)}</span>
          </div>
          {deal.priority === 'high' && (
            <div className="px-2 py-1 bg-red-100/50 dark:bg-red-900/20 border border-red-300/50 dark:border-red-700/30 rounded text-red-600 dark:text-red-400 text-xs">
              High Priority
            </div>
          )}
        </div>

        {/* Risk Factors */}
        {deal.riskFactors && deal.riskFactors.length > 0 && (
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span className="text-xs text-red-600 dark:text-red-400">
              {deal.riskFactors.length} risk factor{deal.riskFactors.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Competitor Warning */}
        {deal.competitorMentioned && (
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs text-yellow-600 dark:text-yellow-400">Competitor mentioned</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {deal.tags && deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
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
}

const SortableDealCard = ({ deal, onClick }: { deal: Deal; onClick: (deal: Deal) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: deal.id,
    data: {
      type: 'Deal',
      deal,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onClick={(e) => {
        e.stopPropagation() // Prevent background click
        onClick(deal)
      }}
    >
      <DealCardContent deal={deal} />
    </div>
  )
}

const Deals = observer(() => {
  const { dealsStore } = useStore()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Fixes double click issue by requiring 5px movement for drag
      },
    })
  )

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
      case 'prospect': return 'Prospect'
      case 'qualified': return 'Qualified'
      case 'proposal': return 'Proposal'
      case 'negotiation': return 'Negotiation'
      case 'closed-won': return 'Closed Won'
      case 'closed-lost': return 'Closed Lost'
    }
  }

  const getStageColor = (stage: DealStage) => {
    switch (stage) {
      case 'prospect': return 'text-slate-600 dark:text-slate-400'
      case 'qualified': return 'text-blue-600 dark:text-blue-400'
      case 'proposal': return 'text-yellow-600 dark:text-yellow-400'
      case 'negotiation': return 'text-orange-600 dark:text-orange-400'
      case 'closed-won': return 'text-green-600 dark:text-green-400'
      case 'closed-lost': return 'text-red-600 dark:text-red-400'
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const deal = active.data.current?.deal as Deal
    setActiveDeal(deal)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDeal(null)

    if (!over) return

    const dealId = active.id as string
    // The drop target id should be the stage name (we'll set this up in KanbanColumn)
    // Or if dropped on another card, we need to find the container
    
    // In this simple implementation, we'll make the column itself a droppable zone
    // but since we are using SortableContext, the 'over' might be another card.
    // We need to resolve the stage from the over id.
    
    let targetStage: DealStage | null = null
    
    // Check if over is a stage container
    if (['prospect', 'qualified', 'proposal', 'negotiation'].includes(over.id as string)) {
      targetStage = over.id as DealStage
    } else {
      // If over is a card, find its stage
      const overDeal = dealsStore.deals.find(d => d.id === over.id)
      if (overDeal) {
        targetStage = overDeal.stage
      }
    }

    if (targetStage) {
      const deal = dealsStore.deals.find(d => d.id === dealId)
      if (deal && deal.stage !== targetStage) {
        try {
          await dealsStore.updateDealStage(dealId, targetStage)
          await dealsStore.fetchStageStats()
          await dealsStore.fetchForecast()
        } catch (error) {
          console.error('Failed to update deal stage:', error)
        }
      }
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
      
      if (newDeal) {
        navigate(`/deals/${newDeal.id}`)
        await dealsStore.fetchStageStats()
        await dealsStore.fetchForecast()
      }
    } catch (error) {
      console.error('Error adding deal:', error)
      throw error
    }
  }

  const handleCardClick = (deal: Deal) => {
    navigate(`/deals/${deal.id}`)
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // If clicking the background (not a card or interactive element), unselect
    if (e.target === e.currentTarget) {
      navigate('/deals')
    }
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  }

  const KanbanColumn = ({ stage, deals }: { stage: DealStage; deals: Deal[] }) => {
    const stageStats = Array.isArray(dealsStore.stageStats) 
      ? dealsStore.stageStats.find(s => s.stage === stage)
      : undefined
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0)

    // We use the stage as the ID for the droppable container if needed, 
    // but SortableContext handles the items. 
    // To make the empty column droppable, we can use a Droppable hook or just rely on the SortableContext 
    // if we ensure the list is never empty or handle it correctly.
    // Actually, dnd-kit's SortableContext doesn't automatically make the container droppable for *empty* lists 
    // unless we also use useDroppable on the container.
    
    // However, for simplicity in this refactor, we will rely on the fact that we can drop "near" items.
    // But to be robust, let's make the column droppable too.
    // We can just use the SortableContext which provides the strategy.
    // But we need a useDroppable for the column to handle empty states or dropping "into" the column.
    
    // Let's use a simple approach: The column div is a droppable zone.
    // But wait, we are using SortableContext.
    // Let's just pass the items to SortableContext.
    
    return (
      <div 
        className="flex-1 min-w-80 flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent column clicks from triggering background unselect
      >
        {/* Column Header */}
        <div className="bg-card rounded-lg p-4 mb-4 border border-border">
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

        {/* Deal Cards Container */}
        <SortableContext 
          id={stage}
          items={deals.map(d => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div 
            className="space-y-3 min-h-[200px] flex-1"
            // We can make this div a droppable target if we want to support dropping in empty columns explicitly
            // But dnd-kit's SortableContext usually handles this if we configure it right.
            // Actually, if the list is empty, we can't drop on an item.
            // So we should use useDroppable here as well.
            // But for now, let's see if the 'over' detection works for the container ID (which we set as 'id={stage}' in SortableContext? No, SortableContext id is just for internal use usually).
            // Actually SortableContext doesn't accept 'id' prop for the container, it accepts 'items'.
            // The 'id' prop on SortableContext is for the strategy? No.
            // Let's wrap this div in a Droppable.
          >
            <DroppableColumn stage={stage}>
              {deals.map((deal) => (
                <SortableDealCard 
                  key={deal.id} 
                  deal={deal} 
                  onClick={handleCardClick}
                />
              ))}
              {deals.length === 0 && (
                <div className="h-full w-full border-2 border-dashed border-border/50 rounded-lg flex items-center justify-center text-muted-foreground/50 text-sm min-h-[100px]">
                  Drop here
                </div>
              )}
            </DroppableColumn>
          </div>
        </SortableContext>
      </div>
    )
  }

  // Helper component to make the column droppable
  const DroppableColumn = ({ stage, children }: { stage: DealStage, children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useSortable({
      id: stage,
      data: { type: 'Column', stage },
      disabled: true, // We don't want to drag the column itself
    })
    
    // Note: useSortable with disabled: true acts like useDroppable but shares the context
    // Actually, better to use useDroppable from @dnd-kit/core to avoid confusion
    // But we need to import it. Let's just use the useSortable trick or import useDroppable.
    // I'll stick to useSortable with disabled: true for now as it's already imported, 
    // OR better, I'll add useDroppable to imports. 
    // Wait, I didn't import useDroppable. Let's use useSortable with disabled: true, it works as a drop target.
    
    return (
      <div 
        ref={setNodeRef}
        className={`h-full transition-colors rounded-lg ${isOver ? 'bg-accent/20' : ''}`}
      >
        {children}
      </div>
    )
  }

  return (
    <MainLayout>
      <div 
        className="h-full flex flex-col"
        onClick={handleBackgroundClick} // Handle background click to unselect
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/30" onClick={e => e.stopPropagation()}>
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
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
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
        <div className="p-6 border-b border-border bg-card/20" onClick={e => e.stopPropagation()}>
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto">
            <div className="p-6 min-w-max h-full">
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
          
          {createPortal(
            <DragOverlay dropAnimation={dropAnimation}>
              {activeDeal ? (
                <DealCardContent deal={activeDeal} isOverlay />
              ) : null}
            </DragOverlay>,
            document.body
          )}
        </DndContext>
      </div>

      {/* Deal Detail Sidebar */}
      {selectedDeal && (
        <div 
          className="fixed right-0 top-0 bottom-0 w-96 bg-sidebar border-l border-sidebar-border z-50 overflow-y-auto shadow-xl"
          onClick={e => e.stopPropagation()} // Prevent clicks in sidebar from closing it
        >
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
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
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
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
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
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
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
