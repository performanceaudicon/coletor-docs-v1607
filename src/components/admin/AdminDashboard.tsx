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
  Key
} from 'lucide-react'
import { mockApi, initializeMockData, WhatsAppGroup } from '../../lib/mockData'
import { sendWhatsAppMessage, fetchWhatsAppGroups as fetchWhatsAppGroupsFromZAPI, notificationTemplates, getDocumentStatus } from '../../lib/notifications'
import { documentCategories, getOverallProgress } from '../../lib/documents'
import { notificationSystem } from '../../lib/notificationSystem'
import { changePassword } from '../../lib/auth'
import Card from '../ui/Card'
import Button from '../ui/Button'
import NotificationCenter from '../ui/NotificationCenter'
import LoadingSpinner from '../ui/LoadingSpinner'

interface AdminDashboardProps {
  user: any
  onSignOut: () => void
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onSignOut }) => {
  const [startups, setStartups] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [whatsappGroups, setWhatsappGroups] = useState<WhatsAppGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshingGroups, setRefreshingGroups] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditAdmin, setShowEditAdmin] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showMessagePreview, setShowMessagePreview] = useState(false)
  const [showGroupSelection, setShowGroupSelection] = useState(false)
  const [selectedStartup, setSelectedStartup] = useState<any>(null)
  const [previewMessage, setPreviewMessage] = useState('')
  const [availableGroups, setAvailableGroups] = useState<WhatsAppGroup[]>([])
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
    initializeMockData()
    fetchData()
    fetchWhatsAppGroups()
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
      const [startupsData, documentsData, notificationsData] = await Promise.all([
        mockApi.getAllStartups(),
        mockApi.getAllDocuments(),
        mockApi.getAllNotifications()
      ])

      setStartups(startupsData || [])
      setDocuments(documentsData || [])
      setNotifications(notificationsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWhatsAppGroups = async () => {
    try {
      const groups = await mockApi.getWhatsAppGroups()
      setWhatsappGroups(groups)
    } catch (error) {
      console.error('Error fetching WhatsApp groups:', error)
    }
  }

  const handleRefreshGroups = async () => {
    setRefreshingGroups(true)
    try {
      const updatedGroups = await fetchWhatsAppGroupsFromZAPI()
      await mockApi.updateWhatsAppGroups(updatedGroups)
      setWhatsappGroups(updatedGroups)
      setAvailableGroups(updatedGroups)
      alert('Grupos atualizados com sucesso!')
    } catch (error) {
      console.error('Error refreshing groups:', error)
      alert('Erro ao atualizar grupos')
    } finally {
      setRefreshingGroups(false)
    }
  }

  const handlePreviewMessage = (startup: any) => {
    const { uploadedDocs, missingDocs } = getDocumentStatus(documents, startup.id)
    const message = notificationTemplates.reminder(startup.name, missingDocs, uploadedDocs)
    setPreviewMessage(message)
    setSelectedStartup(startup)
    setShowMessagePreview(true)
  }

  const sendReminderMessage = async (startup: any) => {
    try {
      const { uploadedDocs, missingDocs } = getDocumentStatus(documents, startup.id)
      const message = notificationTemplates.reminder(startup.name, missingDocs, uploadedDocs)
      
      // If startup has a linked group, send to group, otherwise send to phone
      const target = startup.whatsapp_group_id || startup.phone
      await sendWhatsAppMessage(target, message)
      
      // Log notification
      await mockApi.addNotification({
        startup_id: startup.id,
        type: 'reminder',
        message,
        status: 'sent',
        whatsapp_message_id: null
      })

      notificationSystem.reminderSent(startup.name)
      await fetchData()
    } catch (error) {
      console.error('Error sending reminder:', error)
      notificationSystem.error('Erro', 'Não foi possível enviar o lembrete')
    }
  }

  const sendBulkReminder = async () => {
    const pendingStartups = startups.filter(s => s.status === 'in_progress' || s.status === 'pending')
    
    if (pendingStartups.length === 0) {
      notificationSystem.info('Nenhuma ação necessária', 'Todas as startups estão com documentos em dia')
      return
    }

    notificationSystem.info(
      'Enviando lembretes em massa',
      `Enviando lembretes para ${pendingStartups.length} startups...`
    )

    try {
      for (const startup of pendingStartups) {
        const { uploadedDocs, missingDocs } = getDocumentStatus(documents, startup.id)
        const message = notificationTemplates.reminder(startup.name, missingDocs, uploadedDocs)
        
        const target = startup.whatsapp_group_id || startup.phone
        await sendWhatsAppMessage(target, message)
        
        await mockApi.addNotification({
          startup_id: startup.id,
          type: 'reminder',
          message,
          status: 'sent',
          whatsapp_message_id: null
        })
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      notificationSystem.success(
        'Lembretes enviados',
        `${pendingStartups.length} lembretes foram enviados com sucesso!`
      )
    } catch (error) {
      console.error('Error sending bulk reminders:', error)
      notificationSystem.error('Erro', 'Falha ao enviar alguns lembretes')
    }
  }

  const handleSaveAdmin = async () => {
    try {
      await mockApi.updateAdmin(user.id, editAdminForm)
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

  const handleSetDeadline = async (startupId: string) => {
    const deadline = prompt('Digite a data limite (DD/MM/AAAA):')
    if (!deadline) return

    try {
      const [day, month, year] = deadline.split('/')
      const deadlineDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      
      await mockApi.updateStartup(startupId, {
        deadline: deadlineDate.toISOString()
      })
      
      await fetchData()
      notificationSystem.success('Prazo definido', `Data limite definida para ${new Date(deadlineDate).toLocaleDateString('pt-BR')}`)
    } catch (error) {
      console.error('Error setting deadline:', error)
      notificationSystem.error('Erro', 'Erro ao definir data limite. Use o formato DD/MM/AAAA')
    }
  }

  const handleLinkGroup = async (startupId: string) => {
    setSelectedStartup(startups.find(s => s.id === startupId))
    setAvailableGroups(whatsappGroups)
    setShowGroupSelection(true)
  }

  const handleSelectGroup = async (groupId: string) => {
    if (!selectedStartup) return
    
    try {
      await mockApi.updateStartup(selectedStartup.id, {
        whatsapp_group_id: groupId
      })
      
      const selectedGroup = availableGroups.find(g => g.id === groupId)
      await fetchData()
      setShowGroupSelection(false)
      notificationSystem.success(
        'Grupo vinculado', 
        `${selectedStartup.name} foi vinculada ao grupo ${selectedGroup?.name}`
      )
    } catch (error) {
      console.error('Error linking group:', error)
      notificationSystem.error('Erro', 'Não foi possível vincular o grupo')
    }
  }

  const updateStartupStatus = async (startupId: string, newStatus: string) => {
    try {
      await mockApi.updateStartup(startupId, { status: newStatus as any })
      await fetchData()
    } catch (error) {
      console.error('Error updating startup status:', error)
      alert('Erro ao atualizar status')
    }
  }

  const getStartupProgress = (startupId: string) => {
    const startupDocs = documents.filter(doc => doc.startup_id === startupId)
    return getOverallProgress(startupDocs)
  }

  const filteredStartups = startups.filter(startup => {
    const matchesFilter = filter === 'all' || startup.status === filter
    const matchesSearch = startup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         startup.cnpj.includes(searchTerm)
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: startups.length,
    completed: startups.filter(s => s.status === 'completed').length,
    inProgress: startups.filter(s => s.status === 'in_progress').length,
    pending: startups.filter(s => s.status === 'pending').length,
    underReview: startups.filter(s => s.status === 'under_review').length
  }

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
                <p className="text-sm text-gray-500">Gestão de Documentos</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Concluído</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Em Andamento</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pendente</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Em Análise</p>
                <p className="text-2xl font-bold text-gray-900">{stats.underReview}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
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
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendente</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluído</option>
              <option value="under_review">Em Análise</option>
            </select>
            <Button
              variant="secondary"
              onClick={handleRefreshGroups}
              loading={refreshingGroups}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Grupos
            </Button>
            <Button onClick={sendBulkReminder}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Enviar Lembretes
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
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Progresso</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Prazo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Grupo WhatsApp</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Última Atividade</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredStartups.map((startup) => {
                  const progress = getStartupProgress(startup.id)
                  const isOverdue = startup.deadline && new Date() > new Date(startup.deadline)
                  const linkedGroup = (whatsappGroups || []).find(g => g.id === startup.whatsapp_group_id)
                  const statusColors = {
                    pending: 'bg-red-100 text-red-800',
                    in_progress: 'bg-orange-100 text-orange-800',
                    completed: 'bg-green-100 text-green-800',
                    under_review: 'bg-purple-100 text-purple-800'
                  }

                  return (
                    <tr key={startup.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{startup.name}</p>
                          <p className="text-sm text-gray-500">{startup.email}</p>
                          <p className="text-sm text-gray-500">{startup.cnpj}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[startup.status as keyof typeof statusColors]}`}>
                          {startup.status === 'pending' && 'Pendente'}
                          {startup.status === 'in_progress' && 'Em Andamento'}
                          {startup.status === 'completed' && 'Concluído'}
                          {startup.status === 'under_review' && 'Em Análise'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {startup.deadline ? (
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              {new Date(startup.deadline).toLocaleDateString('pt-BR')}
                            </span>
                            {isOverdue && <AlertCircle className="h-4 w-4 text-red-500" />}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSetDeadline(startup.id)}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {linkedGroup ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{linkedGroup.name}</span>
                            <span className="text-xs text-gray-500">
                              ({linkedGroup.participants || 0} membros)
                            </span>
                            <Link className="h-4 w-4 text-green-500" />
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleLinkGroup(startup.id)}
                          >
                            <Link className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {new Date(startup.last_activity).toLocaleDateString('pt-BR')}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePreviewMessage(startup)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => sendReminderMessage(startup)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <select
                            value={startup.status}
                            onChange={(e) => updateStartupStatus(startup.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded"
                          >
                            <option value="pending">Pendente</option>
                            <option value="in_progress">Em Andamento</option>
                            <option value="completed">Concluído</option>
                            <option value="under_review">Em Análise</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* WhatsApp Groups */}
        <Card className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Grupos WhatsApp Disponíveis
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefreshGroups}
              loading={refreshingGroups}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {refreshingGroups ? 'Atualizando...' : 'Atualizar da Z-API'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(whatsappGroups || []).map((group) => (
              <div key={group.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{group.name}</p>
                  <UsersIcon className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-sm text-gray-500">{group.id}</p>
                <p className="text-xs text-gray-400">{group.participants || 0} participantes</p>
              </div>
            ))}
          </div>
        </Card>

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

        {/* Message Preview Modal */}
        {showMessagePreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Preview da Mensagem - {selectedStartup?.name}
              </h3>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-line">{previewMessage}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowMessagePreview(false)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  sendReminderMessage(selectedStartup)
                  setShowMessagePreview(false)
                }}>
                  Enviar Mensagem
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Group Selection Modal */}
        {showGroupSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Vincular Grupo WhatsApp - {selectedStartup?.name}
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableGroups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors"
                    onClick={() => handleSelectGroup(group.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-500">{group.participants || 0} participantes</p>
                      </div>
                      <UsersIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="secondary" onClick={() => setShowGroupSelection(false)}>
                  Cancelar
                </Button>
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
          </div>
        )}
      </main>
    </div>
  )
}

export default AdminDashboard