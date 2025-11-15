import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { ArrowLeft, Users, Briefcase, Calendar, Loader2, Search, Mail, Phone, Building2, TrendingUp, TrendingDown, Heart } from 'lucide-react'
import { searchApi, type NaturalLanguageSearchResponse, type SearchContact } from '../api/search.api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import HealthScore from '../components/ui/HealthScore'
import SentimentIndicator from '../components/ui/SentimentIndicator'

const SearchResults = observer(() => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''

  const [isLoading, setIsLoading] = useState(true)
  const [results, setResults] = useState<NaturalLanguageSearchResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'contacts' | 'deals' | 'events'>('all')

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const response = await searchApi.naturalLanguageSearch(searchQuery)
      setResults(response)

      // Auto-select tab based on results
      if (response.contacts.length > 0 && response.deals.length === 0 && response.events.length === 0) {
        setActiveTab('contacts')
      } else if (response.deals.length > 0 && response.contacts.length === 0 && response.events.length === 0) {
        setActiveTab('deals')
      } else if (response.events.length > 0 && response.contacts.length === 0 && response.deals.length === 0) {
        setActiveTab('events')
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalResults = (results?.contacts.length || 0) +
    (results?.deals.length || 0) +
    (results?.events.length || 0)

  const filteredContacts = activeTab === 'all' || activeTab === 'contacts' ? results?.contacts || [] : []
  const filteredDeals = activeTab === 'all' || activeTab === 'deals' ? results?.deals || [] : []
  const filteredEvents = activeTab === 'all' || activeTab === 'events' ? results?.events || [] : []

  const handleContactClick = (contactId: string) => {
    navigate('/contacts')
  }

  const handleDealClick = (dealId: string) => {
    navigate('/deals')
  }

  const handleEventClick = (eventId: string) => {
    navigate('/calendar')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-foreground">Searching...</p>
          <p className="text-sm text-muted-foreground mt-2">"{query}"</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Search Results</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
              </p>
            </div>
          </div>

          {/* Query Interpretation */}
          {results?.query_interpretation && (
            <div className="mb-4 p-4 bg-secondary/50 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground italic">
                <Search className="w-4 h-4 inline mr-2" />
                {results.query_interpretation}
              </p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
            >
              All ({totalResults})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'contacts'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
            >
              <Users className="w-4 h-4" />
              Contacts ({results?.contacts.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'deals'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
            >
              <Briefcase className="w-4 h-4" />
              Deals ({results?.deals.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'events'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
            >
              <Calendar className="w-4 h-4" />
              Events ({results?.events.length || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {totalResults === 0 ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No results found</h2>
            <p className="text-muted-foreground">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Contacts Section */}
            {filteredContacts.length > 0 && (
              <section>
                {activeTab === 'all' && (
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">
                      Contacts ({filteredContacts.length})
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleContactClick(contact.id)}
                      className="text-left p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {contact.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {contact.title}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            Score: {contact.search_score}
                          </span>
                          <SentimentIndicator sentiment={contact.sentiment} size="sm" />
                        </div>
                      </div>

                      {/* Company Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground font-medium">{contact.company}</span>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{contact.email}</span>
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{contact.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Health Metrics */}
                      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-secondary/30 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                          <HealthScore score={contact.health_score} size="sm" showLabel={false} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Churn Risk</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full ${contact.churn_risk > 70
                                    ? 'bg-red-500'
                                    : contact.churn_risk > 40
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                style={{ width: `${contact.churn_risk}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-foreground">{contact.churn_risk}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {contact.tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="text-xs px-2 py-1 rounded-md font-medium"
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Search Reason */}
                      {contact.search_reason && (
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-sm text-muted-foreground italic leading-relaxed">
                            {contact.search_reason}
                          </p>
                        </div>
                      )}

                      {/* Notes Preview */}
                      {contact.notes && (
                        <div className="mt-4 p-3 bg-secondary/20 rounded-lg">
                          <p className="text-xs text-muted-foreground line-clamp-2">{contact.notes}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Deals Section */}
            {filteredDeals.length > 0 && (
              <section>
                {activeTab === 'all' && (
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">
                      Deals ({filteredDeals.length})
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredDeals.map((deal: any) => (
                    <button
                      key={deal.id}
                      onClick={() => handleDealClick(deal.id)}
                      className="text-left p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {deal.title || deal.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {deal.company || deal.contact_name}
                          </p>
                        </div>
                        {deal.search_score && (
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            Score: {deal.search_score}
                          </span>
                        )}
                      </div>

                      {deal.value && (
                        <div className="text-2xl font-bold text-primary mb-4">
                          ${deal.value.toLocaleString()}
                        </div>
                      )}

                      {deal.search_reason && (
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-sm text-muted-foreground italic leading-relaxed">
                            {deal.search_reason}
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Events Section */}
            {filteredEvents.length > 0 && (
              <section>
                {activeTab === 'all' && (
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">
                      Events ({filteredEvents.length})
                    </h2>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredEvents.map((event: any) => (
                    <button
                      key={event.id}
                      onClick={() => handleEventClick(event.id)}
                      className="text-left p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                            {event.title || event.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description || event.summary}
                          </p>
                        </div>
                        {event.search_score && (
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            Score: {event.search_score}
                          </span>
                        )}
                      </div>

                      {event.search_reason && (
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-sm text-muted-foreground italic leading-relaxed">
                            {event.search_reason}
                          </p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Metadata Footer */}
        {results?.metadata && (
          <div className="mt-8 p-4 bg-secondary/30 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              Searched {results.metadata.entities_searched.contacts +
                results.metadata.entities_searched.deals +
                results.metadata.entities_searched.events} entities in {results.metadata.duration_ms}ms
              {results.cached && ' • Results cached'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
})

export default SearchResults

