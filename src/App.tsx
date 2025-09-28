import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { StoreContext, rootStore } from './stores'
import HelloWorld from './pages/HelloWorld'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Deals from './pages/Deals'
import Messages from './pages/Messages'
import Calendar from './pages/Calendar'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/dashboard',
    element: <Dashboard />
  },
  {
    path: '/contacts',
    element: <Contacts />
  },
  {
    path: '/deals',
    element: <Deals />
  },
  {
    path: '/messages',
    element: <Messages />
  },
  {
    path: '/calendar',
    element: <Calendar />
  },
  {
    path: '/hello',
    element: <HelloWorld />
  }
])

function App() {
  return (
    <StoreContext.Provider value={rootStore}>
      <RouterProvider router={router} />
    </StoreContext.Provider>
  )
}

export default App
