import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { StoreContext, rootStore } from './stores'
import HelloWorld from './pages/HelloWorld'
import Dashboard from './pages/Dashboard'

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
