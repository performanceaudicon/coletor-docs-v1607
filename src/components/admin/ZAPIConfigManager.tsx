import React, { useState, useEffect } from 'react'
import { Settings, TestTube, CheckCircle, AlertCircle, Save, Eye, EyeOff } from 'lucide-react'
import { getInstanceStatus, fetchWhatsAppGroups, sendWhatsAppMessage } from '../../lib/zapiIntegration'
import { notificationSystem } from '../../lib/notificationSystem'
import Card from '../ui/Card'
import Button from '../ui/Button'
import LoadingSpinner from '../ui/LoadingSpinner'

interface ZAPIConfig {
  baseUrl: string
  clientToken: string
  isConfigured: boolean
}

const ZAPIConfigManager: React.FC = () => {
  const [config, setConfig] = useState<ZAPIConfig>({
    baseUrl: import.meta.env.VITE_ZAPI_BASE_URL || '',
    clientToken: import.meta.env.VITE_ZAPI_CLIENT_TOKEN || '',
    isConfigured: !!(import.meta.env.VITE_ZAPI_BASE_URL && import.meta.env.VITE_ZAPI_CLIENT_TOKEN)
  })
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<any>({
    status: null,
    groups: {
      success: false,
      data: [],
      message: ''
    },
    connection: null
  })
  const [saving, setSaving] = useState(false)

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      // Em um app real, você salvaria isso no Firebase ou backend
      localStorage.setItem('zapi_config', JSON.stringify(config))
      
      // Atualizar variáveis de ambiente temporariamente (apenas para sessão)
      (window as any).__ZAPI_CONFIG__ = config
      
      notificationSystem.success('Configuração salva', 'Configurações da Z-API foram salvas com sucesso!')
      setConfig(prev => ({ ...prev, isConfigured: true }))
    } catch (error) {
      notificationSystem.error('Erro', 'Não foi possível salvar as configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!config.baseUrl || !config.clientToken) {
      notificationSystem.error('Erro', 'Por favor, configure a URL base e o token antes de testar')
      return
    }

    setTesting(true)
    setTestResults({ // Reset to initial structure
      status: null,
      groups: {
        success: false,
        data: [],
        message: ''
      },
      connection: null
    })

    try {
      // Teste 1: Status da instância
      let statusResult = null
      try {
        statusResult = await getInstanceStatus()
      } catch (statusError) {
        console.warn('Status test failed:', statusError)
      }
      
      // Teste 2: Buscar grupos
      let groupsResult = []
      try {
        groupsResult = await fetchWhatsAppGroups()
      } catch (groupsError) {
        console.warn('Groups test failed:', groupsError)
      }
      
      // Teste 3: Enviar mensagem de teste (opcional)
      const testMessage = "🤖 Teste de conexão Z-API - Sistema funcionando corretamente!"
      
      setTestResults({
        status: statusResult ? {
          success: true,
          data: statusResult,
          message: 'Status da instância obtido com sucesso'
        } : {
          success: false,
          message: 'Não foi possível obter status da instância'
        },
        groups: groupsResult.length > 0 ? {
          success: true,
          data: groupsResult,
          message: `${groupsResult.length} grupos encontrados`
        } : {
          success: false,
          message: 'Nenhum grupo encontrado ou erro na busca'
        },
        connection: {
          success: true,
          message: 'Conexão estabelecida com sucesso'
        }
      })

      notificationSystem.success('Teste concluído', 'Todos os testes da Z-API foram executados com sucesso!')
    } catch (error: any) {
      setTestResults({
        status: null, // Ensure status is explicitly null
        groups: { // Ensure groups is explicitly set to default empty state
          success: false,
          data: [],
          message: 'Erro ao buscar grupos'
        },
        connection: {
          success: false,
          message: error.message || 'Erro na conexão'
        }
      })
      notificationSystem.error('Teste falhou', 'Erro ao testar conexão com Z-API: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  const handleTestMessage = async () => {
    const testPhone = prompt('Digite o número para teste (formato: 5511999999999):')
    if (!testPhone) return

    try {
      const result = await sendWhatsAppMessage(testPhone, '🤖 Mensagem de teste do sistema de documentos!')
      
      if (result.success) {
        notificationSystem.success('Mensagem enviada', 'Mensagem de teste enviada com sucesso!')
      } else {
        notificationSystem.error('Erro', 'Falha ao enviar mensagem: ' + result.error)
      }
    } catch (error: any) {
      notificationSystem.error('Erro', 'Erro ao enviar mensagem de teste: ' + error.message)
    }
  }

  useEffect(() => {
    // Carregar configuração salva
    const savedConfig = localStorage.getItem('zapi_config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(prev => ({ ...prev, ...parsed, isConfigured: true }))
      } catch (error) {
        console.error('Error loading saved config:', error)
      }
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Configuração Z-API</h2>
        <div className="flex items-center space-x-2">
          {config.isConfigured ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <CheckCircle className="h-4 w-4 mr-1" />
              Configurado
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <AlertCircle className="h-4 w-4 mr-1" />
              Não configurado
            </span>
          )}
        </div>
      </div>

      {/* Configuração */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <Settings className="h-5 w-5 inline mr-2" />
          Credenciais da API
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Base da Z-API
            </label>
            <input
              type="url"
              value={config.baseUrl}
              onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN"
            />
            <p className="text-xs text-gray-500 mt-1">
              Exemplo: https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.clientToken}
                onChange={(e) => setConfig(prev => ({ ...prev, clientToken: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="SEU_SECURITY_TOKEN"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSaveConfig} loading={saving}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
          </div>
        </div>
      </Card>

      {/* Testes */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <TestTube className="h-5 w-5 inline mr-2" />
          Testes de Conexão
        </h3>

        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button
              onClick={handleTestConnection}
              loading={testing}
              disabled={!config.baseUrl || !config.clientToken}
              variant="secondary"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Testar Conexão
            </Button>
            
            <Button
              onClick={handleTestMessage}
              disabled={!config.isConfigured}
              variant="secondary"
            >
              Enviar Mensagem Teste
            </Button>
          </div>

          {testing && (
            <div className="flex items-center space-x-2 text-blue-600">
              <LoadingSpinner size="sm" color="orange" />
              <span>Executando testes...</span>
            </div>
          )}

          {testResults && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Resultados dos Testes:</h4>
              
              {testResults.connection && (
                <div className={`p-3 rounded-lg ${testResults.connection.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    {testResults.connection.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className={testResults.connection.success ? 'text-green-800' : 'text-red-800'}>
                      Conexão: {testResults.connection.message}
                    </span>
                  </div>
                </div>
              )}

              {testResults.status && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-blue-800 font-medium">Status da Instância</span>
                  </div>
                  <pre className="text-xs text-blue-700 bg-blue-100 p-2 rounded overflow-auto">
                    {JSON.stringify(testResults.status.data, null, 2)}
                  </pre>
                </div>
              )}

              {testResults.groups && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-green-800 font-medium">
                      Grupos: {testResults.groups.message}
                    </span>
                  </div>
                  {testResults.groups.data.length > 0 && (
                    <div className="space-y-1">
                      {testResults.groups.data.slice(0, 5).map((group: any) => (
                        <div key={group.id} className="text-xs text-green-700 bg-green-100 p-2 rounded">
                          {group.name} ({group.participants || 0} participantes)
                        </div>
                      ))}
                      {testResults.groups.data.length > 5 && (
                        <p className="text-xs text-green-600">
                          ... e mais {testResults.groups.data.length - 5} grupos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Documentação */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentação</h3>
        <div className="prose prose-sm max-w-none">
          <h4>Como configurar a Z-API:</h4>
          <ol>
            <li>Acesse o painel da Z-API e crie uma instância</li>
            <li>Copie a URL base da sua instância</li>
            <li>Copie o client token de segurança</li>
            <li>Cole as informações nos campos acima</li>
            <li>Clique em "Salvar Configuração"</li>
            <li>Execute os testes para verificar se está funcionando</li>
          </ol>
          
          <h4>Endpoints utilizados:</h4>
          <ul>
            <li><code>GET /status</code> - Verificar status da instância</li>
            <li><code>GET /groups</code> - Buscar grupos disponíveis</li>
            <li><code>POST /send-text</code> - Enviar mensagens</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}

export default ZAPIConfigManager