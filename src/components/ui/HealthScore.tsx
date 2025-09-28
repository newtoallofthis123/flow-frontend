import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface HealthScoreProps {
  score: number // 0-100
  trend?: 'up' | 'down' | 'stable'
  size?: 'sm' | 'md' | 'lg'
  showTrend?: boolean
  showLabel?: boolean
  variant?: 'circular' | 'bar' | 'minimal'
}

const HealthScore = ({
  score,
  trend = 'stable',
  size = 'md',
  showTrend = false,
  showLabel = false,
  variant = 'circular'
}: HealthScoreProps) => {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-blue-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreBgColor = () => {
    if (score >= 80) return 'bg-green-900/20 border-green-700/30'
    if (score >= 60) return 'bg-blue-900/20 border-blue-700/30'
    if (score >= 40) return 'bg-yellow-900/20 border-yellow-700/30'
    return 'bg-red-900/20 border-red-700/30'
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return TrendingUp
      case 'down':
        return TrendingDown
      case 'stable':
      default:
        return Minus
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-400'
      case 'down':
        return 'text-red-400'
      case 'stable':
      default:
        return 'text-slate-400'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'w-12 h-12',
          text: 'text-xs',
          icon: 'w-3 h-3',
          padding: 'px-2 py-1'
        }
      case 'lg':
        return {
          container: 'w-20 h-20',
          text: 'text-lg',
          icon: 'w-5 h-5',
          padding: 'px-4 py-2'
        }
      case 'md':
      default:
        return {
          container: 'w-16 h-16',
          text: 'text-sm',
          icon: 'w-4 h-4',
          padding: 'px-3 py-1.5'
        }
    }
  }

  const sizeClasses = getSizeClasses()
  const TrendIcon = getTrendIcon()

  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-2">
        <Heart className={`${sizeClasses.icon} ${getScoreColor()}`} />
        <span className={`${getScoreColor()} font-semibold ${sizeClasses.text}`}>
          {score}
        </span>
        {showTrend && (
          <TrendIcon className={`${sizeClasses.icon} ${getTrendColor()}`} />
        )}
      </div>
    )
  }

  if (variant === 'bar') {
    return (
      <div className={`${getScoreBgColor()} ${sizeClasses.padding} rounded-lg border backdrop-blur-sm`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Heart className={`${sizeClasses.icon} ${getScoreColor()}`} />
            {showLabel && (
              <span className="text-slate-300 font-medium">Health</span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <span className={`${getScoreColor()} font-bold ${sizeClasses.text}`}>
              {score}
            </span>
            {showTrend && (
              <TrendIcon className={`${sizeClasses.icon} ${getTrendColor()}`} />
            )}
          </div>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getScoreColor().replace('text-', 'bg-')}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    )
  }

  // Circular variant (default)
  const circumference = 2 * Math.PI * 20 // radius = 20
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg className={sizeClasses.container} viewBox="0 0 44 44">
        {/* Background circle */}
        <circle
          cx="22"
          cy="22"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx="22"
          cy="22"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={getScoreColor()}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dashoffset 0.3s ease-in-out'
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Heart className={`${sizeClasses.icon} ${getScoreColor()} mb-1`} />
        <span className={`${getScoreColor()} font-bold ${sizeClasses.text}`}>
          {score}
        </span>
      </div>

      {/* Trend indicator */}
      {showTrend && (
        <div className="absolute -bottom-1 -right-1">
          <div className={`${getScoreBgColor()} rounded-full p-1 border backdrop-blur-sm`}>
            <TrendIcon className={`w-3 h-3 ${getTrendColor()}`} />
          </div>
        </div>
      )}

      {/* Label */}
      {showLabel && (
        <div className="absolute -bottom-6 text-center">
          <span className="text-slate-400 text-xs font-medium">Health Score</span>
        </div>
      )}
    </div>
  )
}

export default HealthScore