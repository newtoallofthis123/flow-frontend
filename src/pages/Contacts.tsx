import { observer } from 'mobx-react-lite'
import { useStore } from '../stores'
import MainLayout from '../components/layout/MainLayout'
import SearchBar from '../components/ui/SearchBar'
import HealthScore from '../components/ui/HealthScore'
import SentimentIndicator from '../components/ui/SentimentIndicator'
import AIInsight from '../components/ui/AIInsight'
import { Phone, Mail, Building, Calendar, MessageSquare, DollarSign, Tag, Clock, TrendingUp, User } from 'lucide-react'
import { useState } from 'react'

const Contacts = observer(() => {
  const { contactsStore } = useStore()
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

  const selectedContact = selectedContactId
    ? contactsStore.contacts.find(c => c.id === selectedContactId)
    : null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const searchFilters = [
    { id: 'all', label: 'All Contacts', count: contactsStore.contactStats.total },
    { id: 'high-value', label: 'High Value', count: contactsStore.contactStats.highValue },
    { id: 'at-risk', label: 'At Risk', count: contactsStore.contactStats.atRisk },
    { id: 'recent', label: 'Recent Activity', count: contactsStore.contactStats.needsFollowUp }
  ]

  const aiSuggestions = [
    'contacts with high churn risk',
    'recent email interactions',
    'meetings this week',
    'overdue follow-ups'
  ]

  return (
    <MainLayout>
      <div className="h-full flex">
        {/* Left Panel - Contact List */}
        <div className="w-96 border-r border-slate-800 bg-slate-900/50 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">Contacts</h1>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <User className="w-4 h-4" />
                <span>{contactsStore.contactStats.total}</span>
              </div>
            </div>

            <SearchBar
              value={contactsStore.searchQuery}
              onChange={contactsStore.setSearchQuery}
              placeholder="Search contacts, companies..."
              showAI={true}
              showFilter={true}
              filters={searchFilters}
              selectedFilter={contactsStore.filterBy}
              onFilterChange={(filter) => contactsStore.setFilter(filter as typeof contactsStore.filterBy)}
              aiSuggestions={aiSuggestions}
              onAISuggestion={contactsStore.setSearchQuery}
            />
          </div>

          {/* Stats Cards */}
          <div className="p-4 border-b border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">High Value</div>
                <div className="text-lg font-bold text-green-400">{contactsStore.contactStats.highValue}</div>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">At Risk</div>
                <div className="text-lg font-bold text-red-400">{contactsStore.contactStats.atRisk}</div>
              </div>
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {contactsStore.filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedContactId === contact.id
                      ? 'bg-slate-700 border-blue-500'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700/50'
                  }`}
                >
                  {/* Contact Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{contact.name}</h3>
                      <p className="text-xs text-slate-400 truncate">{contact.title}</p>
                      <p className="text-xs text-slate-500 truncate">{contact.company}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <HealthScore score={contact.healthScore} size="sm" />
                      <SentimentIndicator sentiment={contact.sentiment} size="sm" variant="minimal" />
                    </div>
                  </div>

                  {/* Contact Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 text-slate-400">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatCurrency(contact.totalValue)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(contact.lastContact)}</span>
                      </div>
                    </div>
                    {contact.churnRisk > 60 && (
                      <div className="px-2 py-1 bg-red-900/20 border border-red-700/30 rounded text-red-400 text-xs">
                        At Risk
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {contact.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {contact.tags.length > 2 && (
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Contact Detail */}
        <div className="flex-1 flex flex-col">
          {selectedContact ? (
            <>
              {/* Contact Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-900/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {selectedContact.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedContact.name}</h2>
                      <p className="text-slate-400 mb-1">{selectedContact.title}</p>
                      <p className="text-slate-500 flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{selectedContact.company}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <HealthScore
                      score={selectedContact.healthScore}
                      trend={selectedContact.churnRisk > 60 ? 'down' : 'up'}
                      showTrend={true}
                      showLabel={true}
                      variant="circular"
                    />
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">{formatCurrency(selectedContact.totalValue)}</div>
                      <div className="text-sm text-slate-400">{selectedContact.totalDeals} deals</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors">
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
                    <Calendar className="w-4 h-4" />
                    <span>Schedule</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                </div>
              </div>

              {/* Contact Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="col-span-2 space-y-6">
                    {/* Communication Timeline */}
                    <div className="bg-slate-800 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                        <MessageSquare className="w-5 h-5" />
                        <span>Communication Timeline</span>
                      </h3>

                      <div className="space-y-4">
                        {selectedContact.communicationHistory.map((event) => (
                          <div key={event.id} className="flex space-x-4">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              {event.type === 'email' && <Mail className="w-5 h-5 text-blue-400" />}
                              {event.type === 'call' && <Phone className="w-5 h-5 text-green-400" />}
                              {event.type === 'meeting' && <Calendar className="w-5 h-5 text-purple-400" />}
                              {event.type === 'note' && <MessageSquare className="w-5 h-5 text-yellow-400" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {event.subject && (
                                    <h4 className="font-semibold text-white text-sm">{event.subject}</h4>
                                  )}
                                  <SentimentIndicator
                                    sentiment={event.sentiment}
                                    size="sm"
                                    variant="minimal"
                                  />
                                </div>
                                <div className="text-xs text-slate-400">
                                  {formatDate(event.date)} • {formatTime(event.date)}
                                </div>
                              </div>
                              <p className="text-sm text-slate-400 mb-2">{event.summary}</p>
                              {event.aiAnalysis && (
                                <div className="p-3 bg-slate-700/50 rounded-lg">
                                  <div className="flex items-start space-x-2">
                                    <TrendingUp className="w-4 h-4 text-purple-400 mt-0.5" />
                                    <p className="text-sm text-slate-300">{event.aiAnalysis}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* AI Insights */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">AI Insights</h3>
                      <div className="space-y-4">
                        {selectedContact.aiInsights.map((insight) => (
                          <AIInsight
                            key={insight.id}
                            type={insight.type}
                            title={insight.title}
                            description={insight.description}
                            confidence={insight.confidence}
                            actionable={insight.actionable}
                            suggestedAction={insight.suggestedAction}
                            size="sm"
                            variant="card"
                          />
                        ))}
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">Contact Details</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Mail className="w-4 h-4" />
                          <span>{selectedContact.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Phone className="w-4 h-4" />
                          <span>{selectedContact.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-400">
                          <Building className="w-4 h-4" />
                          <span>{selectedContact.company}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="bg-slate-800 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedContact.tags.map((tag) => (
                          <span key={tag} className="flex items-center space-x-1 px-2 py-1 bg-slate-700 text-slate-300 text-sm rounded">
                            <Tag className="w-3 h-3" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    {selectedContact.notes.length > 0 && (
                      <div className="bg-slate-800 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-3">Notes</h4>
                        <div className="space-y-2">
                          {selectedContact.notes.map((note, index) => (
                            <p key={index} className="text-sm text-slate-400">• {note}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a Contact</h3>
                <p className="text-slate-400">Choose a contact from the list to view their details and AI insights.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
})

export default Contacts