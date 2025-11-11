import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { useStore } from '../stores'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorMessage } from '../components/ui/ErrorMessage'
import { LogIn, Mail, Lock } from 'lucide-react'

const Login = observer(() => {
  const { userStore } = useStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Redirect if already authenticated
    if (userStore.isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [userStore.isAuthenticated, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await userStore.login(email, password)
    if (result && userStore.isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }

  // Don't render if already authenticated (will redirect via useEffect)
  if (userStore.isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Sign in to your account to continue
          </p>

          {userStore.error && (
            <div className="mb-6">
              <ErrorMessage message={userStore.error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-secondary text-foreground pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-colors"
                  placeholder="you@example.com"
                  disabled={userStore.isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-secondary text-foreground pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-colors"
                  placeholder="Enter your password"
                  disabled={userStore.isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={userStore.isLoading}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {userStore.isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
})

export default Login

