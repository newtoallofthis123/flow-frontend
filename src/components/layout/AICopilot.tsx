import { Brain, Eye, MessageCircle, TrendingUp } from 'lucide-react'

const AICopilot = () => {
  const quickActions = [
    { icon: Eye, label: 'Analyze this contact', action: () => {} },
    { icon: MessageCircle, label: 'Draft message', action: () => {} },
    { icon: TrendingUp, label: 'Predict outcome', action: () => {} },
  ]

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="w-6 h-6 text-primary" />
        <h2 className="text-lg font-semibold text-sidebar-foreground">AI Copilot</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <p className="text-muted-foreground text-sm mb-3">
            You are viewing a deal in the proposal stage
          </p>

          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm bg-secondary hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  onClick={action.action}
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-accent/20 rounded-lg p-4 border border-border">
          <h3 className="text-primary font-medium text-sm mb-2">AI Insight</h3>
          <p className="text-muted-foreground text-xs">
            This prospect has shown high engagement signals. Consider scheduling a follow-up call within 48 hours for optimal conversion probability.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AICopilot