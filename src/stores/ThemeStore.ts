import { makeAutoObservable, reaction } from 'mobx'

export type Theme = 'light' | 'dark'

export class ThemeStore {
  theme: Theme = 'dark'

  constructor() {
    makeAutoObservable(this)
    this.initializeTheme()

    // Sync theme changes to DOM
    reaction(
      () => this.theme,
      (theme) => {
        this.applyTheme(theme)
        localStorage.setItem('theme', theme)
      }
    )
  }

  private initializeTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      this.theme = savedTheme
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      this.theme = prefersDark ? 'dark' : 'light'
    }
    this.applyTheme(this.theme)
  }

  private applyTheme(theme: Theme) {
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light'
  }

  setTheme(theme: Theme) {
    this.theme = theme
  }
}

