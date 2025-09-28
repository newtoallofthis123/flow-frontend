import { Search, X, Brain, Filter } from 'lucide-react'
import { useState } from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  showAI?: boolean
  showFilter?: boolean
  filters?: FilterOption[]
  selectedFilter?: string
  onFilterChange?: (filter: string) => void
  size?: 'sm' | 'md' | 'lg'
  aiSuggestions?: string[]
  onAISuggestion?: (suggestion: string) => void
}

interface FilterOption {
  id: string
  label: string
  count?: number
}

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  showAI = false,
  showFilter = false,
  filters = [],
  selectedFilter = 'all',
  onFilterChange,
  size = 'md',
  aiSuggestions = [],
  onAISuggestion
}: SearchBarProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'h-8',
          input: 'text-sm px-8',
          icon: 'w-4 h-4',
          button: 'px-2 py-1 text-xs'
        }
      case 'lg':
        return {
          container: 'h-12',
          input: 'text-lg px-12',
          icon: 'w-6 h-6',
          button: 'px-4 py-2 text-base'
        }
      case 'md':
      default:
        return {
          container: 'h-10',
          input: 'text-sm px-10',
          icon: 'w-5 h-5',
          button: 'px-3 py-1.5 text-sm'
        }
    }
  }

  const sizeClasses = getSizeClasses()

  const handleClear = () => {
    onChange('')
    setShowSuggestions(false)
  }

  const handleAISuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    onAISuggestion?.(suggestion)
  }

  const selectedFilterOption = filters.find(f => f.id === selectedFilter)

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {/* Main search input */}
        <div className={`relative flex-1 ${sizeClasses.container}`}>
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Search className={`${sizeClasses.icon} text-slate-400`} />
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setShowSuggestions(aiSuggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className={`w-full ${sizeClasses.container} ${sizeClasses.input} bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
          />

          {value && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            >
              <X className={sizeClasses.icon} />
            </button>
          )}

          {showAI && !value && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Brain className={`${sizeClasses.icon} text-purple-400`} />
            </div>
          )}
        </div>

        {/* Filter dropdown */}
        {showFilter && filters.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`${sizeClasses.container} ${sizeClasses.button} bg-slate-800 border border-slate-700 rounded-lg text-white hover:bg-slate-700 transition-colors flex items-center space-x-2`}
            >
              <Filter className={sizeClasses.icon} />
              <span>
                {selectedFilterOption?.label || 'Filter'}
                {selectedFilterOption?.count !== undefined && (
                  <span className="ml-1 text-slate-400">({selectedFilterOption.count})</span>
                )}
              </span>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      onFilterChange?.(filter.id)
                      setShowFilterDropdown(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                      selectedFilter === filter.id ? 'text-blue-400 bg-slate-700/50' : 'text-white'
                    }`}
                  >
                    <span>{filter.label}</span>
                    {filter.count !== undefined && (
                      <span className="text-slate-400 text-xs">{filter.count}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Suggestions dropdown */}
      {showSuggestions && aiSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">AI Suggestions</span>
            </div>
          </div>

          <div className="py-1">
            {aiSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleAISuggestionClick(suggestion)}
                className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside handler for filter dropdown */}
      {showFilterDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowFilterDropdown(false)}
        />
      )}
    </div>
  )
}

export default SearchBar