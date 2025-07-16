import React, { useState, useEffect } from 'react'
import { X, Send, MessageSquare, Eye, User, Phone, Mail } from 'lucide-react'
import { 
  getAllMessageTemplates, 
  MessageTemplate,
  getDocumentsByStartup,
  getDocumentConfig 
} from '../../lib/firebaseFirestore'
import { sendWhatsAppMessage, formatMessage } from '../../lib/zapiIntegration'
import { notificationSystem } from '../../lib/notificationSystem'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'

interface StartupMessagingModalProps {
  startup: any
  onClose: () => void
}

const StartupMessagingModal: React.FC<StartupMessagingModalProps> = ({ startup, onClose }) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [previewMessage, setPreviewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageType, setMessageType] = useState<'template' | 'custom'>('template')
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [startup.id])

  const fetchData = async () => {
    try {
      const [templatesData, documentsData] = await Promise.all([
        getAllMessageTemplates(),
        getDocumentsByStartup(startup.id)
      ])
      
      setTemplates(templatesData)
      setDocuments(documentsData)
    } catch (error) {
      console.error('Error fetching data:', error)
      notificationSystem.error('Erro', 'Não foi possível carregar os dados')
    } finally {
      setLoading(false)
    }
  }

  const generateMessageVariables = async () => {
    try {
      // Buscar configuração de documentos da startup
      const config = await getDocumentConfig(startup.document_config_id || 'default')
      
      const missingDocs: string[] = []
      const uploadedDocs: string[] = []

      if (config) {
        config.categories.forEach(category => {
          category.documents.forEach(doc => {
            if (doc.required) {
              const isUploaded = documents.some(uploadedDoc => 
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
      }

      const uploadedDocsSection = uploadedDocs.length > 0 
        ? `✅ *Documentos já recebidos:*\n${uploadedDocs.map(doc => `• ${doc}`).join('\n')}\n\n`
        : ''

      const missingDocsSection = missingDocs.length > 0
        ? `📋 *Documentos pendentes:*\n${missingDocs.map(doc => `• ${doc}`).join('\n')}\n\n`
        : ''

      return {
        name: startup.name || 'Startup',
        email: startup.email,
        phone: startup.phone || '',
        cnpj: startup.cnpj || '',
        uploadedDocs: uploadedDocs.join(', '),
        missingDocs: missingDocs.join(', '),
        uploadedDocsSection,
        missingDocsSection,
        deadline: startup.deadline ? new Date(startup.deadline).toLocaleDateString('pt-BR') : 'Não definido',
        progress: `${Math.round((uploadedDocs.length / (uploadedDocs.length + missingDocs.length)) * 100)}%`
      }
    } catch (error) {
      console.error('Error generating variables:', error)
      return {
        name: startup.name || 'Startup',
        email: startup.email,
        phone: startup.phone || '',
        cnpj: startup.cnpj || '',
        uploadedDocs: '',
        missingDocs: '',
        uploadedDocsSection: '',
        missingDocsSection: '',
        deadline: 'Não definido',
        progress: '0%'
      }
    }
  }

  const handleTemplateSelect = async (template: MessageTemplate) => {
    setSelectedTemplate(template)
    const variables = await generateMessageVariables()
    const formatted = formatMessage(template.content, variables)
    setPreviewMessage(formatted)
  }

  const handleSendMessage = async () => {
    if (!startup.phone && !startup.whatsapp_group_id) {
      notificationSystem.error('Erro', 'Startup não possui telefone ou grupo WhatsApp configurado')
      return
    }

    const messageToSend = messageType === 'template' ? previewMessage : customMessage
    
    if (!messageToSend.trim()) {
      notificationSystem.error('Erro', 'Mensagem não pode estar vazia')
      return
    }

    setSending(true)
    try {
      const target = startup.whatsapp_group_id || startup.phone
      const result = await sendWhatsAppMessage(target, messageToSend)
      
      if (result.success) {
        notificationSystem.success(
          'Mensagem enviada', 
          `Mensagem enviada com sucesso para ${startup.name}`
        )
        onClose()
      } else {
        notificationSystem.error('Erro', `Falha ao enviar mensagem: ${result.error}`)
      }
    } catch (error: any) {
      notificationSystem.error('Erro', 'Não foi possível enviar a mensagem: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  const getTemplateTypeLabel = (type: string) => {
    const labels = {
      reminder: 'Lembrete',
      completion: 'Conclusão',
      welcome: 'Boas-vindas',
      follow_up: 'Follow-up',
      deadline: 'Prazo'
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTemplateTypeColor = (type: string) => {
    const colors = {
      reminder: 'bg-orange-100 text-orange-800',
      completion: 'bg-green-100 text-green-800',
      welcome: 'bg-blue-100 text-blue-800',
      follow_up: 'bg-yellow-100 text-yellow-800',
      deadline: 'bg-red-100 text-red-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Enviar Mensagem</h2>
              <p className="text-sm text-gray-600">{startup.name}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar - Startup Info */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Startup</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Nome:</span>
                  <span className="text-sm font-medium">{startup.name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium">{startup.email}</span>
                </div>
                
                {startup.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Telefone:</span>
                    <span className="text-sm font-medium">{startup.phone}</span>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Documentos enviados:</p>
                  <p className="text-lg font-semibold text-orange-600">{documents.length}</p>
                </div>
              </div>
            </Card>

            {/* Message Type Selection */}
            <Card className="mt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Mensagem</h3>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="template"
                    checked={messageType === 'template'}
                    onChange={(e) => setMessageType(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">Usar template</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="custom"
                    checked={messageType === 'custom'}
                    onChange={(e) => setMessageType(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">Mensagem personalizada</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {messageType === 'template' ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Selecionar Template</h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${getTemplateTypeColor(template.type)}`}>
                          {getTemplateTypeLabel(template.type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {template.content.substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>

                {selectedTemplate && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Preview da Mensagem</h4>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(previewMessage)
                          notificationSystem.success('Copiado', 'Mensagem copiada para a área de transferência')
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                        {previewMessage}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Mensagem Personalizada</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Digite sua mensagem:
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Digite sua mensagem personalizada aqui..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customMessage.length} caracteres
                  </p>
                </div>
              </div>
            )}

            {/* Send Button */}
            <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendMessage}
                loading={sending}
                disabled={
                  (messageType === 'template' && !selectedTemplate) ||
                  (messageType === 'custom' && !customMessage.trim())
                }
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Mensagem
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StartupMessagingModal