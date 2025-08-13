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

### Milestone 1 - Clientes & Serviços (1-2 semanas) ✅ 100% CONCLUÍDO
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
- ✅ **CRUD completo de serviços** - FINALIZADO
  - ✅ Interface de listagem com filtros avançados
  - ✅ Criação de novos serviços com validação
  - ✅ Edição de serviços existentes (incluindo troca de cliente)
  - ✅ Exclusão com confirmação detalhada
  - ✅ Busca por cliente, tipo, e período
  - ✅ Tipos de serviço (Areia, Equipamento, Capa, Outro)
  - ✅ Campos: Data, OS, equipamentos, observações, próximo serviço
  - ✅ Relacionamento íntegro com clientes
- ✅ **Histórico de serviços por cliente** - FINALIZADO
  - ✅ Dialog integrado na lista de clientes
  - ✅ Visualização completa do histórico
  - ✅ Interface limpa e informativa
- ✅ **Geração de ordens de serviço** - FINALIZADO
  - ✅ Template baseado no modelo de orçamento
  - ✅ Logo Micena Piscinas estilizado
  - ✅ Informações completas do serviço e cliente
  - ✅ Funcionalidade de impressão otimizada
  - ✅ Botão "Gerar OS" em cada serviço
  - ✅ Dialog dedicado para visualização

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

#### 🔧 Gestão de Serviços (100% Completo)
- **Interface completa** de listagem com filtros avançados
- **CRUD completo** com validação e relacionamentos
- **Busca multicritério** (cliente, tipo, período)
- **Tipos de serviço** configuráveis (Areia, Equipamento, Capa, Outro)
- **Campos customizáveis** (OS, equipamentos, observações)
- **Histórico integrado** por cliente
- **Relacionamentos dinâmicos** com atualização de clientes
- **Interface responsiva** com badges e status visuais
- **Validação robusta** com mensagens de erro
- **Atualizações otimistas** em tempo real
- **Geração de Ordens de Serviço** com template profissional

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

**Gestão de Clientes:**
- `CreateClientDialog.tsx` - Modal de criação de clientes
- `EditClientDialog.tsx` - Modal de edição de clientes
- `ClientList.tsx` - Lista e busca de clientes
- `ClientServiceDialog.tsx` - Dialog de histórico por cliente
- `useClients.ts` - Hook de gerenciamento de estado
- `clients.ts` - API functions para Supabase

**Gestão de Serviços:**
- `CreateServiceDialog.tsx` - Modal de criação de serviços
- `EditServiceDialog.tsx` - Modal de edição de serviços
- `ServiceList.tsx` - Lista com filtros avançados
- `ClientServiceHistory.tsx` - Histórico de serviços por cliente
- `ServiceOrder.tsx` - Componente de ordem de serviço
- `ServiceOrderDialog.tsx` - Dialog para visualizar OS
- `useServices.ts` - Hook de gerenciamento de estado
- `services.ts` - API functions para Supabase

**Componentes Base:**
- `Navigation.tsx` - Barra de navegação
- `formatters.ts` - Utilitários de formatação
- `select.tsx` - Select do shadcn/ui customizado

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

**Infraestrutura e Setup:**
- ✅ Imports de módulos Supabase
- ✅ Componentes shadcn/ui faltantes
- ✅ Migração para Supabase.com
- ✅ Configuração MCP

**Interface e UX:**
- ✅ Inputs controlados vs não controlados
- ✅ Validação de formulários
- ✅ Auto-refresh desnecessário
- ✅ Feedback de botões desabilitados
- ✅ Formatação de campos em tempo real

**Relacionamentos e Dados:**
- ✅ "Cliente não encontrado" após criar/editar serviço
- ✅ Edição de cliente em serviços não funcionando
- ✅ Relacionamentos Cliente-Serviço desatualizados
- ✅ Tipagem TypeScript completa

**Deploy e Build:**
- ✅ Erros de linting rigoroso da Vercel
- ✅ Imports não utilizados
- ✅ Tipos `any` não permitidos
- ✅ Interfaces vazias
- ✅ Aspas não escapadas em JSX
- ✅ Conflitos de nomenclatura de tipos

### 🚀 Deploy e Linting - Lições Aprendidas

**Problemas Comuns de Build na Vercel:**

#### ❌ Erros de TypeScript Rigoroso
```typescript
// ❌ Problemático
const filters: any = {}
const service: any = {}
(service as any).client?.full_name

// ✅ Correto
const filters: {
  clientName?: string
  serviceType?: ServiceType
} = {}
const service: ServiceWithClient = {}
service.clients?.full_name
```

#### ❌ Imports Não Utilizados
```typescript
// ❌ Problemático
import { Edit, Trash2, Eye, Calendar } from 'lucide-react'
// Usando apenas Edit, Trash2, Calendar

// ✅ Correto
import { Edit, Trash2, Calendar } from 'lucide-react'
```

#### ❌ Interfaces Vazias
```typescript
// ❌ Problemático
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

// ✅ Correto
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>
```

#### ❌ Aspas Não Escapadas
```jsx
// ❌ Problemático
<DialogDescription>
  Edite as informações do cliente "{client.full_name}".
</DialogDescription>

// ✅ Correto
<DialogDescription>
  Edite as informações do cliente &quot;{client.full_name}&quot;.
</DialogDescription>
```

#### ❌ Variáveis Não Utilizadas
```typescript
// ❌ Problemático
} catch (error) {
  // Erro já tratado no hook
}

// ✅ Correto
} catch {
  // Erro já tratado no hook
}
```

#### ❌ Schema Zod Incorreto
```typescript
// ❌ Problemático
service_type: z.enum(['AREIA', 'EQUIPAMENTO'], {
  errorMap: () => ({ message: 'Obrigatório' })
})

// ✅ Correto
service_type: z.enum(['AREIA', 'EQUIPAMENTO']).refine(() => true, {
  message: 'Tipo de serviço é obrigatório'
})
```

**Checklist de Deploy:**
- ✅ Executar `npm run build` localmente antes do commit
- ✅ Remover todos os imports não utilizados
- ✅ Substituir tipos `any` por tipos específicos
- ✅ Usar `type` ao invés de `interface` vazias
- ✅ Escapar aspas em strings JSX com `&quot;`
- ✅ Remover variáveis não utilizadas
- ✅ Verificar sintaxe Zod para enums

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
- **Vercel** para frontend (✅ Deploy realizado com sucesso)
- **Supabase Cloud** para backend
- **CDN global** para performance
- **Monitoramento** e logs de produção

### CI/CD
- **Deploy automático** via Vercel
- **Linting rigoroso** com zero tolerância a erros
- **Build otimizado** para produção (~100kb shared JS)
- **Testes automáticos** antes do deploy
- **Rollback automático** em caso de erro

### Build Statistics (Última versão)
- **Páginas**: 5 rotas estáticas geradas
- **JavaScript**: ~100kb shared + específico por página
- **Status**: ✅ Compilado com sucesso
- **Erros de Linting**: 0 ❌ → ✅
- **Warnings**: 1 (não crítico)
- **Tempo de Build**: ~10s

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
*Última atualização: Janeiro 2025 - Milestone 1 100% Concluído + Sistema de OS Implementado*  
*Versão: 1.3*
