import React, { useState } from 'react'
import { Chrome } from 'lucide-react'
import Button from '../ui/Button'

interface GoogleLoginButtonProps {
  onSuccess: () => void
  onError: (error: string) => void
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const { signInWithGoogle } = await import('../../lib/firebaseAuth')
      await signInWithGoogle()
      onSuccess()
    } catch (error: any) {
      console.error('Google login error:', error)
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/popup-blocked') {
        onError('Pop-up bloqueado pelo navegador. Por favor, permita pop-ups para este site e tente novamente.')
      } else if (error.code === 'auth/popup-closed-by-user') {
        onError('Login cancelado. Por favor, tente novamente.')
      } else if (error.code === 'auth/cancelled-popup-request') {
        onError('Solicitação de login cancelada. Tente novamente.')
      } else {
        onError(error.message || 'Erro ao fazer login com Google')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGoogleLogin}
      loading={loading}
      variant="secondary"
      className="w-full flex items-center justify-center space-x-2 border-2 border-gray-300 hover:border-gray-400"
    >
      <Chrome className="h-5 w-5 text-blue-500" />
      <span>{loading ? 'Entrando...' : 'Entrar com Google'}</span>
    </Button>
  )
}

export default GoogleLoginButton