# Sistema de Despesas - Página Financeiro

## Visão Geral

O sistema de despesas foi implementado na página financeiro para permitir o controle completo do fluxo de caixa da empresa. O sistema permite:

- **Lançamento de despesas** com diferentes tipos (materiais, folha de pagamento, impostos, contas fixas, outros)
- **Gerenciamento de materiais** sem preços fixos (preços variáveis por compra)
- **Visualização de resumos** financeiros com receitas e despesas
- **Filtros por período** para análise mensal e anual

## Funcionalidades Implementadas

### 1. Gerenciamento de Materiais

**Localização:** Aba "Materiais" na página financeiro

**Funcionalidades:**
- ✅ Criar novos materiais
- ✅ Editar materiais existentes
- ✅ Deletar materiais
- ✅ Pesquisar materiais por nome/descrição
- ✅ Definir unidade de medida (un, kg, cx, m, m2, m3, L)

**Características:**
- Materiais não possuem preços fixos
- Preços são definidos no momento do lançamento da despesa
- Permite diferentes preços para o mesmo material em compras diferentes

### 2. Lançamento de Despesas

**Localização:** Aba "Despesas" na página financeiro

**Tipos de Despesas:**
- **MATERIAL**: Compra de materiais e produtos
- **FOLHA_PAGAMENTO**: Salários e benefícios dos funcionários
- **IMPOSTOS**: Impostos e taxas governamentais
- **CONTAS_FIXAS**: Aluguel, energia, água, telefone, etc.
- **OUTROS**: Outras despesas não categorizadas

**Funcionalidades:**
- ✅ Formulário intuitivo para lançamento
- ✅ Cálculo automático de valor total para materiais (quantidade × preço unitário)
- ✅ Seleção de material existente ou criação de novo
- ✅ Campos opcionais: fornecedor, observações
- ✅ Validação de dados obrigatórios
- ✅ **Descrição opcional para despesas de material**
- ✅ **Ordem otimizada dos campos (data primeiro, material acima da descrição)**
- ✅ **Atualização em tempo real dos resumos**

### 3. Listagem e Gestão de Despesas

**Funcionalidades:**
- ✅ Visualizar todas as despesas registradas
- ✅ Filtrar por tipo de despesa
- ✅ Pesquisar por descrição, fornecedor ou material
- ✅ Editar despesas existentes
- ✅ Deletar despesas
- ✅ Ordenação por data (mais recentes primeiro)

### 4. Resumo Financeiro Atualizado

**Novos Cards no Dashboard:**
- **Despesas Totais**: Total de todas as despesas registradas
- **Lucro Líquido**: Receita total - Despesas totais
- **Lucro do Mês**: Receita mensal - Despesas mensais

**Resumo por Categoria:**
- ✅ Distribuição das despesas por tipo
- ✅ Percentual de cada categoria
- ✅ Valor total e mensal por categoria
- ✅ Visualização gráfica com cores diferenciadas
- ✅ **Atualização em tempo real quando nova despesa é lançada**

## Estrutura do Banco de Dados

### Tabela `materials`
```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  unit_type VARCHAR(50) DEFAULT 'un',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabela `expenses`
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  expense_type expense_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  material_id UUID REFERENCES materials(id),
  quantity DECIMAL(10,2),
  unit_price DECIMAL(10,2),
  supplier VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enum `expense_type`
```sql
CREATE TYPE expense_type AS ENUM (
  'MATERIAL',
  'FOLHA_PAGAMENTO',
  'IMPOSTOS',
  'CONTAS_FIXAS',
  'OUTROS'
);
```

## Componentes Criados

### 1. `MaterialsManagement.tsx`
- Interface completa para gerenciar materiais
- Formulários de criação e edição
- Tabela com ações (editar/deletar)
- Pesquisa em tempo real

### 2. `ExpenseForm.tsx`
- Formulário para lançamento de despesas
- Cálculo automático para materiais
- Validação de campos obrigatórios
- Interface responsiva

### 3. `ExpensesList.tsx`
- Listagem de todas as despesas
- Filtros por tipo e pesquisa
- Ações de edição e exclusão
- Dialog de edição inline

### 4. `ExpensesSummary.tsx`
- Resumo visual das despesas por categoria
- Percentuais e valores
- Cards informativos
- Design responsivo

## Hooks Criados

### 1. `useMaterials.ts`
- Gerenciamento completo de materiais
- CRUD operations
- Busca e filtros
- Estado de loading e erro

### 2. `useExpenses.ts`
- Gerenciamento completo de despesas
- CRUD operations
- Cálculo de resumos
- Filtros por período

### 3. `useFinancial.ts` (Atualizado)
- Integração com despesas
- Cálculo de lucro líquido
- Resumos mensais e totais
- Compatibilidade com filtros existentes

## Fluxo de Uso

### Para Lançar uma Despesa de Material:

1. **Acessar** a aba "Despesas" na página financeiro
2. **Preencher** o formulário de lançamento (nova ordem otimizada):
   - **Data**: Data da compra (primeiro campo)
   - **Tipo**: "Material"
   - **Material**: Selecionar material existente ou criar novo
   - **Quantidade**: 10
   - **Preço unitário**: R$ 25,00
   - **Descrição**: "Compra de cloro granulado" (opcional para materiais)
   - **Valor total**: Calculado automaticamente: 10 × R$ 25,00 = R$ 250,00
   - **Fornecedor**: "Distribuidora ABC" (opcional)
3. **Clicar** em "Lançar Despesa"
4. **Verificar** atualização automática nos resumos financeiros

### Para Lançar Outras Despesas:

1. **Selecionar** o tipo apropriado (Folha de Pagamento, Impostos, etc.)
2. **Preencher** descrição, valor e data
3. **Adicionar** fornecedor e observações se necessário
4. **Lançar** a despesa

## Benefícios do Sistema

### 1. **Controle Total do Fluxo de Caixa**
- Visão completa de receitas e despesas
- Cálculo automático de lucro líquido
- Análise mensal e anual

### 2. **Flexibilidade nos Preços**
- Materiais sem preços fixos
- Preços variáveis por compra
- Histórico de preços por transação

### 3. **Categorização Inteligente**
- 5 tipos de despesas principais
- Resumos por categoria
- Análise de gastos por tipo

### 4. **Interface Intuitiva**
- Formulários simples e claros
- Validação em tempo real
- Feedback visual com toasts
- Design responsivo para mobile
- **Ordem otimizada dos campos**
- **Atualização em tempo real dos resumos**

### 5. **Integração Completa**
- Compatível com sistema existente
- Filtros por período funcionam com despesas
- Resumos atualizados automaticamente

## Próximos Passos Sugeridos

1. **Relatórios Avançados**
   - Gráficos de evolução mensal
   - Comparativo ano anterior
   - Exportação para PDF/Excel

2. **Alertas e Notificações**
   - Alertas de despesas altas
   - Lembretes de contas a pagar
   - Notificações de orçamento

3. **Integração com Contas a Pagar**
   - Sistema de vencimentos
   - Controle de pagamentos
   - Conciliação bancária

4. **Análise de Rentabilidade**
   - Margem por serviço
   - Análise de custos por cliente
   - ROI de investimentos
