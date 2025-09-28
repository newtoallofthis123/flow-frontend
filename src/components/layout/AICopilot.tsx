import { Brain, Eye, MessageCircle, TrendingUp } from 'lucide-react'

const AICopilot = () => {
  const quickActions = [
    { icon: Eye, label: 'Analyze this contact', action: () => {} },
    { icon: MessageCircle, label: 'Draft message', action: () => {} },
    { icon: TrendingUp, label: 'Predict outcome', action: () => {} },
  ]

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="w-6 h-6 text-purple-400" />
        <h2 className="text-lg font-semibold text-white">AI Copilot</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-slate-300 text-sm mb-3">
            You are viewing a deal in the proposal stage
          </p>

          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-300 hover:text-white"
                  onClick={action.action}
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-700/30">
          <h3 className="text-purple-300 font-medium text-sm mb-2">AI Insight</h3>
          <p className="text-slate-300 text-xs">
            This prospect has shown high engagement signals. Consider scheduling a follow-up call within 48 hours for optimal conversion probability.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AICopilot