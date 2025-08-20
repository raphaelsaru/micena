# Cálculo Automático da Data do Próximo Serviço

## Visão Geral

Foi implementada uma funcionalidade que permite calcular automaticamente a data do próximo serviço baseada no número de meses após a data do serviço atual. Esta funcionalidade está disponível tanto na criação quanto na edição de serviços.

## Como Funciona

### Campo de Meses
- **Localização**: Ao lado do campo "Próximo Serviço" nos formulários de criação e edição de serviços
- **Tipo**: Campo numérico com valores de 1 a 60 meses
- **Valor padrão**: 1 mês
- **Comportamento**: Atualiza automaticamente a data do próximo serviço quando alterado

### Cálculo Automático
- A data do próximo serviço é calculada automaticamente somando o número de meses especificado à data do serviço atual
- O cálculo é feito em tempo real conforme o usuário digita
- A data é formatada automaticamente no formato YYYY-MM-DD

## Implementação Técnica

### Componentes Modificados
1. **CreateServiceDialog.tsx**
   - Adicionado estado `monthsToAdd` para controlar o número de meses
   - Implementada função `calculateNextServiceDate()` para cálculo automático
   - Adicionado useEffect para observar mudanças na data do serviço

2. **EditServiceDialog.tsx**
   - Mesma funcionalidade implementada para edição
   - Adicionada função `calculateMonthsBetween()` para calcular meses entre datas existentes
   - Campo de meses é preenchido automaticamente ao editar um serviço existente

## Problema Identificado e Corrigido

### **Overflow de Mês (Problema do Dia -1)**
O JavaScript tem um comportamento específico com `setMonth()` que pode causar datas incorretas:

**Exemplos de problemas:**
- **31 de janeiro + 1 mês** = 31 de fevereiro = **3 de março** (deveria ser 28/29 de fevereiro)
- **30 de março + 1 mês** = 30 de abril = **30 de maio** (deveria ser 30 de abril)
- **31 de dezembro + 1 mês** = 31 de janeiro = **31 de fevereiro** (deveria ser 31 de janeiro)

**Solução implementada:**
```typescript
const calculateNextServiceDate = (serviceDate: string, months: number) => {
  if (!serviceDate) return ''
  
  const date = new Date(serviceDate)
  const originalDay = date.getDate()
  
  // Adicionar meses
  date.setMonth(date.getMonth() + months)
  
  // Verificar se o dia mudou (problema de overflow)
  if (date.getDate() !== originalDay) {
    // Se o dia mudou, significa que houve overflow
    // Voltar para o último dia do mês anterior
    date.setDate(0)
  }
  
  // Formatar para YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}
```

**Como funciona a correção:**
1. Armazena o dia original antes de adicionar meses
2. Adiciona os meses usando `setMonth()`
3. Verifica se o dia mudou (indicando overflow)
4. Se houve overflow, usa `setDate(0)` para ir para o último dia do mês anterior
5. Formata a data corretamente

### **Problema de Fuso Horário (Dia -1)**
**Descrição do problema:**
- **No input**: A data é exibida no fuso horário local (ex: 19/12/2025)
- **Ao salvar**: A data é convertida para UTC, que pode resultar em um dia anterior
- **Ao exibir novamente**: A data UTC é convertida de volta para local, mostrando 18/12/2025

**Solução implementada:**
```typescript
export function formatDateForDatabase(dateString: string): string {
  if (!dateString) return ''
  
  // Criar uma data no fuso horário local (sem conversão UTC)
  const [year, month, day] = dateString.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  
  // Formatar para YYYY-MM-DD preservando o dia original
  const formattedYear = localDate.getFullYear()
  const formattedMonth = String(localDate.getMonth() + 1).padStart(2, '0')
  const formattedDay = String(localDate.getDate()).padStart(2, '0')
  
  return `${formattedYear}-${formattedMonth}-${formattedDay}`
}
```

**Como funciona a correção:**
1. **Preserva o fuso horário local** ao criar a data
2. **Evita conversão UTC** que pode alterar o dia
3. **Mantém a consistência** entre input e armazenamento
4. **Aplica em todos os formulários** de criação e edição

**Componentes corrigidos:**
- ✅ `CreateServiceDialog.tsx` - Usa `formatDateForDatabase()` ao salvar
- ✅ `EditServiceDialog.tsx` - Usa `formatDateForDatabase()` ao atualizar
- ✅ `utils.ts` - Funções utilitárias para formatação de datas

### **Problema de Timezone na Exibição (Dia -1 na Lista)**
**Descrição do problema:**
- **Banco de dados**: Data correta armazenada (ex: 19/09/2025)
- **Frontend (exibição)**: Data com dia anterior (ex: 18/09/2025)
- **Causa**: Funções `formatDate()` interpretando datas como UTC

**Solução implementada:**
```typescript
// Função formatDate corrigida para tratar timezone
export function formatDate(dateString: string): string {
  if (!dateString) return ''
  
  try {
    // Se a data já está no formato YYYY-MM-DD, criar uma data local
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number)
      const localDate = new Date(year, month - 1, day)
      return localDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    }
    
    // Para outros formatos, usar o comportamento padrão
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}
```

**Como funciona a correção:**
1. **Detecta formato YYYY-MM-DD** (datas do banco)
2. **Cria data local** sem conversão UTC
3. **Preserva o dia original** na exibição
4. **Aplica em todos os componentes** de listagem

**Componentes com exibição corrigida:**
- ✅ `ServiceList.tsx` - Lista principal de serviços
- ✅ `ClientServiceHistory.tsx` - Histórico de serviços do cliente
- ✅ `ServiceOrder.tsx` - Ordem de serviço
- ✅ `formatters.ts` - Função global de formatação

### Funções Principais

#### `calculateNextServiceDate(serviceDate: string, months: number)`
```typescript
const calculateNextServiceDate = (serviceDate: string, months: number) => {
  if (!serviceDate) return ''
  
  const date = new Date(serviceDate)
  date.setMonth(date.getMonth() + months)
  
  // Formatar para YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}
```

#### `calculateMonthsBetween(serviceDate: string, nextServiceDate: string)`
```typescript
const calculateMonthsBetween = (serviceDate: string, nextServiceDate: string) => {
  if (!serviceDate || !nextServiceDate) return 1
  
  const startDate = new Date(serviceDate)
  const endDate = new Date(nextServiceDate)
  
  const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                 (endDate.getMonth() - startDate.getMonth())
  
  return Math.max(1, months)
}
```

## Interface do Usuário

### Campo de Meses
- **Label**: "Meses para Próximo Serviço"
- **Input**: Campo numérico com validação (1-60)
- **Sufixo**: "meses"
- **Descrição**: "Calcula automaticamente a data do próximo serviço"

### Layout
- O campo de meses é posicionado ao lado do campo de data do próximo serviço
- Ambos os campos estão na mesma linha para melhor usabilidade
- A categoria detectada automaticamente foi movida para uma linha separada

## Fluxo de Uso

### Criação de Serviço
1. Usuário preenche a data do serviço
2. Usuário define o número de meses para o próximo serviço (padrão: 1)
3. A data do próximo serviço é calculada automaticamente
4. Usuário pode ajustar manualmente se necessário

### Edição de Serviço
1. Ao abrir o diálogo, o sistema calcula automaticamente os meses entre as datas existentes
2. O campo de meses é preenchido com o valor calculado
3. Usuário pode alterar o número de meses e a data será recalculada
4. A data do próximo serviço é sempre sincronizada com o campo de meses

## Benefícios

1. **Automatização**: Elimina a necessidade de cálculo manual de datas
2. **Precisão**: Evita erros de cálculo de meses
3. **Usabilidade**: Interface intuitiva e responsiva
4. **Consistência**: Mantém sincronização entre campos relacionados
5. **Flexibilidade**: Permite ajustes manuais quando necessário

## Validações

- **Mínimo**: 1 mês
- **Máximo**: 60 meses (5 anos)
- **Valor padrão**: 1 mês
- **Formato de data**: YYYY-MM-DD (padrão HTML5)

## Compatibilidade

- Funciona com todos os tipos de serviço existentes
- Compatível com a estrutura de banco de dados atual
- Não requer mudanças no schema do banco
- Mantém compatibilidade com funcionalidades existentes
