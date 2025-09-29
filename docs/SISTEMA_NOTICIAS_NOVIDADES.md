# Sistema de Notícias e Novidades

## Visão Geral

O sistema de notícias foi implementado para mostrar as novidades do sistema de forma intuitiva aos usuários, funcionando como um "patch notes" ou "change log" integrado.

## Funcionalidades Implementadas

### 1. Popup de Novidades
- **Localização**: `src/components/NewsPopup.tsx`
- **Funcionalidade**: Modal responsivo que exibe as novidades com design intuitivo
- **Características**:
  - Contador de notificações não lidas
  - Botão para marcar todas como lidas
  - Ícones específicos para cada funcionalidade
  - Indicação visual de localização da funcionalidade
  - Data de implementação

### 2. Contexto de Gerenciamento
- **Localização**: `src/contexts/NewsContext.tsx`
- **Funcionalidade**: Gerencia o estado global das notificações
- **Características**:
  - Persistência no localStorage
  - Controle de notificações lidas/não lidas
  - Abertura automática do popup quando há novidades
  - Funções para marcar como lida individual ou em lote
  - **Filtro automático**: Exibe apenas notícias não lidas no popup

### 3. Notificação na Barra de Navegação
- **Localização**: `src/components/NewsNotification.tsx`
- **Funcionalidade**: Ícone de sino com contador de notificações não lidas
- **Características**:
  - Aparece apenas quando há notificações não lidas
  - Badge com número de notificações
  - Clique abre o popup de novidades

### 4. Integração no Layout
- **Localização**: `src/app/layout.tsx` e `src/components/Navigation.tsx`
- **Funcionalidade**: Integração completa no sistema
- **Características**:
  - Provider no layout principal
  - Componente wrapper para o popup
  - Notificação na barra de navegação

## Novidades Atuais (Implementadas em 15/01/2025)

### 1. Equipe 5 - Adicionar Clientes de Outras Rotas
- **Descrição**: Agora a Equipe 5 pode adicionar clientes que já estão cadastrados em outras rotas
- **Localização**: Página de Rotas - Equipe 5
- **Ícone**: Users (laranja)

### 2. Caixas de Seleção Expandidas - Mensalistas
- **Descrição**: Aumento significativo das opções de caixas de seleção na página de Mensalistas
- **Localização**: Página de Mensalistas
- **Ícone**: CheckSquare (azul)

### 3. Busca de Clientes em Rotas
- **Descrição**: Busca de clientes diretamente nas rotas usando campo de busca
- **Localização**: Página de Rotas
- **Ícone**: Search (azul)

### 4. Filtro por Data de Início
- **Descrição**: Filtro para visualizar clientes baseado na data de início do serviço
- **Localização**: Página de Clientes
- **Ícone**: Calendar (verde)

### 5. Impressão de Lista de Clientes
- **Descrição**: Funcionalidade de impressão para listar todos os clientes
- **Localização**: Página de Clientes
- **Ícone**: Printer (roxo)

## Como Adicionar Novas Notificações

### 1. Editar o Contexto
No arquivo `src/contexts/NewsContext.tsx`, adicione novos itens ao array `initialNewsItems`:

```typescript
{
  id: 'nova-funcionalidade',
  title: 'Nome da Funcionalidade',
  description: 'Descrição detalhada da funcionalidade',
  icon: <IconComponent className="w-5 h-5 text-cor-600" />,
  location: 'Localização no Sistema',
  date: 'DD/MM/AAAA',
  isRead: false,
}
```

### 2. Estrutura dos Dados
- **id**: Identificador único (string)
- **title**: Título da funcionalidade
- **description**: Descrição detalhada
- **icon**: Componente de ícone do Lucide React
- **location**: Onde a funcionalidade foi adicionada
- **date**: Data de implementação
- **isRead**: Status de leitura (sempre false para novas)

### 3. Ícones Disponíveis
Use ícones do Lucide React com classes de cor:
- `text-blue-600` - Azul
- `text-green-600` - Verde
- `text-purple-600` - Roxo
- `text-orange-600` - Laranja
- `text-red-600` - Vermelho

## Persistência de Dados

O sistema usa `localStorage` com a chave `micena-news-read` para armazenar os IDs das notificações já lidas. Isso permite que o usuário não veja novamente as notificações já marcadas como lidas.

## Comportamento do Sistema

1. **Primeira visita**: Popup abre automaticamente após 3 segundos se houver notificações não lidas (apenas quando usuário estiver autenticado)
2. **Carregamento seguro**: Verifica se a página está completamente carregada antes de mostrar o popup
3. **Autenticação**: Popup só aparece após login do usuário
4. **Notificações lidas**: **Não aparecem mais no popup** (filtro automático implementado)
5. **Contador**: Mostra número de notificações não lidas na barra de navegação
6. **Experiência limpa**: Popup exibe apenas notícias novas/não lidas, mantendo a interface focada
7. **Responsivo**: Funciona perfeitamente em desktop e mobile com layout adaptativo
8. **Animações suaves**: Transições suaves para evitar interferência visual
9. **Mobile-first**: Layout otimizado para dispositivos móveis com altura dinâmica

## Personalização

### Cores e Estilos
- Cores principais: azul para não lidas, cinza para lidas
- Design segue o padrão Shadcn UI
- Responsivo com Tailwind CSS
- Layout adaptativo para mobile e desktop

### Responsividade Mobile
- Altura dinâmica: `h-[50vh]` no mobile, `h-[400px]` no desktop
- Padding adaptativo: `p-2` no mobile, `p-4` no desktop
- Texto responsivo: `text-xs` no mobile, `text-sm` no desktop
- Botões compactos no mobile com texto abreviado
- Layout flexível que se adapta ao tamanho da tela

### Timing
- Delay de 3 segundos para abertura automática (configurável no contexto)
- Verificação adicional do estado de carregamento da página
- Transições suaves de 300ms com animações fade-in e slide-in

## Manutenção

### Limpeza de Dados Antigos
Para limpar notificações antigas do localStorage:
```javascript
localStorage.removeItem('micena-news-read');
```

### Debug
Para verificar notificações lidas:
```javascript
console.log(JSON.parse(localStorage.getItem('micena-news-read') || '[]'));
```

## Extensões Futuras

1. **Categorias**: Agrupar notificações por tipo
2. **Prioridades**: Notificações importantes vs. informativas
3. **Filtros**: Filtrar por data, categoria, etc.
4. **Histórico**: Manter histórico de todas as notificações
5. **Notificações Push**: Integração com notificações do navegador
