import { observer } from 'mobx-react-lite'
import { Sun, Moon } from 'lucide-react'
import { useStore } from '../../stores'

const ThemeToggle = observer(() => {
  const { themeStore } = useStore()

  return (
    <button
      onClick={() => themeStore.toggleTheme()}
      className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
      aria-label={`Switch to ${themeStore.theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${themeStore.theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {themeStore.theme === 'light' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  )
})

export default ThemeToggle

