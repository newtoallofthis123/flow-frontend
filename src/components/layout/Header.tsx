import { Search, Share2, Bell, HelpCircle, User } from 'lucide-react'

const Header = () => {
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
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center border border-border">
          <User className="w-4 h-4 text-foreground" />
        </div>
      </div>
    </div>
  )
}

export default Header