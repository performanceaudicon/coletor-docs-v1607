export interface DocumentCategory {
  id: string
  name: string
  documents: DocumentItem[]
}

export interface DocumentItem {
  id: string
  name: string
  required: boolean
  description?: string
}

export const documentCategories: DocumentCategory[] = [
  {
    id: 'socios-time',
    name: 'Sócios e Time',
    documents: [
      {
        id: 'captable-organograma',
        name: 'Captable e organograma atual',
        required: true,
        description: 'Estrutura societária atual da empresa'
      },
      {
        id: 'historico-captacoes',
        name: 'Histórico de captações e movimentações societárias',
        required: true,
        description: 'Histórico completo de rodadas de investimento'
      },
      {
        id: 'stock-options',
        name: 'Informações sobre despesas e plano de incentivo para colaboradores (Stock Options)',
        required: false,
        description: 'Documentação do plano de stock options, se houver'
      }
    ]
  },
  {
    id: 'financeiro-operacional',
    name: 'Financeiro/Operacional',
    documents: [
      {
        id: 'budget-business-plan',
        name: 'Budget e Business Plan para os próximos 3 anos',
        required: true,
        description: 'Projeções financeiras e plano de negócios'
      },
      {
        id: 'metricas-operacionais',
        name: 'Histórico de métricas operacionais e P&L',
        required: true,
        description: 'Demonstrativo de resultados e métricas de negócio'
      },
      {
        id: 'dividas-fluxo-caixa',
        name: 'Informações sobre dívidas e fluxo de caixa',
        required: true,
        description: 'Situação financeira atual e projeções de caixa'
      },
      {
        id: 'balancetes-auditadas',
        name: 'Balancetes e demonstrações financeiras auditadas dos últimos 3 anos',
        required: true,
        description: 'Demonstrações financeiras auditadas'
      },
      {
        id: 'expectativa-captacao',
        name: 'Expectativa de Captação e Roadmap',
        required: true,
        description: 'Plano de captação e roadmap de crescimento'
      }
    ]
  },
  {
    id: 'utilizacao-recursos',
    name: 'Utilização dos Recursos',
    documents: [
      {
        id: 'roadmap-produtos',
        name: 'Roadmap de produtos/serviços para os próximos 12 meses',
        required: true,
        description: 'Plano de desenvolvimento de produtos'
      },
      {
        id: 'auditoria-data',
        name: 'Data da última auditoria disponível',
        required: true,
        description: 'Informações sobre a última auditoria realizada'
      }
    ]
  },
  {
    id: 'certidoes-necessarias',
    name: 'Certidões Necessárias',
    documents: [
      {
        id: 'certidoes-gerais',
        name: 'Certidões de tributos, processos judiciais, protestos e trabalhistas',
        required: true,
        description: 'Certidões negativas de débitos e processos'
      }
    ]
  }
]

export const getDocumentProgress = (uploadedDocs: any[], categoryId: string) => {
  const category = documentCategories.find(cat => cat.id === categoryId)
  if (!category) return 0

  const requiredDocs = category.documents.filter(doc => doc.required)
  const uploadedRequiredDocs = uploadedDocs.filter(doc => 
    doc.category === categoryId && 
    requiredDocs.some(reqDoc => reqDoc.id === doc.name)
  )

  return requiredDocs.length > 0 ? (uploadedRequiredDocs.length / requiredDocs.length) * 100 : 0
}

export const getOverallProgress = (uploadedDocs: any[]) => {
  const totalRequired = documentCategories.reduce((acc, cat) => 
    acc + cat.documents.filter(doc => doc.required).length, 0
  )

  const totalUploaded = documentCategories.reduce((acc, cat) => {
    const requiredDocs = cat.documents.filter(doc => doc.required)
    const uploadedCount = uploadedDocs.filter(doc => 
      doc.category === cat.id && 
      requiredDocs.some(reqDoc => reqDoc.id === doc.name)
    ).length
    return acc + uploadedCount
  }, 0)

  return totalRequired > 0 ? (totalUploaded / totalRequired) * 100 : 0
}