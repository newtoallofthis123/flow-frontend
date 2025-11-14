import { makeAutoObservable, reaction } from 'mobx'
import { wsClient } from '../api/websocket'
import { UserStore } from './UserStore'
import { DashboardStore } from './DashboardStore'
import { ContactsStore } from './ContactsStore'
import { DealsStore } from './DealsStore'
import { MessagesStore } from './MessagesStore'
import { CalendarStore } from './CalendarStore'
import { ThemeStore } from './ThemeStore'
import { UIStore } from './UIStore'

export class RootStore {
  userStore: UserStore
  dashboardStore: DashboardStore
  contactsStore: ContactsStore
  dealsStore: DealsStore
  messagesStore: MessagesStore
  calendarStore: CalendarStore
  themeStore: ThemeStore
  uiStore: UIStore
  
  currentRoute: string = '/'
  routeParams: Record<string, string> = {}

  private _initialized = false

  constructor() {
    this.userStore = new UserStore()
    this.dashboardStore = new DashboardStore()
    this.contactsStore = new ContactsStore()
    this.dealsStore = new DealsStore()
    this.messagesStore = new MessagesStore()
    this.calendarStore = new CalendarStore()
    this.themeStore = new ThemeStore()
    this.uiStore = new UIStore()
    makeAutoObservable(this)
    this.setupWebSocketHandlers()
    this.setupRouteReactions()
  }

  private setupWebSocketHandlers() {
    // Global notification handler
    wsClient.on('notification:new', (notification) => {
      // Handle notifications globally
      console.log('New notification:', notification)
    })
  }

  private setupRouteReactions() {
    // React to route changes and initialize appropriate stores
    reaction(
      () => this.currentRoute,
      (route) => {
        if (!this.userStore.isAuthenticated) return

        // Initialize stores based on route
        if (route.startsWith('/dashboard')) {
          this.dashboardStore.initialize()
        } else if (route.startsWith('/contacts')) {
          this.contactsStore.initialize()
          // Fetch specific contact if ID is present
          const contactId = this.routeParams.id
          if (contactId && contactId !== this.contactsStore.selectedContact?.id) {
            this.contactsStore.fetchContact(contactId)
          }
        } else if (route.startsWith('/deals')) {
          this.dealsStore.initialize()
          // Fetch specific deal if ID is present
          const dealId = this.routeParams.id
          if (dealId && dealId !== this.dealsStore.selectedDeal?.id) {
            this.dealsStore.fetchDeal(dealId)
          }
        } else if (route.startsWith('/messages')) {
          // Initialize both messages and contacts (conversations need contact info)
          Promise.all([
            this.messagesStore.initialize(),
            this.contactsStore.initialize(),
          ])
          // Fetch specific conversation if ID is present
          const conversationId = this.routeParams.id
          if (conversationId && conversationId !== this.messagesStore.selectedConversation?.id) {
            this.messagesStore.fetchConversation(conversationId)
          }
        } else if (route.startsWith('/calendar')) {
          this.calendarStore.initialize()
          // Fetch specific event if ID is present
          const eventId = this.routeParams.id
          if (eventId && eventId !== this.calendarStore.selectedEvent?.id) {
            this.calendarStore.fetchEvent(eventId)
          }
        }
      }
    )
  }

  setRoute(path: string, params: Record<string, string> = {}) {
    this.currentRoute = path
    this.routeParams = params
  }

  async initialize() {
    if (this._initialized) return
    this._initialized = true

    // Wait for user authentication to be checked
    await this.userStore.checkAuth()

    // Initialize dashboard by default if authenticated
    if (this.userStore.isAuthenticated) {
      await this.dashboardStore.initialize()
    }
  }
}