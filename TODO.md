# TODO - Micena Piscinas

## ✅ Concluído

### Melhorias na Experiência do Usuário
- [x] **Remoção de indicadores visuais desnecessários**
  - Removidas as indicações de "Serviço customizado" e "Do catálogo"
  - Interface mais limpa e focada

- [x] **Implementação de price_history para todos os itens**
  - Criada função RPC `insert_custom_price_history` para itens sem catálogo
  - Modificada função `createService` para sempre criar price_history
  - Sistema agora mantém histórico de preços para itens do catálogo e customizados

- [x] **Melhoria na experiência de criação de serviços**
  - Ao pressionar Enter no campo de preço, o sistema agora adiciona o item/material
  - Não fecha mais o modal, apenas executa a função "Adicionar Serviço" ou "Adicionar Material"
  - Melhora significativamente o fluxo de trabalho para usuários que digitam rapidamente

- [x] **Formatação monetária padronizada**
  - Todos os valores em reais agora usam vírgula como separador decimal (formato brasileiro)
  - Substituídos todos os `.toFixed(2)` e `.toLocaleString` pela função `formatCurrency`
  - Formatação consistente em toda a aplicação: serviços, materiais, mensalistas e notificações

### Funcionalidades Técnicas
- [x] **Migração de banco de dados**
  - Criada migração `026_add_custom_price_history_function.sql`
  - Função RPC para inserir histórico de preços de itens customizados

- [x] **Componentes atualizados**
  - `ServiceItemsManagerWithCatalog.tsx` - Suporte a Enter para adicionar serviço
  - `ServiceMaterialsManagerWithCatalog.tsx` - Suporte a Enter para adicionar material
  - `services.ts` - Lógica para sempre criar price_history
  - Todos os componentes de serviços agora usam formatação monetária brasileira

## 🔄 Em Andamento

Nenhuma tarefa em andamento no momento.

## 📋 Próximas Melhorias Sugeridas

### Interface do Usuário
- [ ] **Atalhos de teclado adicionais**
  - Ctrl+Enter para salvar o serviço completo
  - Tab para navegar entre campos de forma mais intuitiva

- [ ] **Validação em tempo real**
  - Feedback visual imediato para campos obrigatórios
  - Indicadores de preço sugerido baseado no histórico

### Funcionalidades de Negócio
- [ ] **Sugestões automáticas de preço**
  - Sistema que sugere preços baseado no histórico
  - Alertas para variações significativas de preço

- [ ] **Relatórios de preços**
  - Análise de evolução de preços ao longo do tempo
  - Comparação de preços entre diferentes períodos

## 🐛 Problemas Conhecidos

Nenhum problema conhecido no momento.

## 📝 Notas de Implementação

### Sobre o price_history
- O sistema agora **sempre** cria price_history para todos os itens e materiais
- Itens com `catalog_item_id` usam `insertPriceHistory` normal
- Itens sem `catalog_item_id` (customizados) usam `insertCustomPriceHistory`
- Isso garante que o último preço usado em uma OS seja sempre registrado

### Sobre a experiência do usuário
- Pressionar Enter no campo de preço agora executa a ação de adicionar
- Não fecha o modal, permitindo adicionar múltiplos itens rapidamente
- Melhora significativamente a produtividade para usuários experientes

### Sobre a formatação monetária
- Todos os valores em reais agora usam o formato brasileiro (R$ X,XX)
- Função `formatCurrency` do `@/lib/formatters` garante consistência
- Separação decimal com vírgula, conforme padrão brasileiro
- Formatação aplicada em: serviços, materiais, mensalistas, notificações e relatórios
