import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { useStore } from '../../stores'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = observer(({ children }: ProtectedRouteProps) => {
  const { userStore } = useStore()
  const location = useLocation()

  useEffect(() => {
    // If not authenticated and we have a token, try to fetch current user
    if (!userStore.isAuthenticated && userStore.token && !userStore.isLoading) {
      userStore.fetchCurrentUser()
    }
  }, [userStore])

  // Show loading while checking authentication (if we have a token)
  // This prevents redirecting to login before auth check completes
  if (userStore.token && !userStore.isAuthenticated && userStore.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated (after auth check is complete or no token)
  if (!userStore.isAuthenticated && (!userStore.token || (!userStore.isLoading && userStore.token))) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Render children if authenticated
  return <>{children}</>
})

export default ProtectedRoute

