# Exemplo de Funcionamento do Filtro de Receita

## Visão Geral

O sistema agora permite filtrar a visualização financeira por tipo de receita, fornecendo uma visão clara e separada entre receitas de OS (Ordens de Serviço) e Mensalistas.

## Cenário de Exemplo

### Dados do Sistema:
- **Receita de OS**: R$ 15.000,00 (serviços avulsos realizados)
- **Receita de Mensalistas**: R$ 8.000,00 (mensalidades pagas)
- **Receita Pendente**: R$ 2.500,00 (mensalidades em aberto)
- **Total Geral**: R$ 23.000,00 (OS + Mensalistas)

## Funcionamento dos Filtros

### 1. Filtro: "Todas as Receitas"
**Receita Total**: R$ 23.000,00
- Mostra a soma completa de OS + Mensalistas
- **Receita do Mês**: R$ 11.500,00 (mensalidades + OS do mês atual)
- **Receita Pendente**: R$ 2.500,00 (apenas mensalidades)
- **Descrição**: "Receita total (OS + Mensalistas)" + "Receita total do mês (mensalidades + OS)"

### 2. Filtro: "Apenas OS"
**Receita Total**: R$ 15.000,00
- Mostra apenas receitas de Ordens de Serviço
- **Receita do Mês**: R$ 3.500,00 (OS realizadas no mês atual)
- **Receita Pendente**: R$ 0,00
- **Descrição**: "Receita de OS" + "OS realizadas este mês" + "OS são pagas à vista"

### 3. Filtro: "Apenas Mensalistas"
**Receita Total**: R$ 8.000,00
- Mostra apenas receitas de mensalidades
- **Receita do Mês**: R$ 8.000,00 (mensalidades recebidas este mês)
- **Receita Pendente**: R$ 2.500,00
- **Descrição**: "Receita de Mensalistas" + "Mensalidades recebidas este mês" + "Mensalidades em aberto"

## Benefícios da Implementação

### Para Gestão Financeira:
1. **Visão Clara**: Separação nítida entre tipos de receita
2. **Análise Comparativa**: Facilita comparação entre OS e mensalidades
3. **Planejamento**: Melhor base para projeções financeiras
4. **Controle**: Identificação rápida de fontes de receita

### Para Usuários:
1. **Interface Intuitiva**: Filtro simples e claro
2. **Flexibilidade**: Visualização personalizada conforme necessidade
3. **Contexto**: Descrições adaptativas nos KPIs
4. **Responsividade**: Layout adaptável para diferentes dispositivos

## Casos de Uso

### Gerente Financeiro:
- **Filtro "Todas as Receitas"**: Visão geral para relatórios executivos
- **Filtro "Apenas OS"**: Análise de serviços avulsos e sazonalidade
- **Filtro "Apenas Mensalistas"**: Controle de fluxo de caixa recorrente

### Operacional:
- **Filtro "Apenas OS"**: Acompanhamento de receitas de serviços pontuais
- **Filtro "Apenas Mensalistas"**: Gestão de inadimplência e cobranças

## Implementação Técnica

### Hook useFinancial:
```typescript
interface FinancialSummary {
  totalRevenue: number      // Soma total
  osRevenue: number         // Receita de OS
  mensalistasRevenue: number // Receita de mensalistas
  // ... outros campos
}
```

### Funções de Filtro:
```typescript
const getFilteredRevenue = () => {
  switch (revenueFilter) {
    case 'OS': return summary.osRevenue
    case 'MENSALISTAS': return summary.mensalistasRevenue
    default: return summary.totalRevenue
  }
}

const getFilteredMonthlyRevenue = () => {
  switch (revenueFilter) {
    case 'OS': return summary.osMonthlyRevenue // Receita das OS do mês atual
    case 'MENSALISTAS': return summary.monthlyRevenue
    default: return summary.monthlyRevenue + summary.osMonthlyRevenue // Total mensal
  }
}
```

### Estados da Interface:
- **revenueFilter**: Controla qual tipo de receita está sendo exibido
- **KPIs Dinâmicos**: Valores e descrições se adaptam ao filtro
- **Layout Responsivo**: Grid de 4 colunas para melhor aproveitamento

## Evolução Futura

### Possíveis Melhorias:
1. **Filtros Compostos**: Combinação de tipo + período
2. **Gráficos Comparativos**: Visualização de tendências por tipo
3. **Exportação Filtrada**: Relatórios específicos por categoria
4. **Alertas Inteligentes**: Notificações baseadas no tipo de receita
5. **Dashboard Executivo**: Métricas agregadas por categoria

### Integrações:
1. **Sistemas de Pagamento**: Separação automática por método
2. **CRM**: Análise de receita por segmento de cliente
3. **Contabilidade**: Exportação para sistemas contábeis
4. **BI**: Conectores para ferramentas de business intelligence
