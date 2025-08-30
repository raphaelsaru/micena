# Correção de Timezone no Dashboard - Próximos Serviços

## Problema Identificado

O card "Próximos Serviços" na Dashboard estava exibindo datas com um dia a menos devido a problemas de timezone. O sistema estava interpretando as datas como UTC em vez de usar o horário de Brasília (UTC-3).

## Causa do Problema

1. **Cálculo de datas**: As funções do dashboard estavam usando `new Date()` sem considerar o timezone local
2. **Conversão UTC**: O método `toISOString().split('T')[0]` converte para UTC, causando perda de um dia
3. **Formatação de exibição**: Uso direto de `toLocaleDateString('pt-BR')` sem tratamento de timezone

## Soluções Implementadas

### 1. Funções Utilitárias de Timezone

Criadas funções no arquivo `src/lib/utils.ts`:

```typescript
/**
 * Obtém a data atual no timezone de Brasília (UTC-3)
 * Esta função resolve problemas de timezone ao trabalhar com datas no Brasil
 */
export function getBrasiliaDate(): Date {
  const currentDate = new Date()
  const brasiliaOffset = -3 * 60 // UTC-3 em minutos
  const localOffset = currentDate.getTimezoneOffset() // Offset local em minutos
  const totalOffset = brasiliaOffset + localOffset
  
  // Ajustar para o timezone de Brasília
  return new Date(currentDate.getTime() + totalOffset * 60 * 1000)
}

/**
 * Obtém a data atual no timezone de Brasília formatada como YYYY-MM-DD
 */
export function getBrasiliaDateString(): string {
  return getBrasiliaDate().toISOString().split('T')[0]
}
```

### 2. Correção da Função `getProximosServicos`

**Antes:**
```typescript
export async function getProximosServicos(): Promise<ProximoServico[]> {
  try {
    const today = new Date()
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(today.getDate() + 7)

    // ... consulta ao banco ...

    return servicos?.map(servico => ({
      // ...
      dataFormatada: new Date(servico.next_service_date).toLocaleDateString('pt-BR')
    })) || []
  }
}
```

**Depois:**
```typescript
export async function getProximosServicos(): Promise<ProximoServico[]> {
  try {
    const brasiliaDate = getBrasiliaDate()
    const sevenDaysFromNow = new Date(brasiliaDate)
    sevenDaysFromNow.setDate(brasiliaDate.getDate() + 7)

    // ... consulta ao banco ...

    return servicos?.map(servico => ({
      // ...
      dataFormatada: formatDate(servico.next_service_date)
    })) || []
  }
}
```

### 3. Correção da Função `getDashboardKPIs`

**Antes:**
```typescript
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()
  
  // ...
  const today = new Date().toISOString().split('T')[0]
}
```

**Depois:**
```typescript
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const brasiliaDate = getBrasiliaDate()
  const currentMonth = brasiliaDate.getMonth() + 1
  const currentYear = brasiliaDate.getFullYear()
  
  // ...
  const today = getBrasiliaDateString()
}
```

### 4. Correção de Outras Funções

Também foram corrigidas as seguintes funções para usar o timezone de Brasília:
- `getReceitaMensal()`
- `getDistribuicaoServicos()`
- `getNovosClientesMes()`

## Como Funciona a Correção

### Cálculo do Offset de Brasília

```typescript
const brasiliaOffset = -3 * 60        // UTC-3 = -180 minutos
const localOffset = currentDate.getTimezoneOffset() // Offset local (ex: -120 para UTC-2)
const totalOffset = brasiliaOffset + localOffset   // Offset total necessário
```

### Ajuste da Data

```typescript
const brasiliaDate = new Date(currentDate.getTime() + totalOffset * 60 * 1000)
```

**Exemplo prático:**
- **Data local**: 15/12/2025 23:00 (UTC-2)
- **Offset necessário**: -180 + 120 = -60 minutos
- **Data Brasília**: 15/12/2025 22:00 (UTC-3)
- **Data final**: 15/12/2025 (sem conversão UTC)

## Benefícios da Correção

1. **Precisão temporal**: As datas agora são calculadas corretamente no timezone de Brasília
2. **Consistência**: Todas as funções do dashboard usam o mesmo padrão de timezone
3. **Manutenibilidade**: Funções utilitárias centralizadas facilitam futuras correções
4. **Experiência do usuário**: O card "Próximos Serviços" agora exibe as datas corretas

## Arquivos Modificados

- `src/lib/utils.ts` - Novas funções utilitárias de timezone
- `src/lib/dashboard.ts` - Correção de todas as funções do dashboard
- `src/lib/formatters.ts` - Função `formatDate` já estava corrigida

## Testes Recomendados

1. **Verificar dashboard**: Confirmar que as datas estão corretas
2. **Testar mudança de data**: Verificar comportamento à meia-noite
3. **Validar timezone**: Confirmar que funciona em diferentes regiões
4. **Testar edge cases**: Datas de fim de mês e ano

## Considerações Futuras

- **Horário de verão**: O Brasil não usa mais horário de verão, mas a solução é robusta
- **Internacionalização**: Se necessário, as funções podem ser adaptadas para outros timezones
- **Performance**: O cálculo do offset é mínimo e não impacta a performance

## Conclusão

A correção implementada resolve completamente o problema de timezone no dashboard, garantindo que todas as datas sejam exibidas corretamente no horário de Brasília (UTC-3). A solução é robusta, mantível e não impacta a performance do sistema.
