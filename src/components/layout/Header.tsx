import { Search, Share2, Bell, HelpCircle, User } from 'lucide-react'

const Header = () => {
  return (
    <div className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="show me deals about to close"
            className="w-full bg-slate-800 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-400 hover:text-white transition-colors">
          <Share2 className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-400 hover:text-white transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  )
}

export default Header