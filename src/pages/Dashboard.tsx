import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import {
  TrendingUp,
  ExternalLink,
  DollarSign,
  Target,
  CalendarClock,
  AlertTriangle,
  ArrowUpRight,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import { useStore } from '../stores'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Alert } from '../components/ui/Alert'
import HealthScore from '../components/ui/HealthScore'
import ProbabilityBadge from '../components/ui/ProbabilityBadge'
import type { Deal, DealStage } from '../stores/DealsStore'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatCompactCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

const getCurrentMonth = () => {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())
}

const getButtonStyles = (type: string) => {
  switch (type) {
    case 'primary':
      return 'bg-primary hover:bg-primary/90 text-primary-foreground'
    case 'secondary':
      return 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
    case 'dismiss':
      return 'bg-muted hover:bg-muted/80 text-muted-foreground'
    default:
      return 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
  }
}

const STAGE_LABELS: Record<DealStage, string> = {
  prospect: 'Prospect',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  'closed-won': 'Closed Won',
  'closed-lost': 'Closed Lost',
}

const PIPELINE_STAGES: DealStage[] = ['prospect', 'qualified', 'proposal', 'negotiation']

const KpiTile = ({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = 'default',
  onClick,
}: {
  icon: typeof DollarSign
  label: string
  value: string
  sublabel?: string
  tone?: 'default' | 'success' | 'warning'
  onClick?: () => void
}) => {
  const toneClasses =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-warning'
        : 'text-primary'

  return (
    <Card bordered interactive={!!onClick} onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </span>
        <Icon className={`w-4 h-4 ${toneClasses}`} />
      </div>
      <div className="text-2xl font-semibold text-foreground mb-1">{value}</div>
      {sublabel && <div className="text-xs text-muted-foreground">{sublabel}</div>}
    </Card>
  )
}

const KpiRow = observer(() => {
  const { dashboardStore } = useStore()
  const navigate = useNavigate()
  const { forecastData, summary } = dashboardStore

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiTile
        icon={DollarSign}
        label="Total Pipeline"
        value={formatCompactCurrency(forecastData.total_pipeline)}
        sublabel="Open deals"
        onClick={() => navigate('/deals')}
      />
      <KpiTile
        icon={TrendingUp}
        label="Weighted Forecast"
        value={formatCompactCurrency(forecastData.weighted_forecast)}
        sublabel={getCurrentMonth()}
        tone="success"
      />
      <KpiTile
        icon={CalendarClock}
        label="Closing This Month"
        value={String(forecastData.deals_closing_this_month)}
        sublabel={formatCompactCurrency(forecastData.monthly_forecast)}
        onClick={() => navigate('/deals')}
      />
      <KpiTile
        icon={AlertTriangle}
        label="At-Risk Contacts"
        value={String(summary.atRiskContacts)}
        sublabel="High churn risk"
        tone="warning"
        onClick={() => navigate('/contacts')}
      />
    </div>
  )
})

const PipelineByStage = observer(() => {
  const { dashboardStore } = useStore()
  const navigate = useNavigate()
  const deals = dashboardStore.summary.deals

  const stageBuckets = PIPELINE_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage)
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
    }
  })

  const maxValue = Math.max(...stageBuckets.map((b) => b.value), 1)

  return (
    <Card bordered>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Pipeline by Stage</h2>
        <button
          onClick={() => navigate('/deals')}
          className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {deals.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          No deals in pipeline yet.
        </div>
      ) : (
        <div className="space-y-3">
          {stageBuckets.map((bucket) => (
            <div key={bucket.stage}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-foreground">{STAGE_LABELS[bucket.stage]}</span>
                <span className="text-muted-foreground tabular-nums">
                  {bucket.count} · {formatCompactCurrency(bucket.value)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(bucket.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
})

const TopDeals = observer(() => {
  const { dashboardStore } = useStore()
  const navigate = useNavigate()

  const topDeals: Deal[] = [...dashboardStore.summary.deals]
    .filter((d) => d.stage !== 'closed-won' && d.stage !== 'closed-lost')
    .sort((a, b) => b.value * (b.probability / 100) - a.value * (a.probability / 100))
    .slice(0, 5)

  return (
    <Card bordered>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span>Top Deals</span>
        </h2>
        <button
          onClick={() => navigate('/deals')}
          className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {topDeals.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">No open deals.</div>
      ) : (
        <div className="space-y-2">
          {topDeals.map((deal) => (
            <button
              key={deal.id}
              onClick={() => navigate(`/deals/${deal.id}`)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{deal.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {deal.company || deal.contactName} · {STAGE_LABELS[deal.stage]}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <ProbabilityBadge probability={deal.probability} confidence={deal.confidence} size="sm" />
                <div className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCompactCurrency(deal.value)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
})

const AtRiskContacts = observer(() => {
  const { dashboardStore } = useStore()
  const navigate = useNavigate()

  const atRisk = [...dashboardStore.summary.contacts]
    .filter((c) => c.churnRisk >= 60)
    .sort((a, b) => b.churnRisk - a.churnRisk)
    .slice(0, 5)

  return (
    <Card bordered>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-warning" />
          <span>At-Risk Contacts</span>
        </h2>
        <button
          onClick={() => navigate('/contacts')}
          className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {atRisk.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          No contacts flagged at risk.
        </div>
      ) : (
        <div className="space-y-2">
          {atRisk.map((contact) => (
            <button
              key={contact.id}
              onClick={() => navigate(`/contacts/${contact.id}`)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">{contact.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {contact.company || contact.email}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-3 shrink-0">
                <HealthScore score={contact.healthScore} variant="minimal" size="sm" />
                <Chip variant="warning" size="sm">
                  {contact.churnRisk}% risk
                </Chip>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
})

const AIForecast = observer(() => {
  const { dashboardStore } = useStore()
  const navigate = useNavigate()
  const { forecastData } = dashboardStore

  const getConfidence = () => {
    if (!forecastData.monthly_forecast) return 'low'
    const coverage = forecastData.total_pipeline / forecastData.monthly_forecast
    if (coverage >= 3) return 'high'
    if (coverage >= 2) return 'medium'
    return 'low'
  }

  const confidence = getConfidence()
  const confidenceVariant: 'success' | 'warning' | 'default' =
    confidence === 'high' ? 'success' : confidence === 'medium' ? 'warning' : 'warning'
  const confidenceLabel =
    confidence === 'high'
      ? 'High Confidence'
      : confidence === 'medium'
        ? 'Medium Confidence'
        : 'Low Confidence'

  const coverage =
    forecastData.monthly_forecast > 0
      ? forecastData.total_pipeline / forecastData.monthly_forecast
      : 0

  return (
    <Card bordered>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span>AI Forecast</span>
        </h2>
        <Chip variant={confidenceVariant} size="sm">
          {confidenceLabel}
        </Chip>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
            Weighted
          </div>
          <div className="text-xl font-semibold text-foreground">
            {formatCurrency(forecastData.weighted_forecast)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Pipeline</div>
          <div className="text-xl font-semibold text-foreground">
            {formatCompactCurrency(forecastData.total_pipeline)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Coverage</div>
          <div className="text-xl font-semibold text-foreground">{coverage.toFixed(1)}x</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm text-muted-foreground">{getCurrentMonth()}</span>
        <button
          onClick={() => navigate('/deals')}
          className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 transition-colors"
        >
          <span>Details</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
    </Card>
  )
})

const SMART_FEED_LIMIT = 7

const SmartActionFeed = observer(() => {
  const { dashboardStore } = useStore()
  const navigate = useNavigate()

  const handleAction = async (actionType: string, itemId: string) => {
    if (actionType === 'dismiss') {
      await dashboardStore.dismissActionItem(itemId)
    } else {
      console.log(`Executing action: ${actionType} for item: ${itemId}`)
    }
  }

  const visibleItems = dashboardStore.actionItems.slice(0, SMART_FEED_LIMIT)
  const hasMore = dashboardStore.actionItems.length > SMART_FEED_LIMIT

  return (
    <Card bordered>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">Smart Action Feed</h2>
        {hasMore && (
          <button
            onClick={() => navigate('/actions')}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Show all ({dashboardStore.actionItems.length})
          </button>
        )}
      </div>

      {dashboardStore.actionItems.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center">
          You're all caught up. No actions needed right now.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <Alert
              key={item.id}
              variant="warning"
              action={
                <div className="flex gap-2">
                  {item.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleAction(action.type, item.id)}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors ${getButtonStyles(action.type)}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              }
            >
              {item.title}
            </Alert>
          ))}
        </div>
      )}
    </Card>
  )
})

const Dashboard = observer(() => {
  const { dashboardStore } = useStore()

  useEffect(() => {
    dashboardStore.initialize()
  }, [dashboardStore])

  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Command Center</h1>
        <p className="text-muted-foreground mb-8">AI-powered insights and recommendations</p>

        <div className="space-y-6">
          <KpiRow />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AIForecast />
            </div>
            <PipelineByStage />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopDeals />
            <AtRiskContacts />
          </div>

          <SmartActionFeed />
        </div>
      </div>
    </MainLayout>
  )
})

export default Dashboard
