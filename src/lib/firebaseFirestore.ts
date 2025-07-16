import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../firebaseConfig'

// Document Configuration Types
export interface DocumentItem {
  id: string
  name: string
  required: boolean
  description?: string
}

export interface DocumentCategory {
  id: string
  name: string
  documents: DocumentItem[]
}

export interface DocumentConfig {
  id: string
  name: string
  description?: string
  categories: DocumentCategory[]
  created_at: Timestamp
  updated_at: Timestamp
  created_by: string
}

// Document Types
export interface Document {
  id: string
  startup_id: string
  category: string
  name: string
  file_url: string
  file_path: string
  file_size: number
  file_type: string
  uploaded_at: Timestamp
  status: 'pending' | 'uploaded' | 'verified' | 'rejected'
  required: boolean
  is_extra: boolean
  original_filename: string
}

// Message Template Types
export interface MessageTemplate {
  id: string
  name: string
  type: 'reminder' | 'completion' | 'welcome' | 'follow_up' | 'deadline'
  content: string
  variables: string[] // Available variables like {name}, {missingDocs}, etc.
  created_at: Timestamp
  updated_at: Timestamp
}

// Notification Types
export interface Notification {
  id: string
  startup_id: string
  type: 'reminder' | 'completion' | 'welcome' | 'follow_up' | 'deadline'
  message: string
  sent_at: Timestamp
  status: 'pending' | 'sent' | 'failed'
  whatsapp_message_id?: string
}

// Document Configuration Functions
export const createDocumentConfig = async (config: Omit<DocumentConfig, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'document_configs'), {
      ...config,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    })
    return docRef.id
  } catch (error: any) {
    console.error('Error creating document config:', error)
    throw new Error('Erro ao criar configuração de documentos: ' + error.message)
  }
}

export const updateDocumentConfig = async (id: string, updates: Partial<DocumentConfig>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'document_configs', id), {
      ...updates,
      updated_at: Timestamp.now()
    })
  } catch (error: any) {
    console.error('Error updating document config:', error)
    throw new Error('Erro ao atualizar configuração de documentos: ' + error.message)
  }
}

export const getDocumentConfig = async (id: string): Promise<DocumentConfig | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'document_configs', id))
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as DocumentConfig
    }
    return null
  } catch (error: any) {
    console.error('Error getting document config:', error)
    throw new Error('Erro ao buscar configuração de documentos: ' + error.message)
  }
}

export const getAllDocumentConfigs = async (): Promise<DocumentConfig[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'document_configs'))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentConfig))
  } catch (error: any) {
    console.error('Error getting document configs:', error)
    throw new Error('Erro ao buscar configurações de documentos: ' + error.message)
  }
}

export const deleteDocumentConfig = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'document_configs', id))
  } catch (error: any) {
    console.error('Error deleting document config:', error)
    throw new Error('Erro ao deletar configuração de documentos: ' + error.message)
  }
}

// Document Functions
export const uploadDocument = async (document: Omit<Document, 'id' | 'uploaded_at'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'documents'), {
      ...document,
      uploaded_at: Timestamp.now()
    })
    return docRef.id
  } catch (error: any) {
    console.error('Error uploading document:', error)
    throw new Error('Erro ao fazer upload do documento: ' + error.message)
  }
}

export const getDocumentsByStartup = async (startupId: string): Promise<Document[]> => {
  try {
    const q = query(
      collection(db, 'documents'), 
      where('startup_id', '==', startupId),
      orderBy('uploaded_at', 'desc')
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document))
  } catch (error: any) {
    console.error('Error getting documents:', error)
    throw new Error('Erro ao buscar documentos: ' + error.message)
  }
}

export const getAllDocuments = async (): Promise<Document[]> => {
  try {
    const q = query(collection(db, 'documents'), orderBy('uploaded_at', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document))
  } catch (error: any) {
    console.error('Error getting all documents:', error)
    throw new Error('Erro ao buscar todos os documentos: ' + error.message)
  }
}

export const updateDocumentStatus = async (id: string, status: Document['status']): Promise<void> => {
  try {
    await updateDoc(doc(db, 'documents', id), { status })
  } catch (error: any) {
    console.error('Error updating document status:', error)
    throw new Error('Erro ao atualizar status do documento: ' + error.message)
  }
}

export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'documents', id))
  } catch (error: any) {
    console.error('Error deleting document:', error)
    throw new Error('Erro ao deletar documento: ' + error.message)
  }
}

// Message Template Functions
export const createMessageTemplate = async (template: Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'message_templates'), {
      ...template,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    })
    return docRef.id
  } catch (error: any) {
    console.error('Error creating message template:', error)
    throw new Error('Erro ao criar template de mensagem: ' + error.message)
  }
}

export const updateMessageTemplate = async (id: string, updates: Partial<MessageTemplate>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'message_templates', id), {
      ...updates,
      updated_at: Timestamp.now()
    })
  } catch (error: any) {
    console.error('Error updating message template:', error)
    throw new Error('Erro ao atualizar template de mensagem: ' + error.message)
  }
}

export const getAllMessageTemplates = async (): Promise<MessageTemplate[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'message_templates'))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageTemplate))
  } catch (error: any) {
    console.error('Error getting message templates:', error)
    throw new Error('Erro ao buscar templates de mensagem: ' + error.message)
  }
}

export const getMessageTemplate = async (type: string): Promise<MessageTemplate | null> => {
  try {
    const q = query(collection(db, 'message_templates'), where('type', '==', type))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as MessageTemplate
    }
    return null
  } catch (error: any) {
    console.error('Error getting message template:', error)
    throw new Error('Erro ao buscar template de mensagem: ' + error.message)
  }
}

// Notification Functions
export const addNotification = async (notification: Omit<Notification, 'id' | 'sent_at'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      sent_at: Timestamp.now()
    })
    return docRef.id
  } catch (error: any) {
    console.error('Error adding notification:', error)
    throw new Error('Erro ao adicionar notificação: ' + error.message)
  }
}

export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const q = query(collection(db, 'notifications'), orderBy('sent_at', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification))
  } catch (error: any) {
    console.error('Error getting notifications:', error)
    throw new Error('Erro ao buscar notificações: ' + error.message)
  }
}

// User Functions
export const getAllUsers = async (): Promise<any[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'))
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error: any) {
    console.error('Error getting users:', error)
    throw new Error('Erro ao buscar usuários: ' + error.message)
  }
}

export const updateUser = async (id: string, updates: any): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', id), {
      ...updates,
      updated_at: Timestamp.now()
    })
  } catch (error: any) {
    console.error('Error updating user:', error)
    throw new Error('Erro ao atualizar usuário: ' + error.message)
  }
}

// Real-time listeners
export const subscribeToDocuments = (startupId: string, callback: (documents: Document[]) => void) => {
  const q = query(
    collection(db, 'documents'), 
    where('startup_id', '==', startupId),
    orderBy('uploaded_at', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document))
    callback(documents)
  })
}

export const subscribeToAllUsers = (callback: (users: any[]) => void) => {
  const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'))
  
  return onSnapshot(q, (querySnapshot) => {
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(users)
  })
}