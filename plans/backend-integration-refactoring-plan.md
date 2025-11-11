# Backend Integration Refactoring Plan

**Date:** November 11, 2025  
**Version:** 1.0  
**Status:** Planning Phase

---

## Executive Summary

This document outlines a comprehensive refactoring plan to integrate the Flow CRM frontend with the backend API as specified in `BACKEND_SPECIFICATION.md`. The refactoring will modernize MobX stores using the latest MobX 6 APIs, implement proper API communication, add error handling, loading states, and real-time updates via WebSocket/SSE.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Architecture Overview](#2-architecture-overview)
3. [Environment Configuration](#3-environment-configuration)
4. [API Client Implementation](#4-api-client-implementation)
5. [Store Refactoring](#5-store-refactoring)
6. [Component Updates](#6-component-updates)
7. [Real-time Updates](#7-real-time-updates)
8. [Error Handling & Loading States](#8-error-handling--loading-states)
9. [Type Safety & Validation](#9-type-safety--validation)
10. [Testing Strategy](#10-testing-strategy)
11. [Migration Path](#11-migration-path)
12. [Timeline & Milestones](#12-timeline--milestones)

---

## 1. Current State Analysis

### 1.1 Existing Architecture

**MobX Stores:**
- ✅ Using `makeAutoObservable` (modern MobX 6 API)
- ✅ Using `reaction` for side effects
- ✅ Using `observer` HOC from `mobx-react-lite`
- ❌ All data is mock/hardcoded
- ❌ No API communication layer
- ❌ No error handling
- ❌ No loading states
- ❌ No real-time updates

**Current Stores:**
- `RootStore` - Container for all stores
- `UserStore` - Minimal implementation (needs auth)
- `ThemeStore` - Complete (localStorage-based)
- `DashboardStore` - Mock data
- `ContactsStore` - Mock data with filtering
- `DealsStore` - Mock data with Kanban logic
- `MessagesStore` - Mock data with sentiment analysis
- `CalendarStore` - Mock data with scheduling logic

**Dependencies:**
- MobX 6.15.0 ✅
- mobx-react-lite 4.1.1 ✅
- React Router DOM 7.9.3 ✅
- No HTTP client (needs axios or fetch wrapper)

### 1.2 Backend API Structure

The backend provides:
- RESTful endpoints for CRUD operations
- WebSocket/SSE for real-time updates
- AI-powered features (sentiment, probability, insights)
- Authentication with JWT tokens
- Comprehensive error responses

---

## 2. Architecture Overview

### 2.1 Layered Architecture

```
┌─────────────────────────────────────────┐
│         React Components (UI)           │
│         (observer wrapped)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         MobX Stores (State)             │
│   - Observable state                    │
│   - Actions (API calls)                 │
│   - Computed values                     │
│   - Reactions (side effects)            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         API Client Layer                │
│   - HTTP requests                       │
│   - Request/Response interceptors       │
│   - Error handling                      │
│   - Token management                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Backend API                     │
│   - REST endpoints                      │
│   - WebSocket/SSE                       │
└─────────────────────────────────────────┘
```

### 2.2 Data Flow

**Read Operations:**
1. Component renders → triggers store computed value
2. Store checks if data exists → if not, calls action
3. Action calls API client → makes HTTP request
4. API client returns data → store updates observable state
5. MobX notifies observers → component re-renders

**Write Operations:**
1. User interaction → calls store action
2. Action makes optimistic update (optional)
3. Action calls API client → makes HTTP request
4. On success → confirms state update
5. On error → reverts optimistic update, shows error

**Real-time Updates:**
1. WebSocket connection established on app init
2. Backend sends update event
3. WebSocket handler calls appropriate store action
4. Store updates observable state
5. MobX notifies observers → components re-render

---

## 3. Environment Configuration

### 3.1 Create Environment Files

**File: `.env.development`**
```env
VITE_API_BASE_URL=http://localhost:4545
VITE_WS_URL=ws://localhost:4545
VITE_APP_NAME=Flow CRM
VITE_APP_VERSION=1.0.0
```

**File: `.env.production`**
```env
VITE_API_BASE_URL=https://api.flow-crm.com
VITE_WS_URL=wss://api.flow-crm.com
VITE_APP_NAME=Flow CRM
VITE_APP_VERSION=1.0.0
```

**File: `.env.example`**
```env
VITE_API_BASE_URL=http://localhost:4545
VITE_WS_URL=ws://localhost:4545
VITE_APP_NAME=Flow CRM
VITE_APP_VERSION=1.0.0
```

### 3.2 Environment Config Module

**File: `src/config/env.ts`**
```typescript
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4545',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:4545',
  appName: import.meta.env.VITE_APP_NAME || 'Flow CRM',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const
```

### 3.3 Update .gitignore

```gitignore
# Environment files
.env.local
.env.development.local
.env.production.local
```

---

## 4. API Client Implementation

### 4.1 Core API Client

**File: `src/api/client.ts`**

```typescript
import { env } from '../config/env'

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public error: ApiError
  ) {
    super(error.message)
    this.name = 'ApiClientError'
  }
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.loadToken()
  }

  private loadToken() {
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      }))
      throw new ApiClientError(response.status, error.error || error)
    }

    return response.json()
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse<T>(response)
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse<T>(response)
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse<T>(response)
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response)
  }
}

export const apiClient = new ApiClient(env.apiBaseUrl)
```

### 4.2 API Service Modules

Create separate API service files for each domain:

**File Structure:**
```
src/api/
  ├── client.ts (core client)
  ├── auth.api.ts
  ├── dashboard.api.ts
  ├── contacts.api.ts
  ├── deals.api.ts
  ├── messages.api.ts
  ├── calendar.api.ts
  └── index.ts (exports)
```

**Example: `src/api/contacts.api.ts`**
```typescript
import { apiClient } from './client'
import type { Contact, CommunicationEvent, AIInsight } from '../stores/ContactsStore'

export const contactsApi = {
  // GET /api/contacts
  getContacts: (params?: {
    search?: string
    filter?: 'all' | 'high-value' | 'at-risk' | 'recent'
    sort?: string
  }) => apiClient.get<Contact[]>('/api/contacts', params),

  // GET /api/contacts/:id
  getContact: (id: string) => 
    apiClient.get<Contact>(`/api/contacts/${id}`),

  // POST /api/contacts
  createContact: (data: Omit<Contact, 'id' | 'healthScore' | 'churnRisk'>) =>
    apiClient.post<Contact>('/api/contacts', data),

  // PUT /api/contacts/:id
  updateContact: (id: string, data: Partial<Contact>) =>
    apiClient.put<Contact>(`/api/contacts/${id}`, data),

  // DELETE /api/contacts/:id
  deleteContact: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/api/contacts/${id}`),

  // POST /api/contacts/:id/communication
  addCommunication: (
    id: string,
    data: {
      type: 'email' | 'call' | 'meeting' | 'note'
      date: Date
      subject?: string
      summary: string
    }
  ) => apiClient.post<CommunicationEvent>(`/api/contacts/${id}/communication`, data),

  // GET /api/contacts/:id/ai-insights
  getAIInsights: (id: string) =>
    apiClient.get<AIInsight[]>(`/api/contacts/${id}/ai-insights`),

  // GET /api/contacts/stats
  getStats: () =>
    apiClient.get<{
      total: number
      highValue: number
      atRisk: number
      needsFollowUp: number
    }>('/api/contacts/stats'),
}
```

### 4.3 WebSocket Client

**File: `src/api/websocket.ts`**

```typescript
import { env } from '../config/env'

type MessageHandler = (data: any) => void
type EventHandlers = Map<string, Set<MessageHandler>>

export class WebSocketClient {
  private ws: WebSocket | null = null
  private eventHandlers: EventHandlers = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(private url: string) {}

  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    this.ws = new WebSocket(`${this.url}?token=${token}`)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.attemptReconnect(token)
    }
  }

  private attemptReconnect(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
      setTimeout(() => this.connect(token), delay)
    }
  }

  private handleMessage(message: { event: string; data: any }) {
    const handlers = this.eventHandlers.get(message.event)
    if (handlers) {
      handlers.forEach(handler => handler(message.data))
    }
  }

  on(event: string, handler: MessageHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  off(event: string, handler: MessageHandler) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(event: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }))
    }
  }
}

export const wsClient = new WebSocketClient(env.wsUrl)
```

---

## 5. Store Refactoring

### 5.1 Modern MobX Patterns

**Key Principles:**
1. Use `makeAutoObservable` for automatic observable/action inference
2. Use `runInAction` for async updates
3. Use `flow` for generator-based async actions (optional, more advanced)
4. Use `reaction` for side effects
5. Use `computed` for derived state
6. Keep stores focused and single-responsibility

### 5.2 Store Base Class

**File: `src/stores/BaseStore.ts`**

```typescript
import { makeAutoObservable, runInAction } from 'mobx'
import { ApiClientError } from '../api/client'

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export class BaseStore {
  isLoading = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  protected setLoading(loading: boolean) {
    this.isLoading = loading
  }

  protected setError(error: string | null) {
    this.error = error
  }

  protected async executeAsync<T>(
    action: () => Promise<T>,
    options?: {
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
      showLoading?: boolean
    }
  ): Promise<T | null> {
    const { onSuccess, onError, showLoading = true } = options || {}

    try {
      if (showLoading) {
        this.setLoading(true)
      }
      this.setError(null)

      const result = await action()

      runInAction(() => {
        if (onSuccess) {
          onSuccess(result)
        }
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.error.message
        : error instanceof Error
        ? error.message
        : 'An unknown error occurred'

      runInAction(() => {
        this.setError(errorMessage)
        if (onError) {
          onError(error as Error)
        }
      })

      return null
    } finally {
      if (showLoading) {
        runInAction(() => {
          this.setLoading(false)
        })
      }
    }
  }

  clearError() {
    this.error = null
  }
}
```

### 5.3 UserStore Refactoring

**File: `src/stores/UserStore.ts`**

```typescript
import { makeAutoObservable, runInAction } from 'mobx'
import { authApi } from '../api/auth.api'
import { apiClient } from '../api/client'
import { wsClient } from '../api/websocket'
import { BaseStore } from './BaseStore'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'admin' | 'sales' | 'manager'
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
    timezone: string
  }
  createdAt: Date
  lastLogin: Date
}

export class UserStore extends BaseStore {
  user: User | null = null
  isAuthenticated = false
  token: string | null = null

  constructor() {
    super()
    makeAutoObservable(this)
    this.initializeAuth()
  }

  private initializeAuth() {
    const token = localStorage.getItem('auth_token')
    if (token) {
      this.token = token
      apiClient.setToken(token)
      this.fetchCurrentUser()
    }
  }

  async login(email: string, password: string) {
    return this.executeAsync(
      async () => {
        const response = await authApi.login({ email, password })
        return response
      },
      {
        onSuccess: (data) => {
          this.user = data.user
          this.token = data.token
          this.isAuthenticated = true
          apiClient.setToken(data.token)
          wsClient.connect(data.token)
          localStorage.setItem('refresh_token', data.refreshToken)
        },
      }
    )
  }

  async logout() {
    return this.executeAsync(
      async () => {
        await authApi.logout()
      },
      {
        onSuccess: () => {
          this.user = null
          this.token = null
          this.isAuthenticated = false
          apiClient.setToken(null)
          wsClient.disconnect()
          localStorage.removeItem('auth_token')
          localStorage.removeItem('refresh_token')
        },
      }
    )
  }

  async fetchCurrentUser() {
    return this.executeAsync(
      async () => {
        const user = await authApi.getCurrentUser()
        return user
      },
      {
        onSuccess: (user) => {
          this.user = user
          this.isAuthenticated = true
          if (this.token) {
            wsClient.connect(this.token)
          }
        },
        onError: () => {
          // Token invalid, clear auth
          this.logout()
        },
        showLoading: false,
      }
    )
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      this.logout()
      return
    }

    return this.executeAsync(
      async () => {
        const response = await authApi.refreshToken(refreshToken)
        return response
      },
      {
        onSuccess: (data) => {
          this.token = data.token
          apiClient.setToken(data.token)
          localStorage.setItem('refresh_token', data.refreshToken)
        },
        onError: () => {
          this.logout()
        },
        showLoading: false,
      }
    )
  }

  updatePreferences(preferences: Partial<User['preferences']>) {
    if (this.user) {
      this.user.preferences = { ...this.user.preferences, ...preferences }
    }
  }
}
```

### 5.4 ContactsStore Refactoring

**File: `src/stores/ContactsStore.ts`**

```typescript
import { makeAutoObservable, runInAction, reaction } from 'mobx'
import { contactsApi } from '../api/contacts.api'
import { BaseStore } from './BaseStore'
import { wsClient } from '../api/websocket'
import type { Contact, CommunicationEvent, AIInsight } from '../types/contact'

export class ContactsStore extends BaseStore {
  contacts: Contact[] = []
  selectedContact: Contact | null = null
  searchQuery = ''
  filterBy: 'all' | 'high-value' | 'at-risk' | 'recent' = 'all'
  stats = {
    total: 0,
    highValue: 0,
    atRisk: 0,
    needsFollowUp: 0,
  }

  constructor() {
    super()
    makeAutoObservable(this)
    this.setupReactions()
    this.setupWebSocket()
  }

  private setupReactions() {
    // Auto-fetch when filter changes
    reaction(
      () => this.filterBy,
      () => this.fetchContacts()
    )

    // Debounced search
    let searchTimeout: NodeJS.Timeout
    reaction(
      () => this.searchQuery,
      (query) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
          this.fetchContacts()
        }, 300)
      }
    )
  }

  private setupWebSocket() {
    wsClient.on('contact:updated', (data: { id: string; changes: Partial<Contact> }) => {
      runInAction(() => {
        const contact = this.contacts.find(c => c.id === data.id)
        if (contact) {
          Object.assign(contact, data.changes)
        }
        if (this.selectedContact?.id === data.id) {
          Object.assign(this.selectedContact, data.changes)
        }
      })
    })

    wsClient.on('contact:health_changed', (data: { id: string; oldScore: number; newScore: number }) => {
      runInAction(() => {
        const contact = this.contacts.find(c => c.id === data.id)
        if (contact) {
          contact.healthScore = data.newScore
          contact.relationshipHealth = 
            data.newScore > 70 ? 'high' : data.newScore > 40 ? 'medium' : 'low'
        }
      })
    })
  }

  // Computed values
  get filteredContacts() {
    return this.contacts
      .filter(contact => {
        // Search filter
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase()
          return (
            contact.name.toLowerCase().includes(query) ||
            contact.company.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query)
          )
        }
        return true
      })
      .sort((a, b) => b.healthScore - a.healthScore)
  }

  get contactStats() {
    return this.stats
  }

  // Actions
  async fetchContacts() {
    return this.executeAsync(
      async () => {
        const contacts = await contactsApi.getContacts({
          search: this.searchQuery || undefined,
          filter: this.filterBy,
        })
        return contacts
      },
      {
        onSuccess: (contacts) => {
          this.contacts = contacts
        },
      }
    )
  }

  async fetchContactStats() {
    return this.executeAsync(
      async () => {
        const stats = await contactsApi.getStats()
        return stats
      },
      {
        onSuccess: (stats) => {
          this.stats = stats
        },
        showLoading: false,
      }
    )
  }

  async fetchContact(id: string) {
    return this.executeAsync(
      async () => {
        const contact = await contactsApi.getContact(id)
        return contact
      },
      {
        onSuccess: (contact) => {
          this.selectedContact = contact
          // Update in list if exists
          const index = this.contacts.findIndex(c => c.id === contact.id)
          if (index !== -1) {
            this.contacts[index] = contact
          }
        },
      }
    )
  }

  async createContact(data: Omit<Contact, 'id' | 'healthScore' | 'churnRisk'>) {
    return this.executeAsync(
      async () => {
        const contact = await contactsApi.createContact(data)
        return contact
      },
      {
        onSuccess: (contact) => {
          this.contacts.unshift(contact)
          this.fetchContactStats()
        },
      }
    )
  }

  async updateContact(id: string, data: Partial<Contact>) {
    return this.executeAsync(
      async () => {
        const contact = await contactsApi.updateContact(id, data)
        return contact
      },
      {
        onSuccess: (contact) => {
          const index = this.contacts.findIndex(c => c.id === id)
          if (index !== -1) {
            this.contacts[index] = contact
          }
          if (this.selectedContact?.id === id) {
            this.selectedContact = contact
          }
        },
      }
    )
  }

  async deleteContact(id: string) {
    return this.executeAsync(
      async () => {
        await contactsApi.deleteContact(id)
      },
      {
        onSuccess: () => {
          this.contacts = this.contacts.filter(c => c.id !== id)
          if (this.selectedContact?.id === id) {
            this.selectedContact = null
          }
          this.fetchContactStats()
        },
      }
    )
  }

  async addCommunication(
    contactId: string,
    data: {
      type: 'email' | 'call' | 'meeting' | 'note'
      date: Date
      subject?: string
      summary: string
    }
  ) {
    return this.executeAsync(
      async () => {
        const event = await contactsApi.addCommunication(contactId, data)
        return event
      },
      {
        onSuccess: (event) => {
          const contact = this.contacts.find(c => c.id === contactId)
          if (contact) {
            contact.communicationHistory.unshift(event)
            contact.lastContact = event.date
          }
          if (this.selectedContact?.id === contactId) {
            this.selectedContact.communicationHistory.unshift(event)
            this.selectedContact.lastContact = event.date
          }
        },
      }
    )
  }

  async fetchAIInsights(contactId: string) {
    return this.executeAsync(
      async () => {
        const insights = await contactsApi.getAIInsights(contactId)
        return insights
      },
      {
        onSuccess: (insights) => {
          const contact = this.contacts.find(c => c.id === contactId)
          if (contact) {
            contact.aiInsights = insights
          }
          if (this.selectedContact?.id === contactId) {
            this.selectedContact.aiInsights = insights
          }
        },
        showLoading: false,
      }
    )
  }

  // Local state actions
  setSearchQuery = (query: string) => {
    this.searchQuery = query
  }

  setFilter = (filter: typeof this.filterBy) => {
    this.filterBy = filter
  }

  selectContact = (contact: Contact | null) => {
    this.selectedContact = contact
  }
}
```

### 5.5 Similar Refactoring for Other Stores

Apply the same pattern to:
- **DashboardStore**: Fetch forecast, action items, summary
- **DealsStore**: CRUD operations, stage updates, activities
- **MessagesStore**: Conversations, messages, smart compose
- **CalendarStore**: Events, scheduling, outcomes

---

## 6. Component Updates

### 6.1 Loading & Error States

**Create reusable components:**

**File: `src/components/ui/LoadingSpinner.tsx`**
```typescript
export const LoadingSpinner = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} border-4 border-primary/30 border-t-primary rounded-full animate-spin`} />
    </div>
  )
}
```

**File: `src/components/ui/ErrorMessage.tsx`**
```typescript
import { AlertCircle } from 'lucide-react'

export const ErrorMessage = ({ 
  message, 
  onRetry 
}: { 
  message: string
  onRetry?: () => void 
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1">Error</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 6.2 Update Components to Handle Loading/Error

**Example: Update Contacts.tsx**

```typescript
import { observer } from 'mobx-react-lite'
import { useStore } from '../stores'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { useEffect } from 'react'

const Contacts = observer(() => {
  const { contactsStore } = useStore()

  useEffect(() => {
    contactsStore.fetchContacts()
    contactsStore.fetchContactStats()
  }, [])

  if (contactsStore.isLoading && contactsStore.contacts.length === 0) {
    return (
      <MainLayout>
        <LoadingSpinner size="lg" />
      </MainLayout>
    )
  }

  if (contactsStore.error) {
    return (
      <MainLayout>
        <ErrorMessage 
          message={contactsStore.error}
          onRetry={() => contactsStore.fetchContacts()}
        />
      </MainLayout>
    )
  }

  // ... rest of component
})
```

---

## 7. Real-time Updates

### 7.1 WebSocket Integration in RootStore

**File: `src/stores/RootStore.ts`**

```typescript
import { makeAutoObservable } from 'mobx'
import { wsClient } from '../api/websocket'
import { UserStore } from './UserStore'
import { DashboardStore } from './DashboardStore'
import { ContactsStore } from './ContactsStore'
import { DealsStore } from './DealsStore'
import { MessagesStore } from './MessagesStore'
import { CalendarStore } from './CalendarStore'
import { ThemeStore } from './ThemeStore'

export class RootStore {
  userStore: UserStore
  dashboardStore: DashboardStore
  contactsStore: ContactsStore
  dealsStore: DealsStore
  messagesStore: MessagesStore
  calendarStore: CalendarStore
  themeStore: ThemeStore

  constructor() {
    this.userStore = new UserStore()
    this.dashboardStore = new DashboardStore()
    this.contactsStore = new ContactsStore()
    this.dealsStore = new DealsStore()
    this.messagesStore = new MessagesStore()
    this.calendarStore = new CalendarStore()
    this.themeStore = new ThemeStore()
    
    makeAutoObservable(this)
    this.setupWebSocketHandlers()
  }

  private setupWebSocketHandlers() {
    // Global notification handler
    wsClient.on('notification:new', (notification) => {
      // Handle notifications globally
      console.log('New notification:', notification)
    })
  }

  async initialize() {
    // Initialize app - fetch initial data
    if (this.userStore.isAuthenticated) {
      await Promise.all([
        this.dashboardStore.fetchForecast(),
        this.dashboardStore.fetchActionItems(),
        this.contactsStore.fetchContactStats(),
        this.dealsStore.fetchDeals(),
        this.messagesStore.fetchConversations(),
        this.calendarStore.fetchEvents(),
      ])
    }
  }
}
```

### 7.2 WebSocket Event Mapping

**Backend Channels → Store Handlers:**

```typescript
// Deals
wsClient.on('deal:created', (deal) => dealsStore.handleDealCreated(deal))
wsClient.on('deal:updated', (data) => dealsStore.handleDealUpdated(data))
wsClient.on('deal:stage_changed', (data) => dealsStore.handleStageChanged(data))
wsClient.on('deal:activity_added', (data) => dealsStore.handleActivityAdded(data))

// Messages
wsClient.on('message:received', (data) => messagesStore.handleMessageReceived(data))
wsClient.on('conversation:updated', (data) => messagesStore.handleConversationUpdated(data))
wsClient.on('conversation:unread_count', (data) => messagesStore.handleUnreadCount(data))

// Calendar
wsClient.on('event:created', (event) => calendarStore.handleEventCreated(event))
wsClient.on('event:updated', (data) => calendarStore.handleEventUpdated(data))
wsClient.on('event:reminder', (data) => calendarStore.handleReminder(data))

// Contacts
wsClient.on('contact:updated', (data) => contactsStore.handleContactUpdated(data))
wsClient.on('contact:health_changed', (data) => contactsStore.handleHealthChanged(data))
```

---

## 8. Error Handling & Loading States

### 8.1 Error Handling Strategy

**Levels of Error Handling:**

1. **API Client Level**: Catch network errors, format error responses
2. **Store Level**: Handle business logic errors, update error state
3. **Component Level**: Display errors to user, provide retry options

**Error Types:**
- `UNAUTHORIZED` (401): Redirect to login
- `FORBIDDEN` (403): Show permission error
- `NOT_FOUND` (404): Show not found message
- `VALIDATION_ERROR` (422): Show field-specific errors
- `RATE_LIMIT_EXCEEDED` (429): Show rate limit message
- `AI_SERVICE_ERROR` (500): Show AI service unavailable
- Network errors: Show connection error with retry

### 8.2 Loading State Patterns

**Types of Loading States:**

1. **Initial Load**: Full-page spinner
2. **Refresh**: Small spinner in corner, keep showing old data
3. **Action Loading**: Button spinner, disable button
4. **Optimistic Update**: Update immediately, revert on error

**Implementation:**

```typescript
// In store
isLoading = false  // Global loading
isRefreshing = false  // Background refresh
actionLoading = {  // Specific action loading
  create: false,
  update: false,
  delete: false,
}

// In component
{isLoading && <LoadingSpinner />}
{isRefreshing && <RefreshIndicator />}
<button disabled={actionLoading.create}>
  {actionLoading.create ? <Spinner /> : 'Create'}
</button>
```

---

## 9. Type Safety & Validation

### 9.1 Shared Types

**File: `src/types/index.ts`**

Export all types from stores to ensure consistency between frontend and backend:

```typescript
export type { User } from '../stores/UserStore'
export type { Contact, CommunicationEvent, AIInsight } from '../stores/ContactsStore'
export type { Deal, DealStage, DealActivity, DealInsight } from '../stores/DealsStore'
// ... etc
```

### 9.2 Runtime Validation (Optional)

Consider using Zod for runtime validation:

```typescript
import { z } from 'zod'

const ContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  // ... etc
})

// In API client
const contact = ContactSchema.parse(response)
```

---

## 10. Testing Strategy

### 10.1 Store Testing

**Test Structure:**
```typescript
describe('ContactsStore', () => {
  let store: ContactsStore
  
  beforeEach(() => {
    store = new ContactsStore()
  })

  it('should fetch contacts', async () => {
    const contacts = await store.fetchContacts()
    expect(store.contacts.length).toBeGreaterThan(0)
    expect(store.isLoading).toBe(false)
  })

  it('should handle errors', async () => {
    // Mock API error
    await store.fetchContacts()
    expect(store.error).toBeTruthy()
  })

  it('should filter contacts', () => {
    store.setSearchQuery('john')
    expect(store.filteredContacts.length).toBeLessThan(store.contacts.length)
  })
})
```

### 10.2 API Client Testing

Mock fetch/axios for unit tests:

```typescript
describe('contactsApi', () => {
  it('should fetch contacts with params', async () => {
    const contacts = await contactsApi.getContacts({ filter: 'high-value' })
    expect(contacts).toBeDefined()
  })
})
```

---

## 11. Migration Path

### 11.1 Phase 1: Foundation (Week 1)

**Tasks:**
1. ✅ Create environment configuration
2. ✅ Implement API client
3. ✅ Implement WebSocket client
4. ✅ Create BaseStore
5. ✅ Create API service modules
6. ✅ Create loading/error components

**Deliverables:**
- Working API client with error handling
- WebSocket client with reconnection logic
- Base store with async helpers
- Reusable UI components

### 11.2 Phase 2: Authentication (Week 1)

**Tasks:**
1. ✅ Refactor UserStore
2. ✅ Implement login/logout
3. ✅ Implement token refresh
4. ✅ Create protected route wrapper
5. ✅ Add auth interceptor to API client

**Deliverables:**
- Working authentication flow
- Token management
- Protected routes

### 11.3 Phase 3: Core Stores (Week 2)

**Tasks:**
1. ✅ Refactor ContactsStore
2. ✅ Refactor DealsStore
3. ✅ Refactor MessagesStore
4. ✅ Refactor CalendarStore
5. ✅ Refactor DashboardStore

**Deliverables:**
- All stores connected to backend
- CRUD operations working
- Loading/error states

### 11.4 Phase 4: Real-time Updates (Week 2)

**Tasks:**
1. ✅ Integrate WebSocket in stores
2. ✅ Handle real-time events
3. ✅ Test real-time updates
4. ✅ Add connection status indicator

**Deliverables:**
- Real-time updates working
- Connection status UI
- Reconnection logic

### 11.5 Phase 5: Component Updates (Week 3)

**Tasks:**
1. ✅ Update all components to use new stores
2. ✅ Add loading states
3. ✅ Add error handling
4. ✅ Remove mock data
5. ✅ Test all user flows

**Deliverables:**
- All components updated
- No mock data remaining
- Full user flows working

### 11.6 Phase 6: Polish & Testing (Week 3)

**Tasks:**
1. ✅ Add optimistic updates
2. ✅ Add retry logic
3. ✅ Add offline detection
4. ✅ Write tests
5. ✅ Performance optimization

**Deliverables:**
- Optimistic updates
- Comprehensive error handling
- Test coverage
- Performance improvements

---

## 12. Timeline & Milestones

### Week 1: Foundation & Auth
- **Day 1-2**: Environment config, API client, WebSocket client
- **Day 3-4**: BaseStore, API services, UI components
- **Day 5**: Authentication flow

### Week 2: Store Refactoring & Real-time
- **Day 1**: ContactsStore
- **Day 2**: DealsStore
- **Day 3**: MessagesStore & CalendarStore
- **Day 4**: DashboardStore
- **Day 5**: Real-time integration

### Week 3: Component Updates & Testing
- **Day 1-2**: Update all components
- **Day 3**: Remove mock data, test flows
- **Day 4**: Optimistic updates, retry logic
- **Day 5**: Testing, polish, documentation

---

## 13. Risk Mitigation

### 13.1 Potential Risks

1. **Backend API not ready**: Use mock API server (json-server or MSW)
2. **Breaking changes**: Version API endpoints
3. **Performance issues**: Implement pagination, virtual scrolling
4. **WebSocket connection issues**: Implement fallback to polling
5. **Type mismatches**: Add runtime validation

### 13.2 Rollback Strategy

- Keep mock data in separate files
- Feature flags for API integration
- Gradual rollout per store
- Ability to switch back to mock data

---

## 14. Success Criteria

### 14.1 Functional Requirements

- ✅ All CRUD operations working
- ✅ Real-time updates functional
- ✅ Authentication flow complete
- ✅ Error handling comprehensive
- ✅ Loading states implemented
- ✅ No mock data in production

### 14.2 Non-Functional Requirements

- ✅ API response time < 500ms
- ✅ WebSocket reconnection < 5s
- ✅ Error recovery automatic
- ✅ Type safety maintained
- ✅ Code coverage > 70%

### 14.3 User Experience

- ✅ Smooth transitions
- ✅ Optimistic updates
- ✅ Clear error messages
- ✅ Loading indicators
- ✅ Offline detection

---

## 15. Documentation

### 15.1 Developer Documentation

- API client usage guide
- Store patterns guide
- WebSocket integration guide
- Error handling guide
- Testing guide

### 15.2 API Documentation

- Endpoint reference
- Request/response examples
- Error codes
- WebSocket events
- Rate limits

---

## 16. Appendix

### 16.1 MobX 6 Best Practices

**From MobX Documentation:**

1. **Use `makeAutoObservable`** for simple stores
2. **Use `runInAction`** for async updates
3. **Use `reaction`** for side effects
4. **Use `computed`** for derived values
5. **Keep actions pure** - no side effects
6. **Use `flow`** for complex async flows (generator functions)
7. **Avoid nested observables** - keep flat structure
8. **Use `observer`** HOC for all components that read observables

### 16.2 Modern MobX Patterns

**Async Actions:**
```typescript
// Option 1: runInAction
async fetchData() {
  const data = await api.getData()
  runInAction(() => {
    this.data = data
  })
}

// Option 2: flow (generator)
fetchData = flow(function* (this: Store) {
  const data = yield api.getData()
  this.data = data
})
```

**Reactions:**
```typescript
constructor() {
  makeAutoObservable(this)
  
  // React to changes
  reaction(
    () => this.filterBy,
    () => this.fetchData()
  )
}
```

**Computed Values:**
```typescript
get filteredData() {
  return this.data.filter(item => 
    item.name.includes(this.searchQuery)
  )
}
```

### 16.3 Resources

- [MobX 6 Documentation](https://mobx.js.org/)
- [MobX API Reference](https://mobx.js.org/api.html)
- [MobX React Integration](https://mobx.js.org/react-integration.html)
- [MobX Best Practices](https://mobx.js.org/best-practices.html)

---

## Conclusion

This refactoring plan provides a comprehensive roadmap for integrating the Flow CRM frontend with the backend API using modern MobX 6 patterns. The phased approach ensures minimal disruption while maintaining code quality and type safety throughout the migration.

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Regular check-ins and progress reviews

---

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Author:** AI Assistant  
**Status:** Ready for Review

