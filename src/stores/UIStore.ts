import { makeAutoObservable, reaction } from 'mobx'

export class UIStore {
  sidebarCollapsed = false
  aiCopilotCollapsed = false

  constructor() {
    makeAutoObservable(this)
    this.initializeState()

    // Persist state changes to localStorage
    reaction(
      () => this.sidebarCollapsed,
      (collapsed) => {
        localStorage.setItem('sidebarCollapsed', String(collapsed))
      }
    )

    reaction(
      () => this.aiCopilotCollapsed,
      (collapsed) => {
        localStorage.setItem('aiCopilotCollapsed', String(collapsed))
      }
    )
  }

  private initializeState() {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed')
    const aiCopilotCollapsed = localStorage.getItem('aiCopilotCollapsed')
    
    if (sidebarCollapsed !== null) {
      this.sidebarCollapsed = sidebarCollapsed === 'true'
    }
    
    if (aiCopilotCollapsed !== null) {
      this.aiCopilotCollapsed = aiCopilotCollapsed === 'true'
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed
  }

  toggleAICopilot() {
    this.aiCopilotCollapsed = !this.aiCopilotCollapsed
  }

  setSidebarCollapsed(collapsed: boolean) {
    this.sidebarCollapsed = collapsed
  }

  setAICopilotCollapsed(collapsed: boolean) {
    this.aiCopilotCollapsed = collapsed
  }
}

