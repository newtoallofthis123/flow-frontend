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
        this.dealsStore.fetchForecast(),
        this.dealsStore.fetchStageStats(),
        // Add other initial fetches as needed
      ])
    }
  }
}