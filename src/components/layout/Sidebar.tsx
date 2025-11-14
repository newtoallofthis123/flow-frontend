import {
  BarChart3,
  Users,
  Target,
  MessageSquare,
  Calendar,
  TrendingUp,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { useStore } from '../../stores'

const Sidebar = observer(() => {
  const location = useLocation()
  const { uiStore } = useStore()

  const navItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Contacts', path: '/contacts' },
    { icon: Target, label: 'Deals', path: '/deals', badge: '7' },
    { icon: MessageSquare, label: 'Messages', path: '/messages' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
    { icon: Brain, label: 'AI Insights', path: '/ai-insights', highlight: true },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ]

  const isActive = (path: string) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/')
  }

  return (
    <div className={`relative bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
      uiStore.sidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-6">
        {!uiStore.sidebarCollapsed ? (
          <Link to="/dashboard" className="flex items-center space-x-2 mb-8 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
            <span className="text-xl font-bold text-sidebar-foreground">FLOW</span>
          </Link>
        ) : (
          <Link to="/dashboard" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
          </Link>
        )}

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center ${uiStore.sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-colors relative group ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-foreground'
                    : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                } ${item.highlight ? 'bg-accent/20 border border-border' : ''}`}
                title={uiStore.sidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${item.highlight ? 'text-primary' : active ? 'text-sidebar-foreground' : ''}`} />
                  {!uiStore.sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </div>
                {!uiStore.sidebarCollapsed && item.badge && (
                  <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
                {uiStore.sidebarCollapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
                {uiStore.sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      <button
        onClick={() => uiStore.toggleSidebar()}
        className="absolute -right-3 top-6 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center hover:bg-sidebar-accent transition-colors z-10 shadow-sm"
        aria-label={uiStore.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {uiStore.sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
        )}
      </button>
    </div>
  )
})

export default Sidebar