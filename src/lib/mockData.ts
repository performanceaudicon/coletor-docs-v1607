// Mock data and local storage utilities
export interface Startup {
  id: string
  email: string
  name: string
  cnpj: string
  phone: string
  created_at: string
  updated_at: string
  status: 'pending' | 'in_progress' | 'completed' | 'under_review'
  last_activity: string
  completion_date: string | null
  deadline: string | null
  whatsapp_group_id: string | null
}

export interface Document {
  id: string
  startup_id: string
  category: string
  name: string
  file_url: string
  file_size: number
  file_type: string
  uploaded_at: string
  status: 'pending' | 'uploaded' | 'verified' | 'rejected'
  required: boolean
  is_extra: boolean
}

export interface Notification {
  id: string
  startup_id: string
  type: 'reminder' | 'completion' | 'welcome' | 'follow_up'
  message: string
  sent_at: string
  status: 'pending' | 'sent' | 'failed'
  whatsapp_message_id: string | null
}

export interface WhatsAppGroup {
  id: string
  name: string
  isGroup: boolean
  participants?: number
}

export interface Admin {
  id: string
  email: string
  name: string
  created_at: string
  role: 'admin' | 'super_admin'
  phone: string
}

// Local storage keys
const STORAGE_KEYS = {
  CURRENT_USER: 'current_user',
  STARTUPS: 'startups',
  DOCUMENTS: 'documents',
  NOTIFICATIONS: 'notifications',
  ADMINS: 'admins',
  WHATSAPP_GROUPS: 'whatsapp_groups'
}

// Mock admin user
const mockAdmin: Admin = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Administrator',
  created_at: new Date().toISOString(),
  role: 'admin',
  phone: '+5511999999999'
}

// Mock WhatsApp groups
const mockGroups: WhatsAppGroup[] = [
  {
    id: '120363043965842108@g.us',
    name: 'Startups - Documentos Pendentes',
    isGroup: true,
    participants: 15
  },
  {
    id: '120363028374829384@g.us', 
    name: 'Equipe Administrativa',
    isGroup: true,
    participants: 8
  },
  {
    id: '120363019283746592@g.us',
    name: 'Notificações Gerais',
    isGroup: true,
    participants: 25
  }
]

// Initialize mock data
export const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ADMINS)) {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify([mockAdmin]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.STARTUPS)) {
    localStorage.setItem(STORAGE_KEYS.STARTUPS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]))
  }
  if (!localStorage.getItem(STORAGE_KEYS.WHATSAPP_GROUPS)) {
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_GROUPS, JSON.stringify(mockGroups))
  }
}

// Local storage utilities
export const getFromStorage = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveToStorage = <T>(key: string, data: T[]): void => {
  localStorage.setItem(key, JSON.stringify(data))
}

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9)
}

// Mock API functions
export const mockApi = {
  // Auth functions
  signUp: async (email: string, password: string, userData: Partial<Startup>) => {
    const startups = getFromStorage<Startup>(STORAGE_KEYS.STARTUPS)
    
    if (startups.find(s => s.email === email)) {
      throw new Error('Email já cadastrado')
    }

    const newStartup: Startup = {
      id: generateId(),
      email,
      name: userData.name || '',
      cnpj: userData.cnpj || '',
      phone: userData.phone || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      last_activity: new Date().toISOString(),
      completion_date: null,
      deadline: null,
      whatsapp_group_id: null
    }

    startups.push(newStartup)
    saveToStorage(STORAGE_KEYS.STARTUPS, startups)
    
    return { user: newStartup }
  },

  signIn: async (email: string, password: string) => {
    const startups = getFromStorage<Startup>(STORAGE_KEYS.STARTUPS)
    const admins = getFromStorage<Admin>(STORAGE_KEYS.ADMINS)
    
    const startup = startups.find(s => s.email === email)
    const admin = admins.find(a => a.email === email)
    
    if (!startup && !admin) {
      throw new Error('Usuário não encontrado')
    }

    const user = startup || admin
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
    
    return { user }
  },

  signOut: async () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
  },

  getCurrentUser: async () => {
    const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
    return userData ? JSON.parse(userData) : null
  },

  isAdmin: async (userId: string) => {
    const admins = getFromStorage<Admin>(STORAGE_KEYS.ADMINS)
    const admin = admins.find(a => a.id === userId)
    return admin || null
  },

  // Startup functions
  getStartup: async (id: string) => {
    const startups = getFromStorage<Startup>(STORAGE_KEYS.STARTUPS)
    return startups.find(s => s.id === id)
  },

  updateStartup: async (id: string, updates: Partial<Startup>) => {
    const startups = getFromStorage<Startup>(STORAGE_KEYS.STARTUPS)
    const index = startups.findIndex(s => s.id === id)
    
    if (index !== -1) {
      startups[index] = { ...startups[index], ...updates, updated_at: new Date().toISOString() }
      saveToStorage(STORAGE_KEYS.STARTUPS, startups)
      return startups[index]
    }
    
    throw new Error('Startup não encontrada')
  },

  updateAdmin: async (id: string, updates: Partial<Admin>) => {
    const admins = getFromStorage<Admin>(STORAGE_KEYS.ADMINS)
    const index = admins.findIndex(a => a.id === id)
    
    if (index !== -1) {
      admins[index] = { ...admins[index], ...updates }
      saveToStorage(STORAGE_KEYS.ADMINS, admins)
      return admins[index]
    }
    
    throw new Error('Admin não encontrado')
  },

  getAllStartups: async () => {
    return getFromStorage<Startup>(STORAGE_KEYS.STARTUPS)
  },

  // Document functions
  getDocuments: async (startupId: string) => {
    const documents = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS)
    return documents.filter(d => d.startup_id === startupId)
  },

  getAllDocuments: async () => {
    return getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS)
  },

  uploadDocument: async (document: Omit<Document, 'id' | 'uploaded_at'>) => {
    const documents = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS)
    
    // Remove existing document with same category and name
    const filteredDocs = documents.filter(d => 
      !(d.startup_id === document.startup_id && d.category === document.category && d.name === document.name)
    )
    
    const newDocument: Document = {
      ...document,
      id: generateId(),
      uploaded_at: new Date().toISOString()
    }
    
    filteredDocs.push(newDocument)
    saveToStorage(STORAGE_KEYS.DOCUMENTS, filteredDocs)
    
    return newDocument
  },

  deleteDocument: async (startupId: string, category: string, name: string) => {
    const documents = getFromStorage<Document>(STORAGE_KEYS.DOCUMENTS)
    const filteredDocs = documents.filter(d => 
      !(d.startup_id === startupId && d.category === category && d.name === name)
    )
    saveToStorage(STORAGE_KEYS.DOCUMENTS, filteredDocs)
  },

  // WhatsApp Groups functions
  getWhatsAppGroups: async () => {
    return getFromStorage<WhatsAppGroup>(STORAGE_KEYS.WHATSAPP_GROUPS)
  },

  updateWhatsAppGroups: async (groups: WhatsAppGroup[]) => {
    saveToStorage(STORAGE_KEYS.WHATSAPP_GROUPS, groups)
    return groups
  },

  // Enhanced auth functions
  updateUserLastLogin: async (userId: string) => {
    const startups = getFromStorage<Startup>(STORAGE_KEYS.STARTUPS)
    const admins = getFromStorage<Admin>(STORAGE_KEYS.ADMINS)
    
    const startupIndex = startups.findIndex(s => s.id === userId)
    if (startupIndex !== -1) {
      startups[startupIndex].last_activity = new Date().toISOString()
      saveToStorage(STORAGE_KEYS.STARTUPS, startups)
    }
    
    // For admins, we'd update admin table
  },

  savePasswordResetToken: async (email: string, token: string) => {
    // Mock implementation - in real app, save to database with expiry
    console.log(`Password reset token for ${email}: ${token}`)
  },

  validateResetToken: async (token: string) => {
    // Mock validation - in real app, check database
    return token.length > 5
  },

  updatePassword: async (token: string, newPassword: string) => {
    // Mock password update
    console.log(`Password updated for token: ${token}`)
  },

  verifyEmail: async (token: string) => {
    // Mock email verification
    return { success: true, message: 'Email verificado com sucesso!' }
  },

  validateCurrentPassword: async (userId: string, password: string) => {
    // Mock password validation - in real app, hash and compare
    return password.length > 0
  },

  updateUserPassword: async (userId: string, newPassword: string) => {
    // Mock password update
    console.log(`Password updated for user: ${userId}`)
  },

  // Notification functions
  getAllNotifications: async () => {
    return getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
  },

  addNotification: async (notification: Omit<Notification, 'id' | 'sent_at'>) => {
    const notifications = getFromStorage<Notification>(STORAGE_KEYS.NOTIFICATIONS)
    
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      sent_at: new Date().toISOString()
    }
    
    notifications.push(newNotification)
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications)
    
    return newNotification
  }
}