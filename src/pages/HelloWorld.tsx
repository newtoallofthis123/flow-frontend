import { observer } from 'mobx-react-lite'
import { useStore } from '../stores'

const HelloWorld = observer(() => {
  const { userStore } = useStore()

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold mb-4">Hello World</h1>
        <p className="text-muted-foreground">
          React + TypeScript + Vite + TailwindCSS 4 + ShadcnUI + React Router + MobX
        </p>

        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">MobX Example</h2>
          <p className="mb-4">Current value: <span className="font-mono text-primary">{userStore.exampleValue}</span></p>
          <button
            onClick={() => userStore.incrementExample()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Increment (Check Console)
          </button>
          <p className="text-sm text-muted-foreground mt-2">
            Click the button to trigger a MobX reaction and check the browser console
          </p>
        </div>
      </div>
    </div>
  )
})

export default HelloWorld