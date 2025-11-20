import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { useStore } from '../stores'
import MainLayout from '../components/layout/MainLayout'
import SearchBar from '../components/ui/SearchBar'
import AIInsight from '../components/ui/AIInsight'
import AddEventModal from '../components/ui/AddEventModal'
import AddOutcomeModal from '../components/ui/AddOutcomeModal'
import { Calendar as CalendarIcon, Clock, Video, MapPin, Users, Building, Target, Brain, Plus, AlertTriangle, CheckCircle } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { CalendarEvent } from '../stores/CalendarStore'

const Calendar = observer(() => {
  const { calendarStore, contactsStore } = useStore()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [isAddOutcomeModalOpen, setIsAddOutcomeModalOpen] = useState(false)

  // Initialize contacts store to resolve contact information
  useEffect(() => {
    if (contactsStore.contacts.length === 0) {
      contactsStore.initialize()
    }
  }, [contactsStore])

  // Fetch full event details when ID changes (includes preparation and AI insights)
  useEffect(() => {
    if (id) {
      calendarStore.fetchEvent(id)
      // Also fetch preparation if available
      calendarStore.fetchPreparation(id).catch(() => {
        // Preparation might not be available for all events, ignore errors
      })
    }
  }, [id, calendarStore])

  // Resolve contact information from contacts store if not in event
  const selectedEvent = id
    ? (calendarStore.events.find(e => e.id === id) || calendarStore.selectedEvent)
    : null

  // Enhance event with contact information if contactId is present but name/company are missing
  // Note: We mutate the event object directly to maintain MobX reactivity
  const enhancedEvent = selectedEvent
    ? (() => {
        if (selectedEvent.contactId && !selectedEvent.contactName) {
          const contact = contactsStore.contacts.find(c => c.id === selectedEvent.contactId)
          if (contact) {
            // Mutate directly to maintain reactivity
            if (!selectedEvent.contactName) selectedEvent.contactName = contact.name
            if (!selectedEvent.contactCompany) selectedEvent.contactCompany = contact.company
          }
        }
        return selectedEvent
      })()
    : null

  // Debug: Log preparation data
  useEffect(() => {
    if (enhancedEvent) {
      console.log('Enhanced event preparation:', enhancedEvent.preparation, 'Event ID:', enhancedEvent.id)
    }
  }, [enhancedEvent?.id, enhancedEvent?.preparation])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const searchFilters = [
    { id: 'all', label: 'All Events', count: calendarStore.calendarStats.totalThisWeek },
    { id: 'meetings', label: 'Meetings', count: calendarStore.calendarStats.meetingsThisWeek },
    { id: 'high-priority', label: 'High Priority', count: calendarStore.calendarStats.highPriorityThisWeek },
    { id: 'follow-ups', label: 'Follow-ups', count: calendarStore.calendarStats.followUpsNeeded }
  ]

  const aiSuggestions = [
    'meetings this week',
    'preparation needed',
    'follow-ups overdue',
    'high-priority events'
  ]

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return Users
      case 'call':
        return CalendarIcon
      case 'demo':
        return Target
      case 'follow-up':
        return Clock
      default:
        return CalendarIcon
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting':
        return 'bg-blue-100/50 dark:bg-blue-900/20 border-blue-300/50 dark:border-blue-700/30 text-blue-600 dark:text-blue-400'
      case 'call':
        return 'bg-green-100/50 dark:bg-green-900/20 border-green-300/50 dark:border-green-700/30 text-green-600 dark:text-green-400'
      case 'demo':
        return 'bg-purple-100/50 dark:bg-purple-900/20 border-purple-300/50 dark:border-purple-700/30 text-purple-600 dark:text-purple-400'
      case 'follow-up':
        return 'bg-yellow-100/50 dark:bg-yellow-900/20 border-yellow-300/50 dark:border-yellow-700/30 text-yellow-600 dark:text-yellow-400'
      default:
        return 'bg-slate-100/50 dark:bg-slate-900/20 border-slate-300/50 dark:border-slate-700/30 text-slate-600 dark:text-slate-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 dark:border-l-red-400'
      case 'medium':
        return 'border-l-yellow-500 dark:border-l-yellow-400'
      case 'low':
      default:
        return 'border-l-blue-500 dark:border-l-blue-400'
    }
  }

  const EventCard = ({ event }: { event: CalendarEvent }) => {
    const Icon = getEventTypeIcon(event.type)

    return (
      <div
        onClick={() => navigate(`/calendar/${event.id}`)}
        className={`p-4 bg-card border-l-4 rounded-lg cursor-pointer hover:bg-accent/50 transition-all border border-border ${getPriorityColor(event.priority)} ${
          id === event.id ? 'ring-2 ring-primary' : ''
        }`}
      >
        {/* Event Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${getEventTypeColor(event.type)}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-card-foreground text-sm truncate">{event.title}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                </div>
                {event.contactName && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-xs text-muted-foreground truncate">{event.contactName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {event.priority === 'high' && (
            <div className="px-2 py-1 bg-red-100/50 dark:bg-red-900/20 border border-red-300/50 dark:border-red-700/30 rounded text-red-600 dark:text-red-400 text-xs">
              High Priority
            </div>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-2">
          {event.contactCompany && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground/70">
              <Building className="w-3 h-3" />
              <span>{event.contactCompany}</span>
            </div>
          )}

          {(event.location || event.meetingLink) && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground/70">
              {event.location ? (
                <>
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </>
              ) : (
                <>
                  <Video className="w-3 h-3" />
                  <span>Video call</span>
                </>
              )}
            </div>
          )}

          {/* AI Insights Count */}
          {event.aiInsights.length > 0 && (
            <div className="flex items-center space-x-1 text-xs">
              <Brain className="w-3 h-3 text-primary" />
              <span className="text-primary">{event.aiInsights.length} AI insight{event.aiInsights.length > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded">
                  {tag}
                </span>
              ))}
              {event.tags.length > 3 && (
                <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded">
                  +{event.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const todayEvents = calendarStore.todayEvents
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Get all events sorted by date (use slice() to avoid mutating observable array)
  const allEvents = calendarStore.events.slice().sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  
  // Separate events into past, today, and upcoming
  const pastEvents = allEvents.filter(event => event.startTime < today)
  const upcomingEvents = allEvents.filter(event => 
    event.startTime >= tomorrow && !pastEvents.some(pe => pe.id === event.id) && !todayEvents.some(te => te.id === event.id)
  )

  return (
    <MainLayout>
      <div className="h-full flex">
        {/* Left Panel - Events List */}
        <div className="w-96 border-r border-border bg-sidebar/50 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
              <button 
                onClick={() => setIsAddEventModalOpen(true)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Event</span>
              </button>
            </div>

            <SearchBar
              value={calendarStore.searchQuery}
              onChange={calendarStore.setSearchQuery}
              placeholder="Search events, contacts..."
              showAI={true}
              showFilter={true}
              filters={searchFilters}
              selectedFilter={calendarStore.filterBy}
              onFilterChange={(filter) => calendarStore.setFilter(filter as typeof calendarStore.filterBy)}
              aiSuggestions={aiSuggestions}
              onAISuggestion={calendarStore.setSearchQuery}
            />
          </div>

          {/* Calendar Stats */}
          <div className="p-4 border-b border-border bg-card/30">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{calendarStore.calendarStats.meetingsThisWeek}</div>
                <div className="text-xs text-muted-foreground">Meetings This Week</div>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">{calendarStore.calendarStats.highPriorityThisWeek}</div>
                <div className="text-xs text-muted-foreground">High Priority</div>
              </div>
            </div>
          </div>

          {/* Today's Events */}
          <div className="p-4 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Today</span>
              <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">{todayEvents.length}</span>
            </h3>

            {todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No events today</p>
              </div>
            )}
          </div>

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Past Events</span>
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">{pastEvents.length}</span>
              </h3>
              <div className="space-y-3">
                {pastEvents.slice(-5).map((event) => (
                  <div key={event.id} className="relative opacity-75">
                    <div className="absolute left-0 top-4 w-16 text-center">
                      <div className="text-xs text-muted-foreground font-medium">{formatShortDate(event.startTime)}</div>
                    </div>
                    <div className="ml-20">
                      <EventCard event={event} />
                    </div>
                  </div>
                ))}
                {pastEvents.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Showing last 5 of {pastEvents.length} past events
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Upcoming</span>
              {upcomingEvents.length > 0 && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">{upcomingEvents.length}</span>
              )}
            </h3>

            {upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="relative">
                    <div className="absolute left-0 top-4 w-16 text-center">
                      <div className="text-xs text-muted-foreground font-medium">{formatShortDate(event.startTime)}</div>
                    </div>
                    <div className="ml-20">
                      <EventCard event={event} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No upcoming events</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Event Detail */}
        <div className="flex-1 flex flex-col">
          {enhancedEvent ? (
            <>
              {/* Event Header */}
              <div className="p-6 border-b border-border bg-card/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-3 rounded-lg ${getEventTypeColor(enhancedEvent.type)}`}>
                        {(() => {
                          const Icon = getEventTypeIcon(enhancedEvent.type)
                          return <Icon className="w-6 h-6" />
                        })()}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{enhancedEvent.title}</h2>
                        <div className="flex items-center space-x-4 text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(enhancedEvent.startTime)} - {formatTime(enhancedEvent.endTime)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{formatDate(enhancedEvent.startTime)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {enhancedEvent.description && (
                      <p className="text-muted-foreground mb-4">{enhancedEvent.description}</p>
                    )}

                    <div className="flex items-center space-x-4">
                      {enhancedEvent.contactName && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{enhancedEvent.contactName}</span>
                          {enhancedEvent.contactCompany && (
                            <>
                              <span>•</span>
                              <span>{enhancedEvent.contactCompany}</span>
                            </>
                          )}
                        </div>
                      )}

                      {(enhancedEvent.location || enhancedEvent.meetingLink) && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          {enhancedEvent.location ? (
                            <>
                              <MapPin className="w-4 h-4" />
                              <span>{enhancedEvent.location}</span>
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4" />
                              <span>Video call</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {enhancedEvent.meetingLink && (
                      <button className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors">
                        Join Call
                      </button>
                    )}
                    {!enhancedEvent.outcome && (
                      <button 
                        onClick={() => setIsAddOutcomeModalOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Add Outcome</span>
                      </button>
                    )}
                    <button className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-secondary-foreground transition-colors">
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="col-span-2 space-y-6">
                    {/* Meeting Preparation */}
                    <div className="bg-card rounded-lg p-6 border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-card-foreground flex items-center space-x-2">
                          <Brain className="w-5 h-5 text-primary" />
                          <span>AI Meeting Preparation</span>
                        </h3>
                        <button
                          onClick={() => {
                            console.log('Manual fetch preparation for event:', enhancedEvent.id)
                            calendarStore.fetchPreparation(enhancedEvent.id)
                          }}
                          className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 rounded text-primary transition-colors"
                        >
                          Refresh
                        </button>
                      </div>

                      {(() => {
                        const prep = enhancedEvent.preparation
                        
                        // Debug section
                        console.log('Rendering preparation section, prep:', prep)
                        
                        const hasContent = prep && (
                          (prep.suggestedTalkingPoints && prep.suggestedTalkingPoints.length > 0) ||
                          (prep.recentInteractions && prep.recentInteractions.length > 0) ||
                          prep.dealContext ||
                          (prep.competitorIntel && prep.competitorIntel.length > 0) ||
                          (prep.personalNotes && prep.personalNotes.length > 0) ||
                          (prep.documentsToShare && prep.documentsToShare.length > 0)
                        )
                        
                        console.log('Has content:', hasContent)
                        
                        if (!hasContent) {
                          return (
                            <div>
                              <p className="text-sm text-muted-foreground mb-2">Preparation data is being generated...</p>
                              <details className="text-xs text-muted-foreground">
                                <summary className="cursor-pointer">Debug Info</summary>
                                <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                                  {JSON.stringify(prep, null, 2)}
                                </pre>
                              </details>
                            </div>
                          )
                        }
                        
                        return (
                          <>
                            {/* Talking Points */}
                            {prep.suggestedTalkingPoints && prep.suggestedTalkingPoints.length > 0 && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-card-foreground mb-3">Suggested Talking Points</h4>
                              <ul className="space-y-2">
                                {prep.suggestedTalkingPoints.map((point, index) => (
                                  <li key={index} className="flex items-start space-x-2 text-card-foreground">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Recent Interactions */}
                          {prep.recentInteractions && prep.recentInteractions.length > 0 && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-card-foreground mb-3">Recent Interactions</h4>
                              <div className="space-y-2">
                                {prep.recentInteractions.map((interaction, index) => (
                                  <div key={index} className="p-3 bg-accent/50 rounded-lg border border-border">
                                    <p className="text-sm text-card-foreground">{interaction}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Deal Context */}
                          {prep.dealContext && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-card-foreground mb-3">Deal Context</h4>
                              <div className="p-3 bg-blue-100/50 dark:bg-blue-900/20 border border-blue-300/50 dark:border-blue-700/30 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">{prep.dealContext}</p>
                              </div>
                            </div>
                          )}

                          {/* Documents to Share */}
                          {prep.documentsToShare && prep.documentsToShare.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-card-foreground mb-3">Documents to Share</h4>
                              <div className="space-y-2">
                                {prep.documentsToShare.map((doc, index) => (
                                  <div key={index} className="flex items-center space-x-2 p-2 bg-accent/30 rounded text-sm text-card-foreground border border-border">
                                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                                    <span>{doc}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Personal Notes */}
                          {prep.personalNotes && prep.personalNotes.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-card-foreground mb-3">Personal Notes</h4>
                              <div className="space-y-2">
                                {prep.personalNotes.map((note, index) => (
                                  <p key={index} className="text-sm text-muted-foreground">• {note}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Competitor Intel */}
                          {prep.competitorIntel && prep.competitorIntel.length > 0 && (
                            <div className="mt-6 bg-red-100/50 dark:bg-red-900/10 border border-red-300/50 dark:border-red-700/30 rounded-lg p-4">
                              <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3">Competitor Intelligence</h4>
                              <div className="space-y-2">
                                {prep.competitorIntel.map((intel, index) => (
                                  <div key={index} className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-300">{intel}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          </>
                        )
                      })()}
                    </div>

                    {/* Attendees */}
                    {enhancedEvent.attendees && enhancedEvent.attendees.length > 0 && (
                      <div className="bg-card rounded-lg p-6 border border-border">
                        <h3 className="text-lg font-semibold text-card-foreground mb-4">Attendees</h3>
                        <div className="space-y-3">
                          {enhancedEvent.attendees.map((attendee) => (
                            <div key={attendee.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border">
                              <div>
                                <div className="font-medium text-card-foreground">{attendee.name}</div>
                                <div className="text-sm text-muted-foreground">{attendee.role}</div>
                                <div className="text-sm text-muted-foreground/70">{attendee.email}</div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                attendee.status === 'accepted' ? 'bg-green-100/50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                                attendee.status === 'declined' ? 'bg-red-100/50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                                attendee.status === 'tentative' ? 'bg-yellow-100/50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {attendee.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meeting Outcome */}
                    {enhancedEvent.outcome && (
                      <div className="bg-card rounded-lg p-6 border border-border">
                        <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span>Meeting Outcome</span>
                        </h3>
                        
                        <div className="space-y-4">
                          {/* Summary */}
                          <div>
                            <h4 className="font-semibold text-card-foreground mb-2">Summary</h4>
                            <p className="text-sm text-muted-foreground">{enhancedEvent.outcome.summary}</p>
                          </div>

                          {/* Next Steps */}
                          {enhancedEvent.outcome.nextSteps.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-card-foreground mb-2">Next Steps</h4>
                              <ul className="space-y-1">
                                {enhancedEvent.outcome.nextSteps.map((step, index) => (
                                  <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2" />
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Key Decisions */}
                          {enhancedEvent.outcome.keyDecisions.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-card-foreground mb-2">Key Decisions</h4>
                              <ul className="space-y-1">
                                {enhancedEvent.outcome.keyDecisions.map((decision, index) => (
                                  <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2" />
                                    <span>{decision}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Metrics */}
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Sentiment Score</div>
                              <div className="text-lg font-semibold text-card-foreground">
                                {enhancedEvent.outcome.sentimentScore > 0 ? '😊' : enhancedEvent.outcome.sentimentScore < 0 ? '😐' : '😊'} {enhancedEvent.outcome.sentimentScore}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Meeting Rating</div>
                              <div className="text-lg font-semibold text-card-foreground">
                                {'⭐'.repeat(enhancedEvent.outcome.meetingRating)}
                              </div>
                            </div>
                          </div>

                          {/* Follow-up */}
                          {enhancedEvent.outcome.followUpRequired && enhancedEvent.outcome.followUpDate && (
                            <div className="pt-4 border-t border-border">
                              <div className="flex items-center space-x-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Follow-up scheduled for:</span>
                                <span className="font-medium text-card-foreground">
                                  {formatDate(enhancedEvent.outcome.followUpDate)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* AI Insights */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">AI Insights</h3>
                      <div className="space-y-4">
                        {enhancedEvent.aiInsights.length > 0 ? (
                          enhancedEvent.aiInsights.map((insight) => (
                          <AIInsight
                            key={insight.id}
                            type={insight.type === 'follow-up' ? 'suggestion' : insight.type as any}
                            title={insight.title}
                            description={insight.description}
                            confidence={insight.confidence}
                            actionable={insight.actionable}
                            suggestedAction={insight.suggestedAction}
                            size="sm"
                            variant="card"
                          />
                        ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No AI insights available</p>
                        )}
                      </div>
                    </div>

                    {/* Event Status */}
                    <div className="bg-card rounded-lg p-4 border border-border">
                      <h4 className="font-semibold text-card-foreground mb-3">Event Status</h4>
                      <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                        enhancedEvent.status === 'confirmed' ? 'bg-green-100/50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                        enhancedEvent.status === 'scheduled' ? 'bg-blue-100/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                        enhancedEvent.status === 'completed' ? 'bg-muted text-muted-foreground' :
                        enhancedEvent.status === 'cancelled' ? 'bg-red-100/50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                        'bg-yellow-100/50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {enhancedEvent.status.charAt(0).toUpperCase() + enhancedEvent.status.slice(1)}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CalendarIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Select an Event</h3>
                <p className="text-muted-foreground">Choose an event from the list to view details and AI insights.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onSubmit={async (eventData) => {
          await calendarStore.createEvent(eventData)
          setIsAddEventModalOpen(false)
        }}
      />

      <AddOutcomeModal
        isOpen={isAddOutcomeModalOpen}
        onClose={() => setIsAddOutcomeModalOpen(false)}
        onSubmit={async (outcome) => {
          if (enhancedEvent?.id) {
            await calendarStore.addOutcome(enhancedEvent.id, outcome)
            setIsAddOutcomeModalOpen(false)
          }
        }}
        eventTitle={enhancedEvent?.title}
      />
    </MainLayout>
  )
})

export default Calendar