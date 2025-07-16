// Enhanced authentication system with better security and session management
import { mockApi } from './mockData'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'startup' | 'admin'
  emailVerified: boolean
  lastLogin: string
  sessionExpiry: string
}

export interface AuthSession {
  user: AuthUser
  token: string
  expiresAt: string
}

// Session management
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const SESSION_KEY = 'auth_session'

export const signUp = async (email: string, password: string, userData: any) => {
  // Enhanced validation
  if (!isValidEmail(email)) {
    throw new Error('Email inválido')
  }
  
  // Simplified password validation for better UX
  if (password.length < 6) {
    throw new Error('Senha deve ter pelo menos 6 caracteres')
  }

  const result = await mockApi.signUp(email, password, userData)
  
  // Create session
  const session = createSession(result.user)
  saveSession(session)
  
  // Send welcome notification (mock)
  await sendWelcomeEmail(email, userData.name)
  
  return result
}

export const signIn = async (email: string, password: string) => {
  const result = await mockApi.signIn(email, password)
  
  // Update last login
  await mockApi.updateUserLastLogin(result.user.id)
  
  // Create session
  const session = createSession(result.user)
  saveSession(session)
  
  return result
}

export const signOut = async () => {
  clearSession()
  await mockApi.signOut()
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const session = getSession()
  if (!session || isSessionExpired(session)) {
    clearSession()
    return null
  }
  
  // Refresh session if needed
  if (shouldRefreshSession(session)) {
    const refreshedSession = await refreshSession(session)
    saveSession(refreshedSession)
    return refreshedSession.user
  }
  
  return session.user
}

export const isAdmin = async (userId: string) => {
  const admin = await mockApi.isAdmin(userId)
  return !!admin // Garantir que retorna boolean
}

export const requestPasswordReset = async (email: string) => {
  // Mock password reset
  console.log('Password reset requested for:', email)
  
  // In real implementation, send email with reset link
  const resetToken = generateResetToken()
  await mockApi.savePasswordResetToken(email, resetToken)
  
  return { success: true, message: 'Email de recuperação enviado!' }
}

export const resetPassword = async (token: string, newPassword: string) => {
  if (newPassword.length < 6) {
    throw new Error('Senha deve ter pelo menos 6 caracteres')
  }
  
  const isValidToken = await mockApi.validateResetToken(token)
  if (!isValidToken) {
    throw new Error('Token inválido ou expirado')
  }
  
  await mockApi.updatePassword(token, newPassword)
  return { success: true, message: 'Senha alterada com sucesso!' }
}

export const verifyEmail = async (token: string) => {
  const result = await mockApi.verifyEmail(token)
  return result
}

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuário não autenticado')
  
  const isValid = await mockApi.validateCurrentPassword(user.id, currentPassword)
  if (!isValid) throw new Error('Senha atual incorreta')
  
  if (newPassword.length < 6) {
    throw new Error('Nova senha deve ter pelo menos 6 caracteres')
  }
  
  await mockApi.updateUserPassword(user.id, newPassword)
  return { success: true, message: 'Senha alterada com sucesso!' }
}

// Helper functions
const createSession = (user: any): AuthSession => {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_DURATION)
  
  return {
    user: {
      ...user,
      emailVerified: user.emailVerified || false,
      lastLogin: now.toISOString(),
      sessionExpiry: expiresAt.toISOString()
    },
    token: generateSessionToken(),
    expiresAt: expiresAt.toISOString()
  }
}

const saveSession = (session: AuthSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

const getSession = (): AuthSession | null => {
  try {
    const sessionData = localStorage.getItem(SESSION_KEY)
    return sessionData ? JSON.parse(sessionData) : null
  } catch {
    return null
  }
}

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY)
}

const isSessionExpired = (session: AuthSession): boolean => {
  return new Date() > new Date(session.expiresAt)
}

const shouldRefreshSession = (session: AuthSession): boolean => {
  const now = new Date()
  const expiresAt = new Date(session.expiresAt)
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()
  const refreshThreshold = 2 * 60 * 60 * 1000 // 2 hours
  
  return timeUntilExpiry < refreshThreshold
}

const refreshSession = async (session: AuthSession): Promise<AuthSession> => {
  // In real implementation, validate with server
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION)
  
  return {
    ...session,
    expiresAt: newExpiresAt.toISOString(),
    token: generateSessionToken()
  }
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}


const generateSessionToken = (): string => {
  return Math.random().toString(36).substr(2) + Date.now().toString(36)
}

const generateResetToken = (): string => {
  return Math.random().toString(36).substr(2, 15)
}

const sendWelcomeEmail = async (email: string, name: string) => {
  // Mock email sending
  console.log(`Welcome email sent to ${email} for ${name}`)
}