import { makeAutoObservable } from 'mobx'
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
  }
}