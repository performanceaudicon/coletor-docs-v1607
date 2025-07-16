# Sistema de Coleta de Documentos para Startups

## Visão Geral

Este é um sistema completo de coleta e gerenciamento de documentos para startups, desenvolvido com Firebase e integração Z-API para WhatsApp. O sistema oferece customização completa de documentos, autenticação Google, e funcionalidades avançadas de administração.

## Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Storage, Hosting)
- **Autenticação**: Firebase Auth com Google Sign-In
- **Armazenamento**: Firebase Storage para arquivos
- **Notificações**: Z-API para WhatsApp
- **Build Tool**: Vite

## Funcionalidades Principais

### Para Startups
- **Autenticação Google**: Login rápido e seguro com conta Google
- **Documentos Customizáveis**: Sistema de documentos configurável por startup
- **Upload Seguro**: Armazenamento seguro no Firebase Storage
- **Progresso em Tempo Real**: Acompanhamento visual do progresso
- **Documentos Extras**: Possibilidade de enviar documentos adicionais
- **Notificações**: Recebimento de lembretes via WhatsApp

### Para Administradores
- **Dashboard Avançado**: Painel completo com múltiplas abas
- **Configuração de Documentos**: Criação e edição de configurações personalizadas
- **Templates de Mensagem**: Edição completa dos templates de WhatsApp
- **Visualização de Documentos**: Download e visualização de todos os documentos
- **Integração Z-API**: Gerenciamento completo de grupos e mensagens WhatsApp
- **Relatórios Detalhados**: Estatísticas completas do sistema

## Configuração do Ambiente

### Pré-requisitos
- Node.js 18+
- Conta no Firebase
- Conta na Z-API (opcional, para WhatsApp)

### Configuração do Firebase

1. **Criar Projeto Firebase**:
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Crie um novo projeto
   - Habilite Authentication, Firestore e Storage

2. **Configurar Authentication**:
   - Habilite Email/Password e Google como provedores
   - Configure domínios autorizados

3. **Configurar Firestore**:
   - Crie o banco de dados em modo de produção
   - Implemente as regras de segurança (arquivo `firestore.rules`)

4. **Configurar Storage**:
   - Habilite o Firebase Storage
   - Configure as regras de segurança (arquivo `storage.rules`)

### Configuração das Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id

# Z-API Configuration (opcional)
VITE_ZAPI_BASE_URL=https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN
VITE_ZAPI_CLIENT_TOKEN=SEU_SECURITY_TOKEN

# Application Settings
VITE_ADMIN_EMAIL=admin@example.com
```

### Instalação

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Deploy no Firebase

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto (se necessário)
firebase init

# Deploy
npm run build
firebase deploy
```

## Integração com Z-API (WhatsApp)

### Configuração

1. Cadastre-se no Z-API
2. Configure sua instância do WhatsApp
3. Obtenha as credenciais (URL e Token)
4. Configure as variáveis de ambiente no `.env`

### Endpoints Utilizados

- `GET /groups` - Buscar grupos disponíveis
- `POST /send-text` - Enviar mensagens
- `GET /status` - Verificar status da instância

### Headers Obrigatórios
- `client-token`: Token de segurança da Z-API
- `Content-Type`: application/json

## Fluxo de Trabalho

### Para Startups
1. Login com Google ou email/senha
2. Acesso ao dashboard personalizado
3. Upload de documentos conforme configuração
4. Acompanhamento do progresso
5. Envio de documentos extras (opcional)
6. Finalização quando 100% completo

### Para Administradores
1. Login como administrador
2. Configuração de documentos por startup
3. Edição de templates de mensagem
4. Monitoramento em tempo real
5. Envio de lembretes personalizados
6. Download e análise de documentos

## Funcionalidades Avançadas

### Configuração de Documentos
- Criação de configurações personalizadas
- Documentos obrigatórios e opcionais
- Categorização flexível
- Descrições detalhadas

### Templates de Mensagem
- Edição completa dos templates
- Variáveis dinâmicas
- Preview em tempo real
- Múltiplos tipos de mensagem

### Visualização de Documentos
- Download direto dos arquivos
- Visualização em nova aba
- Informações detalhadas
- Controle de status

### Integração WhatsApp
- Grupos automáticos
- Status da instância
- Mensagens personalizadas
- Validação de números

## Segurança

### Firestore Rules
- Usuários só acessam seus próprios dados
- Admins têm acesso completo
- Validação de roles
- Proteção contra acesso não autorizado

### Storage Rules
- Arquivos organizados por usuário
- Acesso restrito ao proprietário
- Admins podem visualizar todos os arquivos
- Validação de autenticação

## Estrutura do Projeto

```
src/
├── components/
│   ├── auth/           # Componentes de autenticação
│   ├── admin/          # Dashboard administrativo
│   ├── startup/        # Dashboard das startups
│   └── ui/             # Componentes reutilizáveis
├── lib/
│   ├── firebaseAuth.ts      # Autenticação Firebase
│   ├── firebaseFirestore.ts # Operações Firestore
│   ├── firebaseStorage.ts   # Upload de arquivos
│   ├── zapiIntegration.ts   # Integração Z-API
│   └── notificationSystem.ts # Sistema de notificações
├── firebaseConfig.ts   # Configuração Firebase
└── App.tsx            # Componente principal
```

## Credenciais de Teste

### Administrador
Configure o email do administrador na variável `VITE_ADMIN_EMAIL`

### Startups
Qualquer usuário que não seja o administrador será tratado como startup

## Troubleshooting

### Problemas Comuns

1. **Erro de autenticação Firebase**:
   - Verifique as configurações no `.env`
   - Confirme se o domínio está autorizado no Firebase Console

2. **Z-API não funciona**:
   - Verifique se as variáveis `VITE_ZAPI_*` estão configuradas
   - Teste a conectividade com a instância Z-API

3. **Upload de arquivos falha**:
   - Verifique as regras do Firebase Storage
   - Confirme se o usuário está autenticado

4. **Firestore permission denied**:
   - Verifique as regras do Firestore
   - Confirme se o usuário tem as permissões corretas

## Roadmap

### Próximas Funcionalidades
- [ ] Notificações push
- [ ] Relatórios em PDF
- [ ] Integração com Google Drive
- [ ] API REST para integrações
- [ ] App mobile
- [ ] Assinatura digital de documentos

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Suporte

Para suporte técnico:
- Consulte a documentação do Firebase
- Verifique a documentação da Z-API
- Abra uma issue no repositório

## Licença

Este projeto está sob a licença MIT.