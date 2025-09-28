import {
  BarChart3,
  Users,
  Target,
  MessageSquare,
  Calendar,
  TrendingUp,
  Brain,
  Settings
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const location = useLocation()

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
    <div className="w-64 bg-slate-900 border-r border-slate-800">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center space-x-2 mb-8 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="text-xl font-bold text-white">FLOW</span>
        </Link>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                } ${item.highlight ? 'bg-purple-900/20 border border-purple-700/30' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${item.highlight ? 'text-purple-400' : active ? 'text-white' : ''}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default Sidebar