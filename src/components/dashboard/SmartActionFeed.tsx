import { Lightbulb, Target, AlertTriangle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../../stores'

const SmartActionFeed = observer(() => {
  const { dashboardStore } = useStore()

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'lightbulb':
        return Lightbulb
      case 'target':
        return Target
      case 'alert-triangle':
        return AlertTriangle
      default:
        return Lightbulb
    }
  }

  const getItemStyles = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'border-l-blue-400 bg-blue-900/10'
      case 'warning':
        return 'border-l-yellow-400 bg-yellow-900/10'
      default:
        return 'border-l-green-400 bg-green-900/10'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'text-blue-400'
      case 'warning':
        return 'text-yellow-400'
      default:
        return 'text-green-400'
    }
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

  const handleAction = (actionType: string, itemId: string) => {
    if (actionType === 'dismiss') {
      dashboardStore.dismissActionItem(itemId)
    } else {
      console.log(`Executing action: ${actionType} for item: ${itemId}`)
    }
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <h2 className="text-xl font-semibold text-card-foreground mb-6">Smart Action Feed</h2>

      <div className="space-y-4">
        {dashboardStore.actionItems.map((item) => {
          const Icon = getIcon(item.icon)
          return (
            <div
              key={item.id}
              className={`border-l-4 pl-4 pr-4 py-4 rounded-r-lg bg-card/50 ${getItemStyles(item.type)}`}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 mt-0.5 ${getIconColor(item.type)}`} />
                <div className="flex-1">
                  <p className="text-card-foreground text-sm mb-3">{item.title}</p>
                  <div className="flex space-x-2">
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
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default SmartActionFeed