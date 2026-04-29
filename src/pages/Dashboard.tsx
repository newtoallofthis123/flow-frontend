import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { TrendingUp, ExternalLink } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import { useStore } from '../stores'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Alert } from '../components/ui/Alert'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

const AIForecast = observer(() => {
  const { dashboardStore } = useStore()
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

      <div className="mb-4">
        <div className="text-2xl font-medium text-foreground mb-1">
          {formatCurrency(forecastData.weighted_forecast)}
        </div>
        <div className="text-muted-foreground text-sm">{getCurrentMonth()}</div>
      </div>

      <div className="flex items-center justify-end">
        <button className="text-primary hover:text-primary/80 text-sm flex items-center gap-1 transition-colors">
          <span>Details</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </Card>
  )
})

const SmartActionFeed = observer(() => {
  const { dashboardStore } = useStore()

  const handleAction = async (actionType: string, itemId: string) => {
    if (actionType === 'dismiss') {
      await dashboardStore.dismissActionItem(itemId)
    } else {
      console.log(`Executing action: ${actionType} for item: ${itemId}`)
    }
  }

  return (
    <Card bordered>
      <h2 className="text-base font-semibold text-foreground mb-4">Smart Action Feed</h2>

      <div className="space-y-3">
        {dashboardStore.actionItems.map((item) => (
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
          <AIForecast />
          <SmartActionFeed />
        </div>
      </div>
    </MainLayout>
  )
})

export default Dashboard
