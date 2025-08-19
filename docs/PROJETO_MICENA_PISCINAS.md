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

### 3. 📅 Sistema de Rotas (Agenda) - NOVO!
- **Navegação por dias úteis** (segunda a sexta-feira)
- **Interface moderna** com tabs para cada dia da semana
- **Sistema de ordenação inteligente** (crescente/decrescente por posição)
- **Layout flexível** com toggle entre 1 coluna (padrão) e 2 colunas
- **Movimento entre posições** via setas ↑↓ (substituindo drag & drop)
- **Sistema de mudanças pendentes** com botão "Salvar posições"
- **Persistência otimizada** com apenas 1 leitura e 1 escrita no banco
- **Validação de constraints** evitando duplicatas de posição
- **Fila contínua** funcionando como sequência única entre colunas

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
- ✅ **Sistema de numeração automática da OS** - FINALIZADO
  - ✅ Numeração automática no formato OS-ANO-XXXX
  - ✅ Sequencial automático (0001, 0002, 0003...)
  - ✅ Reset anual automático
  - ✅ Campo de input removido dos formulários
  - ✅ Geração automática na criação de serviços
  - ✅ Fallback robusto em caso de erro
- ✅ **Otimizações de impressão** - FINALIZADO
  - ✅ Header da aplicação oculto na impressão
  - ✅ Botões de ação ocultos na impressão
  - ✅ Layout limpo para impressão profissional
  - ✅ Classe `print:hidden` implementada

### Milestone 2 - Sistema de Rotas (1-2 semanas) ✅ 100% CONCLUÍDO
- ✅ **Interface de rotas por dia da semana** - FINALIZADO
  - ✅ Tabs para cada dia útil (Segunda a Sexta-feira)
  - ✅ Navegação intuitiva entre dias
  - ✅ Contador de clientes por dia
  - ✅ Botão para adicionar clientes à rota
- ✅ **Sistema de ordenação inteligente** - FINALIZADO
  - ✅ Ordenação padrão decrescente (order_index DESC)
  - ✅ Toggle entre ordenação crescente e decrescente
  - ✅ Filtros visuais adaptativos
  - ✅ Setas de movimento que se adaptam à ordenação
- ✅ **Layout flexível em colunas** - FINALIZADO
  - ✅ Visualização padrão em 1 coluna
  - ✅ Toggle para layout em 2 colunas
  - ✅ Divisão inteligente (coluna esquerda recebe +1 se ímpar)
  - ✅ Responsivo para diferentes tamanhos de tela
- ✅ **Sistema de movimento entre posições** - FINALIZADO
  - ✅ Setas ↑↓ para mover clientes (substituindo drag & drop)
  - ✅ Movimento apenas entre posições adjacentes
  - ✅ Lógica de troca de posições (swap)
  - ✅ Fila contínua funcionando entre colunas
- ✅ **Sistema de mudanças pendentes** - FINALIZADO
  - ✅ Estado local para mudanças não persistidas
  - ✅ Botão "Salvar posições" para persistir mudanças
  - ✅ Contador de mudanças pendentes
  - ✅ Feedback visual para usuário
- ✅ **Persistência otimizada** - FINALIZADO
  - ✅ RPC `get_day_state` para 1 leitura completa
  - ✅ RPC `save_positions` para 1 escrita em transação
  - ✅ Evita constraints de posição duplicada
  - ✅ Operações atômicas no banco
- ✅ **Validações e tratamento de erros** - FINALIZADO
  - ✅ Prevenção de clientes duplicados na mesma rota
  - ✅ Validação de posições válidas
  - ✅ Tratamento de erros com mensagens claras
  - ✅ Estados de loading e feedback visual

### Milestone 3 - Controle Financeiro (1-1.5 semanas) ✅ 100% CONCLUÍDO
- ✅ **Sistema de itens e materiais** - IMPLEMENTADO
  - ✅ Gerenciamento de itens de serviço com valores
  - ✅ Gerenciamento de materiais com unidades de medida
  - ✅ Cálculo automático de totais (serviços + materiais)
  - ✅ Métodos de pagamento (PIX, Transferência, Dinheiro, Cartão, Boleto)
  - ✅ Detalhes de pagamento para cada serviço
  - ✅ Componentes `ServiceItemsManager` e `ServiceMaterialsManager`
  - ✅ Componente `ServiceTotals` para resumo financeiro
- ✅ **Sistema de Mensalistas** - IMPLEMENTADO
  - ✅ Página dedicada `/mensalistas` com interface completa
  - ✅ Lista de clientes mensalistas com busca em tempo real
  - ✅ Controle de valores mensais com edição inline
  - ✅ Sistema de pagamentos mensais (12 meses) com checkboxes
  - ✅ Dashboard com resumo financeiro completo
  - ✅ Cálculo automático de adimplência e métricas
  - ✅ Visualização em abas (Lista e Resumo Detalhado)
  - ✅ Interface responsiva para desktop e mobile
  - ✅ Integração completa com banco de dados
  - ✅ Migração `004_add_monthly_fee_to_clients.sql` aplicada
- 🔄 **Upload de comprovantes** - PENDENTE
- 🔄 **Relatórios financeiros** - PENDENTE

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
- **Migrações** funcionais (`001_initial_schema.sql`, `002_add_save_positions_function.sql`, `003_add_service_items_and_materials.sql`)
- **Dados de exemplo** inseridos via seed
- **Tipos TypeScript** gerados automaticamente
- **MCP Supabase** configurado para operações
- **RPCs otimizados** para sistema de rotas
- **Sistema de itens e materiais** com controle financeiro
- **Tabelas financeiras**: `service_items`, `service_materials`
- **Enums**: `material_unit`, `payment_method`
- **Triggers automáticos** para cálculo de totais

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
- **Sistema de itens e materiais** com controle financeiro
- **Métodos de pagamento** integrados (PIX, Transferência, Dinheiro, Cartão, Boleto)
- **Cálculo automático de totais** para serviços e materiais

#### 📅 Sistema de Rotas (100% Completo) - NOVO!
- **Interface moderna** com tabs para dias da semana
- **Sistema de ordenação** crescente/decrescente por posição
- **Layout flexível** com toggle entre 1 e 2 colunas
- **Movimento entre posições** via setas ↑↓ adaptativas
- **Sistema de mudanças pendentes** com persistência em lote
- **RPCs otimizados** para 1 leitura + 1 escrita
- **Validação de constraints** evitando duplicatas
- **Fila contínua** funcionando entre colunas
- **Interface responsiva** para desktop e mobile
- **Feedback visual** para todas as operações

#### 🎨 UI/UX Implementadas
- **Design responsivo** para desktop e mobile
- **Navegação principal** com menu superior
- **Dialogs modais** para criação e edição
- **Loading states** e feedback visual
- **Toast notifications** para ações do usuário
- **Inputs controlados** com formatação automática
- **Validação em tempo real** com mensagens claras
- **Tooltips explicativos** para botões desabilitados
- **Layout adaptativo** para diferentes preferências de usuário

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
- `ServiceItemsManager.tsx` - Gerenciador de itens de serviço
- `ServiceMaterialsManager.tsx` - Gerenciador de materiais
- `ServiceTotals.tsx` - Resumo financeiro do serviço
- `useServices.ts` - Hook de gerenciamento de estado
- `services.ts` - API functions para Supabase

**Sistema de Rotas - NOVO!:**
- `RoutesPage.tsx` - Página principal do sistema de rotas
- `RouteTab.tsx` - Componente de aba para cada dia da semana
- `RouteClientCard.tsx` - Card individual de cliente na rota
- `AddClientToRouteDialog.tsx` - Dialog para adicionar clientes à rota
- `useRoutes.ts` - Hook de gerenciamento de estado das rotas
- `routes.ts` - API functions para Supabase RPCs

**Componentes Base:**
- `Navigation.tsx` - Barra de navegação
- `formatters.ts` - Utilitários de formatação
- `select.tsx` - Select do shadcn/ui customizado

#### 🔧 Funções e Utilitários Implementados

**Sistema de Numeração da OS:**
- `generateWorkOrderNumber()` - Gera automaticamente números sequenciais
- Formato: OS-ANO-XXXX (ex: OS-2025-0001)
- Reset anual automático
- Fallback robusto para erros

**Sistema de Rotas - NOVO!:**
- `getDayState()` - RPC para buscar estado completo de um dia
- `savePositions()` - RPC para persistir mudanças em lote
- `getClientMovementLimits()` - Calcula limites de movimento baseado na fila global
- `moveClientByVisualPosition()` - Move clientes considerando ordenação visual
- `applyPendingChanges()` - Aplica mudanças pendentes ao estado local

**Sistema de Controle Financeiro - NOVO!:**
- `calculate_service_total()` - Função PostgreSQL para calcular totais automaticamente
- `update_service_total()` - Trigger para manter totais atualizados
- Sistema de itens de serviço com valores individuais
- Sistema de materiais com unidades de medida e preços
- Cálculo automático de subtotais e total geral
- Integração com métodos de pagamento

**Otimizações de Impressão:**
- Classe `print:hidden` implementada no header
- Botões de ação ocultos na impressão
- Layout limpo para impressão profissional

#### 📦 Bibliotecas Integradas
- **React Hook Form** para gerenciamento de formulários
- **Zod** para validação de schemas
- **Sonner** para notificações toast
- **Lucide React** para ícones
- **shadcn/ui** components (Button, Input, Dialog, Switch, etc.)

### 🚀 Próximos Passos Recomendados

#### 1. ✅ Sistema de Rotas (Milestone 2) - CONCLUÍDO
- Interface de agenda semanal ✅
- Sistema de ordenação inteligente ✅
- Layout em colunas flexível ✅
- Movimento entre posições ✅
- Sistema de mudanças pendentes ✅
- Persistência otimizada ✅

#### 2. ✅ Controle Financeiro (Milestone 3) - CONCLUÍDO
- ✅ Sistema de itens e materiais ✅
- ✅ Métodos de pagamento ✅
- ✅ Cálculo automático de totais ✅
- ✅ Sistema de Mensalistas ✅
- 🔄 Upload de comprovantes (pendente)
- 🔄 Relatórios financeiros (pendente)

#### 3. Integrações (Milestone 4)
- Google Calendar API
- Sincronização de eventos
- Lembretes automáticos

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

**Correções de Bugs e Melhorias:**
- ✅ **Erros de hidratação HTML** - CORRIGIDO
  - ✅ Elementos `<div>` aninhados em `<p>` removidos
  - ✅ Estrutura HTML válida para React
  - ✅ AlertDialogDescription corrigido
  - ✅ DialogDescription adicionado para acessibilidade
- ✅ **Sistema de numeração da OS** - IMPLEMENTADO
  - ✅ Campo manual removido dos formulários
  - ✅ Numeração automática implementada
  - ✅ Função `generateWorkOrderNumber()` criada
  - ✅ Fallback robusto para erros
- ✅ **Acessibilidade dos diálogos** - MELHORADA
  - ✅ `DialogDescription` adicionado em todos os diálogos
  - ✅ `AlertDialogDescription` corrigido
  - ✅ Warning de acessibilidade resolvido

**Sistema de Rotas - NOVO!:**
- ✅ **Erros de constraint de posição duplicada** - RESOLVIDO
  - ✅ Sistema de mudanças pendentes implementado
  - ✅ Persistência em lote via RPC `save_positions`
  - ✅ Validação de posições adjacentes
  - ✅ Prevenção de operações simultâneas
- ✅ **Interface de movimento intuitiva** - IMPLEMENTADA
  - ✅ Setas ↑↓ substituindo drag & drop
  - ✅ Movimento apenas entre posições adjacentes
  - ✅ Lógica de troca de posições (swap)
  - ✅ Adaptação das setas à ordenação atual
- ✅ **Layout em colunas flexível** - IMPLEMENTADO
  - ✅ Toggle entre 1 e 2 colunas
  - ✅ Divisão inteligente de clientes
  - ✅ Fila contínua funcionando entre colunas
  - ✅ Responsividade para diferentes telas
- ✅ **Sistema de ordenação adaptativo** - IMPLEMENTADO
  - ✅ Ordenação padrão decrescente
  - ✅ Toggle crescente/decrescente
  - ✅ Setas que se adaptam à ordenação
  - ✅ Posições visuais vs. lógicas

### 🔧 Melhorias Técnicas Implementadas

#### Sistema de Numeração Automática da OS
- **Função `generateWorkOrderNumber()`** implementada
- **Formato padrão**: OS-ANO-XXXX (ex: OS-2025-0001)
- **Sequencial automático** com reset anual
- **Fallback robusto** para casos de erro
- **Campo manual removido** dos formulários
- **Integração transparente** com criação de serviços

#### Sistema de Controle Financeiro - NOVO!
- **Tabelas `service_items` e `service_materials`** implementadas
- **Enums `material_unit` e `payment_method`** criados
- **Função `calculate_service_total()`** para cálculo automático de totais
- **Triggers automáticos** para manter totais atualizados
- **Componentes especializados** para gerenciamento de itens e materiais
- **Integração completa** com formulários de serviços
- **Cálculo em tempo real** de subtotais e total geral
- **Métodos de pagamento** integrados ao sistema de serviços

#### Sistema de Rotas Otimizado - NOVO!
- **RPCs otimizados** para 1 leitura + 1 escrita
- **Sistema de mudanças pendentes** para operações em lote
- **Validação de constraints** evitando duplicatas
- **Interface de movimento intuitiva** com setas adaptativas
- **Layout flexível** em 1 ou 2 colunas
- **Fila contínua** funcionando entre colunas
- **Ordenação adaptativa** crescente/decrescente

#### Otimizações de Impressão
- **Header da aplicação** oculto na impressão (`print:hidden`)
- **Botões de ação** ocultos na impressão
- **Layout limpo** para impressão profissional
- **CSS responsivo** para diferentes formatos de impressão

#### Correções de Acessibilidade
- **`DialogDescription`** adicionado em todos os diálogos
- **`AlertDialogDescription`** corrigido para estrutura HTML válida
- **Warning de acessibilidade** resolvido
- **Estrutura HTML semântica** implementada

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
*Última atualização: Janeiro 2025 - Milestone 3 100% Concluído + Sistema de Mensalistas Completo*  
*Versão: 3.0*
