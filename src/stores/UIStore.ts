import { makeAutoObservable, reaction } from 'mobx'

export const SIDEBAR_MIN_WIDTH = 200
export const SIDEBAR_MAX_WIDTH = 400
export const SIDEBAR_DEFAULT_WIDTH = 256

export const AI_COPILOT_MIN_WIDTH = 280
export const AI_COPILOT_MAX_WIDTH = 640
export const AI_COPILOT_DEFAULT_WIDTH = 320

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

export class UIStore {
  sidebarCollapsed = false
  aiCopilotCollapsed = false
  sidebarWidth = SIDEBAR_DEFAULT_WIDTH
  aiCopilotWidth = AI_COPILOT_DEFAULT_WIDTH

  constructor() {
    makeAutoObservable(this)
    this.initializeState()

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

    reaction(
      () => this.sidebarWidth,
      (width) => {
        localStorage.setItem('sidebarWidth', String(width))
      }
    )

    reaction(
      () => this.aiCopilotWidth,
      (width) => {
        localStorage.setItem('aiCopilotWidth', String(width))
      }
    )
  }

  private initializeState() {
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed')
    const aiCopilotCollapsed = localStorage.getItem('aiCopilotCollapsed')
    const sidebarWidth = localStorage.getItem('sidebarWidth')
    const aiCopilotWidth = localStorage.getItem('aiCopilotWidth')

    if (sidebarCollapsed !== null) {
      this.sidebarCollapsed = sidebarCollapsed === 'true'
    }

    if (aiCopilotCollapsed !== null) {
      this.aiCopilotCollapsed = aiCopilotCollapsed === 'true'
    }

    if (sidebarWidth !== null) {
      const parsed = parseInt(sidebarWidth, 10)
      if (!Number.isNaN(parsed)) {
        this.sidebarWidth = clamp(parsed, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH)
      }
    }

    if (aiCopilotWidth !== null) {
      const parsed = parseInt(aiCopilotWidth, 10)
      if (!Number.isNaN(parsed)) {
        this.aiCopilotWidth = clamp(parsed, AI_COPILOT_MIN_WIDTH, AI_COPILOT_MAX_WIDTH)
      }
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

  setSidebarWidth(width: number) {
    this.sidebarWidth = clamp(width, SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH)
  }

  setAICopilotWidth(width: number) {
    this.aiCopilotWidth = clamp(width, AI_COPILOT_MIN_WIDTH, AI_COPILOT_MAX_WIDTH)
  }
}

