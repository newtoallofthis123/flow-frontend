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
        return 'bg-green-400'
      case 'medium':
        return 'bg-yellow-400'
      case 'low':
        return 'bg-red-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'low':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          <span>AI Forecast</span>
        </h2>
        <div className="flex space-x-1">
          <div className={`w-2 h-2 ${getConfidenceColor(forecastData.confidence)} rounded-full`}></div>
          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-4xl font-bold text-white mb-2">
          {formatCurrency(forecastData.revenue)}
        </div>
        <div className="text-slate-400 text-sm">{forecastData.period}</div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 ${getConfidenceColor(forecastData.confidence)} rounded-full`}></div>
          <span className={`${getConfidenceText(forecastData.confidence)} text-sm capitalize`}>
            {forecastData.confidence} confidence
          </span>
        </div>
        <button className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1 transition-colors">
          <span>Details</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
})

export default AIForecastCard