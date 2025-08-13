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

### Milestone 0 - Fundamentos (0.5-1 semana) ✅ CONCLUÍDO
- ✅ Bootstrap do projeto Next.js
- ✅ Configuração Supabase e Tailwind
- ✅ Setup de autenticação (estrutura preparada)
- ✅ Migrações iniciais do banco
- ✅ Migração para Supabase.com
- ✅ Configuração MCP (Model Context Protocol)
- ✅ Dados de exemplo (seed) inseridos

### Milestone 1 - Clientes & Serviços (1-2 semanas) 🔄 EM PROGRESSO
- ✅ **CRUD completo de clientes** - FINALIZADO
  - ✅ Interface de listagem com busca e filtros
  - ✅ Criação de novos clientes com validação
  - ✅ Edição de clientes existentes
  - ✅ Exclusão com confirmação
  - ✅ Auto-formatação de CPF/CNPJ, telefone e CEP
  - ✅ Validação de dados em tempo real
  - ✅ Sistema de mensalistas (Switch)
  - ✅ Feedback visual e UX aprimorada
  - ✅ Atualizações otimistas sem polling
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

## 📈 Progresso Técnico Detalhado

### ✅ Funcionalidades Implementadas

#### 🏗️ Infraestrutura Base
- **Next.js 15.4.6** com App Router configurado
- **TypeScript** estrito para type safety
- **Tailwind CSS 4** para styling moderno
- **shadcn/ui** components integrados
- **Supabase** como backend completo
- **PostgreSQL** com schema inicial aplicado

#### 🗄️ Banco de Dados
- **Schema completo** definido e aplicado
- **Migrações** funcionais (`001_initial_schema.sql`)
- **Dados de exemplo** inseridos via seed
- **Tipos TypeScript** gerados automaticamente
- **MCP Supabase** configurado para operações

#### 👥 Gestão de Clientes (100% Completo)
- **Interface completa** de listagem e gerenciamento
- **Busca em tempo real** por nome, documento ou email
- **Formulários validados** com Zod + React Hook Form
- **Auto-formatação** de documentos, telefones e CEP
- **Validação** de CPF/CNPJ em tempo real
- **Sistema de mensalistas** com Switch do shadcn/ui
- **Feedback visual** para estados de formulário
- **Atualizações otimistas** sem reload da página
- **Exclusão com confirmação** via AlertDialog
- **Tratamento de erros** completo com toast messages

#### 🎨 UI/UX Implementadas
- **Design responsivo** para desktop e mobile
- **Navegação principal** com menu superior
- **Dialogs modais** para criação e edição
- **Loading states** e feedback visual
- **Toast notifications** para ações do usuário
- **Inputs controlados** com formatação automática
- **Validação em tempo real** com mensagens claras
- **Tooltips explicativos** para botões desabilitados

#### 🔧 Componentes Criados
- `CreateClientDialog.tsx` - Modal de criação
- `EditClientDialog.tsx` - Modal de edição  
- `ClientList.tsx` - Lista e busca de clientes
- `Navigation.tsx` - Barra de navegação
- `useClients.ts` - Hook de gerenciamento de estado
- `formatters.ts` - Utilitários de formatação
- `clients.ts` - API functions para Supabase

#### 📦 Bibliotecas Integradas
- **React Hook Form** para gerenciamento de formulários
- **Zod** para validação de schemas
- **Sonner** para notificações toast
- **Lucide React** para ícones
- **shadcn/ui** components (Button, Input, Dialog, Switch, etc.)

### 🚀 Próximos Passos Recomendados

#### 1. CRUD de Serviços (Milestone 1 - Parte 2)
- Interface para gerenciar serviços por cliente
- Tipos de serviço (areia, equipamento, capa, outros)
- Datas de serviço e próximo atendimento
- Histórico de serviços por cliente
- Geração de ordens de serviço

#### 2. Sistema de Rotas (Milestone 2)
- Interface de agenda semanal
- Drag & drop para ordenação
- Layout em colunas por dia
- Configuração de capacidade

### 🐛 Problemas Resolvidos
- ✅ Imports de módulos Supabase
- ✅ Componentes shadcn/ui faltantes
- ✅ Inputs controlados vs não controlados
- ✅ Validação de formulários
- ✅ Auto-refresh desnecessário
- ✅ Feedback de botões desabilitados
- ✅ Tipagem TypeScript completa
- ✅ Formatação de campos em tempo real

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
*Última atualização: Janeiro 2025 - Milestone 1 Parte 1 Concluída*  
*Versão: 1.1*
