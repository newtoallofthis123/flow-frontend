import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { Search, Share2, Bell, HelpCircle, User, LogOut, ChevronDown, Users, Briefcase, Calendar, Loader2, X } from 'lucide-react'
import { useStore } from '../../stores'
import ThemeToggle from '../ui/ThemeToggle'
import { searchApi, type NaturalLanguageSearchResponse } from '../../api/search.api'

const Header = observer(() => {
  const { userStore } = useStore()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<NaturalLanguageSearchResponse | null>(null)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await userStore.logout()
    navigate('/login')
  }

  const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsSearching(true)
      setShowResults(true)
      try {
        const response = await searchApi.naturalLanguageSearch(searchQuery.trim())
        setSearchResults(response)
      } catch (error) {
        console.error('Search error:', error)
        setSearchResults(null)
      } finally {
        setIsSearching(false)
      }
    }
  }

  const handleContactClick = (contactId: string) => {
    navigate(`/contacts`)
    setShowResults(false)
    setSearchQuery('')
  }

  const handleDealClick = (dealId: string) => {
    navigate(`/deals`)
    setShowResults(false)
    setSearchQuery('')
  }

  const handleEventClick = (eventId: string) => {
    navigate(`/calendar`)
    setShowResults(false)
    setSearchQuery('')
  }

  const totalResults = (searchResults?.contacts.length || 0) + 
                      (searchResults?.deals.length || 0) + 
                      (searchResults?.events.length || 0)

  return (
    <div className="h-16 bg-card border-b border-border flex items-center justify-between px-6 backdrop-blur-sm">
      <div className="flex items-center space-x-4 flex-1 max-w-2xl">
        <div className="relative flex-1" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            onFocus={() => searchResults && setShowResults(true)}
            placeholder="show me deals about to close"
            disabled={isSearching}
            className="w-full bg-secondary text-foreground pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 animate-spin" />
          )}
          
          {/* Search Results Dropdown */}
          {showResults && (searchResults || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black border border-border rounded-xl shadow-2xl z-[9999] max-h-[70vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-3 text-base text-foreground">Searching...</span>
                </div>
              ) : searchResults ? (
                <>
                  {/* Header */}
                  <div className="p-5 border-b border-border/50 bg-black">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {totalResults} result{totalResults !== 1 ? 's' : ''} found
                      </h3>
                      <button
                        onClick={() => setShowResults(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary/50 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    {searchResults.query_interpretation && (
                      <p className="text-sm text-muted-foreground/80 italic leading-relaxed">
                        {searchResults.query_interpretation}
                      </p>
                    )}
                  </div>

                  {/* Contacts */}
                  {searchResults.contacts.length > 0 && (
                    <div className="p-5 border-b border-border/50 bg-black">
                      <div className="flex items-center space-x-2 mb-4">
                        <Users className="w-5 h-5 text-primary" />
                        <h4 className="text-base font-semibold text-foreground">
                          Contacts ({searchResults.contacts.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {searchResults.contacts.map((contact) => (
                          <button
                            key={contact.id}
                            onClick={() => handleContactClick(contact.id)}
                            className="w-full text-left p-4 rounded-xl hover:bg-secondary/30 transition-all duration-200 border border-border/30 hover:border-border hover:shadow-lg group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{contact.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{contact.company} • {contact.title}</p>
                                <p className="text-sm text-muted-foreground/70 mt-1">{contact.email}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                                  Score: {contact.search_score}
                                </span>
                              </div>
                            </div>
                            {contact.search_reason && (
                              <p className="text-sm text-muted-foreground/80 mt-3 italic leading-relaxed border-t border-border/30 pt-3">
                                {contact.search_reason}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Deals */}
                  {searchResults.deals.length > 0 && (
                    <div className="p-5 border-b border-border/50 bg-black">
                      <div className="flex items-center space-x-2 mb-4">
                        <Briefcase className="w-5 h-5 text-primary" />
                        <h4 className="text-base font-semibold text-foreground">
                          Deals ({searchResults.deals.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {searchResults.deals.map((deal: any) => (
                          <button
                            key={deal.id}
                            onClick={() => handleDealClick(deal.id)}
                            className="w-full text-left p-4 rounded-xl hover:bg-secondary/30 transition-all duration-200 border border-border/30 hover:border-border hover:shadow-lg group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{deal.title || deal.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{deal.company || deal.contact_name}</p>
                              </div>
                              {deal.search_score && (
                                <div className="text-right flex-shrink-0">
                                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                                    Score: {deal.search_score}
                                  </span>
                                </div>
                              )}
                            </div>
                            {deal.search_reason && (
                              <p className="text-sm text-muted-foreground/80 mt-3 italic leading-relaxed border-t border-border/30 pt-3">
                                {deal.search_reason}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {searchResults.events.length > 0 && (
                    <div className="p-5 bg-black">
                      <div className="flex items-center space-x-2 mb-4">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h4 className="text-base font-semibold text-foreground">
                          Events ({searchResults.events.length})
                        </h4>
                      </div>
                      <div className="space-y-3">
                        {searchResults.events.map((event: any) => (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event.id)}
                            className="w-full text-left p-4 rounded-xl hover:bg-secondary/30 transition-all duration-200 border border-border/30 hover:border-border hover:shadow-lg group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{event.title || event.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{event.description || event.summary}</p>
                              </div>
                              {event.search_score && (
                                <div className="text-right flex-shrink-0">
                                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                                    Score: {event.search_score}
                                  </span>
                                </div>
                              )}
                            </div>
                            {event.search_reason && (
                              <p className="text-sm text-muted-foreground/80 mt-3 italic leading-relaxed border-t border-border/30 pt-3">
                                {event.search_reason}
                              </p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {totalResults === 0 && (
                    <div className="p-12 text-center bg-black">
                      <p className="text-base text-muted-foreground">No results found</p>
                      <p className="text-sm text-muted-foreground/60 mt-2">Try a different search query</p>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  {searchResults.metadata && (
                    <div className="p-4 border-t border-border/50 bg-black/80">
                      <p className="text-xs text-muted-foreground/70 text-center font-medium">
                        Searched {searchResults.metadata.entities_searched.contacts + 
                                 searchResults.metadata.entities_searched.deals + 
                                 searchResults.metadata.entities_searched.events} entities in {searchResults.metadata.duration_ms}ms
                        {searchResults.cached && ' • Cached'}
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
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