import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import AICopilot from './AICopilot'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-950">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <AICopilot />
      </div>
    </div>
  )
}

export default MainLayout