import { observer } from 'mobx-react-lite'
import MainLayout from '../components/layout/MainLayout'
import AIForecastCard from '../components/dashboard/AIForecastCard'
import SmartActionFeed from '../components/dashboard/SmartActionFeed'

const Dashboard = observer(() => {

  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Command Center</h1>
        <p className="text-slate-400 mb-8">AI-powered insights and recommendations</p>

        <div className="space-y-6">
          <AIForecastCard />
          <SmartActionFeed />
        </div>
      </div>
    </MainLayout>
  )
})

export default Dashboard