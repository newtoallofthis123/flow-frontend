import { observer } from 'mobx-react-lite'
import { useStore } from '../stores'
import MainLayout from '../components/layout/MainLayout'
import SearchBar from '../components/ui/SearchBar'
import SentimentIndicator from '../components/ui/SentimentIndicator'
import { MessageSquare, Send, Phone, Mail, Calendar, Building, User, Brain, Lightbulb, Zap, Clock, Paperclip, Smile } from 'lucide-react'
import { useState } from 'react'

const Messages = observer(() => {
  const { messagesStore } = useStore()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  const selectedConversation = selectedConversationId
    ? messagesStore.conversations.find(c => c.id === selectedConversationId)
    : null

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return date.toLocaleDateString()
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
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

  const handleSendMessage = () => {
    if (selectedConversationId && messagesStore.composingMessage.trim()) {
      messagesStore.sendMessage(selectedConversationId, messagesStore.composingMessage)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-400'
      case 'medium':
        return 'border-l-yellow-400'
      case 'low':
      default:
        return 'border-l-blue-400'
    }
  }

  const getSentimentTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return '📈'
      case 'declining':
        return '📉'
      case 'stable':
      default:
        return '➡️'
    }
  }

  return (
    <MainLayout>
      <div className="h-full flex">
        {/* Left Panel - Conversation List */}
        <div className="w-96 border-r border-slate-800 bg-slate-900/50 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-white">Messages</h1>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <MessageSquare className="w-4 h-4" />
                <span>{messagesStore.messageStats.total}</span>
              </div>
            </div>

            <SearchBar
              value={messagesStore.searchQuery}
              onChange={messagesStore.setSearchQuery}
              placeholder="Search conversations, contacts..."
              showAI={true}
              showFilter={true}
              filters={searchFilters}
              selectedFilter={messagesStore.filterBy}
              onFilterChange={(filter) => messagesStore.setFilter(filter as typeof messagesStore.filterBy)}
              aiSuggestions={aiSuggestions}
              onAISuggestion={messagesStore.setSearchQuery}
            />
          </div>

          {/* Sentiment Overview */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/30">
            <h3 className="text-sm font-semibold text-white mb-3">Overall Sentiment</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-900/20 border border-green-700/30 rounded p-2 text-center">
                <div className="text-green-400 font-bold">{Math.round(messagesStore.sentimentOverview.positive)}%</div>
                <div className="text-xs text-slate-400">Positive</div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded p-2 text-center">
                <div className="text-yellow-400 font-bold">{Math.round(messagesStore.sentimentOverview.neutral)}%</div>
                <div className="text-xs text-slate-400">Neutral</div>
              </div>
              <div className="bg-red-900/20 border border-red-700/30 rounded p-2 text-center">
                <div className="text-red-400 font-bold">{Math.round(messagesStore.sentimentOverview.negative)}%</div>
                <div className="text-xs text-slate-400">Negative</div>
              </div>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {messagesStore.filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all ${getPriorityColor(conversation.priority)} ${
                    selectedConversationId === conversation.id
                      ? 'bg-slate-700 border-blue-500 border border-l-4'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700/50 border border-l-4'
                  }`}
                >
                  {/* Conversation Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">{conversation.contactName}</h3>
                        {conversation.unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-slate-500">
                        <Building className="w-3 h-3" />
                        <span className="truncate">{conversation.contactCompany}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <SentimentIndicator
                        sentiment={conversation.overallSentiment}
                        size="sm"
                        variant="minimal"
                      />
                      <span className="text-xs text-slate-400">
                        {getSentimentTrendIcon(conversation.sentimentTrend)}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(conversation.lastMessage)}</span>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="mb-3">
                    <p className="text-sm text-slate-400 line-clamp-2">{conversation.aiSummary}</p>
                  </div>

                  {/* Tags */}
                  {conversation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {conversation.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {conversation.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                          +{conversation.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Conversation Detail */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-6 border-b border-slate-800 bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">
                        {selectedConversation.contactName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedConversation.contactName}</h2>
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Building className="w-4 h-4" />
                        <span>{selectedConversation.contactCompany}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <SentimentIndicator
                        sentiment={selectedConversation.overallSentiment}
                        showLabel={true}
                        variant="detailed"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
                        <Phone className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors">
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {selectedConversation.messages.map((message) => (
                    <div key={message.id} className="flex space-x-4">
                      {/* Avatar */}
                      <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        {message.senderType === 'user' ? (
                          <User className="w-4 h-4 text-blue-400" />
                        ) : (
                          <span className="text-white text-sm">{message.senderName.charAt(0)}</span>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        {/* Message Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-white text-sm">{message.senderName}</span>
                            {message.subject && (
                              <>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-400 text-sm">{message.subject}</span>
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
                          <div className="flex items-center space-x-2 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(message.timestamp)}</span>
                          </div>
                        </div>

                        {/* Message Body */}
                        <div className="bg-slate-800 rounded-lg p-4 mb-3">
                          <p className="text-slate-300 leading-relaxed">{message.content}</p>
                        </div>

                        {/* AI Analysis */}
                        {message.aiAnalysis && (
                          <div className="bg-slate-700/30 rounded-lg p-4">
                            <div className="flex items-start space-x-2 mb-3">
                              <Brain className="w-4 h-4 text-purple-400 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="text-sm font-semibold text-white mb-2">AI Analysis</h4>
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                  <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wide">Emotional Tone</span>
                                    <p className="text-sm text-slate-300">{message.aiAnalysis.emotionalTone}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wide">Business Intent</span>
                                    <p className="text-sm text-slate-300 capitalize">{message.aiAnalysis.businessIntent}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wide">Urgency Level</span>
                                    <p className={`text-sm font-medium capitalize ${
                                      message.aiAnalysis.urgencyLevel === 'high' ? 'text-red-400' :
                                      message.aiAnalysis.urgencyLevel === 'medium' ? 'text-yellow-400' :
                                      'text-green-400'
                                    }`}>
                                      {message.aiAnalysis.urgencyLevel}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wide">Response Time</span>
                                    <p className="text-sm text-slate-300">{message.aiAnalysis.responseTime}</p>
                                  </div>
                                </div>

                                {message.aiAnalysis.keyTopics.length > 0 && (
                                  <div className="mb-3">
                                    <span className="text-xs text-slate-400 uppercase tracking-wide">Key Topics</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {message.aiAnalysis.keyTopics.map((topic) => (
                                        <span key={topic} className="px-2 py-0.5 bg-blue-900/20 border border-blue-700/30 text-blue-400 text-xs rounded">
                                          {topic}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {message.aiAnalysis.actionItems.length > 0 && (
                                  <div>
                                    <span className="text-xs text-slate-400 uppercase tracking-wide">Action Items</span>
                                    <ul className="mt-1 space-y-1">
                                      {message.aiAnalysis.actionItems.map((item, index) => (
                                        <li key={index} className="text-sm text-slate-300 flex items-center space-x-2">
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
                              <div className="border-t border-slate-600 pt-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                                  <span className="text-sm font-medium text-white">Suggested Response</span>
                                </div>
                                <p className="text-sm text-slate-300 bg-slate-800 rounded p-2">
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
              <div className="p-6 border-t border-slate-800 bg-slate-900/30">
                {/* Smart Compose Suggestions */}
                {messagesStore.smartCompose && (
                  <div className="mb-4 p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-semibold text-white">AI Writing Assistant</span>
                    </div>

                    {messagesStore.smartCompose.suggestions.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-purple-300 uppercase tracking-wide">Quick Suggestions</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {messagesStore.smartCompose.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => messagesStore.setComposingMessage(suggestion)}
                              className="px-3 py-1.5 bg-purple-800/30 hover:bg-purple-700/30 border border-purple-600/30 rounded-full text-purple-300 text-xs transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span className="text-slate-400">Current tone: {messagesStore.smartCompose.toneAdjustments.current}</span>
                      </div>
                      <div className="flex space-x-2">
                        {messagesStore.smartCompose.toneAdjustments.alternatives.map((alt, index) => (
                          <button
                            key={index}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title={alt.preview}
                          >
                            {alt.tone}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Compose Box */}
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <div className="relative">
                      <textarea
                        value={messagesStore.composingMessage}
                        onChange={(e) => messagesStore.setComposingMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full h-24 p-4 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                        <button className="text-slate-400 hover:text-white transition-colors">
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button className="text-slate-400 hover:text-white transition-colors">
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={handleSendMessage}
                      disabled={!messagesStore.composingMessage.trim()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-white font-medium transition-colors flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a Conversation</h3>
                <p className="text-slate-400">Choose a conversation from the list to view messages and AI insights.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
})

export default Messages