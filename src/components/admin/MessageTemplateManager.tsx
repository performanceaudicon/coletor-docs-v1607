import React, { useState, useEffect } from 'react'
import { Edit, Save, X, MessageSquare, Eye } from 'lucide-react'
import { 
  MessageTemplate,
  createMessageTemplate,
  updateMessageTemplate,
  getAllMessageTemplates
} from '../../lib/firebaseFirestore'
import { formatMessage } from '../../lib/zapiIntegration'
import { notificationSystem } from '../../lib/notificationSystem'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'

const MessageTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null)
  const [previewMessage, setPreviewMessage] = useState('')

  const defaultTemplates = [
    {
      name: 'Lembrete',
      type: 'reminder' as const,
      content: `Olá {name}! 👋

Notamos que você ainda não concluiu o envio de todos os documentos necessários.

{uploadedDocsSection}

{missingDocsSection}

Por favor, acesse o sistema para completar o envio dos documentos pendentes.

Precisa de ajuda? Entre em contato conosco!
📞 WhatsApp: (11) 99999-9999
📧 Email: suporte@empresa.com

Contamos com você! 💪`,
      variables: ['name', 'uploadedDocs', 'missingDocs', 'uploadedDocsSection', 'missingDocsSection']
    },
    {
      name: 'Conclusão',
      type: 'completion' as const,
      content: `Parabéns {name}! 🎉

Recebemos todos os seus documentos! Obrigado pela colaboração.

Nossa equipe seguirá com a análise e entraremos em contato em breve.

Obrigado! 🙏`,
      variables: ['name']
    },
    {
      name: 'Boas-vindas',
      type: 'welcome' as const,
      content: `Bem-vindo {name}! 👋

Seu acesso ao sistema de documentos foi criado com sucesso!

Acesse o sistema e comece a enviar seus documentos.

Vamos começar? 🚀`,
      variables: ['name']
    },
    {
      name: 'Follow-up',
      type: 'follow_up' as const,
      content: `Oi {name}! 📋

Lembrete gentil: ainda temos alguns documentos pendentes.

Por favor, acesse o sistema para completar o envio.

Contamos com você! 💪`,
      variables: ['name']
    },
    {
      name: 'Prazo',
      type: 'deadline' as const,
      content: `Atenção {name}! ⏰

O prazo para envio dos documentos é até {deadline}.

Por favor, complete o envio o quanto antes para evitar atrasos.

Precisa de ajuda? Entre em contato conosco! 🚨`,
      variables: ['name', 'deadline']
    }
  ]

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const templatesData = await getAllMessageTemplates()
      
      // If no templates exist, create default ones
      if (templatesData.length === 0) {
        for (const template of defaultTemplates) {
          await createMessageTemplate(template)
        }
        // Fetch again after creating defaults
        const newTemplatesData = await getAllMessageTemplates()
        setTemplates(newTemplatesData)
      } else {
        setTemplates(templatesData)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      notificationSystem.error('Erro', 'Não foi possível carregar os templates')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTemplate = async (template: MessageTemplate) => {
    try {
      await updateMessageTemplate(template.id, {
        content: template.content,
        variables: template.variables
      })
      
      notificationSystem.success('Sucesso', 'Template atualizado com sucesso!')
      setEditingTemplate(null)
      fetchTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      notificationSystem.error('Erro', 'Não foi possível atualizar o template')
    }
  }

  const handlePreview = (template: MessageTemplate) => {
    const sampleVariables = {
      name: 'Startup Exemplo',
      deadline: '31/12/2024',
      uploadedDocs: 'Captable, Business Plan',
      missingDocs: 'Certidões, Balancetes',
      uploadedDocsSection: `✅ *Documentos já recebidos:*
• Captable e organograma atual
• Budget e Business Plan para os próximos 3 anos

`,
      missingDocsSection: `📋 *Documentos pendentes:*
• Certidões de tributos, processos judiciais, protestos e trabalhistas
• Balancetes e demonstrações financeiras auditadas dos últimos 3 anos

`
    }

    const formatted = formatMessage(template.content, sampleVariables)
    setPreviewMessage(formatted)
    setPreviewTemplate(template)
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
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Templates de Mensagem</h2>
        <div className="text-sm text-gray-600">
          {templates.length} templates configurados
        </div>
      </div>

      <div className="grid gap-6">
        {templates.map((template) => (
          <Card key={template.id}>
            {editingTemplate?.id === template.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTemplateTypeColor(template.type)}`}>
                        {getTemplateTypeLabel(template.type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleUpdateTemplate(editingTemplate)}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingTemplate(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo da Mensagem
                  </label>
                  <textarea
                    value={editingTemplate.content}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                    placeholder="Digite o conteúdo da mensagem..."
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Variáveis Disponíveis:</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full font-mono cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          const textarea = document.querySelector('textarea')
                          if (textarea) {
                            const cursorPos = textarea.selectionStart
                            const textBefore = editingTemplate.content.substring(0, cursorPos)
                            const textAfter = editingTemplate.content.substring(cursorPos)
                            const newContent = textBefore + `{${variable}}` + textAfter
                            setEditingTemplate({ ...editingTemplate, content: newContent })
                          }
                        }}
                      >
                        {`{${variable}}`}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Clique em uma variável para inserir no texto
                  </p>
                </div>
              </div>
            ) : (
              // View Mode
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTemplateTypeColor(template.type)}`}>
                        {getTemplateTypeLabel(template.type)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => handlePreview(template)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingTemplate(template)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Conteúdo:</h4>
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {template.content}
                  </pre>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Variáveis:</h4>
                  <div className="flex flex-wrap gap-2">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-mono"
                      >
                        {`{${variable}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Preview: {previewTemplate.name}
              </h3>
              <Button variant="secondary" onClick={() => setPreviewTemplate(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">
                Mensagem formatada (com dados de exemplo):
              </h4>
              <div className="bg-white rounded p-3 border">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {previewMessage}
                </pre>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>* Este é um preview com dados de exemplo. Na mensagem real, as variáveis serão substituídas pelos dados reais da startup.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageTemplateManager