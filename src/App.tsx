import React, { useState, useEffect } from 'react'
import { getCurrentUser, isAdmin } from './lib/firebaseAuth'
import ErrorBoundary from './components/ui/ErrorBoundary'
import ToastContainer from './components/ui/ToastContainer'
import LoadingSpinner from './components/ui/LoadingSpinner'
import EnhancedLoginForm from './components/auth/EnhancedLoginForm'
import EnhancedRegisterForm from './components/auth/EnhancedRegisterForm'
import EnhancedStartupDashboard from './components/startup/EnhancedStartupDashboard'
import EnhancedAdminDashboard from './components/admin/EnhancedAdminDashboard'

function App() {
  const [user, setUser] = useState<any>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(true)  
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        const adminStatus = await isAdmin(currentUser.id)
        setIsAdminUser(adminStatus)
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = async () => {
    setTimeout(async () => {
      await checkUser()
    }, 100)
  }

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('./lib/firebaseAuth')
      await signOut()
      setUser(null)
      setIsAdminUser(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Inicializando sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {!user ? (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            {showLogin ? (
              <EnhancedLoginForm
                onSuccess={handleAuthSuccess}
                onToggleForm={() => setShowLogin(false)}
              />
            ) : (
              <EnhancedRegisterForm
                onSuccess={handleAuthSuccess}
                onToggleForm={() => setShowLogin(true)}
              />
            )}
          </div>
        ) : isAdminUser ? (
          <EnhancedAdminDashboard user={user} onSignOut={handleSignOut} />
        ) : (
          <EnhancedStartupDashboard user={user} onSignOut={handleSignOut} />
        )}
      </div>
      <ToastContainer />
    </ErrorBoundary>
  )
}

export default App