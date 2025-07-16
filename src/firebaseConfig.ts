import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Validate Firebase configuration
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName])

if (missingVars.length > 0) {
  console.error('Missing Firebase environment variables:', missingVars)
  console.error('Please check your .env file and ensure all Firebase variables are set correctly.')
}

// Firebase configuration - only initialize if all variables are present
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}
console.log('Firebase config:', firebaseConfig);


// Check if all required variables are present
const hasAllRequiredVars = missingVars.length === 0
const isFirebaseConfigured = hasAllRequiredVars && Object.values(firebaseConfig).every(value => value && value.trim() !== '')

if (!isFirebaseConfigured) {
  console.warn('🚨 FIREBASE NOT CONFIGURED')
  console.warn('Firebase configuration is incomplete or missing.')
  console.warn('To use real Firebase:')
  console.warn('1. Create a .env file in the project root')
  console.warn('2. Add your Firebase credentials (see .env.example)')
  console.warn('3. Restart the development server')
}

// Initialize Firebase
let app
try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig)
  } else {
    app = null
  }
} catch (error) {
  console.error('Failed to initialize Firebase:', error)
  app = null
}

// Initialize Firebase services
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null
export { isFirebaseConfigured }

export default app