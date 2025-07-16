import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebaseConfig'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'startup' | 'admin'
  emailVerified: boolean
  lastLogin: string
  photoURL?: string
  cnpj?: string
  phone?: string
  document_config_id?: string
}

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async (): Promise<AuthUser> => {
  try {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Firebase não está configurado. Por favor, configure as variáveis de ambiente no arquivo .env e reinicie o servidor.')
    }
    
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    let userData: AuthUser
    
    if (userDoc.exists()) {
      // Update last login
      userData = userDoc.data() as AuthUser
      await updateDoc(doc(db, 'users', user.uid), {
        lastLogin: new Date().toISOString(),
        photoURL: user.photoURL
      })
    } else {
      // Create new user document
      const isAdmin = user.email === import.meta.env.VITE_ADMIN_EMAIL
      userData = {
        id: user.uid,
        email: user.email!,
        name: user.displayName || user.email!.split('@')[0],
        role: isAdmin ? 'admin' : 'startup',
        emailVerified: user.emailVerified,
        lastLogin: new Date().toISOString(),
        photoURL: user.photoURL || undefined
      }
      
      await setDoc(doc(db, 'users', user.uid), userData)
    }
    
    return userData
  } catch (error: any) {
    console.error('Error signing in with Google:', error)
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Pop-up bloqueado pelo navegador. Permita pop-ups para este site.')
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Login cancelado pelo usuário.')
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Solicitação de login cancelada.')
    } else if (error.code === 'auth/api-key-not-valid') {
      throw new Error('Configuração Firebase inválida. Verifique as credenciais.')
    } else {
      throw new Error('Erro ao fazer login com Google: ' + error.message)
    }
  }
}

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  userData: Partial<AuthUser>
): Promise<AuthUser> => {
  try {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Firebase não está configurado. Por favor, configure as variáveis de ambiente no arquivo .env e reinicie o servidor.')
    }
    
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const user = result.user
    
    const newUserData: AuthUser = {
      id: user.uid,
      email: user.email!,
      name: userData.name || user.email!.split('@')[0],
      role: 'startup',
      emailVerified: user.emailVerified,
      lastLogin: new Date().toISOString(),
      cnpj: userData.cnpj,
      phone: userData.phone,
      document_config_id: 'default' // Default document configuration
    }
    
    await setDoc(doc(db, 'users', user.uid), newUserData)
    
    return newUserData
  } catch (error: any) {
    console.error('Error signing up:', error)
    throw new Error('Erro ao criar conta: ' + error.message)
  }
}

export const signInWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  try {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error('Firebase não está configurado. Por favor, configure as variáveis de ambiente no arquivo .env e reinicie o servidor.')
    }
    
    const result = await signInWithEmailAndPassword(auth, email, password)
    const user = result.user
    
    const userDoc = await getDoc(doc(db, 'users', user.uid))
    
    if (!userDoc.exists()) {
      throw new Error('Dados do usuário não encontrados')
    }
    
    const userData = userDoc.data() as AuthUser
    
    // Update last login
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date().toISOString()
    })
    
    return userData
  } catch (error: any) {
    console.error('Error signing in:', error)
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/api-key-not-valid') {
      throw new Error('Configuração Firebase inválida. Verifique as credenciais no arquivo .env')
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('Usuário não encontrado')
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Senha incorreta')
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Email inválido')
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('Conta desabilitada')
    } else {
      throw new Error('Erro ao fazer login: ' + error.message)
    }
  }
}

export const signOut = async (): Promise<void> => {
  try {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase não está configurado. Por favor, configure as variáveis de ambiente no arquivo .env e reinicie o servidor.')
    }
    await firebaseSignOut(auth)
  } catch (error: any) {
    console.error('Error signing out:', error)
    throw new Error('Erro ao fazer logout: ' + error.message)
  }
}

export const getCurrentUser = (): Promise<AuthUser | null> => {
  return new Promise((resolve) => {
    if (!auth || !db) {
      resolve(null)
      return
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      unsubscribe()
      
      if (!user) {
        resolve(null)
        return
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        
        if (userDoc.exists()) {
          resolve(userDoc.data() as AuthUser)
        } else {
          resolve(null)
        }
      } catch (error) {
        console.error('Error getting current user:', error)
        resolve(null)
      }
    })
  })
}

export const updateUserProfile = async (userId: string, updates: Partial<AuthUser>): Promise<void> => {
  try {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase não está configurado. Por favor, configure as variáveis de ambiente no arquivo .env e reinicie o servidor.')
    }
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      lastLogin: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    throw new Error('Erro ao atualizar perfil: ' + error.message)
  }
}

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  try {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase não está configurado. Por favor, configure as variáveis de ambiente no arquivo .env e reinicie o servidor.')
    }
    const user = auth.currentUser
    if (!user || !user.email) {
      throw new Error('Usuário não autenticado')
    }
    
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    
    // Update password
    await updatePassword(user, newPassword)
  } catch (error: any) {
    console.error('Error changing password:', error)
    if (error.code === 'auth/wrong-password') {
      throw new Error('Senha atual incorreta')
    }
    throw new Error('Erro ao alterar senha: ' + error.message)
  }
}

export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    if (!isFirebaseConfigured || !db) {
      return false
    }
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const userData = userDoc.data() as AuthUser
      return userData.role === 'admin'
    }
    return false
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}