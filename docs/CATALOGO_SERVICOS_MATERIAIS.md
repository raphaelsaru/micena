# Catálogo de Serviços e Materiais com Histórico de Preços

## Visão Geral

Esta funcionalidade implementa um sistema de catálogos para serviços e materiais, com preenchimento automático de preços baseado no histórico de lançamentos anteriores.

## Funcionalidades Implementadas

### 1. Catálogos
- **Catálogo de Serviços**: Lista padronizada de serviços oferecidos
- **Catálogo de Materiais**: Lista padronizada de materiais utilizados
- Busca com acentos e filtros em tempo real
- Exibição de unidades de medida quando aplicável

### 2. Preenchimento Automático de Preços
- Ao selecionar um serviço/material, o sistema busca automaticamente o último preço utilizado
- Se não houver histórico, o campo de valor fica vazio para preenchimento manual
- Indicador visual mostrando quando o preço vem do histórico
- Botão "Reaplicar" para restaurar o último preço caso o usuário o altere

### 3. Histórico de Preços
- Armazenamento automático de todos os preços utilizados
- Cache em memória para melhor performance
- Debounce de 300ms para evitar múltiplas chamadas à API

## Estrutura do Banco de Dados

### Tabelas Criadas

#### `service_catalog`
```sql
CREATE TABLE service_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    unit_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `material_catalog`
```sql
CREATE TABLE material_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    unit_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `price_history`
```sql
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_type TEXT NOT NULL CHECK (item_type IN ('service', 'material')),
    item_id UUID NOT NULL,
    price_numeric NUMERIC(12,2) NOT NULL,
    org_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Funções RPC

#### `get_last_price(item_type, item_id, org_id)`
Retorna o último preço registrado para um item específico.

#### `insert_price_history(item_type, item_id, price_numeric, org_id)`
Insere um novo preço no histórico.

## Componentes Criados

### 1. `SearchableSelect`
- Select com busca para seleção única
- Filtro em tempo real
- Exibição de unidades de medida
- Botão para limpar seleção

### 2. `MultiSelect`
- Select com busca para seleção múltipla
- Chips para itens selecionados
- Filtro que exclui itens já selecionados
- Botão para limpar todos

### 3. `CurrencyInput`
- Input monetário com máscara brasileira
- Formatação automática (R$ 0,00)
- Validação de valores positivos
- Conversão automática entre string e número

### 4. `ServiceItemsManagerWithCatalog`
- Gerenciador de itens de serviço com catálogo
- Preenchimento automático de preços
- Validação de campos obrigatórios
- Lista de itens adicionados

### 5. `ServiceMaterialsManagerWithCatalog`
- Gerenciador de materiais com catálogo
- Seleção de unidades de medida
- Cálculo automático de totais
- Preenchimento automático de preços

## Hook Personalizado

### `usePriceHistory`
- Cache de preços em memória
- Debounce para otimizar chamadas à API
- Funções para buscar e inserir preços
- Limpeza automática de cache

## Como Usar

### 1. Adicionar Serviço
1. Selecione um serviço do catálogo usando o campo de busca
2. O valor será preenchido automaticamente se houver histórico
3. Edite o valor se necessário
4. Clique em "Adicionar Serviço"

### 2. Adicionar Material
1. Selecione um material do catálogo
2. Escolha a unidade de medida
3. Digite a quantidade
4. O preço unitário será preenchido automaticamente se houver histórico
5. Edite o preço se necessário
6. Clique em "Adicionar Material"

### 3. Indicadores Visuais
- **Azul**: "Usando último valor: R$ X,XX" - indica que o preço vem do histórico
- **Botão Reaplicar**: permite restaurar o último preço caso alterado
- **Validação**: campos obrigatórios destacados em vermelho

## Dados Inseridos

### Serviços (29 itens)
- Correção de hidráulica/elétrica
- Instalações (CDT, aquecedor, coletor, etc.)
- Manutenções (bomba, casa de máquina, etc.)
- Troca de areia (diferentes volumes)
- Visita técnica

### Materiais (31 itens)
- Tubos e conexões
- Equipamentos (bomba, aquecedor, etc.)
- Capas (proteção, térmica)
- Areia para filtro
- Acessórios diversos

## Validações

- Valores monetários devem ser ≥ 0
- Campos obrigatórios: serviço/material, valor/preço
- Quantidade deve ser > 0 para materiais
- Busca funciona com acentos e caracteres especiais

## Performance

- Cache em memória com duração de 5 minutos
- Debounce de 300ms para busca de preços
- Índices no banco para consultas rápidas
- Lazy loading dos catálogos

## Próximos Passos

1. **Interface de Administração**: Permitir adicionar/editar itens dos catálogos
2. **Relatórios**: Histórico de preços por período
3. **Organizações**: Suporte a múltiplas organizações
4. **Exportação**: Dados dos catálogos em CSV/Excel
5. **Auditoria**: Log de alterações nos catálogos
