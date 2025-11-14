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
import SearchResults from './pages/SearchResults'

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
  const location = useLocation()
  const token = localStorage.getItem('auth_token')
  
  // Only redirect if we're actually on the root path
  // This preserves the current route on page refresh
  if (location.pathname === '/') {
    if (token) {
      return <Navigate to="/dashboard" replace />
    }
    return <Navigate to="/login" replace />
  }
  
  // If we're not on root, don't redirect (shouldn't happen, but safe guard)
  return null
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
    path: '/search',
    element: (
      <ProtectedRoute>
        <RouteSync>
          <SearchResults />
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
