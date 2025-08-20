# Paginação Incremental - Micena Piscinas

## Visão Geral

A paginação incremental foi implementada para otimizar o carregamento de dados nas listagens de clientes e serviços. Em vez de carregar todos os registros de uma vez, o sistema carrega inicialmente apenas 15 registros e permite carregar mais conforme necessário.

## Características

### 🚀 **Performance Otimizada**
- Carregamento inicial de apenas 15 registros
- Carregamento sob demanda para reduzir uso de memória
- Melhora significativa no tempo de carregamento inicial

### 🔄 **Dois Modos de Carregamento**
1. **Botão "Carregar Mais"** (padrão)
   - Usuário clica para carregar mais registros
   - Controle total sobre quando carregar
   - Indicador visual de carregamento

2. **Scroll Infinito** (opcional)
   - Carregamento automático ao chegar no final da página
   - Experiência mais fluida
   - Pode ser ativado/desativado pelo usuário

### 📱 **Responsivo e Acessível**
- Indicadores de carregamento claros
- Estados de loading separados para carregamento inicial e incremental
- Tratamento de erros robusto

## Implementação Técnica

### Hooks Atualizados

#### `useClients`
```typescript
const {
  clients,           // Lista de clientes carregados
  isLoading,         // Carregamento inicial
  isLoadingMore,     // Carregamento incremental
  hasMore,           // Se há mais dados para carregar
  loadMoreClients,   // Função para carregar mais
  refreshClients     // Função para recarregar tudo
} = useClients()
```

#### `useServices`
```typescript
const {
  services,          // Lista de serviços carregados
  isLoading,         // Carregamento inicial
  isLoadingMore,     // Carregamento incremental
  hasMore,           // Se há mais dados para carregar
  loadMoreServices,  // Função para carregar mais
  refreshServices    // Função para recarregar tudo
} = useServices()
```

### Funções de Banco de Dados

#### `getClientsPaginated(page, pageSize)`
```typescript
export async function getClientsPaginated(page: number, pageSize: number): Promise<Client[]> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('full_name', { ascending: true })
    .range(from, to) // Usa range do Supabase para paginação

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }

  return data || []
}
```

#### `getServicesPaginated(page, pageSize)`
```typescript
export async function getServicesPaginated(page: number, pageSize: number): Promise<ServiceWithClient[]> {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      clients(full_name, document),
      service_items(*),
      service_materials(*)
    `)
    .order('service_date', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error('Erro ao carregar serviços')
  }

  return data || []
}
```

### Componentes

#### `LoadMoreButton`
Botão reutilizável para carregar mais dados:
```typescript
<LoadMoreButton
  onClick={handleLoadMore}
  isLoading={isLoadingMore}
  hasMore={hasMore}
/>
```

#### `InfiniteList`
Componente wrapper que suporta ambos os modos:
```typescript
<InfiniteList
  onLoadMore={handleLoadMore}
  hasMore={hasMore}
  isLoading={isLoading}
  isLoadingMore={isLoadingMore}
  enableInfiniteScroll={enableInfiniteScroll}
>
  {/* Lista de dados */}
</InfiniteList>
```

## Como Usar

### 1. **Carregamento Padrão (Botão)**
- Os dados são carregados automaticamente em lotes de 15
- Clique em "Carregar Mais" para buscar mais registros
- O botão desaparece quando não há mais dados

### 2. **Scroll Infinito**
- Clique no botão de configurações para ativar
- Role a página para baixo para carregar automaticamente
- Desative clicando novamente no botão

### 3. **Busca e Filtros**
- Durante buscas, a paginação é desabilitada
- Todos os resultados da busca são exibidos de uma vez
- Retorna à paginação normal ao limpar a busca

## Vantagens

### ✅ **Para o Usuário**
- Carregamento mais rápido da página inicial
- Experiência mais fluida com grandes volumes de dados
- Controle sobre quando carregar mais dados
- Opção de scroll infinito para quem preferir

### ✅ **Para o Sistema**
- Menor uso de memória no navegador
- Redução no tempo de resposta inicial
- Melhor performance em dispositivos móveis
- Menor carga no banco de dados

### ✅ **Para o Desenvolvimento**
- Código reutilizável e modular
- Fácil manutenção e extensão
- Padrão consistente em todo o sistema
- Hooks customizados bem estruturados

## Configuração

### Tamanho da Página
O tamanho padrão é de 15 registros por página. Para alterar:

```typescript
// Em useClients.ts e useServices.ts
const PAGE_SIZE = 15 // Altere este valor conforme necessário
```

### Threshold do Scroll Infinito
```typescript
// Em useInfiniteScroll.ts
const threshold = 200 // Distância em pixels do final da página
```

## Tratamento de Erros

- Erros de carregamento são exibidos via toast
- Estados de loading são gerenciados corretamente
- Rollback automático em caso de falha nas operações
- Recarregamento automático em caso de erro

## Monitoramento

### Estados Importantes
- `isLoading`: Carregamento inicial da página
- `isLoadingMore`: Carregamento de dados adicionais
- `hasMore`: Se existem mais dados para carregar
- `currentPage`: Página atual sendo exibida

### Logs de Debug
```typescript
console.log('Carregando página:', page)
console.log('Registros carregados:', data.length)
console.log('Ainda há mais dados:', hasMore)
```

## Futuras Melhorias

- [ ] Cache de dados carregados
- [ ] Sincronização em tempo real
- [ ] Indicadores de progresso mais detalhados
- [ ] Configurações de paginação por usuário
- [ ] Otimização para listas muito grandes


