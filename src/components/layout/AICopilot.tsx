import { useState, useEffect, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Brain, ChevronLeft, ChevronRight, Bot, User, Send, Loader2 } from 'lucide-react'
import { observer } from 'mobx-react-lite'
import { useStore } from '../../stores'
import { llmApi } from '../../api'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AICopilot = observer(() => {
  const rootStore = useStore()
  const { uiStore, userStore, dealsStore, contactsStore, messagesStore, calendarStore, dashboardStore } = rootStore
  const location = useLocation()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Don't render if not authenticated
  if (!userStore.isAuthenticated) {
    return null
  }

  // Ensure stores are initialized
  useEffect(() => {
    if (userStore.isAuthenticated) {
      const path = location.pathname
      if (path.startsWith('/deals')) {
        dealsStore.initialize()
      } else if (path.startsWith('/contacts')) {
        contactsStore.initialize()
      } else if (path.startsWith('/messages')) {
        messagesStore.initialize()
      } else if (path.startsWith('/calendar')) {
        calendarStore.initialize()
      } else if (path.startsWith('/dashboard')) {
        dashboardStore.initialize()
      }
    }
  }, [location.pathname, userStore.isAuthenticated, dealsStore, contactsStore, messagesStore, calendarStore, dashboardStore])

  // Build context based on current route and stores (same logic as AIChatBubble)
  const context = useMemo(() => {
    const path = location.pathname
    const params = rootStore.routeParams

    if (path.startsWith('/deals')) {
      const dealId = params.id
      if (dealId) {
        const deal = dealsStore.deals.find(d => d.id === dealId) || dealsStore.selectedDeal
        if (deal) {
          const expectedCloseDate = deal.expectedCloseDate instanceof Date 
            ? deal.expectedCloseDate.toLocaleDateString() 
            : new Date(deal.expectedCloseDate).toLocaleDateString()
          return `You are viewing a specific deal:
- Deal Title: ${deal.title}
- Company: ${deal.company}
- Contact: ${deal.contactName}
- Value: $${(deal.value ?? 0).toLocaleString()}
- Stage: ${deal.stage}
- Probability: ${deal.probability}% (${deal.confidence} confidence)
- Expected Close Date: ${expectedCloseDate}
- Priority: ${deal.priority}
- Description: ${deal.description || 'No description'}
- Tags: ${(deal.tags || []).join(', ') || 'None'}
- Risk Factors: ${(deal.riskFactors || []).length > 0 ? deal.riskFactors.join(', ') : 'None'}
- Positive Signals: ${(deal.positiveSignals || []).length > 0 ? deal.positiveSignals.join(', ') : 'None'}
- Competitor Mentioned: ${deal.competitorMentioned || 'No'}
- Recent Activities: ${(deal.activities || []).slice(0, 5).map(a => `${a.type}: ${a.description}`).join('; ') || 'None'}
- AI Insights: ${(deal.aiInsights || []).map(i => `${i.type}: ${i.title} - ${i.description}`).join('; ') || 'None'}`
        }
        if (dealsStore.isLoading) {
          return `You are viewing a specific deal (ID: ${dealId}). Data is currently loading...`
        }
        return `You are viewing a specific deal (ID: ${dealId}), but the deal details are not yet available.`
      }
      const deals = dealsStore.filteredDeals || dealsStore.deals || []
      const stats = dealsStore.stageStats || []
      const forecast = dealsStore.forecastData || { totalPipeline: 0, weightedForecast: 0, dealsClosingThisMonth: 0 }
      
      if (dealsStore.isLoading && deals.length === 0) {
        return `You are viewing the deals pipeline. Data is currently loading...`
      }
      
      if (deals.length === 0 && stats.length === 0 && (!forecast || forecast.totalPipeline === 0)) {
        return `You are viewing the deals pipeline, but there are currently no deals in the system.`
      }
      
      const totalPipeline = (forecast?.totalPipeline ?? 0)
      const weightedForecast = (forecast?.weightedForecast ?? 0)
      const dealsClosingThisMonth = (forecast?.dealsClosingThisMonth ?? 0)
      
      return `You are viewing the deals pipeline:
- Total Active Deals: ${deals.length}
- Total Pipeline Value: $${totalPipeline.toLocaleString()}
- Weighted Forecast: $${weightedForecast.toLocaleString()}
- Deals Closing This Month: ${dealsClosingThisMonth}
- Stage Breakdown:
${stats.length > 0 ? stats.map(s => `  - ${s.stage}: ${s.count} deals, $${(s.totalValue ?? 0).toLocaleString()}, avg probability ${s.avgProbability ?? 0}%`).join('\n') : '  No deals in any stage'}
- Current Filter: ${dealsStore.filterBy}
- Search Query: ${dealsStore.searchQuery || 'None'}
- Recent Deals: ${deals.length > 0 ? deals.slice(0, 10).map(d => `${d.title} (${d.stage}, $${(d.value ?? 0).toLocaleString()}, ${d.probability ?? 0}%)`).join('; ') : 'No deals available'}`
    }

    if (path.startsWith('/contacts')) {
      const contactId = params.id
      if (contactId) {
        const contact = contactsStore.contacts.find(c => c.id === contactId) || contactsStore.selectedContact
        if (contact) {
          const lastContact = contact.lastContact instanceof Date 
            ? contact.lastContact.toLocaleDateString() 
            : new Date(contact.lastContact).toLocaleDateString()
          const nextFollowUp = contact.nextFollowUp 
            ? (contact.nextFollowUp instanceof Date 
                ? contact.nextFollowUp.toLocaleDateString() 
                : new Date(contact.nextFollowUp).toLocaleDateString())
            : 'Not scheduled'
          return `You are viewing a specific contact:
- Name: ${contact.name}
- Email: ${contact.email}
- Company: ${contact.company}
- Title: ${contact.title}
- Phone: ${contact.phone}
- Relationship Health: ${contact.relationshipHealth} (Score: ${contact.healthScore}/100)
- Sentiment: ${contact.sentiment}
- Churn Risk: ${contact.churnRisk}%
- Total Deals: ${contact.totalDeals}
- Total Deal Value: $${(contact.totalValue ?? 0).toLocaleString()}
- Last Contact: ${lastContact}
- Next Follow-up: ${nextFollowUp}
- Tags: ${(contact.tags || []).join(', ') || 'None'}
- Notes: ${(contact.notes || []).slice(0, 3).join('; ') || 'None'}
- Recent Communication: ${(contact.communicationHistory || []).slice(0, 5).map(c => {
            const commDate = c.date instanceof Date ? c.date.toLocaleDateString() : new Date(c.date).toLocaleDateString()
            return `${c.type} on ${commDate}: ${c.summary}`
          }).join('; ') || 'None'}
- AI Insights: ${(contact.aiInsights || []).map(i => `${i.type}: ${i.title} - ${i.description}`).join('; ') || 'None'}`
        }
      }
      const contacts = contactsStore.filteredContacts || contactsStore.contacts || []
      const stats = contactsStore.stats
      return `You are viewing the contacts list:
- Total Contacts: ${stats.total}
- High Value Contacts: ${stats.highValue}
- At Risk Contacts: ${stats.atRisk}
- Needs Follow-up: ${stats.needsFollowUp}
- Current Filter: ${contactsStore.filterBy}
- Search Query: ${contactsStore.searchQuery || 'None'}
- Recent Contacts: ${contacts.slice(0, 10).map(c => `${c.name} (${c.company}, Health: ${c.healthScore}%, ${c.sentiment})`).join('; ')}`
    }

    if (path.startsWith('/messages')) {
      const conversationId = params.id
      if (conversationId) {
        const conversation = messagesStore.conversations.find(c => c.id === conversationId) || messagesStore.selectedConversation
        if (conversation) {
          return `You are viewing a specific conversation:
- Contact: ${conversation.contactName} (${conversation.contactCompany})
- Overall Sentiment: ${conversation.overallSentiment}
- Sentiment Trend: ${conversation.sentimentTrend}
- Priority: ${conversation.priority}
- Unread Messages: ${conversation.unreadCount}
- Tags: ${(conversation.tags || []).join(', ') || 'None'}
- AI Summary: ${conversation.aiSummary || 'No summary available'}
- Recent Messages: ${(conversation.messages || []).slice(-5).map(m => `${m.senderName} (${m.senderType}): ${m.content.substring(0, 100)}${m.content.length > 100 ? '...' : ''} [${m.sentiment}]`).join('; ')}`
        }
      }
      const conversations = messagesStore.filteredConversations || messagesStore.conversations || []
      const stats = messagesStore.messageStats
      const sentiment = messagesStore.sentimentOverview
      return `You are viewing the messages/conversations:
- Total Conversations: ${stats.total}
- Unread: ${stats.unread}
- High Priority: ${stats.highPriority}
- Needs Follow-up: ${stats.needsFollowUp}
- Average Response Time: ${stats.averageResponseTime}
- Sentiment Overview: Positive ${sentiment.positive}, Neutral ${sentiment.neutral}, Negative ${sentiment.negative}
- Current Filter: ${messagesStore.filterBy}
- Search Query: ${messagesStore.searchQuery || 'None'}
- Recent Conversations: ${conversations.slice(0, 10).map(c => `${c.contactName} (${c.overallSentiment}, ${c.unreadCount} unread)`).join('; ')}`
    }

    if (path.startsWith('/calendar')) {
      const eventId = params.id
      if (eventId) {
        const event = calendarStore.events.find(e => e.id === eventId) || calendarStore.selectedEvent
        if (event) {
          const startTime = event.startTime instanceof Date 
            ? event.startTime.toLocaleString() 
            : new Date(event.startTime).toLocaleString()
          const endTime = event.endTime instanceof Date 
            ? event.endTime.toLocaleString() 
            : new Date(event.endTime).toLocaleString()
          return `You are viewing a specific calendar event:
- Title: ${event.title}
- Type: ${event.type}
- Start: ${startTime}
- End: ${endTime}
- Status: ${event.status}
- Priority: ${event.priority}
- Contact: ${event.contactName || 'N/A'} (${event.contactCompany || 'N/A'})
- Location: ${event.location || 'Virtual/Not specified'}
- Attendees: ${(event.attendees || []).map(a => `${a.name} (${a.status})`).join(', ') || 'None'}
- Description: ${event.description || 'No description'}
- Tags: ${(event.tags || []).join(', ') || 'None'}
- AI Insights: ${(event.aiInsights || []).map(i => `${i.type}: ${i.title} - ${i.description}`).join('; ') || 'None'}
- Preparation: ${(event.preparation?.suggestedTalkingPoints || []).length > 0 ? event.preparation.suggestedTalkingPoints.join('; ') : 'None'}
- Outcome: ${event.outcome ? `${event.outcome.summary} (Rating: ${event.outcome.meetingRating}/5)` : 'Not completed'}`
        }
      }
      const events = calendarStore.events || []
      const stats = calendarStore.calendarStats
      return `You are viewing the calendar:
- Total This Week: ${stats.totalThisWeek}
- Meetings This Week: ${stats.meetingsThisWeek}
- High Priority This Week: ${stats.highPriorityThisWeek}
- Follow-ups Needed: ${stats.followUpsNeeded}
- Current View: ${calendarStore.currentView}
- Current Filter: ${calendarStore.filterBy}
- Search Query: ${calendarStore.searchQuery || 'None'}
- Upcoming Events: ${events.slice(0, 10).map(e => {
          const startDate = e.startTime instanceof Date 
            ? e.startTime.toLocaleDateString() 
            : new Date(e.startTime).toLocaleDateString()
          return `${e.title} (${startDate}, ${e.type}, ${e.status})`
        }).join('; ')}`
    }

    if (path.startsWith('/dashboard')) {
      const forecast = dashboardStore.forecastData
      const summary = dashboardStore.summary
      const actionItems = dashboardStore.actionItems || []
      const forecastRevenue = (forecast?.revenue ?? 0)
      const forecastPeriod = forecast?.period || 'N/A'
      const totalDealsValue = (summary?.totalDealsValue ?? 0)
      
      return `You are viewing the dashboard:
- Forecast Revenue: $${forecastRevenue.toLocaleString()} (${forecastPeriod})
- Forecast Confidence: ${forecast?.confidence || 'N/A'}
- Total Deals Value: $${totalDealsValue.toLocaleString()}
- High Probability Deals: ${summary?.highProbabilityDeals ?? 0}
- At Risk Contacts: ${summary?.atRiskContacts ?? 0}
- Recent Deals: ${(summary?.deals || []).slice(0, 5).map(d => `${d.title} (${d.stage}, $${(d.value ?? 0).toLocaleString()})`).join('; ') || 'None'}
- Recent Contacts: ${(summary?.contacts || []).slice(0, 5).map(c => `${c.name} (${c.company}, Health: ${c.healthScore ?? 0}%)`).join('; ') || 'None'}
- Action Items: ${actionItems.slice(0, 5).map(a => `${a.title} (${a.type})`).join('; ') || 'None'}`
    }

    return `You are viewing the ${path} page.`
  }, [
    location.pathname, 
    dealsStore.deals, 
    dealsStore.filteredDeals, 
    dealsStore.stageStats, 
    dealsStore.forecastData, 
    dealsStore.isLoading,
    dealsStore.selectedDeal,
    contactsStore.contacts, 
    contactsStore.filteredContacts, 
    contactsStore.stats, 
    contactsStore.isLoading,
    contactsStore.selectedContact,
    messagesStore.conversations, 
    messagesStore.filteredConversations, 
    messagesStore.messageStats, 
    messagesStore.sentimentOverview, 
    messagesStore.isLoading,
    messagesStore.selectedConversation,
    calendarStore.events, 
    calendarStore.calendarStats, 
    calendarStore.isLoading,
    calendarStore.selectedEvent,
    dashboardStore.forecastData, 
    dashboardStore.summary, 
    dashboardStore.actionItems,
    dashboardStore.isLoading
  ])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when sidebar expands
  useEffect(() => {
    if (!uiStore.aiCopilotCollapsed && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [uiStore.aiCopilotCollapsed])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
    setIsLoading(true)

    try {
      const systemPrompt = `You are a helpful AI assistant for a CRM system. You are currently viewing the ${location.pathname} page. Here is the context of the current page:\n\n${context}\n\nUse this context to provide relevant and helpful answers about the data, deals, contacts, messages, calendar events, or dashboard information shown on this page.`

      const userMessages = [...messages, userMessage].map((msg) => msg.content)

      const response = await llmApi.sendMessage({
        system_prompt: systemPrompt,
        user_messages: userMessages,
        provider: "gemini",
        model: "gemini-2.5-flash-lite",
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`
    }
  }

  if (uiStore.aiCopilotCollapsed) {
    return (
      <div className="relative w-16 bg-sidebar border-l border-sidebar-border flex flex-col">
        <button
          onClick={() => uiStore.toggleAICopilot()}
          className="absolute -left-3 top-6 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center hover:bg-sidebar-accent transition-colors z-10 shadow-sm"
          aria-label="Expand AI Copilot"
        >
          <ChevronLeft className="w-4 h-4 text-sidebar-foreground" />
        </button>
        <div className="p-6 flex flex-col items-center">
          <Brain className="w-6 h-6 text-primary mb-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-80 bg-sidebar border-l border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-sidebar-foreground">AI Copilot</h2>
        </div>
        <button
          onClick={() => uiStore.toggleAICopilot()}
          className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors"
          aria-label="Collapse AI Copilot"
        >
          <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="w-12 h-12 mb-4 text-primary/50" />
            <p className="text-sm">
              Ask me anything about the current page!
            </p>
            <p className="text-xs mt-2 text-muted-foreground/70">
              Context: {location.pathname}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`flex-1 rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-card-foreground border border-border'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'opacity-70' : 'text-muted-foreground'}`}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 rounded-lg p-3 bg-card border border-border">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-end space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 min-h-[40px] max-h-32 p-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors overflow-y-auto scrollbar-hide"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="p-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg text-primary-foreground transition-colors flex items-center justify-center"
            aria-label="Send Message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => uiStore.toggleAICopilot()}
        className="absolute -left-3 top-6 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center hover:bg-sidebar-accent transition-colors z-10 shadow-sm"
        aria-label="Collapse AI Copilot"
      >
        <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
      </button>
    </div>
  )
})

export default AICopilot