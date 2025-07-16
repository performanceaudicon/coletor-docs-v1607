import React, { useState, useEffect } from 'react'
import { 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare,
  Filter,
  Search,
  Settings,
  Edit,
  RefreshCw,
  Eye,
  Calendar,
  Link,
  Users as UsersIcon,
  Shield,
  Key,
  Cog,
  MessageCircle,
  Database
} from 'lucide-react'
import ZAPIConfigManager from './ZAPIConfigManager'
import StartupDocumentManager from './StartupDocumentManager'
import EnhancedStartupDetailsModal from './EnhancedStartupDetailsModal'
import { 
  getAllUsers, 
  updateUser, 
  getAllDocuments,
  getAllNotifications,
  getDocumentConfig,
  getAllDocumentConfigs
} from '../../lib/firebaseFirestore'
import { fetchWhatsAppGroups, sendWhatsAppMessage, sendGroupMessage, getInstanceStatus } from '../../lib/zapiIntegration'
import { notificationSystem } from '../../lib/notificationSystem'
import { changePassword } from '../../lib/firebaseAuth'
import Card from '../ui/Card'
import Button from '../ui/Button'
import NotificationCenter from '../ui/NotificationCenter'
import LoadingSpinner from '../ui/LoadingSpinner'
import DocumentConfigManager from './DocumentConfigManager'
import MessageTemplateManager from './MessageTemplateManager'

interface EnhancedAdminDashboardProps {
  user: any
  onSignOut: () => void
}

interface DocumentConfig {
  id: string;
  name: string;
  // Add other config properties if needed
}

const EnhancedAdminDashboard: React.FC<EnhancedAdminDashboardProps> = ({ user, onSignOut }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [startups, setStartups] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [whatsappGroups, setWhatsappGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshingGroups, setRefreshingGroups] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStartup, setSelectedStartup] = useState<any>(null)
  const [showStartupDetails, setShowStartupDetails] = useState(false)
  const [showLinkConfigModal, setShowLinkConfigModal] = useState(false)
  const [selectedConfigToLink, setSelectedConfigToLink] = useState<string>('')
  const [documentConfigs, setDocumentConfigs] = useState<DocumentConfig[]>([])
  const [showEditAdmin, setShowEditAdmin] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [instanceStatus, setInstanceStatus] = useState<any>(null)
  const [editAdminForm, setEditAdminForm] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    fetchData()
 fetchDocumentConfigs()
    fetchWhatsAppGroupsData()
    checkInstanceStatus()
  }, [])

  useEffect(() => {
    setEditAdminForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || ''
    })
  }, [user])

  const fetchData = async () => {
    try {
      const [usersData, documentsData, notificationsData] = await Promise.all([
        getAllUsers(),
        getAllDocuments(),
        getAllNotifications()
      ])

      // Filter only startup users
      const startupUsers = usersData.filter(u => u.role === 'startup')
      setStartups(startupUsers)
      setDocuments(documentsData || [])
      setNotifications(notificationsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      notificationSystem.error('Erro', 'Não foi possível carregar os dados')
    } finally {
      setLoading(false)
    }
  }

  const fetchDocumentConfigs = async () => {
    try {
      const configs = await getAllDocumentConfigs();
 setDocumentConfigs(configs);
    } catch (error) {
      console.error('Error fetching document configurations:', error);
 notificationSystem.error('Erro', 'Não foi possível carregar as configurações de documentos');
    }
  }

  const fetchWhatsAppGroupsData = async () => {
    try {
      const groups = await fetchWhatsAppGroups()
      setWhatsappGroups(groups)
    } catch (error) {
      console.error('Error fetching WhatsApp groups:', error)
      // Set empty array on error to prevent crashes
      setWhatsappGroups([])
      
      // Only show error notification if Z-API is configured
      const config = getRuntimeConfig()
      if (config.baseUrl && config.clientToken) {
        notificationSystem.error('Erro Z-API', 'Não foi possível buscar grupos do WhatsApp')
      }
    }
  }

  const checkInstanceStatus = async () => {
    try {
      const status = await getInstanceStatus()
      setInstanceStatus(status)
    } catch (error) {
      console.error('Error checking instance status:', error)
    }
  }

  const handleRefreshGroups = async () => {
    setRefreshingGroups(true)
    try {
      const updatedGroups = await fetchWhatsAppGroups()
      setWhatsappGroups(updatedGroups)
      notificationSystem.success('Sucesso', 'Grupos atualizados com sucesso!')
    } catch (error) {
      console.error('Error refreshing groups:', error)
      notificationSystem.error('Erro', 'Erro ao atualizar grupos')
    } finally {
      setRefreshingGroups(false)
    }
  }

  const sendReminderMessage = async (startup: any) => {
    try {
      // Get startup's document configuration
      const docConfig = await getDocumentConfig(startup.document_config_id || 'default')
      if (!docConfig) {
        notificationSystem.error('Erro', 'Configuração de documentos não encontrada')
        return
      }

      // Calculate missing and uploaded documents
      const startupDocs = documents.filter(doc => doc.startup_id === startup.id)
      const missingDocs: string[] = []
      const uploadedDocs: string[] = []

      docConfig.categories.forEach(category => {
        category.documents.forEach(doc => {
          if (doc.required) {
            const isUploaded = startupDocs.some(uploadedDoc => 
              uploadedDoc.category === category.id && uploadedDoc.name === doc.id
            )
            
            if (isUploaded) {
              uploadedDocs.push(`${category.name}: ${doc.name}`)
            } else {
              missingDocs.push(`${category.name}: ${doc.name}`)
            }
          }
        })
      })

      // Create message content
      let message = `Olá ${startup.name}! 👋\n\nNotamos que você ainda não concluiu o envio de todos os documentos necessários.\n\n`
      
      if (uploadedDocs.length > 0) {
        message += `✅ *Documentos já recebidos:*\n`
        uploadedDocs.forEach(doc => {
          message += `• ${doc}\n`
        })
        message += `\n`
      }
      
      if (missingDocs.length > 0) {
        message += `📋 *Documentos pendentes:*\n`
        missingDocs.forEach(doc => {
          message += `• ${doc}\n`
        })
        message += `\n`
      }
      
      message += `Por favor, acesse o sistema para completar o envio dos documentos pendentes.\n\n`
      message += `Precisa de ajuda? Entre em contato conosco!\n`
      message += `📞 WhatsApp: (11) 99999-9999\n`
      message += `📧 Email: suporte@empresa.com\n\n`
      message += `Contamos com você! 💪`

      // Send message
      const target = startup.whatsapp_group_id || startup.phone
      const result = await sendWhatsAppMessage(target, message)
      
      if (result.success) {
        notificationSystem.success('Lembrete enviado', `Lembrete enviado para ${startup.name}`)
      } else {
        notificationSystem.error('Erro', `Falha ao enviar lembrete: ${result.error}`)
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      notificationSystem.error('Erro', 'Não foi possível enviar o lembrete')
    }
  }

  const handleSaveAdmin = async () => {
    try {
      await updateUser(user.id, editAdminForm)
      setShowEditAdmin(false)
      notificationSystem.success('Perfil atualizado', 'Suas informações foram atualizadas com sucesso!')
    } catch (error) {
      console.error('Error updating admin:', error)
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

  const handleViewStartup = (startup: any) => {
    setSelectedStartup(startup)
    setShowStartupDetails(true)
  }

  const handleLinkConfigClick = (startup: any) => {
    setSelectedStartup(startup);
    setSelectedConfigToLink(startup.document_config_id || ''); // Pre-select current config if exists
    setShowLinkConfigModal(true);
  };

  const handleAssignConfig = async () => {
    if (!selectedStartup || !selectedConfigToLink) {
      notificationSystem.error('Erro', 'Selecione uma startup e uma configuração');
      return;
    }

    try {
      await updateUser(selectedStartup.id, { document_config_id: selectedConfigToLink });
      notificationSystem.success('Sucesso', `Configuração de documento atribuída à ${selectedStartup.name}`);
      setShowLinkConfigModal(false);
      setSelectedStartup(null);
      setSelectedConfigToLink('');
      fetchData(); // Refresh startup list to show updated config
    } catch (error) {
      notificationSystem.error('Erro', 'Não foi possível atribuir a configuração');
    }
  }

  const filteredStartups = startups.filter(startup => {
    const matchesSearch = startup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.cnpj?.includes(searchTerm)
    return matchesSearch
  })

  const stats = {
    total: startups.length,
    active: startups.filter(s => s.lastLogin && new Date(s.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    withDocuments: startups.filter(s => documents.some(d => d.startup_id === s.id)).length,
    totalDocuments: documents.length
  }

  const tabs = [
    { id: 'overview', name: 'Visão Geral', icon: Users },
    { id: 'startup-docs', name: 'Documentos das Startups', icon: FileText },
    { id: 'documents', name: 'Configurações de Documentos', icon: FileText },
    { id: 'messages', name: 'Templates de Mensagem', icon: MessageCircle },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare },
    { id: 'zapi-config', name: 'Configuração Z-API', icon: Settings }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-orange-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-gray-500">Gestão Completa do Sistema</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <NotificationCenter />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowEditAdmin(true)}
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
              <Button variant="secondary" onClick={onSignOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Startups</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Ativas (7 dias)</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Com Documentos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.withDocuments}</p>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Documentos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleRefreshGroups}
                  loading={refreshingGroups}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Grupos
                </Button>
              </div>
            </div>

            {/* Startups Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Startup</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Documentos</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Última Atividade</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStartups.map((startup) => {
                      const startupDocs = documents.filter(doc => doc.startup_id === startup.id)
                      
                      return (
                        <tr key={startup.id} className="border-b border-gray-100">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              {startup.photoURL ? (
                                <img
                                  src={startup.photoURL}
                                  alt={startup.name}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                  <span className="text-orange-600 font-medium">
                                    {startup.name?.charAt(0) || startup.email?.charAt(0) || '?'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{startup.name || 'Nome não informado'}</p>
                                <p className="text-sm text-gray-500">{startup.email}</p>
                                {startup.cnpj && (
                                  <p className="text-sm text-gray-500">{startup.cnpj}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {startupDocs.length} documentos
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-gray-600">
                              {startup.lastLogin ? 
                                new Date(startup.lastLogin).toLocaleDateString('pt-BR') : 
                                'Nunca'
                              }
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleViewStartup(startup)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Detalhes
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => sendReminderMessage(startup)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleLinkConfigClick(startup)}
>
                                <Link className="h-4 w-4 mr-1" />
                                Config Documentos
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'startup-docs' && <StartupDocumentManager />}
        {activeTab === 'documents' && <DocumentConfigManager />}
        {activeTab === 'messages' && <MessageTemplateManager />}
        {activeTab === 'zapi-config' && <ZAPIConfigManager />}
        
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Integração WhatsApp</h2>
              <Button
                variant="secondary"
                onClick={handleRefreshGroups}
                loading={refreshingGroups}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar Grupos
              </Button>
            </div>

            {/* Instance Status */}
            {instanceStatus && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Status da Instância</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-medium ${instanceStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
                      {instanceStatus.connected ? 'Conectado' : 'Desconectado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium">{instanceStatus.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bateria</p>
                    <p className="font-medium">{instanceStatus.battery || 'N/A'}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Última Atualização</p>
                    <p className="font-medium">
                      {instanceStatus.lastSeen ? new Date(instanceStatus.lastSeen).toLocaleString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* WhatsApp Groups */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Grupos WhatsApp Disponíveis
              </h3>
              {whatsappGroups.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum grupo encontrado</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Verifique se a Z-API está configurada corretamente
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {whatsappGroups.map((group) => (
                    <div key={group.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <UsersIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{group.id}</p>
                      <p className="text-xs text-gray-400">{group.participants || 0} participantes</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Modals */}
        {showStartupDetails && selectedStartup && (
          <EnhancedStartupDetailsModal
            startup={selectedStartup}
            onClose={() => setShowStartupDetails(false)}
          />
        )}

        {/* Link Config Modal */}
        {showLinkConfigModal && selectedStartup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Atribuir Configuração de Documentos para {selectedStartup.name}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Configuração de Documentos
                  </label>
                  <select
                    value={selectedConfigToLink}
                    onChange={(e) => setSelectedConfigToLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">-- Selecione uma configuração --</option>
                    {documentConfigs.map(config => (
                      <option key={config.id} value={config.id}>
                        {config.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="secondary" onClick={() => setShowLinkConfigModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAssignConfig}>
                  Atribuir Configuração
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Admin Modal */}
        {showEditAdmin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Editar Perfil Admin</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={editAdminForm.name}
                    onChange={(e) => setEditAdminForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editAdminForm.email}
                    onChange={(e) => setEditAdminForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={editAdminForm.phone}
                    onChange={(e) => setEditAdminForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="secondary" onClick={() => setShowEditAdmin(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveAdmin}>
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
      </main>
    </div>
  )
}

export default EnhancedAdminDashboard