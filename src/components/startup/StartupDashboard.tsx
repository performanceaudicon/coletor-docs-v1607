import React, { useState, useEffect } from 'react'
import { Building2, FileText, Send, CheckCircle, AlertCircle, Edit, MessageCircle, Plus, Calendar, Shield, Key } from 'lucide-react'
import { mockApi, initializeMockData } from '../../lib/mockData'
import { documentCategories, getOverallProgress } from '../../lib/documents'
import { uploadFile, deleteFile } from '../../lib/storage'
import { scheduleNotification, sendHelpMessage } from '../../lib/notifications'
import { notificationSystem } from '../../lib/notificationSystem';
import { changePassword } from '../../lib/auth'
import DocumentCategory from './DocumentCategory'
import ProgressBar from '../ui/ProgressBar'
import Button from '../ui/Button'
import Card from '../ui/Card'
import NotificationCenter from '../ui/NotificationCenter'
import LoadingSpinner from '../ui/LoadingSpinner'
import { getDocumentConfig } from '../../lib/firebaseFirestore'

interface StartupDashboardProps {
  user: any
  onSignOut: () => void
}

const StartupDashboard: React.FC<StartupDashboardProps> = ({ user, onSignOut }) => {
  const [startup, setStartup] = useState<any>(null)
  const [documentConfig, setDocumentConfig] = useState<any | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
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
    initializeMockData()
    fetchStartupData()
    fetchDocuments()
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
    try {
      const data = await mockApi.getStartup(user.id)
      setStartup(data)

      // Fetch document configuration if assigned
      if (data && data.document_config_id) {
        const config = await getDocumentConfig(data.document_config_id);
        setDocumentConfig(config);
      } else {
        // If no specific config is assigned, try to fetch a default one
        try {
          const defaultConfig = await getDocumentConfig('default'); // Assuming 'default' is the ID of your default config
          setDocumentConfig(defaultConfig);
        } catch (defaultError) {
          console.warn('No document config assigned and no default config found:', defaultError);
        }
      }
    } catch (error) {
      console.error('Error fetching startup data:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const data = await mockApi.getDocuments(user.id)
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (categoryId: string, documentId: string, file: File) => {
    setUploadLoading(true)
    try {
      const { url } = await uploadFile(file, `${user.id}/${categoryId}`)

      await mockApi.uploadDocument({
        startup_id: user.id,
        category: categoryId,
        name: documentId,
        file_url: url,
        file_size: file.size,
        file_type: file.type,
        status: 'uploaded',
        is_extra: false,
        required: documentCategories
          .find(cat => cat.id === categoryId)
          ?.documents.find(doc => doc.id === documentId)?.required || false
      })

      // Update startup status and last activity
      await mockApi.updateStartup(user.id, {
        status: 'in_progress',
        last_activity: new Date().toISOString()
      })

      await fetchDocuments()
      await fetchStartupData()
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Erro ao fazer upload do arquivo')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleFileRemove = async (categoryId: string, documentId: string) => {
    try {
      await mockApi.deleteDocument(user.id, categoryId, documentId)
      await fetchDocuments()
    } catch (error) {
      console.error('Error removing file:', error)
      alert('Erro ao remover arquivo')
    }
  }

  const handleSaveProfile = async () => {
    try {
      await mockApi.updateStartup(user.id, editForm)
      await fetchStartupData()
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
      await sendHelpMessage(startup?.phone || '', startup?.name || '')
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
      alert('Por favor, preencha o nome e selecione um arquivo')
      return
    }

    setUploadLoading(true)
    try {
      const { url } = await uploadFile(extraDocForm.file, `${user.id}/extras`)

      await mockApi.uploadDocument({
        startup_id: user.id,
        category: 'extras',
        name: extraDocForm.name,
        file_url: url,
        file_size: extraDocForm.file.size,
        file_type: extraDocForm.file.type,
        status: 'uploaded',
        required: false,
        is_extra: true
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

  const handleSubmitDocuments = async () => {
    setSubmitting(true)
    try {
      await mockApi.updateStartup(user.id, {
        status: 'completed',
        completion_date: new Date().toISOString()
      })

      // Schedule completion notification
      await scheduleNotification(user.id, 'completion', 0)

      // Mock webhook call
      console.log('Mock webhook triggered:', {
        event: 'documents_completed',
        startup_id: user.id,
        startup_name: startup?.name,
        completion_date: new Date().toISOString()
      })

      await fetchStartupData()
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

  const overallProgress = getOverallProgress(documents)
  const canSubmit = overallProgress === 100 && startup?.status !== 'completed'
  const extraDocuments = documents.filter(doc => doc.is_extra)
  const isOverdue = startup?.deadline && new Date() > new Date(startup.deadline)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-orange-600" />
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
                  {startup?.deadline && (
                    <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Prazo: {new Date(startup.deadline).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                  {startup?.status === 'completed' ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Concluído
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      Em andamento
                    </span>
                  )}
                </div>
              </div>

              {isOverdue && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Prazo vencido!
                      </p>
                      <p className="text-sm text-red-600">
                        O prazo para envio dos documentos era {new Date(startup.deadline).toLocaleDateString('pt-BR')}. 
                        Entre em contato conosco o quanto antes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <ProgressBar progress={overallProgress} className="mb-6" />

              {startup?.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Documentos enviados com sucesso!
                      </p>
                      <p className="text-sm text-green-600">
                        Nossa equipe está analisando sua documentação e entrará em contato em breve.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {canSubmit && !isOverdue && (
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
              {documentCategories.map((category) => (
                <DocumentCategory
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
                          Enviado em {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
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
                <div>
                  <p className="text-sm text-gray-600">CNPJ</p>
                  <p className="font-medium">{startup?.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{startup?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{startup?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Progresso</p>
                  <p className="font-medium">{overallProgress.toFixed(0)}%</p>
                </div>
                {startup?.deadline && (
                  <div>
                    <p className="text-sm text-gray-600">Prazo</p>
                    <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {new Date(startup.deadline).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <FileText className="h-5 w-5 inline mr-2" />
                Resumo
              </h3>
              <div className="space-y-3">
                {documentCategories.map((category) => {
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

export default StartupDashboard