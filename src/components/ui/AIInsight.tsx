import { Brain, Target, AlertTriangle, Lightbulb, Users, ExternalLink, X } from 'lucide-react'

interface AIInsightProps {
  type: 'opportunity' | 'risk' | 'suggestion' | 'trend' | 'competitor'
  title: string
  description: string
  confidence?: number
  impact?: 'high' | 'medium' | 'low'
  actionable?: boolean
  suggestedAction?: string
  onAction?: () => void
  onDismiss?: () => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'card' | 'inline' | 'toast'
}

const AIInsight = ({
  type,
  title,
  description,
  confidence = 0,
  impact = 'medium',
  actionable = false,
  suggestedAction,
  onAction,
  onDismiss,
  size = 'md',
  variant = 'card'
}: AIInsightProps) => {
  const getTypeConfig = () => {
    switch (type) {
      case 'opportunity':
        return {
          icon: Target,
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-700/30',
          accentColor: 'bg-green-400'
        }
      case 'risk':
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-700/30',
          accentColor: 'bg-red-400'
        }
      case 'suggestion':
        return {
          icon: Lightbulb,
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/20',
          borderColor: 'border-blue-700/30',
          accentColor: 'bg-blue-400'
        }
      case 'competitor':
        return {
          icon: Users,
          color: 'text-purple-400',
          bgColor: 'bg-purple-900/20',
          borderColor: 'border-purple-700/30',
          accentColor: 'bg-purple-400'
        }
      case 'trend':
      default:
        return {
          icon: Brain,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-700/30',
          accentColor: 'bg-yellow-400'
        }
    }
  }

  const getImpactColor = () => {
    switch (impact) {
      case 'high':
        return 'text-red-400'
      case 'low':
        return 'text-green-400'
      case 'medium':
      default:
        return 'text-yellow-400'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'p-3',
          title: 'text-sm',
          description: 'text-xs',
          icon: 'w-4 h-4',
          button: 'px-2 py-1 text-xs'
        }
      case 'lg':
        return {
          padding: 'p-6',
          title: 'text-lg',
          description: 'text-base',
          icon: 'w-6 h-6',
          button: 'px-4 py-2 text-sm'
        }
      case 'md':
      default:
        return {
          padding: 'p-4',
          title: 'text-base',
          description: 'text-sm',
          icon: 'w-5 h-5',
          button: 'px-3 py-1.5 text-sm'
        }
    }
  }

  const config = getTypeConfig()
  const sizeClasses = getSizeClasses()
  const Icon = config.icon

  if (variant === 'inline') {
    return (
      <div className="flex items-start space-x-3">
        <div className={`${config.bgColor} ${config.borderColor} p-2 rounded-lg border`}>
          <Icon className={`${sizeClasses.icon} ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className={`${sizeClasses.title} font-semibold text-card-foreground truncate`}>
              {title}
            </h4>
            {confidence > 0 && (
              <div className="flex items-center space-x-1">
                <Brain className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">{confidence}%</span>
              </div>
            )}
          </div>
          <p className={`${sizeClasses.description} text-muted-foreground leading-relaxed`}>
            {description}
          </p>
          {actionable && suggestedAction && (
            <button
              onClick={onAction}
              className={`mt-2 ${sizeClasses.button} ${config.color} ${config.bgColor} ${config.borderColor} rounded border font-medium hover:bg-opacity-80 transition-colors`}
            >
              {suggestedAction}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'toast') {
    return (
      <div className={`${config.bgColor} ${config.borderColor} ${sizeClasses.padding} rounded-lg border backdrop-blur-sm relative`}>
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentColor} rounded-l-lg`} />

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start space-x-3 pr-6">
          <Icon className={`${sizeClasses.icon} ${config.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1 min-w-0">
            <h4 className={`${sizeClasses.title} font-semibold text-card-foreground mb-1`}>
              {title}
            </h4>
            <p className={`${sizeClasses.description} text-muted-foreground leading-relaxed`}>
              {description}
            </p>
            {actionable && suggestedAction && onAction && (
              <button
                onClick={onAction}
                className={`mt-3 ${sizeClasses.button} ${config.color} ${config.bgColor} ${config.borderColor} rounded border font-medium hover:bg-opacity-80 transition-colors flex items-center space-x-1`}
              >
                <span>{suggestedAction}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Card variant (default)
  return (
    <div className={`${config.bgColor} ${config.borderColor} ${sizeClasses.padding} rounded-lg border backdrop-blur-sm relative overflow-hidden`}>
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentColor}`} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Icon className={`${sizeClasses.icon} ${config.color}`} />
          <h4 className={`${sizeClasses.title} font-semibold text-card-foreground`}>
            {title}
          </h4>
        </div>

        <div className="flex items-center space-x-3">
          {impact && (
            <span className={`text-xs font-medium ${getImpactColor()} uppercase tracking-wide`}>
              {impact}
            </span>
          )}
          {confidence > 0 && (
            <div className="flex items-center space-x-1">
              <Brain className="w-3 h-3 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">{confidence}%</span>
            </div>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className={`${sizeClasses.description} text-muted-foreground leading-relaxed mb-4`}>
        {description}
      </p>

      {actionable && suggestedAction && onAction && (
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Suggested Action
          </span>
          <button
            onClick={onAction}
            className={`${sizeClasses.button} ${config.color} ${config.bgColor} ${config.borderColor} rounded border font-medium hover:bg-opacity-80 transition-colors flex items-center space-x-1`}
          >
            <span>{suggestedAction}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}

export default AIInsight