import { createContext, useContext } from 'react'
import { RootStore } from './RootStore'

export const rootStore = new RootStore()

export const StoreContext = createContext(rootStore)

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
