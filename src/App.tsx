import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, useLocation, useParams } from 'react-router-dom'
import { StoreContext, rootStore } from './stores'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import HelloWorld from './pages/HelloWorld'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Deals from './pages/Deals'
import Messages from './pages/Messages'
import Calendar from './pages/Calendar'

// Component to sync route changes with RootStore
const RouteSync = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const params = useParams()

  useEffect(() => {
    // Filter out undefined values from params
    const cleanParams: Record<string, string> = {}
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanParams[key] = value
      }
    })
    rootStore.setRoute(location.pathname, cleanParams)
  }, [location.pathname, params])

  return <>{children}</>
}

const RootRedirect = () => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/login" replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <Dashboard />
        </RouteSync>
      </ProtectedRoute>
    )
  },
  {
    path: '/contacts',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <Contacts />
        </RouteSync>
      </ProtectedRoute>
    )
  },
  {
    path: '/contacts/:id',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <Contacts />
        </RouteSync>
      </ProtectedRoute>
    )
  },
  {
    path: '/deals',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <Deals />
        </RouteSync>
      </ProtectedRoute>
    )
  },
  {
    path: '/deals/:id',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <Deals />
        </RouteSync>
      </ProtectedRoute>
    )
  },
  {
    path: '/messages',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <Messages />
        </RouteSync>
      </ProtectedRoute>
    )
  },
  {
    path: '/messages/:id',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <Messages />
        </RouteSync>
      </ProtectedRoute>
    )
  },
  {
    path: '/calendar',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <Calendar />
        </RouteSync>
      </ProtectedRoute>
    )
  },
  {
    path: '/calendar/:id',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <Calendar />
        </RouteSync>
      </ProtectedRoute>
    )
  },
  {
    path: '/hello',
    element: (
      <ProtectedRoute>
        <HelloWorld />
      </ProtectedRoute>
    )
  }
])

function App() {
  useEffect(() => {
    // Initialize the root store when app starts
    rootStore.initialize()
  }, [])

  return (
    <StoreContext.Provider value={rootStore}>
      <RouterProvider router={router} />
    </StoreContext.Provider>
  )
}

export default App
