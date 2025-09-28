import { makeAutoObservable } from 'mobx'

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

export class MessagesStore {
  conversations: Conversation[] = []
  selectedConversation: Conversation | null = null
  searchQuery = ''
  filterBy: 'all' | 'unread' | 'high-priority' | 'follow-up' = 'all'
  isLoading = false
  composingMessage = ''
  smartCompose: SmartCompose | null = null

  constructor() {
    makeAutoObservable(this)
    this.loadMockData()
  }

  get filteredConversations() {
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
        filtered = filtered.filter(conv => conv.tags.includes('follow-up'))
        break
    }

    return filtered
      .filter(conv => !conv.archived)
      .sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime())
  }

  get messageStats() {
    const total = this.conversations.length
    const unread = this.conversations.filter(c => c.unreadCount > 0).length
    const highPriority = this.conversations.filter(c => c.priority === 'high').length
    const needsFollowUp = this.conversations.filter(c => c.tags.includes('follow-up')).length

    return {
      total,
      unread,
      highPriority,
      needsFollowUp,
      averageResponseTime: this.calculateAverageResponseTime()
    }
  }

  get sentimentOverview() {
    const sentiments = this.conversations.map(c => c.overallSentiment)
    const positive = sentiments.filter(s => s === 'positive').length
    const neutral = sentiments.filter(s => s === 'neutral').length
    const negative = sentiments.filter(s => s === 'negative').length

    return {
      positive: (positive / sentiments.length) * 100,
      neutral: (neutral / sentiments.length) * 100,
      negative: (negative / sentiments.length) * 100
    }
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
    this.generateSmartCompose(content)
  }

  sendMessage = (conversationId: string, content: string, type: Message['type'] = 'email') => {
    const conversation = this.conversations.find(c => c.id === conversationId)
    if (!conversation) return

    const newMessage: Message = {
      id: Date.now().toString(),
      conversationId,
      senderId: 'current-user',
      senderName: 'You',
      senderType: 'user',
      content,
      timestamp: new Date(),
      type,
      sentiment: this.analyzeSentiment(content),
      confidence: 85,
      status: 'sent'
    }

    conversation.messages.push(newMessage)
    conversation.lastMessage = new Date()
    conversation.tags = conversation.tags.filter(tag => tag !== 'follow-up')

    this.composingMessage = ''
    this.smartCompose = null
  }

  markConversationPriority = (conversationId: string, priority: Conversation['priority']) => {
    const conversation = this.conversations.find(c => c.id === conversationId)
    if (conversation) {
      conversation.priority = priority
    }
  }

  archiveConversation = (conversationId: string) => {
    const conversation = this.conversations.find(c => c.id === conversationId)
    if (conversation) {
      conversation.archived = true
    }
  }

  addTag = (conversationId: string, tag: string) => {
    const conversation = this.conversations.find(c => c.id === conversationId)
    if (conversation && !conversation.tags.includes(tag)) {
      conversation.tags.push(tag)
    }
  }

  private analyzeSentiment = (content: string): 'positive' | 'neutral' | 'negative' => {
    // Simple sentiment analysis (in production, would use AI service)
    const positiveWords = ['great', 'excellent', 'perfect', 'love', 'amazing', 'thank you', 'thanks', 'awesome', 'fantastic']
    const negativeWords = ['terrible', 'awful', 'hate', 'problem', 'issue', 'frustrated', 'annoying', 'disappointed', 'worst']

    const lowerContent = content.toLowerCase()
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private generateSmartCompose = (content: string) => {
    // Mock AI-powered smart compose suggestions
    const suggestions = []
    const templates = this.getMessageTemplates()

    if (content.toLowerCase().includes('meeting')) {
      suggestions.push('Schedule a call', 'Send calendar invite', 'Confirm availability')
    }
    if (content.toLowerCase().includes('follow up') || content.toLowerCase().includes('followup')) {
      suggestions.push('Schedule follow-up reminder', 'Add to task list', 'Set follow-up date')
    }

    this.smartCompose = {
      suggestions,
      toneAdjustments: {
        current: 'friendly',
        alternatives: [
          {
            tone: 'formal',
            preview: 'I hope this message finds you well. I wanted to follow up on our previous discussion...'
          },
          {
            tone: 'casual',
            preview: 'Hey! Just wanted to check in about what we discussed...'
          }
        ]
      },
      templateSuggestions: templates.slice(0, 3)
    }
  }

  private getMessageTemplates = (): MessageTemplate[] => {
    return [
      {
        id: '1',
        name: 'Follow-up Meeting',
        category: 'follow-up',
        content: 'Hi {contactName}, I wanted to follow up on our conversation about {topic}. Would you be available for a quick call this week to discuss next steps?',
        variables: ['contactName', 'topic']
      },
      {
        id: '2',
        name: 'Proposal Follow-up',
        category: 'proposal',
        content: 'Hi {contactName}, I hope you had a chance to review the proposal I sent. I\'d be happy to schedule a call to discuss any questions you might have.',
        variables: ['contactName']
      },
      {
        id: '3',
        name: 'Demo Invitation',
        category: 'meeting',
        content: 'Hi {contactName}, Based on our conversation, I think you\'d benefit from seeing our platform in action. Would you be interested in a personalized demo this week?',
        variables: ['contactName']
      }
    ]
  }

  private calculateAverageResponseTime = (): string => {
    // Mock calculation - would analyze actual response times
    return '2.3 hours'
  }

  private loadMockData = () => {
    this.conversations = [
      {
        id: '1',
        contactId: '1',
        contactName: 'Sarah Williams',
        contactCompany: 'TechCorp Solutions',
        lastMessage: new Date('2024-01-16T10:30:00'),
        unreadCount: 2,
        overallSentiment: 'positive',
        sentimentTrend: 'improving',
        aiSummary: 'Positive conversation about Q1 budget planning. Sarah is engaged and ready to move forward with enterprise package.',
        tags: ['enterprise', 'budget-discussion'],
        priority: 'high',
        archived: false,
        messages: [
          {
            id: '1',
            conversationId: '1',
            senderId: '1',
            senderName: 'Sarah Williams',
            senderType: 'contact',
            content: 'Hi! I wanted to follow up on our Q1 budget discussion. We\'ve got approval for the enterprise package and are excited to move forward. Could we schedule a call this week to finalize the details?',
            timestamp: new Date('2024-01-16T10:30:00'),
            type: 'email',
            subject: 'Q1 Budget Approval - Ready to Proceed',
            sentiment: 'positive',
            confidence: 92,
            aiAnalysis: {
              keyTopics: ['Budget approval', 'Enterprise package', 'Timeline'],
              emotionalTone: 'Enthusiastic and professional',
              urgencyLevel: 'medium',
              businessIntent: 'purchase',
              suggestedResponse: 'Express enthusiasm and propose specific meeting times',
              responseTime: 'Within 2 hours for high-priority deal',
              actionItems: ['Schedule follow-up call', 'Prepare enterprise package details', 'Send calendar invite']
            },
            status: 'delivered'
          },
          {
            id: '2',
            conversationId: '1',
            senderId: 'current-user',
            senderName: 'You',
            senderType: 'user',
            content: 'That\'s fantastic news, Sarah! I\'m thrilled to hear about the budget approval. I\'d love to schedule a call to walk through the enterprise package details and timeline. Are you available Thursday or Friday afternoon?',
            timestamp: new Date('2024-01-16T08:15:00'),
            type: 'email',
            sentiment: 'positive',
            confidence: 88,
            status: 'sent'
          },
          {
            id: '3',
            conversationId: '1',
            senderId: '1',
            senderName: 'Sarah Williams',
            senderType: 'contact',
            content: 'Perfect! Friday at 2 PM works great for me. Looking forward to it!',
            timestamp: new Date('2024-01-16T08:45:00'),
            type: 'email',
            sentiment: 'positive',
            confidence: 95,
            status: 'delivered'
          }
        ]
      },
      {
        id: '2',
        contactId: '2',
        contactName: 'Mike Chen',
        contactCompany: 'Startup.io',
        lastMessage: new Date('2024-01-15T16:20:00'),
        unreadCount: 0,
        overallSentiment: 'neutral',
        sentimentTrend: 'stable',
        aiSummary: 'Price-sensitive prospect asking about scaling options. Needs ROI demonstration and flexible pricing.',
        tags: ['pricing', 'follow-up', 'roi-needed'],
        priority: 'medium',
        archived: false,
        messages: [
          {
            id: '4',
            conversationId: '2',
            senderId: '2',
            senderName: 'Mike Chen',
            senderType: 'contact',
            content: 'I\'ve been reviewing your platform and it looks like a good fit for our team. However, I\'m concerned about the pricing as we scale. Do you have any options for startups or volume discounts?',
            timestamp: new Date('2024-01-15T14:30:00'),
            type: 'email',
            subject: 'Pricing Questions for Growing Team',
            sentiment: 'neutral',
            confidence: 75,
            aiAnalysis: {
              keyTopics: ['Pricing concerns', 'Scaling', 'Startup discounts'],
              emotionalTone: 'Professional but cautious',
              urgencyLevel: 'medium',
              businessIntent: 'inquiry',
              suggestedResponse: 'Address pricing concerns with ROI focus and startup-friendly options',
              responseTime: 'Within 4 hours - price-sensitive lead',
              actionItems: ['Prepare ROI analysis', 'Create startup pricing proposal', 'Schedule discovery call']
            },
            status: 'read'
          },
          {
            id: '5',
            conversationId: '2',
            senderId: 'current-user',
            senderName: 'You',
            senderType: 'user',
            content: 'Thanks for your interest, Mike! I completely understand the scaling concerns for startups. We actually have several options that could work well for you, including our startup-friendly pricing tier. I\'d love to schedule a 15-minute call to understand your specific needs and show you how our customers typically see ROI within the first 3 months. Would tomorrow afternoon work?',
            timestamp: new Date('2024-01-15T16:20:00'),
            type: 'email',
            sentiment: 'positive',
            confidence: 85,
            status: 'sent'
          }
        ]
      },
      {
        id: '3',
        contactId: '3',
        contactName: 'Emma Rodriguez',
        contactCompany: 'GlobalCorp',
        lastMessage: new Date('2024-01-10T11:15:00'),
        unreadCount: 1,
        overallSentiment: 'negative',
        sentimentTrend: 'declining',
        aiSummary: 'Frustrated customer with service issues. Relationship at risk, needs immediate executive attention.',
        tags: ['at-risk', 'service-issues', 'executive-escalation'],
        priority: 'high',
        archived: false,
        messages: [
          {
            id: '6',
            conversationId: '3',
            senderId: '3',
            senderName: 'Emma Rodriguez',
            senderType: 'contact',
            content: 'I\'m really disappointed with the recent service issues we\'ve been experiencing. Our team has lost confidence in the platform, and I\'m under pressure to evaluate alternatives. We need a senior leader to address these concerns immediately, or we\'ll have to consider other options.',
            timestamp: new Date('2024-01-10T11:15:00'),
            type: 'email',
            subject: 'Urgent: Service Issues and Relationship Concerns',
            sentiment: 'negative',
            confidence: 94,
            aiAnalysis: {
              keyTopics: ['Service issues', 'Lost confidence', 'Competitor evaluation', 'Executive escalation needed'],
              emotionalTone: 'Frustrated and disappointed',
              urgencyLevel: 'high',
              businessIntent: 'complaint',
              suggestedResponse: 'Immediate executive escalation, acknowledge concerns, provide specific action plan',
              responseTime: 'Immediate response required - relationship at risk',
              actionItems: ['Executive escalation', 'Service review meeting', 'Recovery plan', 'Competitor analysis']
            },
            status: 'delivered'
          }
        ]
      },
      {
        id: '4',
        contactId: '4',
        contactName: 'David Park',
        contactCompany: 'InnovateTech',
        lastMessage: new Date('2024-01-14T15:45:00'),
        unreadCount: 0,
        overallSentiment: 'positive',
        sentimentTrend: 'improving',
        aiSummary: 'Very satisfied existing customer ready for expansion. Strong champion with proven ROI.',
        tags: ['expansion', 'champion', 'existing-customer'],
        priority: 'high',
        archived: false,
        messages: [
          {
            id: '7',
            conversationId: '4',
            senderId: '4',
            senderName: 'David Park',
            senderType: 'contact',
            content: 'Our Q4 results with your platform exceeded all expectations! The team is thrilled with the productivity gains. We\'re ready to expand to our other 3 product teams. Can we discuss pricing for the additional users?',
            timestamp: new Date('2024-01-14T15:45:00'),
            type: 'email',
            subject: 'Expansion Opportunity - Additional Teams',
            sentiment: 'positive',
            confidence: 98,
            aiAnalysis: {
              keyTopics: ['Exceeded expectations', 'Productivity gains', 'Team expansion', 'Pricing discussion'],
              emotionalTone: 'Enthusiastic and satisfied',
              urgencyLevel: 'medium',
              businessIntent: 'purchase',
              suggestedResponse: 'Express excitement, propose expansion meeting with volume pricing',
              responseTime: 'Within 2 hours - hot expansion opportunity',
              actionItems: ['Prepare expansion proposal', 'Calculate volume discounts', 'Schedule expansion meeting']
            },
            status: 'read'
          },
          {
            id: '8',
            conversationId: '4',
            senderId: 'current-user',
            senderName: 'You',
            senderType: 'user',
            content: 'David, that\'s incredible news! I\'m so excited to hear about the amazing results. I\'d love to put together an expansion proposal with volume pricing for the additional teams. Could we schedule a call this week to discuss the specifics and timeline?',
            timestamp: new Date('2024-01-14T16:20:00'),
            type: 'email',
            sentiment: 'positive',
            confidence: 92,
            status: 'sent'
          }
        ]
      }
    ]
  }
}