// Z-API Integration following the exact pattern provided
export interface ZAPIGroup {
  id: string
  name: string
  isGroup: boolean
  participants?: number
}

export interface ZAPIMessage {
  phone: string
  message: string
}

export interface ZAPIResponse {
  success: boolean
  messageId?: string
  error?: string
}

const ZAPI_BASE_URL = import.meta.env.VITE_ZAPI_BASE_URL
const ZAPI_CLIENT_TOKEN = import.meta.env.VITE_ZAPI_CLIENT_TOKEN

// Function to get runtime config (for when admin saves config in localStorage)
const getRuntimeConfig = () => {
  const runtimeConfig = (window as any).__ZAPI_CONFIG__
  if (runtimeConfig) {
    return {
      baseUrl: runtimeConfig.baseUrl,
      clientToken: runtimeConfig.clientToken
    }
  }
  
  // Try localStorage
  try {
    const savedConfig = localStorage.getItem('zapi_config')
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig)
      return {
        baseUrl: parsed.baseUrl,
        clientToken: parsed.clientToken
      }
    }
  } catch (error) {
    console.error('Error loading saved config:', error)
  }
  
  return {
    baseUrl: ZAPI_BASE_URL,
    clientToken: ZAPI_CLIENT_TOKEN
  }
}

if (!ZAPI_BASE_URL || !ZAPI_CLIENT_TOKEN) {
  console.warn('Z-API configuration missing. Please set VITE_ZAPI_BASE_URL and VITE_ZAPI_CLIENT_TOKEN in your .env file')
}

// Fetch WhatsApp groups following Z-API pattern
export const fetchWhatsAppGroups = async (page: number = 1, pageSize: number = 20): Promise<ZAPIGroup[]> => {
  const config = getRuntimeConfig()
  
  if (!config.baseUrl || !config.clientToken) {
    throw new Error('Z-API não configurado. Verifique as variáveis de ambiente.')
  }

  try {
    const url = `${config.baseUrl}/groups?page=${page}&pageSize=${pageSize}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'client-token': config.clientToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    
    // Handle different response formats from Z-API
    let groups = []
    
    if (Array.isArray(data)) {
      groups = data
    } else if (data.groups && Array.isArray(data.groups)) {
      groups = data.groups
    } else if (data.data && Array.isArray(data.data)) {
      groups = data.data
    } else if (data.result && Array.isArray(data.result)) {
      groups = data.result
    } else {
      console.warn('Unexpected Z-API response format:', data)
      return []
    }
    
    return groups.map((group: any) => ({
      id: group.id || group.groupId || group.chatId,
      name: group.name || group.subject || group.title || 'Grupo sem nome',
      isGroup: true,
      participants: group.participants?.length || group.participantsCount || 0
    }))
  } catch (error: any) {
    console.error('Error fetching WhatsApp groups:', error)
    throw new Error('Erro ao buscar grupos do WhatsApp: ' + error.message)
  }
}

// Send WhatsApp message following Z-API pattern
export const sendWhatsAppMessage = async (phone: string, message: string): Promise<ZAPIResponse> => {
  const config = getRuntimeConfig()
  
  if (!config.baseUrl || !config.clientToken) {
    throw new Error('Z-API não configurado. Verifique as variáveis de ambiente.')
  }

  try {
    const url = `${config.baseUrl}/send-text`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'client-token': config.clientToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phone,
        message: message
      })
    })

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      success: data.success || true,
      messageId: data.messageId || data.id,
      error: data.error
    }
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Send message to WhatsApp group
export const sendGroupMessage = async (groupId: string, message: string): Promise<ZAPIResponse> => {
  const config = getRuntimeConfig()
  
  if (!config.baseUrl || !config.clientToken) {
    throw new Error('Z-API não configurado. Verifique as variáveis de ambiente.')
  }

  try {
    const url = `${config.baseUrl}/send-text`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'client-token': config.clientToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: groupId,
        message: message
      })
    })

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      success: data.success || true,
      messageId: data.messageId || data.id,
      error: data.error
    }
  } catch (error: any) {
    console.error('Error sending group message:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Get instance status
export const getInstanceStatus = async (): Promise<any> => {
  const config = getRuntimeConfig()
  
  if (!config.baseUrl || !config.clientToken) {
    throw new Error('Z-API não configurado. Verifique as variáveis de ambiente.')
  }

  try {
    const url = `${config.baseUrl}/status`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'client-token': config.clientToken,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.status} - ${response.statusText}`)
    }

    return await response.json()
  } catch (error: any) {
    console.error('Error getting instance status:', error)
    throw new Error('Erro ao verificar status da instância: ' + error.message)
  }
}

// Validate phone number format for Brazil
export const validatePhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  let cleanPhone = phone.replace(/\D/g, '')
  
  // Add country code if not present
  if (cleanPhone.length === 11 && cleanPhone.startsWith('11')) {
    cleanPhone = '55' + cleanPhone
  } else if (cleanPhone.length === 10) {
    cleanPhone = '5511' + cleanPhone
  } else if (!cleanPhone.startsWith('55')) {
    cleanPhone = '55' + cleanPhone
  }
  
  return cleanPhone
}

// Format message with variables
export const formatMessage = (template: string, variables: Record<string, any>): string => {
  let formattedMessage = template
  
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`
    formattedMessage = formattedMessage.replace(new RegExp(placeholder, 'g'), variables[key])
  })
  
  return formattedMessage
}