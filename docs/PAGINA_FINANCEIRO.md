# Página Financeiro - Sistema Micena Piscinas

## Visão Geral

A página Financeiro foi criada para fornecer uma visão completa da gestão financeira do sistema, incluindo controle de mensalistas, pagamentos avulsos e geração de relatórios.

## Funcionalidades Implementadas

### 1. Resumo Geral (Topo da Página)

**Filtro de Receita:**
- **Todas as Receitas**: Mostra a soma total de OS + Mensalistas
- **Apenas OS**: Filtra para mostrar apenas receitas de Ordens de Serviço
- **Apenas Mensalistas**: Filtra para mostrar apenas receitas de mensalidades

**KPIs em Cards:**
- **Receita Total**: Valor baseado no filtro selecionado (OS, Mensalistas ou Total)
- **Receita do Mês**: Valor baseado no filtro selecionado (OS = OS do mês atual, Mensalistas = mensalidades do mês, Total = mensalidades + OS do mês)
- **Receita Pendente**: Exibe o valor total de pagamentos em aberto (adaptado ao filtro)
- **Total de Mensalistas Ativos**: Conta clientes com mensalidade ativa

### 2. Mensalistas

**Tabela com colunas:**
- Cliente
- Valor da mensalidade
- Status geral (Pago/Em Aberto)
- Último pagamento

**Filtros:**
- Todos
- Apenas pagos
- Apenas em aberto

### 3. Pagamentos Avulsos (OS)

**Tabela com colunas:**
- Nº OS
- Cliente
- Serviço
- Data
- Valor
- Método de pagamento
- Ações (Ver OS completa)



### 5. UI/UX

**Design responsivo:**
- Layout adaptável para diferentes tamanhos de tela
- Grid responsivo para os cards de KPI
- Tabelas com scroll horizontal em telas pequenas

**Componentes shadcn/ui utilizados:**
- Cards para KPIs e seções
- Tabs para organização do conteúdo
- Tabelas para dados estruturados
- Badges para status
- Botões com variantes
- Select para filtros
- DatePicker para seleção de datas

## Estrutura de Arquivos

```
src/
├── app/
│   └── financeiro/
│       └── page.tsx          # Página principal
├── components/
│   └── ui/
│       ├── table.tsx         # Componente de tabela
│       ├── date-picker.tsx   # Seletor de datas
│       └── calendar.tsx      # Calendário
└── hooks/
    └── useFinancial.ts       # Hook para dados financeiros
```

## Hook useFinancial

O hook `useFinancial` gerencia toda a lógica de dados da página:

### Estados:
- `summary`: Resumo financeiro (receitas totais, OS, mensalistas e mensalistas)
- `mensalistas`: Lista de clientes mensalistas
- `servicePayments`: Pagamentos de serviços avulsos
- `loading`: Estado de carregamento
- `error`: Tratamento de erros

### Funções:
- `fetchSummary()`: Busca resumo financeiro (incluindo separação OS vs Mensalistas)
- `fetchMensalistas()`: Busca dados dos mensalistas
- `fetchServicePayments()`: Busca pagamentos de serviços e calcula receita de OS
- `filterMensalistasByStatus()`: Filtra mensalistas por status

## Navegação

A página Financeiro foi adicionada à navegação principal com:
- Ícone: BarChart3
- Rota: `/financeiro`
- Posição: Após "Mensalistas"

## Integração com Banco de Dados

### Tabelas utilizadas:
- `clients`: Dados dos clientes
- `payments`: Pagamentos mensais
- `services`: Serviços realizados
- `service_items`: Itens dos serviços
- `service_materials`: Materiais utilizados

### Queries principais:
- Cálculo de receita mensal por status
- Contagem de mensalistas ativos
- Busca de serviços com valores
- Filtros por período para relatórios

## Responsividade

A página foi desenvolvida com foco em responsividade:

- **Mobile**: Cards empilhados, tabelas com scroll
- **Tablet**: Layout intermediário com grid adaptativo
- **Desktop**: Layout completo com todas as funcionalidades visíveis

## Tratamento de Erros

- Estados de loading para melhor UX
- Tratamento de erros com mensagens claras
- Botão de retry em caso de falha
- Fallbacks para dados ausentes

## Funcionalidades Futuras

Possíveis melhorias para versões futuras:

1. **Exportação de dados**: CSV, Excel
2. **Gráficos**: Evolução de receitas ao longo do tempo
3. **Dashboard avançado**: Mais métricas e indicadores
4. **Notificações**: Alertas para pagamentos vencidos
5. **Integração**: Conectores com sistemas de pagamento
6. **Relatórios personalizados**: Templates customizáveis

## Uso

1. Acesse a página através do menu "Financeiro"
2. **Selecione o filtro de receita** no topo para visualizar:
   - **Todas as Receitas**: Soma total de OS + Mensalistas
   - **Apenas OS**: Apenas receitas de Ordens de Serviço
   - **Apenas Mensalistas**: Apenas receitas de mensalidades
3. Visualize os KPIs que se adaptam ao filtro selecionado
4. Use as abas para navegar entre as seções:
   - **Mensalistas**: Gerencie clientes com mensalidade
   - **Pagamentos Avulsos**: Visualize serviços realizados
5. Utilize os filtros para refinar as informações

## Manutenção

Para manter a página funcionando corretamente:

- Verifique as permissões do banco de dados
- Monitore o hook `useFinancial` para performance
- Atualize os tipos TypeScript conforme necessário
- Teste a responsividade em diferentes dispositivos
