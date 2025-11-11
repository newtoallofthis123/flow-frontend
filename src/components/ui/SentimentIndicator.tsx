import { Smile, Meh, Frown, Brain } from 'lucide-react'

interface SentimentIndicatorProps {
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showConfidence?: boolean
  variant?: 'default' | 'minimal' | 'detailed'
}

const SentimentIndicator = ({
  sentiment,
  confidence = 0,
  size = 'md',
  showLabel = false,
  showConfidence = false,
  variant = 'default'
}: SentimentIndicatorProps) => {
  const getSentimentConfig = () => {
    switch (sentiment) {
      case 'positive':
        return {
          icon: Smile,
          emoji: '😊',
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-700/30',
          label: 'Positive'
        }
      case 'negative':
        return {
          icon: Frown,
          emoji: '😟',
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-700/30',
          label: 'Negative'
        }
      case 'neutral':
      default:
        return {
          icon: Meh,
          emoji: '😐',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-700/30',
          label: 'Neutral'
        }
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-6 h-6',
          icon: 'w-3 h-3',
          text: 'text-xs',
          padding: 'px-2 py-1'
        }
      case 'lg':
        return {
          container: 'w-10 h-10',
          icon: 'w-6 h-6',
          text: 'text-base',
          padding: 'px-4 py-2'
        }
      case 'md':
      default:
        return {
          container: 'w-8 h-8',
          icon: 'w-4 h-4',
          text: 'text-sm',
          padding: 'px-3 py-1.5'
        }
    }
  }

  const config = getSentimentConfig()
  const sizeClasses = getSizeClasses()
  const Icon = config.icon

  if (variant === 'minimal') {
    return (
      <span className={`${sizeClasses.text}`} title={`${config.label} sentiment`}>
        {config.emoji}
      </span>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`${config.bgColor} ${config.borderColor} ${sizeClasses.padding} rounded-lg border backdrop-blur-sm`}>
        <div className="flex items-center space-x-2">
          <Icon className={`${sizeClasses.icon} ${config.color}`} />
          <div className="flex flex-col">
            <span className={`${config.color} font-medium ${sizeClasses.text}`}>
              {config.label}
            </span>
            {showConfidence && confidence > 0 && (
              <div className="flex items-center space-x-1">
                <Brain className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">{confidence}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className={`${sizeClasses.container} ${config.bgColor} ${config.borderColor} rounded-full border flex items-center justify-center backdrop-blur-sm`}>
      <Icon className={`${sizeClasses.icon} ${config.color}`} />
      {showLabel && (
        <span className={`ml-2 ${config.color} ${sizeClasses.text} font-medium`}>
          {config.label}
        </span>
      )}
      {showConfidence && confidence > 0 && (
        <div className="ml-1 flex items-center">
          <Brain className="w-3 h-3 text-primary" />
          <span className="text-xs text-muted-foreground ml-1">{confidence}%</span>
        </div>
      )}
    </div>
  )
}

export default SentimentIndicator