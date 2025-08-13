# 🏊‍♂️ Micena Piscinas - Sistema de Gerenciamento

## 📋 Visão Geral do Projeto

**Micena Piscinas** é um sistema web completo para gerenciamento de clientes, serviços, rotas de atendimento e controle financeiro de uma empresa de manutenção de piscinas. O sistema foi projetado para centralizar todas as operações da empresa em uma única plataforma moderna e intuitiva.

### 🎯 Objetivos Principais
- **Centralizar** o cadastro de clientes e histórico de serviços
- **Planejar rotas** de atendimento de segunda a sexta com ordenação inteligente
- **Controlar financeiro** de mensalistas (pagamentos, comprovantes, status)
- **Automatizar** lembretes via integração com Google Agenda
- **Gerar relatórios** e ordens de serviço personalizáveis

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológica
- **Frontend**: Next.js 15.4.6 (App Router) + TypeScript + React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Backend**: Next.js API Routes + Server Actions
- **Banco de Dados**: PostgreSQL via Supabase
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage (comprovantes)
- **Deploy**: Vercel (frontend) + Supabase (backend)
- **Integrações**: Google Calendar API

### Estrutura do Projeto
```
micena-piscinas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Página inicial
│   │   └── globals.css        # Estilos globais
│   └── lib/                   # Utilitários e configurações
├── supabase/                  # Configurações Supabase
│   └── config.toml           # Configuração local
├── scripts/                   # Scripts de migração
├── docs/                      # Documentação do projeto
└── public/                    # Assets estáticos
```

---

## 🚀 Funcionalidades do Sistema

### 1. 📱 Gerenciamento de Clientes
- **CRUD completo** (Criar, Ler, Atualizar, Deletar)
- **Campos essenciais**: CPF/CNPJ, nome, email, telefone, endereço, CEP, chave Pix
- **Identificação de mensalistas** vs. clientes pontuais
- **Histórico completo** de serviços e pagamentos
- **Busca e filtros** por nome, documento ou status

### 2. 🔧 Gerenciamento de Serviços
- **Cadastro de serviços** prestados a cada cliente
- **Tipos de serviço**: troca de areia, equipamentos, capa da piscina, outros
- **Detalhamento** de equipamentos trocados
- **Datas**: serviço realizado e próximo atendimento
- **Geração de ordens de serviço** e recibos
- **Histórico completo** por cliente

### 3. 📅 Sistema de Rotas (Agenda)
- **Navegação por dias úteis** (segunda a sexta)
- **Configuração de capacidade** máxima por dia
- **Ordenação decrescente** automática dos clientes
- **Drag & Drop** para reordenação manual
- **Layout em colunas** (5 clientes por coluna)
- **Inserção em posições específicas** com reordenação automática

### 4. 💰 Controle Financeiro
- **Gestão de mensalistas** com controle mensal
- **Status de pagamentos**: PAGO, EM ABERTO
- **Upload de comprovantes** com marcação automática
- **Controle de meses** pagos e em atraso
- **Relatórios financeiros** por período

### 5. 📱 Interface e Usabilidade
- **Design responsivo** para desktop e mobile
- **Interface moderna** com Tailwind CSS
- **Navegação intuitiva** com menu superior
- **Temas personalizáveis** para impressão
- **Busca e filtros** em todas as listagens

### 6. 🔐 Sistema de Autenticação
- **Login único** para o cliente (tipo admin)
- **Acesso separado** para equipe de desenvolvimento
- **Segurança** via Supabase Auth
- **Controle de sessões** e tokens

---

## 🗄️ Modelo de Dados

### Tabelas Principais

#### `clients` - Cadastro de Clientes
- Informações pessoais e de contato
- Status de mensalista
- Notas e observações

#### `services` - Serviços Prestados
- Relacionamento com cliente
- Tipo e detalhes do serviço
- Datas de realização e próximo atendimento
- Integração com Google Calendar

#### `payments` - Controle de Pagamentos
- Status mensal por cliente
- Comprovantes anexados
- Marcação automática via comprovante
- Controle de valores e datas

#### `route_settings` - Configurações de Rotas
- Capacidade máxima por dia da semana
- Configurações específicas por dia útil

#### `route_assignments` - Atribuições de Rotas
- Ordenação dos clientes por dia
- Sistema de índices para ordenação
- Relacionamento com configurações

---

## ⚙️ Setup e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm/yarn/pnpm
- Conta Supabase
- Conta Google (para Calendar API)

### Instalação Local

1. **Clone o repositório**
```bash
git clone [URL_DO_REPOSITORIO]
cd micena-piscinas
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Crie um arquivo .env.local
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_servico
GOOGLE_CLIENT_ID=seu_client_id_google
GOOGLE_CLIENT_SECRET=seu_client_secret_google
```

4. **Configure o Supabase**
```bash
# Link com seu projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplique as migrações
npm run migrate:dev
```

5. **Execute o projeto**
```bash
npm run dev
```

### Scripts Disponíveis

- **`npm run dev`** - Servidor de desenvolvimento
- **`npm run build`** - Build de produção
- **`npm run start`** - Servidor de produção
- **`npm run lint`** - Verificação de código
- **`npm run migrate:dev`** - Aplicar migrações no ambiente de desenvolvimento
- **`npm run migrate:prod`** - Aplicar migrações no ambiente de produção

---

## 🛠️ Desenvolvimento

### Estrutura de Código
- **TypeScript strict** para type safety
- **ESLint + Prettier** para padronização
- **Componentes reutilizáveis** com shadcn/ui
- **Server Actions** para operações de backend
- **Validação Zod** para inputs

### Padrões de Desenvolvimento
- **Componentes funcionais** com hooks React
- **Estado global** via React Context ou Zustand
- **API Routes** para operações complexas
- **Server Actions** para operações simples
- **Tratamento de erros** consistente
- **Logs de auditoria** para operações críticas

### Testes
- **Smoke tests** para funcionalidades principais
- **Testes de integração** para APIs
- **Validação de formulários** e inputs
- **Testes de responsividade** para mobile

---

## 📊 Roadmap de Implementação

### Milestone 0 - Fundamentos (0.5-1 semana)
- ✅ Bootstrap do projeto Next.js
- ✅ Configuração Supabase e Tailwind
- 🔄 Setup de autenticação
- 🔄 Migrações iniciais do banco

### Milestone 1 - Clientes & Serviços (1-2 semanas)
- 🔄 CRUD completo de clientes
- 🔄 CRUD de serviços
- 🔄 Histórico por cliente
- 🔄 Geração de ordens de serviço

### Milestone 2 - Sistema de Rotas (1-2 semanas)
- 🔄 Interface de rotas por dia da semana
- 🔄 Sistema de ordenação e drag & drop
- 🔄 Layout em colunas
- 🔄 Impressão personalizável

### Milestone 3 - Controle Financeiro (1-1.5 semanas)
- 🔄 Gestão de mensalistas
- 🔄 Upload de comprovantes
- 🔄 Controle de pagamentos
- 🔄 Relatórios financeiros

### Milestone 4 - Integrações (0.5-1 semana)
- 🔄 Google Calendar API
- 🔄 Sincronização de eventos
- 🔄 Lembretes automáticos

---

## 🔒 Segurança e Permissões

### Autenticação
- **Supabase Auth** com JWT tokens
- **Refresh tokens** automáticos
- **Sessões seguras** com expiração configurável

### Controle de Acesso
- **1 usuário admin** (cliente)
- **1 usuário de suporte** (equipe de desenvolvimento)
- **RLS (Row Level Security)** no banco de dados
- **Validação de permissões** em todas as operações

### Proteção de Dados
- **Sanitização de inputs** com Zod
- **Rate limiting** nas APIs
- **Logs de auditoria** para operações críticas
- **Backup automático** do banco de dados

---

## 🚀 Deploy e Produção

### Ambiente de Desenvolvimento
- **Supabase local** para desenvolvimento
- **Hot reload** com Next.js
- **Logs detalhados** para debugging

### Ambiente de Produção
- **Vercel** para frontend
- **Supabase Cloud** para backend
- **CDN global** para performance
- **Monitoramento** e logs de produção

### CI/CD
- **Deploy automático** via Vercel
- **Testes automáticos** antes do deploy
- **Rollback automático** em caso de erro

---

## 📚 Documentação e Recursos

### Documentação Técnica
- **README.md** - Visão geral do projeto
- **docs/** - Documentação detalhada
- **Componentes** - Documentação dos componentes UI
- **APIs** - Documentação das rotas e Server Actions

### Recursos Externos
- **Next.js Docs** - Framework principal
- **Supabase Docs** - Backend e autenticação
- **Tailwind CSS** - Sistema de estilos
- **shadcn/ui** - Componentes base

---

## 🤝 Contribuição e Equipe

### Equipe de Desenvolvimento
- **Rafael Araujo** - Desenvolvimento e arquitetura
- **Raphael Saru** - Desenvolvimento e coordenação

### Processo de Desenvolvimento
1. **Análise de requisitos** com o cliente
2. **Planejamento técnico** e arquitetura
3. **Desenvolvimento iterativo** por milestones
4. **Testes e validação** de funcionalidades
5. **Deploy e monitoramento** em produção

### Comunicação
- **Discord** para coordenação da equipe
- **Reuniões regulares** para alinhamento
- **Documentação atualizada** para referência

---

## 📞 Suporte e Contato

### Equipe de Desenvolvimento
- **Rafael Araujo** - [CONTATO]
- **Raphael Saru** - [CONTATO]

### Cliente
- **Micena Piscinas** - [CONTATO]

### Recursos de Suporte
- **Documentação técnica** neste repositório
- **Issues do GitHub** para bugs e melhorias
- **Supabase Dashboard** para monitoramento do banco
- **Vercel Dashboard** para monitoramento da aplicação

---

## 📝 Notas Importantes

### Limitações da Versão 1.0
- **1 organização única** (sem multi-tenant)
- **1 usuário admin** principal
- **Integração básica** com Google Calendar
- **Relatórios básicos** de impressão

### Funcionalidades Futuras (v2.0)
- **Múltiplos usuários** e roles
- **App mobile nativo**
- **Cobrança online** integrada
- **Analytics avançados** e dashboards
- **Integração com WhatsApp** para notificações
- **Sistema de tickets** para suporte

### Considerações Técnicas
- **Performance** otimizada para até 1000 clientes
- **Escalabilidade** horizontal via Supabase
- **Backup automático** diário
- **Monitoramento** de performance e erros

---

*Documento criado em: Janeiro 2025*  
*Última atualização: Janeiro 2025*  
*Versão: 1.0*
