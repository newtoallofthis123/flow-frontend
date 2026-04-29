import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import { useStore } from '../stores'
import MainLayout from '../components/layout/MainLayout'
import SearchBar from '../components/ui/SearchBar'
import SentimentIndicator from '../components/ui/SentimentIndicator'
import { MessageSquare, Send, Phone, Mail, Calendar, Building, User, Brain, Lightbulb, Zap, Clock, Paperclip, TrendingUp, TrendingDown, Minus, Smile } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'

const Messages = observer(() => {
  const { messagesStore, contactsStore } = useStore()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const selectedConversation = id
    ? messagesStore.conversations.find(c => c.id === id)
    : null

  // Auto-select the first conversation when none is in URL
  useEffect(() => {
    if (id || messagesStore.conversations.length === 0) return
    const target = messagesStore.conversations[0]
    if (target) navigate(`/messages/${target.id}`, { replace: true })
  }, [id, messagesStore.conversations.length, navigate])

  // Helper to get contact name/company, with fallback
  const getContactInfo = (contactId: string) => {
    const contact = contactsStore.contacts.find(c => c.id === contactId)
    return {
      name: contact?.name || 'Unknown Contact',
      company: contact?.company || 'Unknown Company',
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  const formatTime = (date: Date | string | undefined | null) => {
    const d = date instanceof Date ? date : date ? new Date(date) : null
    if (!d || isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(d)
  }

  const searchFilters = [
    { id: 'all', label: 'All Messages', count: messagesStore.messageStats.total },
    { id: 'unread', label: 'Unread', count: messagesStore.messageStats.unread },
    { id: 'high-priority', label: 'High Priority', count: messagesStore.messageStats.highPriority },
    { id: 'follow-up', label: 'Follow-up Needed', count: messagesStore.messageStats.needsFollowUp }
  ]

  const aiSuggestions = [
    'urgent messages',
    'negative sentiment',
    'meeting requests',
    'price discussions'
  ]

  const handleSendMessage = async () => {
    if (id && messagesStore.composingMessage.trim()) {
      await messagesStore.sendMessage(id, messagesStore.composingMessage)
    }
  }

  const getPriorityChip = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Chip variant="danger" size="sm">Urgent</Chip>
      case 'medium':
        return <Chip variant="warning" size="sm">Hot Lead</Chip>
      default:
        return null
    }
  }

  const getSentimentTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-3 h-3 text-success" />
      case 'declining':
        return <TrendingDown className="w-3 h-3 text-destructive" />
      case 'stable':
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />
    }
  }

  return (
    <MainLayout>
      <div className="h-full flex">
        {/* Left Panel - Conversation List */}
        <div className="w-96 border-r border-border bg-sidebar/50 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-foreground">Messages</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                <span>{messagesStore.messageStats.total}</span>
              </div>
            </div>

            <SearchBar
              value={messagesStore.searchQuery}
              onChange={messagesStore.setSearchQuery}
              placeholder="Search conversations, contacts..."
              showAI={false}
              showFilter={true}
              filters={searchFilters}
              selectedFilter={messagesStore.filterBy}
              onFilterChange={(filter) => messagesStore.setFilter(filter as typeof messagesStore.filterBy)}
              aiSuggestions={aiSuggestions}
              onAISuggestion={messagesStore.setSearchQuery}
            />
          </div>

          {/* Sentiment Overview */}
          <div className="p-4 border-b border-border bg-card/30">
            <h3 className="text-sm font-semibold text-foreground mb-3">Overall Sentiment</h3>
            <div className="grid grid-cols-3 gap-2">
              <Card className="p-3 text-center">
                <div className="text-lg font-bold text-foreground mb-1">{Math.round(messagesStore.sentimentOverview.positive)}%</div>
                <Chip variant="success" size="sm">Positive</Chip>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-lg font-bold text-foreground mb-1">{Math.round(messagesStore.sentimentOverview.neutral)}%</div>
                <Chip variant="warning" size="sm">Neutral</Chip>
              </Card>
              <Card className="p-3 text-center">
                <div className="text-lg font-bold text-foreground mb-1">{Math.round(messagesStore.sentimentOverview.negative)}%</div>
                <Chip variant="danger" size="sm">Negative</Chip>
              </Card>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {messagesStore.filteredConversations.map((conversation) => (
                <Card
                  key={conversation.id}
                  interactive
                  onClick={() => navigate(`/messages/${conversation.id}`)}
                  className={`p-4 ${id === conversation.id ? 'ring-2 ring-primary' : ''}`}
                >
                  {/* Conversation Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start space-x-2 flex-1 min-w-0">
                      <SentimentIndicator
                        sentiment={conversation.overallSentiment}
                        size="sm"
                        variant="minimal"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-semibold text-card-foreground truncate">
                            {conversation.contactName || getContactInfo(conversation.contactId).name}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <Chip variant="info" size="sm">{conversation.unreadCount}</Chip>
                          )}
                          {getPriorityChip(conversation.priority)}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground/70">
                          <Building className="w-3 h-3" />
                          <span className="truncate">
                            {conversation.contactCompany || getContactInfo(conversation.contactId).company}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <div className="flex items-center">
                        {getSentimentTrendIcon(conversation.sentimentTrend)}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(conversation.lastMessage)}</span>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">{conversation.aiSummary}</p>
                  </div>

                  {/* Tags */}
                  {conversation.tags && conversation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {conversation.tags.slice(0, 3).map((tag) => (
                        <Chip key={tag} size="sm">{tag}</Chip>
                      ))}
                      {conversation.tags.length > 3 && (
                        <Chip size="sm">+{conversation.tags.length - 3}</Chip>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Conversation Detail */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-6 border-b border-border bg-card/30">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0 border border-border">
                      <span className="text-foreground font-semibold text-lg">
                        {((selectedConversation.contactName || getContactInfo(selectedConversation.contactId).name) || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold text-foreground mb-1 truncate">
                        {selectedConversation.contactName || getContactInfo(selectedConversation.contactId).name}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{selectedConversation.contactCompany || getContactInfo(selectedConversation.contactId).company}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <SentimentIndicator
                      sentiment={selectedConversation.overallSentiment}
                      size="sm"
                      variant="minimal"
                    />
                    <div className="h-6 w-px bg-border" />
                    <div className="flex items-center gap-1">
                      <button className="p-2.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-2.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {(selectedConversation.messages || []).map((message) => (
                    <div key={message.id} className="flex space-x-4">
                      {/* Avatar */}
                      <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                        {message.senderType === 'user' ? (
                          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <span className="text-card-foreground text-sm">{(message.senderName || '?').charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        {/* Message Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-card-foreground text-sm">{message.senderName}</span>
                            {message.subject && (
                              <>
                                <span className="text-muted-foreground/70">•</span>
                                <span className="text-muted-foreground text-sm">{message.subject}</span>
                              </>
                            )}
                            <SentimentIndicator
                              sentiment={message.sentiment}
                              confidence={message.confidence}
                              size="sm"
                              variant="minimal"
                              showConfidence={true}
                            />
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                        </div>

                        {/* Message Body */}
                        <Card className="p-4 mb-3">
                          <p className="text-card-foreground leading-relaxed">{message.content}</p>
                        </Card>

                        {/* AI Analysis */}
                        {message.aiAnalysis && (
                          <div className="bg-accent/30 rounded-lg p-4 border border-border">
                            <div className="flex items-start space-x-2 mb-3">
                              <Brain className="w-4 h-4 text-primary mt-0.5" />
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-card-foreground mb-2">AI Analysis</h4>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Emotional Tone</span>
                                    <p className="text-sm text-card-foreground">{message.aiAnalysis.emotionalTone}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Business Intent</span>
                                    <p className="text-sm text-card-foreground capitalize">{message.aiAnalysis.businessIntent}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Urgency Level</span>
                                    <p className={`text-sm font-medium capitalize ${
                                      message.aiAnalysis.urgencyLevel === 'high' ? 'text-destructive' :
                                      message.aiAnalysis.urgencyLevel === 'medium' ? 'text-warning' :
                                      'text-success'
                                    }`}>
                                      {message.aiAnalysis.urgencyLevel}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Response Time</span>
                                    <p className="text-sm text-card-foreground">{message.aiAnalysis.responseTime}</p>
                                  </div>
                                </div>

                                {message.aiAnalysis.keyTopics && message.aiAnalysis.keyTopics.length > 0 && (
                                  <div className="mb-3">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Key Topics</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {message.aiAnalysis.keyTopics.map((topic) => (
                                        <Chip key={topic} variant="info" size="sm">{topic}</Chip>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {message.aiAnalysis.actionItems && message.aiAnalysis.actionItems.length > 0 && (
                                  <div>
                                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Action Items</span>
                                    <ul className="mt-1 space-y-1">
                                      {message.aiAnalysis.actionItems.map((item, index) => (
                                        <li key={index} className="text-sm text-card-foreground flex items-center space-x-2">
                                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>

                            {message.aiAnalysis.suggestedResponse && (
                              <div className="border-t border-border pt-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Lightbulb className="w-4 h-4 text-warning" />
                                  <span className="text-sm font-medium text-card-foreground">Suggested Response</span>
                                </div>
                                <p className="text-sm text-card-foreground bg-card rounded p-2 border border-border">
                                  {message.aiAnalysis.suggestedResponse}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Compose */}
              <div className="p-6 border-t border-border bg-card/30">
                {/* Smart Compose Suggestions */}
                {messagesStore.smartCompose && (
                  <div className="mb-4 p-4 bg-accent/20 border border-border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-card-foreground">AI Writing Assistant</span>
                    </div>

                    {messagesStore.smartCompose && messagesStore.smartCompose.suggestions && messagesStore.smartCompose.suggestions.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-primary uppercase tracking-wide">Quick Suggestions</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {messagesStore.smartCompose.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => messagesStore.setComposingMessage(suggestion)}
                              className="px-3 py-1.5 bg-secondary hover:bg-accent border border-border rounded-full text-card-foreground text-xs transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {messagesStore.smartCompose && messagesStore.smartCompose.toneAdjustments && (
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-warning" />
                          <span className="text-muted-foreground">Current tone: {messagesStore.smartCompose.toneAdjustments.current}</span>
                        </div>
                        <div className="flex space-x-2">
                          {(messagesStore.smartCompose.toneAdjustments.alternatives || []).map((alt, index) => (
                            <button
                              key={index}
                              className="text-primary hover:text-primary/80 transition-colors"
                              title={alt.preview}
                            >
                              {alt.tone}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Compose Box */}
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={messagesStore.composingMessage}
                        onChange={(e) => messagesStore.setComposingMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full h-24 p-4 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messagesStore.composingMessage.trim()}
                    className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg text-primary-foreground font-medium transition-colors flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Select a Conversation</h3>
                <p className="text-muted-foreground">Choose a conversation from the list to view messages and AI insights.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
})

export default Messages