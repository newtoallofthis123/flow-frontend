import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { Search, Share2, Bell, HelpCircle, User, LogOut, ChevronDown } from 'lucide-react'
import { useStore } from '../../stores'
import ThemeToggle from '../ui/ThemeToggle'

const Header = observer(() => {
  const { userStore } = useStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = async () => {
    await userStore.logout()
    navigate('/login')
  }

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6 backdrop-blur-sm">
      <div className="flex items-center space-x-4 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="show me deals about to close"
            className="w-full bg-secondary text-foreground pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
          <Share2 className="w-5 h-5" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
          >
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border border-border">
              {userStore.user?.avatar ? (
                <img
                  src={userStore.user.avatar}
                  alt={userStore.user.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User className="w-4 h-4 text-foreground" />
              )}
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20">
                {userStore.user && (
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{userStore.user.name}</p>
                    <p className="text-xs text-muted-foreground">{userStore.user.email}</p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
})

export default Header