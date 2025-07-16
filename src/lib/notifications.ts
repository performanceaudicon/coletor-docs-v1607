import { documentCategories } from './documents'

// Mock Z-API Integration for WhatsApp notifications
interface ZAPIMessage {
  phone: string
  message: string
}

export const sendWhatsAppMessage = async (phone: string, message: string) => {
  // Mock WhatsApp message sending
  console.log('Mock WhatsApp message sent to:', phone)
  console.log('Message:', message)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return {
    success: true,
    messageId: `mock_${Date.now()}`
  }
}

export const refreshWhatsAppGroups = async () => {
  // Mock API call to Z-API to get updated groups
  console.log('Mock: Refreshing WhatsApp groups from Z-API')
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Mock updated groups (in real implementation, this would come from Z-API)
  return [
    {
      id: 'group1@g.us',
      name: 'Startups - Documentos Pendentes',
      isGroup: true
    },
    {
      id: 'group2@g.us', 
      name: 'Equipe Administrativa',
      isGroup: true
    },
    {
      id: 'group3@g.us',
      name: 'Notificações Gerais',
      isGroup: true
    },
    {
      id: 'group4@g.us',
      name: 'Novo Grupo Atualizado',
      isGroup: true
    }
  ]
}

export const sendHelpMessage = async (phone: string, userName: string) => {
  const message = `Olá ${userName}! 👋\n\nPrecisa de ajuda com o envio dos documentos?\n\nNossa equipe está aqui para te auxiliar! Entre em contato conosco:\n\n📞 WhatsApp: (11) 99999-9999\n📧 Email: suporte@empresa.com\n\nEstamos prontos para ajudar! 😊`
  
  return await sendWhatsAppMessage(phone, message)
}

export const notificationTemplates = {
  reminder: (name: string, missingDocs: string[], uploadedDocs: string[]) => {
    let message = `Olá ${name}! 👋\n\nNotamos que você ainda não concluiu o envio de todos os documentos necessários.\n\n`
    
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
    
    return message
  },
  
  completion: (name: string) => 
    `Parabéns ${name}! 🎉\n\nRecebemos todos os seus documentos! Obrigado pela colaboração.\n\nNossa equipe seguirá com a análise e entraremos em contato em breve.\n\nObrigado! 🙏`,
  
  welcome: (name: string) => 
    `Bem-vindo ${name}! 👋\n\nSeu acesso ao sistema de documentos foi criado com sucesso!\n\nAcesse: [LINK]\n\nVamos começar? 🚀`,
  
  followUp: (name: string) => 
    `Oi ${name}! 📋\n\nLembrete gentil: ainda temos alguns documentos pendentes.\n\nPor favor, acesse o sistema para completar o envio.\n\nContamos com você! 💪`,

  deadline: (name: string, deadline: string) =>
    `Atenção ${name}! ⏰\n\nO prazo para envio dos documentos é até ${deadline}.\n\nPor favor, complete o envio o quanto antes para evitar atrasos.\n\nPrecisa de ajuda? Entre em contato conosco! 🚨`
}

// Function to get missing and uploaded documents for a startup
export const getDocumentStatus = (documents: any[], startupId: string) => {
  const uploadedDocs: string[] = []
  const missingDocs: string[] = []
  
  // Get all required documents from categories
  documentCategories.forEach((category: any) => {
    category.documents.forEach((doc: any) => {
      if (doc.required) {
        const isUploaded = documents.some(uploadedDoc => 
          uploadedDoc.startup_id === startupId && 
          uploadedDoc.category === category.id && 
          uploadedDoc.name === doc.id
        )
        
        if (isUploaded) {
          uploadedDocs.push(`${category.name}: ${doc.name}`)
        } else {
          missingDocs.push(`${category.name}: ${doc.name}`)
        }
      }
    })
  })
  
  return { uploadedDocs, missingDocs }
}

// Enhanced Z-API integration
export const fetchWhatsAppGroups = async () => {
  // Mock Z-API call - replace with real implementation
  console.log('Fetching WhatsApp groups from Z-API...')
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Mock response from Z-API /chats endpoint
  const mockResponse = [
    {
      id: "120363043965842108@g.us",
      name: "Startups - Documentos Pendentes",
      isGroup: true,
      participants: 15
    },
    {
      id: "120363028374829384@g.us", 
      name: "Equipe Administrativa",
      isGroup: true,
      participants: 8
    },
    {
      id: "120363019283746592@g.us",
      name: "Notificações Gerais",
      isGroup: true,
      participants: 25
    },
    {
      id: "120363047382947362@g.us",
      name: "Suporte Técnico",
      isGroup: true,
      participants: 5
    },
    {
      id: "120363051847293847@g.us",
      name: "Startups - Urgente",
      isGroup: true,
      participants: 12
    }
  ]
  
  return mockResponse
}

export const scheduleNotification = async (startupId: string, type: keyof typeof notificationTemplates, delayHours: number = 24) => {
  // Mock notification scheduling
  console.log(`Mock: Scheduling ${type} notification for startup ${startupId} in ${delayHours} hours`)
  
  return {
    success: true,
    scheduledFor: new Date(Date.now() + delayHours * 60 * 60 * 1000)
  }
}