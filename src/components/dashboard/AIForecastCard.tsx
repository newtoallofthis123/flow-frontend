import { TrendingUp, ExternalLink } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../../stores'

const AIForecastCard = observer(() => {
  const { dashboardStore } = useStore()
  const { forecastData } = dashboardStore

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-500 dark:bg-green-400'
      case 'medium':
        return 'bg-yellow-500 dark:bg-yellow-400'
      case 'low':
        return 'bg-red-500 dark:bg-red-400'
      default:
        return 'bg-gray-500 dark:bg-gray-400'
    }
  }

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 dark:text-green-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-card-foreground flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>AI Forecast</span>
        </h2>
        <div className="flex space-x-1">
          <div className={`w-2 h-2 ${getConfidenceColor(forecastData.confidence)} rounded-full`}></div>
          <div className="w-2 h-2 bg-yellow-500 dark:bg-yellow-400 rounded-full"></div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-4xl font-bold text-card-foreground mb-2">
          {formatCurrency(forecastData.revenue)}
        </div>
        <div className="text-muted-foreground text-sm">{forecastData.period}</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 ${getConfidenceColor(forecastData.confidence)} rounded-full`}></div>
          <span className={`${getConfidenceText(forecastData.confidence)} text-sm capitalize`}>
            {forecastData.confidence} confidence
          </span>
        </div>
        <button className="text-primary hover:text-primary/80 text-sm flex items-center space-x-1 transition-colors">
          <span>Details</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
})

export default AIForecastCard