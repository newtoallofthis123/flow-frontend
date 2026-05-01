import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { useStore } from '../stores'
import { Card } from '../components/ui/Card'
import { Alert } from '../components/ui/Alert'

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

const Actions = observer(() => {
  const { dashboardStore } = useStore()

  useEffect(() => {
    dashboardStore.initialize()
  }, [dashboardStore])

  const handleAction = async (actionType: string, itemId: string) => {
    if (actionType === 'dismiss') {
      await dashboardStore.dismissActionItem(itemId)
    } else {
      console.log(`Executing action: ${actionType} for item: ${itemId}`)
    }
  }

  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Smart Action Feed</h1>
        <p className="text-muted-foreground mb-8">
          {dashboardStore.actionItems.length} action{dashboardStore.actionItems.length === 1 ? '' : 's'} requiring your attention
        </p>

        <Card bordered>
          {dashboardStore.actionItems.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              You're all caught up. No actions needed right now.
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardStore.actionItems.map((item) => (
                <Alert
                  key={item.id}
                  variant="warning"
                  action={
                    <div className="flex gap-2">
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
                  }
                >
                  {item.title}
                </Alert>
              ))}
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  )
})

export default Actions
