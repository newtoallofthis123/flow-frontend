import { Brain } from 'lucide-react'

interface ProbabilityBadgeProps {
  probability: number
  confidence: 'high' | 'medium' | 'low'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const ProbabilityBadge = ({
  probability,
  confidence,
  size = 'md',
  showIcon = true
}: ProbabilityBadgeProps) => {
  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high':
        return 'bg-green-900/20 border-green-700/30 text-green-400'
      case 'medium':
        return 'bg-yellow-900/20 border-yellow-700/30 text-yellow-400'
      case 'low':
        return 'bg-red-900/20 border-red-700/30 text-red-400'
    }
  }

  const getProbabilityColor = () => {
    if (probability >= 80) return 'text-green-400'
    if (probability >= 60) return 'text-blue-400'
    if (probability >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs'
      case 'md':
        return 'px-3 py-1.5 text-sm'
      case 'lg':
        return 'px-4 py-2 text-base'
    }
  }

  return (
    <div className={`${getConfidenceColor()} ${getSizeClasses()} rounded-lg border backdrop-blur-sm`}>
      <div className="flex items-center space-x-1">
        {showIcon && (
          <Brain className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} text-purple-400`} />
        )}
        <span className={`font-semibold ${getProbabilityColor()}`}>
          {probability}%
        </span>
        <span className="text-slate-400">AI</span>
      </div>
    </div>
  )
}

export default ProbabilityBadge