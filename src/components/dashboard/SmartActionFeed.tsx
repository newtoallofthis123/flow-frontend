import { Lightbulb, Target, AlertTriangle } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../../stores'
import type { ActionItem } from '../../stores/DashboardStore'

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
        return 'bg-blue-600 hover:bg-blue-700 text-white'
      case 'secondary':
        return 'bg-slate-600 hover:bg-slate-700 text-slate-200'
      case 'dismiss':
        return 'bg-slate-700 hover:bg-slate-600 text-slate-300'
      default:
        return 'bg-slate-600 hover:bg-slate-700 text-slate-200'
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
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-xl font-semibold text-white mb-6">Smart Action Feed</h2>

      <div className="space-y-4">
        {dashboardStore.actionItems.map((item) => {
          const Icon = getIcon(item.icon)
          return (
            <div
              key={item.id}
              className={`border-l-4 pl-4 pr-4 py-4 rounded-r-lg ${getItemStyles(item.type)}`}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 mt-0.5 ${getIconColor(item.type)}`} />
                <div className="flex-1">
                  <p className="text-slate-200 text-sm mb-3">{item.title}</p>
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