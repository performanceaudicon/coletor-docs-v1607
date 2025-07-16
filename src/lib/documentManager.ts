// Advanced document management system
import { uploadFile, deleteFile } from './storage'
import { mockApi } from './mockData'

export interface DocumentFile {
  id: string
  name: string
  originalName: string
  size: number
  type: string
  url: string
  uploadedAt: string
  version: number
  checksum: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  version: number
  file: DocumentFile
  uploadedBy: string
  uploadedAt: string
  changeNote?: string
}

export interface DocumentMetadata {
  id: string
  startupId: string
  categoryId: string
  documentId: string
  status: 'pending' | 'uploaded' | 'verified' | 'rejected'
  required: boolean
  isExtra: boolean
  currentVersion: number
  files: DocumentFile[]
  versions: DocumentVersion[]
  tags: string[]
  notes: string[]
  lastModified: string
  expiresAt?: string
}

export class DocumentManager {
  private static instance: DocumentManager
  private documents: Map<string, DocumentMetadata> = new Map()

  static getInstance(): DocumentManager {
    if (!DocumentManager.instance) {
      DocumentManager.instance = new DocumentManager()
    }
    return DocumentManager.instance
  }

  async uploadDocument(
    startupId: string,
    categoryId: string,
    documentId: string,
    files: File[],
    options: {
      required?: boolean
      isExtra?: boolean
      tags?: string[]
      note?: string
      replaceExisting?: boolean
    } = {}
  ): Promise<DocumentMetadata> {
    try {
      // Validate files
      this.validateFiles(files)

      const existingDoc = await this.getDocument(startupId, categoryId, documentId)
      const isNewDocument = !existingDoc
      const currentVersion = existingDoc ? existingDoc.currentVersion + 1 : 1

      // Upload files
      const uploadedFiles: DocumentFile[] = []
      for (const file of files) {
        const checksum = await this.calculateChecksum(file)
        const { url, path } = await uploadFile(file, `${startupId}/${categoryId}`)
        
        const documentFile: DocumentFile = {
          id: this.generateId(),
          name: path,
          originalName: file.name,
          size: file.size,
          type: file.type,
          url,
          uploadedAt: new Date().toISOString(),
          version: currentVersion,
          checksum
        }
        
        uploadedFiles.push(documentFile)
      }

      // Create or update document metadata
      const documentMetadata: DocumentMetadata = {
        id: existingDoc?.id || this.generateId(),
        startupId,
        categoryId,
        documentId,
        status: 'uploaded',
        required: options.required || false,
        isExtra: options.isExtra || false,
        currentVersion,
        files: options.replaceExisting ? uploadedFiles : [...(existingDoc?.files || []), ...uploadedFiles],
        versions: [
          ...(existingDoc?.versions || []),
          ...uploadedFiles.map(file => ({
            id: this.generateId(),
            documentId: documentMetadata.id,
            version: currentVersion,
            file,
            uploadedBy: startupId,
            uploadedAt: new Date().toISOString(),
            changeNote: options.note
          }))
        ],
        tags: options.tags || [],
        notes: existingDoc?.notes || [],
        lastModified: new Date().toISOString(),
        expiresAt: options.isExtra ? undefined : this.calculateExpiryDate()
      }

      // Save to storage
      await mockApi.uploadDocument({
        startup_id: startupId,
        category: categoryId,
        name: documentId,
        file_url: uploadedFiles[0].url,
        file_size: uploadedFiles[0].size,
        file_type: uploadedFiles[0].type,
        status: 'uploaded',
        required: options.required || false,
        is_extra: options.isExtra || false
      })

      this.documents.set(documentMetadata.id, documentMetadata)

      // Trigger notifications
      await this.notifyDocumentUpdate(startupId, documentMetadata, isNewDocument)

      return documentMetadata
    } catch (error) {
      console.error('Error uploading document:', error)
      throw new Error('Falha no upload do documento')
    }
  }

  async getDocument(startupId: string, categoryId: string, documentId: string): Promise<DocumentMetadata | null> {
    // In real implementation, query database
    const documents = await mockApi.getDocuments(startupId)
    const doc = documents.find(d => d.category === categoryId && d.name === documentId)
    
    if (!doc) return null

    return {
      id: doc.id,
      startupId,
      categoryId,
      documentId,
      status: doc.status,
      required: doc.required,
      isExtra: doc.is_extra,
      currentVersion: 1,
      files: [{
        id: doc.id,
        name: doc.file_url.split('/').pop() || '',
        originalName: doc.file_url.split('/').pop() || '',
        size: doc.file_size,
        type: doc.file_type,
        url: doc.file_url,
        uploadedAt: doc.uploaded_at,
        version: 1,
        checksum: ''
      }],
      versions: [],
      tags: [],
      notes: [],
      lastModified: doc.uploaded_at
    }
  }

  async deleteDocument(startupId: string, categoryId: string, documentId: string): Promise<void> {
    const document = await this.getDocument(startupId, categoryId, documentId)
    if (!document) throw new Error('Documento não encontrado')

    // Delete files from storage
    for (const file of document.files) {
      await deleteFile(file.name)
    }

    // Remove from database
    await mockApi.deleteDocument(startupId, categoryId, documentId)
    
    this.documents.delete(document.id)
  }

  async searchDocuments(startupId: string, query: {
    category?: string
    status?: string
    tags?: string[]
    dateRange?: { from: string; to: string }
  }): Promise<DocumentMetadata[]> {
    const documents = await mockApi.getDocuments(startupId)
    
    return documents
      .filter(doc => {
        if (query.category && doc.category !== query.category) return false
        if (query.status && doc.status !== query.status) return false
        // Add more filtering logic as needed
        return true
      })
      .map(doc => ({
        id: doc.id,
        startupId,
        categoryId: doc.category,
        documentId: doc.name,
        status: doc.status,
        required: doc.required,
        isExtra: doc.is_extra,
        currentVersion: 1,
        files: [],
        versions: [],
        tags: [],
        notes: [],
        lastModified: doc.uploaded_at
      }))
  }

  async addDocumentNote(documentId: string, note: string, userId: string): Promise<void> {
    const document = this.documents.get(documentId)
    if (!document) throw new Error('Documento não encontrado')

    document.notes.push(`${new Date().toISOString()} - ${userId}: ${note}`)
    document.lastModified = new Date().toISOString()
  }

  async updateDocumentTags(documentId: string, tags: string[]): Promise<void> {
    const document = this.documents.get(documentId)
    if (!document) throw new Error('Documento não encontrado')

    document.tags = tags
    document.lastModified = new Date().toISOString()
  }

  private validateFiles(files: File[]): void {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ]

    for (const file of files) {
      if (file.size > maxSize) {
        throw new Error(`Arquivo ${file.name} é muito grande. Máximo: 10MB`)
      }
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de arquivo não permitido: ${file.type}`)
      }
    }
  }

  private async calculateChecksum(file: File): Promise<string> {
    // Simple checksum calculation (in real app, use crypto)
    return `${file.name}-${file.size}-${file.lastModified}`
  }

  private calculateExpiryDate(): string {
    // Documents expire after 1 year
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    return expiryDate.toISOString()
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private async notifyDocumentUpdate(startupId: string, document: DocumentMetadata, isNew: boolean): Promise<void> {
    // Trigger notifications for document updates
    console.log(`Document ${isNew ? 'uploaded' : 'updated'}:`, document.documentId)
  }
}

export const documentManager = DocumentManager.getInstance()