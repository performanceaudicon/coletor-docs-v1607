import React, { useState, useEffect } from 'react'
import { Building2, FileText, Send, CheckCircle, AlertCircle, Edit, MessageCircle, Plus, Calendar, Shield, Key } from 'lucide-react'
import { 
  getDocumentsByStartup, 
  uploadDocument as uploadDocumentToFirestore,
  deleteDocument,
  getDocumentConfig,
  DocumentConfig
} from '../../lib/firebaseFirestore'
import { uploadFile, deleteFile } from '../../lib/firebaseStorage'
import { updateUserProfile, changePassword } from '../../lib/firebaseAuth'
import { sendWhatsAppMessage } from '../../lib/zapiIntegration'
import { notificationSystem } from '../../lib/notificationSystem'
import CustomDocumentCategory from './CustomDocumentCategory'
import ProgressBar from '../ui/ProgressBar'
import Button from '../ui/Button'
import Card from '../ui/Card'
import NotificationCenter from '../ui/NotificationCenter'
import LoadingSpinner from '../ui/LoadingSpinner'

interface EnhancedStartupDashboardProps {
  user: any
  onSignOut: () => void
}

const EnhancedStartupDashboard: React.FC<EnhancedStartupDashboardProps> = ({ user, onSignOut }) => {
  const [startup, setStartup] = useState<any>(user)
  const [documents, setDocuments] = useState<any[]>([])
  const [documentConfig, setDocumentConfig] = useState<DocumentConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showExtraDocuments, setShowExtraDocuments] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    cnpj: '',
    phone: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [extraDocForm, setExtraDocForm] = useState({
    name: '',
    description: '',
    file: null as File | null
  })

  useEffect(() => {
    fetchStartupData()
    fetchDocuments()
    fetchDocumentConfig()
  }, [user])

  useEffect(() => {
    if (startup) {
      setEditForm({
        name: startup.name || '',
        email: startup.email || '',
        cnpj: startup.cnpj || '',
        phone: startup.phone || ''
      })
    }
  }, [startup])

  const fetchStartupData = async () => {
    setStartup(user)
  }

  const fetchDocuments = async () => {
    try {
      const data = await getDocumentsByStartup(user.id)
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentConfig = async () => {
    try {
      const configId = user.document_config_id || 'default'
      const config = await getDocumentConfig(configId)
      setDocumentConfig(config)
    } catch (error) {
      console.error('Error fetching document config:', error)
      // Create a default config if none exists
      setDocumentConfig({
        id: 'default',
        name: 'Configuração Padrão',
        categories: [],
        created_at: new Date() as any,
        updated_at: new Date() as any,
        created_by: 'system'
      })
    }
  }

  const handleFileUpload = async (categoryId: string, documentId: string, file: File) => {
    setUploadLoading(true)
    try {
      const filePath = `documents/${user.id}/${categoryId}/${documentId}_${Date.now()}_${file.name}`
      const { url, path } = await uploadFile(file, filePath)

      // Find document info from config
      const category = documentConfig?.categories.find(cat => cat.id === categoryId)
      const documentInfo = category?.documents.find(doc => doc.id === documentId)

      await uploadDocumentToFirestore({
        startup_id: user.id,
        category: categoryId,
        name: documentId,
        file_url: url,
        file_path: path,
        file_size: file.size,
        file_type: file.type,
        status: 'uploaded',
        required: documentInfo?.required || false,
        is_extra: false,
        original_filename: file.name
      })

      await fetchDocuments()
      notificationSystem.documentUploaded(documentInfo?.name || documentId, category?.name || categoryId)
    } catch (error) {
      console.error('Error uploading file:', error)
      notificationSystem.error('Erro', 'Erro ao fazer upload do arquivo')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileRemove = async (categoryId: string, documentId: string) => {
    try {
      const document = documents.find(doc => 
        doc.category === categoryId && doc.name === documentId
      )
      
      if (document) {
        await deleteFile(document.file_path)
        await deleteDocument(document.id)
        await fetchDocuments()
        notificationSystem.success('Documento removido', 'Documento removido com sucesso!')
      }
    } catch (error) {
      console.error('Error removing file:', error)
      notificationSystem.error('Erro', 'Erro ao remover arquivo')
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(user.id, editForm)
      setStartup({ ...startup, ...editForm })
      setShowEditProfile(false)
      notificationSystem.success('Perfil atualizado', 'Suas informações foram atualizadas com sucesso!')
    } catch (error) {
      console.error('Error updating profile:', error)
      notificationSystem.error('Erro', 'Não foi possível atualizar o perfil')
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notificationSystem.error('Erro', 'As senhas não coincidem')
      return
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowChangePassword(false)
      notificationSystem.success('Senha alterada', 'Sua senha foi alterada com sucesso!')
    } catch (error: any) {
      notificationSystem.error('Erro', error.message || 'Não foi possível alterar a senha')
    }
  }

  const handleSendHelp = async () => {
    try {
      const message = `Olá! Sou da ${startup?.name || 'startup'} e preciso de ajuda com o sistema de documentos. Podem me auxiliar?`
      await sendWhatsAppMessage('5511999999999', message) // Replace with actual support number
      notificationSystem.success(
        'Ajuda solicitada', 
        'Nossa equipe entrará em contato em breve!',
        [{
          id: 'whatsapp',
          label: 'Abrir WhatsApp',
          action: () => window.open('https://wa.me/5511999999999', '_blank')
        }]
      )
    } catch (error) {
      console.error('Error sending help message:', error)
      notificationSystem.error('Erro', 'Não foi possível enviar a mensagem de ajuda')
    }
  }

  const handleUploadExtraDocument = async () => {
    if (!extraDocForm.file || !extraDocForm.name) {
      notificationSystem.error('Erro', 'Por favor, preencha o nome e selecione um arquivo')
      return
    }

    setUploadLoading(true)
    try {
      const filePath = `documents/${user.id}/extras/${Date.now()}_${extraDocForm.file.name}`
      const { url, path } = await uploadFile(extraDocForm.file, filePath)

      await uploadDocumentToFirestore({
        startup_id: user.id,
        category: 'extras',
        name: extraDocForm.name,
        file_url: url,
        file_path: path,
        file_size: extraDocForm.file.size,
        file_type: extraDocForm.file.type,
        status: 'uploaded',
        required: false,
        is_extra: true,
        original_filename: extraDocForm.file.name
      })

      await fetchDocuments()
      setExtraDocForm({ name: '', description: '', file: null })
      setShowExtraDocuments(false)
      notificationSystem.documentUploaded(extraDocForm.name, 'Documentos Extras')
    } catch (error) {
      console.error('Error uploading extra document:', error)
      notificationSystem.error('Erro', 'Não foi possível enviar o documento extra')
    } finally {
      setUploadLoading(false)
    }
  }

  const getOverallProgress = () => {
    if (!documentConfig) return 0

    const totalRequired = documentConfig.categories.reduce((acc, cat) => 
      acc + cat.documents.filter(doc => doc.required).length, 0
    )

    const totalUploaded = documentConfig.categories.reduce((acc, cat) => {
      const requiredDocs = cat.documents.filter(doc => doc.required)
      const uploadedCount = documents.filter(doc => 
        doc.category === cat.id && 
        requiredDocs.some(reqDoc => reqDoc.id === doc.name)
      ).length
      return acc + uploadedCount
    }, 0)

    return totalRequired > 0 ? (totalUploaded / totalRequired) * 100 : 0
  }

  const handleSubmitDocuments = async () => {
    setSubmitting(true)
    try {
      // In a real implementation, you would update the user's status
      // await updateUserProfile(user.id, { status: 'completed', completion_date: new Date().toISOString() })

      notificationSystem.success(
        'Documentos enviados!', 
        'Todos os documentos foram enviados com sucesso. Nossa equipe entrará em contato em breve.',
        [{
          id: 'track',
          label: 'Acompanhar status',
          action: () => console.log('Track status')
        }]
      )
    } catch (error) {
      console.error('Error submitting documents:', error)
      notificationSystem.error('Erro', 'Não foi possível finalizar o envio dos documentos')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const overallProgress = getOverallProgress()
  const canSubmit = overallProgress === 100
  const extraDocuments = documents.filter(doc => doc.is_extra)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {startup?.photoURL ? (
                <img
                  src={startup.photoURL}
                  alt={startup.name}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <Building2 className="h-8 w-8 text-orange-600" />
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {startup?.name || 'Startup'}
                </h1>
                <p className="text-sm text-gray-500">Portal de Documentos</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditProfile(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar Perfil
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowChangePassword(true)}
              >
                <Key className="h-4 w-4 mr-1" />
                Alterar Senha
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSendHelp}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Ajuda
              </Button>
              <Button variant="secondary" onClick={onSignOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Card className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Status dos Documentos</h2>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Em andamento
                  </span>
                </div>
              </div>

              <ProgressBar progress={overallProgress} className="mb-6" />

              {canSubmit && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        Todos os documentos obrigatórios foram enviados!
                      </p>
                      <p className="text-sm text-orange-600">
                        Você pode finalizar o envio agora.
                      </p>
                    </div>
                    <Button
                      onClick={handleSubmitDocuments}
                      loading={submitting}
                      variant="success"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Finalizar Envio
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Documentos Obrigatórios</h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowExtraDocuments(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Enviar Documento Extra
                </Button>
              </div>
            </Card>

            <div className="space-y-6">
              {documentConfig?.categories.map((category) => (
                <CustomDocumentCategory
                  key={category.id}
                  category={category}
                  uploadedDocuments={documents}
                  onFileUpload={handleFileUpload}
                  onFileRemove={handleFileRemove}
                  loading={uploadLoading}
                />
              ))}
            </div>

            {extraDocuments.length > 0 && (
              <Card className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Extras</h3>
                <div className="space-y-3">
                  {extraDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          Enviado em {doc.uploaded_at?.toDate ? 
                            doc.uploaded_at.toDate().toLocaleDateString('pt-BR') :
                            new Date(doc.uploaded_at).toLocaleDateString('pt-BR')
                          }
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-medium">{startup?.name}</p>
                </div>
                {startup?.cnpj && (
                  <div>
                    <p className="text-sm text-gray-600">CNPJ</p>
                    <p className="font-medium">{startup.cnpj}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{startup?.email}</p>
                </div>
                {startup?.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium">{startup.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Progresso</p>
                  <p className="font-medium">{overallProgress.toFixed(0)}%</p>
                </div>
              </div>
            </Card>

            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <FileText className="h-5 w-5 inline mr-2" />
                Resumo
              </h3>
              <div className="space-y-3">
                {documentConfig?.categories.map((category) => {
                  const categoryDocs = documents.filter(doc => doc.category === category.id)
                  const requiredDocs = category.documents.filter(doc => doc.required)
                  const uploadedRequired = categoryDocs.filter(doc => 
                    requiredDocs.some(req => req.id === doc.name)
                  )
                  
                  return (
                    <div key={category.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{category.name}</span>
                      <span className="text-sm font-medium">
                        {uploadedRequired.length}/{requiredDocs.length}
                      </span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>

        {/* Modals - Same as before but using the new forms */}
        {/* Edit Profile Modal */}
        {showEditProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Perfil</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={editForm.cnpj}
                    onChange={(e) => setEditForm(prev => ({ ...prev, cnpj: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="secondary" onClick={() => setShowEditProfile(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveProfile}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showChangePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Alterar Senha</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Digite a nova senha"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 6 caracteres
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="secondary" onClick={() => setShowChangePassword(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleChangePassword}>
                  Alterar Senha
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Extra Documents Modal */}
        {showExtraDocuments && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enviar Documento Extra</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Documento</label>
                  <input
                    type="text"
                    value={extraDocForm.name}
                    onChange={(e) => setExtraDocForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ex: Contrato adicional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                  <textarea
                    value={extraDocForm.description}
                    onChange={(e) => setExtraDocForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="Descrição do documento..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo</label>
                  <input
                    type="file"
                    onChange={(e) => setExtraDocForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="secondary" onClick={() => setShowExtraDocuments(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUploadExtraDocument} loading={uploadLoading}>
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default EnhancedStartupDashboard