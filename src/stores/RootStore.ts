import { makeAutoObservable } from 'mobx'
import { UserStore } from './UserStore'
import { DashboardStore } from './DashboardStore'

export class RootStore {
  userStore: UserStore
  dashboardStore: DashboardStore

  constructor() {
    this.userStore = new UserStore()
    this.dashboardStore = new DashboardStore()
    makeAutoObservable(this)
  }
}