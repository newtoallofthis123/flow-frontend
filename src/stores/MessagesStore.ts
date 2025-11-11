import { makeObservable, observable, computed, action, runInAction, reaction } from 'mobx'
import { messagesApi } from '../api/messages.api'
import { BaseStore } from './BaseStore'
import { wsClient } from '../api/websocket'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderType: 'user' | 'contact'
  content: string
  timestamp: Date
  type: 'email' | 'sms' | 'chat'
  subject?: string
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number // 0-100 for sentiment confidence
  aiAnalysis?: MessageAnalysis
  attachments?: Attachment[]
  status: 'sent' | 'delivered' | 'read' | 'replied'
}

export interface Conversation {
  id: string
  contactId: string
  contactName: string
  contactCompany: string
  lastMessage: Date
  unreadCount: number
  messages: Message[]
  overallSentiment: 'positive' | 'neutral' | 'negative'
  sentimentTrend: 'improving' | 'stable' | 'declining'
  aiSummary: string
  tags: string[]
  priority: 'high' | 'medium' | 'low'
  archived: boolean
}

export interface MessageAnalysis {
  keyTopics: string[]
  emotionalTone: string
  urgencyLevel: 'high' | 'medium' | 'low'
  businessIntent: 'inquiry' | 'complaint' | 'support' | 'purchase' | 'follow-up'
  suggestedResponse: string
  responseTime: string
  actionItems: string[]
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
}

export interface SmartCompose {
  suggestions: string[]
  toneAdjustments: {
    current: 'formal' | 'casual' | 'friendly' | 'urgent'
    alternatives: Array<{
      tone: 'formal' | 'casual' | 'friendly' | 'urgent'
      preview: string
    }>
  }
  templateSuggestions: MessageTemplate[]
}

export interface MessageTemplate {
  id: string
  name: string
  category: 'follow-up' | 'meeting' | 'proposal' | 'support' | 'introduction'
  content: string
  variables: string[]
}

export class MessagesStore extends BaseStore {
  conversations: Conversation[] = []
  selectedConversation: Conversation | null = null
  searchQuery = ''
  filterBy: 'all' | 'unread' | 'high-priority' | 'follow-up' = 'all'
  composingMessage = ''
  smartCompose: SmartCompose | null = null
  messageStats: {
    total: number
    unread: number
    highPriority: number
    needsFollowUp: number
    averageResponseTime: string
  } = {
    total: 0,
    unread: 0,
    highPriority: 0,
    needsFollowUp: 0,
    averageResponseTime: '0 hours',
  }
  sentimentOverview: {
    positive: number
    neutral: number
    negative: number
  } = {
    positive: 0,
    neutral: 0,
    negative: 0,
  }

  private _initialized = false

  constructor() {
    super()
    makeObservable(this, {
      conversations: observable,
      selectedConversation: observable,
      searchQuery: observable,
      filterBy: observable,
      composingMessage: observable,
      smartCompose: observable,
      messageStats: observable,
      sentimentOverview: observable,
      filteredConversations: computed,
      setSearchQuery: action,
      setFilter: action,
      selectConversation: action,
      setComposingMessage: action,
    })
    this.setupReactions()
    this.setupWebSocket()
  }

  private setupReactions() {
    // Auto-fetch when filter changes
    reaction(
      () => this.filterBy,
      () => {
        if (this._initialized) {
          this.fetchConversations()
        }
      }
    )

    // Debounced search
    let searchTimeout: ReturnType<typeof setTimeout>
    reaction(
      () => this.searchQuery,
      () => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
          if (this._initialized) {
            this.fetchConversations()
          }
        }, 300)
      }
    )
  }

  async initialize() {
    if (this._initialized) return
    this._initialized = true
    
    await Promise.all([
      this.fetchConversations(),
      this.fetchStats(),
      this.fetchSentimentOverview(),
    ])
  }

  private setupWebSocket() {
    wsClient.on('conversation:created', (conversation: Conversation) => {
      runInAction(() => {
        this.conversations.unshift(conversation)
      })
    })

    wsClient.on('conversation:updated', (data: { id: string; changes: Partial<Conversation> }) => {
      runInAction(() => {
        const conversation = this.conversations.find(c => c.id === data.id)
        if (conversation) {
          Object.assign(conversation, data.changes)
        }
        if (this.selectedConversation?.id === data.id) {
          Object.assign(this.selectedConversation, data.changes)
        }
      })
    })

    wsClient.on('message:sent', (data: { conversationId: string; message: Message }) => {
      runInAction(() => {
        const conversation = this.conversations.find(c => c.id === data.conversationId)
        if (conversation) {
          conversation.messages.push(data.message)
          conversation.lastMessage = new Date(data.message.timestamp)
        }
        if (this.selectedConversation?.id === data.conversationId) {
          this.selectedConversation.messages.push(data.message)
          this.selectedConversation.lastMessage = new Date(data.message.timestamp)
        }
      })
    })
  }

  get filteredConversations() {
    // Ensure conversations is always an array
    if (!Array.isArray(this.conversations)) {
      return []
    }
    let filtered = this.conversations

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase()
      filtered = filtered.filter(conv =>
        conv.contactName.toLowerCase().includes(query) ||
        conv.contactCompany.toLowerCase().includes(query) ||
        conv.messages.some(msg => msg.content.toLowerCase().includes(query))
      )
    }

    // Category filter
    switch (this.filterBy) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0)
        break
      case 'high-priority':
        filtered = filtered.filter(conv => conv.priority === 'high')
        break
      case 'follow-up':
        filtered = filtered.filter(conv => conv.tags && conv.tags.includes('follow-up'))
        break
    }

    return filtered
      .filter(conv => !conv.archived)
      .sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime())
  }


  setSearchQuery = (query: string) => {
    this.searchQuery = query
  }

  setFilter = (filter: typeof this.filterBy) => {
    this.filterBy = filter
  }

  selectConversation = (conversation: Conversation) => {
    this.selectedConversation = conversation
    // Mark as read
    conversation.unreadCount = 0
  }

  setComposingMessage = (content: string) => {
    this.composingMessage = content
    if (content.trim()) {
      this.generateSmartCompose(content)
    } else {
      this.smartCompose = null
    }
  }

  // Transform API response to Conversation interface
  private transformConversation(apiConv: any): Conversation {
    const parseDate = (dateStr: string | null | undefined, fallback?: Date): Date => {
      if (!dateStr) return fallback || new Date()
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? (fallback || new Date()) : date
    }

    return {
      id: apiConv.id,
      contactId: apiConv.contact_id || apiConv.contactId || '',
      contactName: apiConv.contact_name || apiConv.contactName || '', // May need to fetch separately
      contactCompany: apiConv.contact_company || apiConv.contactCompany || '', // May need to fetch separately
      lastMessage: parseDate(apiConv.last_message_at || apiConv.lastMessage),
      unreadCount: apiConv.unread_count || apiConv.unreadCount || 0,
      messages: Array.isArray(apiConv.messages)
        ? apiConv.messages.map((msg: any) => ({
            id: msg.id,
            conversationId: msg.conversation_id || msg.conversationId || apiConv.id,
            senderId: msg.sender_id || msg.senderId || '',
            senderName: msg.sender_name || msg.senderName || '',
            senderType: msg.sender_type || msg.senderType || 'contact',
            content: msg.content || '',
            timestamp: parseDate(msg.timestamp || msg.created_at),
            type: msg.type || 'email',
            subject: msg.subject,
            sentiment: msg.sentiment || 'neutral',
            confidence: msg.confidence || 0,
            aiAnalysis: msg.aiAnalysis || msg.ai_analysis,
            attachments: Array.isArray(msg.attachments) ? msg.attachments : [],
            status: msg.status || 'sent',
          }))
        : [],
      overallSentiment: apiConv.overall_sentiment || apiConv.overallSentiment || 'neutral',
      sentimentTrend: apiConv.sentiment_trend || apiConv.sentimentTrend || 'stable',
      aiSummary: apiConv.ai_summary || apiConv.aiSummary || '',
      tags: Array.isArray(apiConv.tags) ? apiConv.tags : [],
      priority: apiConv.priority || 'medium',
      archived: apiConv.archived || false,
    }
  }

  async fetchConversations() {
    return this.executeAsync(
      async () => {
        const conversations = await messagesApi.getConversations({
          filter: this.filterBy,
          search: this.searchQuery || undefined,
        })
        // Transform API response to match Conversation interface
        return Array.isArray(conversations)
          ? conversations.map(conv => this.transformConversation(conv))
          : []
      },
      {
        onSuccess: (conversations) => {
          this.conversations = conversations
        },
      }
    )
  }

  async fetchConversation(id: string) {
    return this.executeAsync(
      async () => {
        const conversation = await messagesApi.getConversation(id)
        return this.transformConversation(conversation)
      },
      {
        onSuccess: (conversation) => {
          this.selectedConversation = conversation
          const index = this.conversations.findIndex(c => c.id === id)
          if (index !== -1) {
            this.conversations[index] = conversation
          }
        },
      }
    )
  }

  async fetchStats() {
    return this.executeAsync(
      async () => {
        const stats = await messagesApi.getStats()
        return stats
      },
      {
        onSuccess: (stats) => {
          this.messageStats = stats
        },
        showLoading: false,
      }
    )
  }

  async fetchSentimentOverview() {
    return this.executeAsync(
      async () => {
        const overview = await messagesApi.getSentimentOverview()
        return overview
      },
      {
        onSuccess: (overview) => {
          this.sentimentOverview = overview
        },
        showLoading: false,
      }
    )
  }

  async sendMessage(conversationId: string, content: string, type: Message['type'] = 'email', subject?: string) {
    return this.executeAsync(
      async () => {
        const message = await messagesApi.sendMessage(conversationId, {
          content,
          type,
          subject,
        })
        // Convert date strings to Date objects
        return {
          ...message,
          timestamp: new Date(message.timestamp),
        }
      },
      {
        onSuccess: (message) => {
          const conversation = this.conversations.find(c => c.id === conversationId)
          if (conversation) {
            conversation.messages.push(message)
            conversation.lastMessage = message.timestamp
            conversation.tags = conversation.tags.filter(tag => tag !== 'follow-up')
          }
          if (this.selectedConversation?.id === conversationId) {
            this.selectedConversation.messages.push(message)
            this.selectedConversation.lastMessage = message.timestamp
            this.selectedConversation.tags = this.selectedConversation.tags.filter(tag => tag !== 'follow-up')
          }
          this.composingMessage = ''
          this.smartCompose = null
        },
      }
    )
  }

  async markConversationPriority(conversationId: string, priority: Conversation['priority']) {
    return this.executeAsync(
      async () => {
        const conversation = await messagesApi.updatePriority(conversationId, priority)
        // Convert date strings to Date objects
        return {
          ...conversation,
          lastMessage: new Date(conversation.lastMessage),
          messages: conversation.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }
      },
      {
        onSuccess: (conversation) => {
          const index = this.conversations.findIndex(c => c.id === conversationId)
          if (index !== -1) {
            this.conversations[index] = conversation
          }
          if (this.selectedConversation?.id === conversationId) {
            this.selectedConversation = conversation
          }
        },
      }
    )
  }

  async archiveConversation(conversationId: string, archived: boolean = true) {
    return this.executeAsync(
      async () => {
        const conversation = await messagesApi.archiveConversation(conversationId, archived)
        // Convert date strings to Date objects
        return {
          ...conversation,
          lastMessage: new Date(conversation.lastMessage),
          messages: conversation.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }
      },
      {
        onSuccess: (conversation) => {
          const index = this.conversations.findIndex(c => c.id === conversationId)
          if (index !== -1) {
            this.conversations[index] = conversation
          }
          if (this.selectedConversation?.id === conversationId) {
            this.selectedConversation = conversation
          }
        },
      }
    )
  }

  async addTag(conversationId: string, tag: string) {
    return this.executeAsync(
      async () => {
        const conversation = await messagesApi.addTag(conversationId, tag)
        // Convert date strings to Date objects
        return {
          ...conversation,
          lastMessage: new Date(conversation.lastMessage),
          messages: conversation.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }
      },
      {
        onSuccess: (conversation) => {
          const index = this.conversations.findIndex(c => c.id === conversationId)
          if (index !== -1) {
            this.conversations[index] = conversation
          }
          if (this.selectedConversation?.id === conversationId) {
            this.selectedConversation = conversation
          }
        },
      }
    )
  }

  async fetchAIAnalysis(messageId: string) {
    return this.executeAsync(
      async () => {
        const analysis = await messagesApi.getAIAnalysis(messageId)
        return analysis
      },
      {
        showLoading: false,
      }
    )
  }

  async generateSmartCompose(content: string) {
    if (!this.selectedConversation) return

    return this.executeAsync(
      async () => {
        const smartCompose = await messagesApi.smartCompose(this.selectedConversation!.id, content)
        return smartCompose
      },
      {
        onSuccess: (smartCompose) => {
          this.smartCompose = smartCompose
        },
        showLoading: false,
      }
    )
  }

  async getMessageTemplates(category?: string): Promise<MessageTemplate[]> {
    const result = await this.executeAsync(
      async () => {
        const templates = await messagesApi.getTemplates(category)
        return templates
      },
      {
        showLoading: false,
      }
    )
    return result || []
  }

}