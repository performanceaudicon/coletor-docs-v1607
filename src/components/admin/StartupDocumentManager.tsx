import React, { useState, useEffect } from 'react'
import { FileText, User, CheckCircle, AlertCircle, Clock, Eye, Download, MessageSquare } from 'lucide-react'
import { 
  getAllUsers, 
  getDocumentsByStartup, 
  getAllDocumentConfigs,
  updateUser,
  Document,
  DocumentConfig 
} from '../../lib/firebaseFirestore'
import { downloadFile } from '../../lib/firebaseStorage'
import { notificationSystem } from '../../lib/notificationSystem'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'
import ProgressBar from '../ui/ProgressBar'

interface StartupWithProgress {
  id: string
  name: string
  email: string
  cnpj?: string
  phone?: string
  document_config_id?: string
  lastLogin?: string
  documents: Document[]
  progress: number
  configName?: string
}

const StartupDocumentManager: React.FC = () => {
  const [startups, setStartups] = useState<StartupWithProgress[]>([])
  const [documentConfigs, setDocumentConfigs] = useState<DocumentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStartup, setSelectedStartup] = useState<StartupWithProgress | null>(null)
  const [showAssignConfig, setShowAssignConfig] = useState(false)
  const [assigningConfig, setAssigningConfig] = useState(false)
  const [selectedConfigId, setSelectedConfigId] = useState('')
  const [filter, setFilter] = useState<'all' | 'no-config' | 'incomplete' | 'complete'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [usersData, configsData] = await Promise.all([
        getAllUsers(),
        getAllDocumentConfigs()
      ])

      // Filtrar apenas startups
      const startupUsers = usersData.filter(u => u.role === 'startup')
      
      // Buscar documentos para cada startup
      const startupsWithDocs = await Promise.all(
        startupUsers.map(async (startup) => {
          const documents = await getDocumentsByStartup(startup.id)
          const config = configsData.find(c => c.id === startup.document_config_id)
          
          // Calcular progresso
          const progress = calculateProgress(documents, config)
          
          return {
            ...startup,
            documents,
            progress,
            configName: config?.name || 'Sem configuração'
          }
        })
      )

      setStartups(startupsWithDocs)
      setDocumentConfigs(configsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      notificationSystem.error('Erro', 'Não foi possível carregar os dados')
    } finally {
      setLoading(false)
    }
  }

  const calculateProgress = (documents: Document[], config?: DocumentConfig): number => {
    if (!config) return 0

    const totalRequired = config.categories.reduce((acc, cat) => 
      acc + cat.documents.filter(doc => doc.required).length, 0
    )

    if (totalRequired === 0) return 100

    const uploadedRequired = config.categories.reduce((acc, cat) => {
      const requiredDocs = cat.documents.filter(doc => doc.required)
      const uploadedCount = documents.filter(doc => 
        doc.category === cat.id && 
        requiredDocs.some(reqDoc => reqDoc.id === doc.name)
      ).length
      return acc + uploadedCount
    }, 0)

    return (uploadedRequired / totalRequired) * 100
  }

  const handleAssignConfig = async () => {
    if (!selectedStartup || !selectedConfigId) return

    setAssigningConfig(true)
    try {
      await updateUser(selectedStartup.id, { document_config_id: selectedConfigId })
      
      notificationSystem.success(
        'Configuração atribuída', 
        `Configuração de documentos atribuída à ${selectedStartup.name}`
      )
      
      setShowAssignConfig(false)
      setSelectedStartup(null)
      setSelectedConfigId('')
      await fetchData()
    } catch (error) {
      notificationSystem.error('Erro', 'Não foi possível atribuir a configuração')
    } finally {
      setAssigningConfig(false)
    }
  }

  const handleDownloadDocument = async (document: Document) => {
    try {
      await downloadFile(document.file_url, document.original_filename)
      notificationSystem.success('Download', `${document.original_filename} baixado com sucesso!`)
    } catch (error) {
      notificationSystem.error('Erro', 'Não foi possível fazer o download do arquivo')
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

  const filteredStartups = startups.filter(startup => {
    switch (filter) {
      case 'no-config':
        return !startup.document_config_id
      case 'incomplete':
        return startup.progress < 100
      case 'complete':
        return startup.progress === 100
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Documentos</h2>
        <div className="flex items-center space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">Todas as startups</option>
            <option value="no-config">Sem configuração</option>
            <option value="incomplete">Documentos incompletos</option>
            <option value="complete">Documentos completos</option>
          </select>
          <span className="text-sm text-gray-600">
            {filteredStartups.length} startups
          </span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <User className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Startups</p>
              <p className="text-2xl font-bold text-gray-900">{startups.length}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Sem Configuração</p>
              <p className="text-2xl font-bold text-gray-900">
                {startups.filter(s => !s.document_config_id).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Incompletos</p>
              <p className="text-2xl font-bold text-gray-900">
                {startups.filter(s => s.progress < 100).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completos</p>
              <p className="text-2xl font-bold text-gray-900">
                {startups.filter(s => s.progress === 100).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Lista de Startups */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Startup</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Configuração</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Progresso</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Documentos</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Última Atividade</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredStartups.map((startup) => (
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
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${startup.document_config_id ? 'text-gray-900' : 'text-red-600'}`}>
                        {startup.configName}
                      </span>
                      {!startup.document_config_id && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${startup.progress === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                          style={{ width: `${startup.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{startup.progress.toFixed(0)}%</span>
                    </div>
                  </td>
                  
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {startup.documents.length} documentos
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
                        onClick={() => setSelectedStartup(startup)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedStartup(startup)
                          setSelectedConfigId(startup.document_config_id || '')
                          setShowAssignConfig(true)
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Config
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Detalhes da Startup */}
      {selectedStartup && !showAssignConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Documentos - {selectedStartup.name}
              </h3>
              <Button variant="secondary" onClick={() => setSelectedStartup(null)}>
                ×
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-6">
                <ProgressBar progress={selectedStartup.progress} />
              </div>
              
              {selectedStartup.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum documento enviado ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedStartup.documents.map((document) => (
                    <div key={document.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{document.name}</h4>
                          <p className="text-sm text-gray-500">{document.original_filename}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(document.status)}`}>
                            {getStatusLabel(document.status)}
                          </span>
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
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <p>Categoria: {document.category}</p>
                          <p>Enviado em: {document.uploaded_at?.toDate ? 
                            document.uploaded_at.toDate().toLocaleDateString('pt-BR') :
                            new Date(document.uploaded_at).toLocaleDateString('pt-BR')
                          }</p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(document.file_url, '_blank')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadDocument(document)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atribuir Configuração */}
      {showAssignConfig && selectedStartup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Atribuir Configuração - {selectedStartup.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Configuração de Documentos
                </label>
                <select
                  value={selectedConfigId}
                  onChange={(e) => setSelectedConfigId(e.target.value)}
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
              <Button variant="secondary" onClick={() => setShowAssignConfig(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAssignConfig} loading={assigningConfig}>
                Atribuir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StartupDocumentManager