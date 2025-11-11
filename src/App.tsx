import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { StoreContext, rootStore } from './stores'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/Login'
import HelloWorld from './pages/HelloWorld'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Deals from './pages/Deals'
import Messages from './pages/Messages'
import Calendar from './pages/Calendar'

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
        <Dashboard />
      </ProtectedRoute>
    )
  },
  {
    path: '/contacts',
    element: (
      <ProtectedRoute>
        <Contacts />
      </ProtectedRoute>
    )
  },
  {
    path: '/contacts/:id',
    element: (
      <ProtectedRoute>
        <Contacts />
      </ProtectedRoute>
    )
  },
  {
    path: '/deals',
    element: (
      <ProtectedRoute>
        <Deals />
      </ProtectedRoute>
    )
  },
  {
    path: '/deals/:id',
    element: (
      <ProtectedRoute>
        <Deals />
      </ProtectedRoute>
    )
  },
  {
    path: '/messages',
    element: (
      <ProtectedRoute>
        <Messages />
      </ProtectedRoute>
    )
  },
  {
    path: '/messages/:id',
    element: (
      <ProtectedRoute>
        <Messages />
      </ProtectedRoute>
    )
  },
  {
    path: '/calendar',
    element: (
      <ProtectedRoute>
        <Calendar />
      </ProtectedRoute>
    )
  },
  {
    path: '/calendar/:id',
    element: (
      <ProtectedRoute>
        <Calendar />
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
  return (
    <StoreContext.Provider value={rootStore}>
      <RouterProvider router={router} />
    </StoreContext.Provider>
  )
}

export default App
