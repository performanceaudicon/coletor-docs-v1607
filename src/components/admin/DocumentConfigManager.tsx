import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Save, X, FileText, Folder } from 'lucide-react'
import { 
  DocumentConfig, 
  DocumentCategory, 
  DocumentItem,
  createDocumentConfig,
  updateDocumentConfig,
  getAllDocumentConfigs,
  deleteDocumentConfig
} from '../../lib/firebaseFirestore'
import { notificationSystem } from '../../lib/notificationSystem'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'

const DocumentConfigManager: React.FC = () => {
  const [configs, setConfigs] = useState<DocumentConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [editingConfig, setEditingConfig] = useState<DocumentConfig | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newConfig, setNewConfig] = useState<Partial<DocumentConfig>>({
    name: '',
    description: '',
    categories: []
  })

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    try {
      const configsData = await getAllDocumentConfigs()
      setConfigs(configsData)
    } catch (error) {
      console.error('Error fetching configs:', error)
      notificationSystem.error('Erro', 'Não foi possível carregar as configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateConfig = async () => {
    if (!newConfig.name) {
      notificationSystem.error('Erro', 'Nome da configuração é obrigatório')
      return
    }

    try {
      await createDocumentConfig({
        name: newConfig.name,
        description: newConfig.description || '',
        categories: newConfig.categories || [],
        created_by: 'admin' // In real app, get from auth context
      })
      
      notificationSystem.success('Sucesso', 'Configuração criada com sucesso!')
      setShowCreateForm(false)
      setNewConfig({ name: '', description: '', categories: [] })
      fetchConfigs()
    } catch (error) {
      console.error('Error creating config:', error)
      notificationSystem.error('Erro', 'Não foi possível criar a configuração')
    }
  }

  const handleUpdateConfig = async (config: DocumentConfig) => {
    try {
      await updateDocumentConfig(config.id, {
        name: config.name,
        description: config.description,
        categories: config.categories
      })
      
      notificationSystem.success('Sucesso', 'Configuração atualizada com sucesso!')
      setEditingConfig(null)
      fetchConfigs()
    } catch (error) {
      console.error('Error updating config:', error)
      notificationSystem.error('Erro', 'Não foi possível atualizar a configuração')
    }
  }

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar esta configuração?')) return

    try {
      await deleteDocumentConfig(id)
      notificationSystem.success('Sucesso', 'Configuração deletada com sucesso!')
      fetchConfigs()
    } catch (error) {
      console.error('Error deleting config:', error)
      notificationSystem.error('Erro', 'Não foi possível deletar a configuração')
    }
  }

  const addCategory = (config: DocumentConfig | Partial<DocumentConfig>) => {
    const newCategory: DocumentCategory = {
      id: Date.now().toString(),
      name: 'Nova Categoria',
      documents: []
    }

    if (editingConfig && config === editingConfig) {
      setEditingConfig({
        ...editingConfig,
        categories: [...editingConfig.categories, newCategory]
      })
    } else if (config === newConfig) {
      setNewConfig({
        ...newConfig,
        categories: [...(newConfig.categories || []), newCategory]
      })
    }
  }

  const updateCategory = (
    config: DocumentConfig | Partial<DocumentConfig>, 
    categoryIndex: number, 
    updates: Partial<DocumentCategory>
  ) => {
    const categories = [...(config.categories || [])]
    categories[categoryIndex] = { ...categories[categoryIndex], ...updates }

    if (editingConfig && config === editingConfig) {
      setEditingConfig({ ...editingConfig, categories })
    } else if (config === newConfig) {
      setNewConfig({ ...newConfig, categories })
    }
  }

  const removeCategory = (config: DocumentConfig | Partial<DocumentConfig>, categoryIndex: number) => {
    const categories = [...(config.categories || [])]
    categories.splice(categoryIndex, 1)

    if (editingConfig && config === editingConfig) {
      setEditingConfig({ ...editingConfig, categories })
    } else if (config === newConfig) {
      setNewConfig({ ...newConfig, categories })
    }
  }

  const addDocument = (config: DocumentConfig | Partial<DocumentConfig>, categoryIndex: number) => {
    const newDocument: DocumentItem = {
      id: Date.now().toString(),
      name: 'Novo Documento',
      required: true,
      description: ''
    }

    const categories = [...(config.categories || [])]
    categories[categoryIndex].documents.push(newDocument)

    if (editingConfig && config === editingConfig) {
      setEditingConfig({ ...editingConfig, categories })
    } else if (config === newConfig) {
      setNewConfig({ ...newConfig, categories })
    }
  }

  const updateDocument = (
    config: DocumentConfig | Partial<DocumentConfig>,
    categoryIndex: number,
    documentIndex: number,
    updates: Partial<DocumentItem>
  ) => {
    const categories = [...(config.categories || [])]
    categories[categoryIndex].documents[documentIndex] = {
      ...categories[categoryIndex].documents[documentIndex],
      ...updates
    }

    if (editingConfig && config === editingConfig) {
      setEditingConfig({ ...editingConfig, categories })
    } else if (config === newConfig) {
      setNewConfig({ ...newConfig, categories })
    }
  }

  const removeDocument = (
    config: DocumentConfig | Partial<DocumentConfig>,
    categoryIndex: number,
    documentIndex: number
  ) => {
    const categories = [...(config.categories || [])]
    categories[categoryIndex].documents.splice(documentIndex, 1)

    if (editingConfig && config === editingConfig) {
      setEditingConfig({ ...editingConfig, categories })
    } else if (config === newConfig) {
      setNewConfig({ ...newConfig, categories })
    }
  }

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
        <h2 className="text-2xl font-bold text-gray-900">Configurações de Documentos</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nova Configuração</h3>
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={newConfig.name || ''}
                  onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: Documentos para Rodada Seed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={newConfig.description || ''}
                  onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Descrição opcional"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Categorias</h4>
                <Button size="sm" variant="secondary" onClick={() => addCategory(newConfig)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Categoria
                </Button>
              </div>

              {(newConfig.categories || []).map((category, categoryIndex) => (
                <div key={category.id} className="border rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategory(newConfig, categoryIndex, { name: e.target.value })}
                      className="font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-2 py-1"
                    />
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => addDocument(newConfig, categoryIndex)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Documento
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => removeCategory(newConfig, categoryIndex)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {category.documents.map((document, documentIndex) => (
                    <div key={document.id} className="bg-gray-50 rounded p-3 mb-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={document.name}
                            onChange={(e) => updateDocument(newConfig, categoryIndex, documentIndex, { name: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={document.description || ''}
                            onChange={(e) => updateDocument(newConfig, categoryIndex, documentIndex, { description: e.target.value })}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                            placeholder="Descrição"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={document.required}
                              onChange={(e) => updateDocument(newConfig, categoryIndex, documentIndex, { required: e.target.checked })}
                              className="mr-1"
                            />
                            <span className="text-sm">Obrigatório</span>
                          </label>
                        </div>
                        <div className="col-span-1">
                          <Button size="sm" variant="danger" onClick={() => removeDocument(newConfig, categoryIndex, documentIndex)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="secondary" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateConfig}>
                <Save className="h-4 w-4 mr-2" />
                Criar Configuração
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Configs List */}
      <div className="grid gap-6">
        {configs.map((config) => (
          <Card key={config.id}>
            {editingConfig?.id === config.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Editando Configuração</h3>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleUpdateConfig(editingConfig)}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingConfig(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                    <input
                      type="text"
                      value={editingConfig.name}
                      onChange={(e) => setEditingConfig({ ...editingConfig, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <input
                      type="text"
                      value={editingConfig.description || ''}
                      onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Categories - Similar structure as create form */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Categorias</h4>
                    <Button size="sm" variant="secondary" onClick={() => addCategory(editingConfig)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Categoria
                    </Button>
                  </div>

                  {editingConfig.categories.map((category, categoryIndex) => (
                    <div key={category.id} className="border rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <input
                          type="text"
                          value={category.name}
                          onChange={(e) => updateCategory(editingConfig, categoryIndex, { name: e.target.value })}
                          className="font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-orange-500 rounded px-2 py-1"
                        />
                        <div className="flex space-x-2">
                          <Button size="sm" variant="secondary" onClick={() => addDocument(editingConfig, categoryIndex)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Documento
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => removeCategory(editingConfig, categoryIndex)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {category.documents.map((document, documentIndex) => (
                        <div key={document.id} className="bg-gray-50 rounded p-3 mb-2">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={document.name}
                                onChange={(e) => updateDocument(editingConfig, categoryIndex, documentIndex, { name: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                              />
                            </div>
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={document.description || ''}
                                onChange={(e) => updateDocument(editingConfig, categoryIndex, documentIndex, { description: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-orange-500"
                                placeholder="Descrição"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={document.required}
                                  onChange={(e) => updateDocument(editingConfig, categoryIndex, documentIndex, { required: e.target.checked })}
                                  className="mr-1"
                                />
                                <span className="text-sm">Obrigatório</span>
                              </label>
                            </div>
                            <div className="col-span-1">
                              <Button size="sm" variant="danger" onClick={() => removeDocument(editingConfig, categoryIndex, documentIndex)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                    {config.description && (
                      <p className="text-sm text-gray-600">{config.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditingConfig(config)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteConfig(config.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {config.categories.map((category) => (
                    <div key={category.id} className="border rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <Folder className="h-5 w-5 text-orange-600 mr-2" />
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <span className="ml-2 text-sm text-gray-500">
                          ({category.documents.length} documentos)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {category.documents.map((document) => (
                          <div key={document.id} className="flex items-center p-2 bg-gray-50 rounded">
                            <FileText className="h-4 w-4 text-gray-500 mr-2" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{document.name}</p>
                              {document.description && (
                                <p className="text-xs text-gray-600">{document.description}</p>
                              )}
                            </div>
                            {document.required && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                Obrigatório
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DocumentConfigManager