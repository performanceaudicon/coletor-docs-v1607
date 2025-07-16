import React, { useState, useEffect } from 'react'
import { X, Download, Eye, FileText, Calendar, User, Phone, Mail, Building } from 'lucide-react'
import { Document, getDocumentsByStartup, updateDocumentStatus } from '../../lib/firebaseFirestore'
import { downloadFile } from '../../lib/firebaseStorage'
import { notificationSystem } from '../../lib/notificationSystem'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'

interface StartupDetailsModalProps {
  startup: any
  onClose: () => void
}

const StartupDetailsModal: React.FC<StartupDetailsModalProps> = ({ startup, onClose }) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [startup.id])

  const fetchDocuments = async () => {
    try {
      const docs = await getDocumentsByStartup(startup.id)
      setDocuments(docs)
    } catch (error) {
      console.error('Error fetching documents:', error)
      notificationSystem.error('Erro', 'Não foi possível carregar os documentos')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (document: Document) => {
    setDownloadingDoc(document.id)
    try {
      await downloadFile(document.file_url, document.original_filename)
      notificationSystem.success('Download', `${document.original_filename} baixado com sucesso!`)
    } catch (error) {
      console.error('Error downloading file:', error)
      notificationSystem.error('Erro', 'Não foi possível fazer o download do arquivo')
    } finally {
      setDownloadingDoc(null)
    }
  }

  const handleViewDocument = (document: Document) => {
    window.open(document.file_url, '_blank')
  }

  const handleStatusChange = async (documentId: string, newStatus: Document['status']) => {
    try {
      await updateDocumentStatus(documentId, newStatus)
      await fetchDocuments()
      notificationSystem.success('Status atualizado', 'Status do documento foi atualizado com sucesso!')
    } catch (error) {
      console.error('Error updating document status:', error)
      notificationSystem.error('Erro', 'Não foi possível atualizar o status do documento')
    }
  }

  const getStatusColor = (status: Document['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      uploaded: 'bg-blue-100 text-blue-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: Document['status']) => {
    const labels = {
      pending: 'Pendente',
      uploaded: 'Enviado',
      verified: 'Verificado',
      rejected: 'Rejeitado'
    }
    return labels[status] || status
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = []
    }
    acc[doc.category].push(doc)
    return acc
  }, {} as Record<string, Document[]>)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-8 w-8 text-orange-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{startup.name}</h2>
              <p className="text-sm text-gray-600">Detalhes da startup e documentos</p>
            </div>
          </div>
          <Button variant="secondary" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar - Startup Info */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Startup</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Nome</p>
                    <p className="font-medium">{startup.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{startup.email}</p>
                  </div>
                </div>

                {startup.cnpj && (
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">CNPJ</p>
                      <p className="font-medium">{startup.cnpj}</p>
                    </div>
                  </div>
                )}

                {startup.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-medium">{startup.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Última Atividade</p>
                    <p className="font-medium">
                      {startup.lastLogin ? new Date(startup.lastLogin).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    startup.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {startup.role === 'admin' ? 'Administrador' : 'Startup'}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total de documentos</span>
                  <span className="font-medium">{documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Verificados</span>
                  <span className="font-medium text-green-600">
                    {documents.filter(d => d.status === 'verified').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pendentes</span>
                  <span className="font-medium text-yellow-600">
                    {documents.filter(d => d.status === 'uploaded').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Rejeitados</span>
                  <span className="font-medium text-red-600">
                    {documents.filter(d => d.status === 'rejected').length}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content - Documents */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Documentos</h3>
              <div className="text-sm text-gray-600">
                {documents.length} documentos encontrados
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum documento encontrado</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedDocuments).map(([category, categoryDocs]) => (
                  <Card key={category}>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                      {category.replace('-', ' ')}
                    </h4>
                    <div className="space-y-3">
                      {categoryDocs.map((document) => (
                        <div key={document.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-gray-500" />
                              <div>
                                <h5 className="font-medium text-gray-900">{document.name}</h5>
                                <p className="text-sm text-gray-600">{document.original_filename}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {document.required && (
                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                  Obrigatório
                                </span>
                              )}
                              {document.is_extra && (
                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                  Extra
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(document.status)}`}>
                                {getStatusLabel(document.status)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span>{formatFileSize(document.file_size)}</span>
                              <span>{document.file_type}</span>
                              <span>
                                {document.uploaded_at?.toDate ? 
                                  document.uploaded_at.toDate().toLocaleDateString('pt-BR') :
                                  new Date(document.uploaded_at).toLocaleDateString('pt-BR')
                                }
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <select
                                value={document.status}
                                onChange={(e) => handleStatusChange(document.id, e.target.value as Document['status'])}
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-500"
                              >
                                <option value="uploaded">Enviado</option>
                                <option value="verified">Verificado</option>
                                <option value="rejected">Rejeitado</option>
                              </select>

                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewDocument(document)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownload(document)}
                                loading={downloadingDoc === document.id}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StartupDetailsModal