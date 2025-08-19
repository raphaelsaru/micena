# Funcionalidades de Drag & Drop para Rotas - Micena Piscinas

## Visão Geral

Este documento descreve as novas funcionalidades de drag & drop implementadas no sistema de rotas da Micena Piscinas, que permitem aos usuários reordenar clientes de forma mais intuitiva e eficiente.

## Funcionalidades Implementadas

### 1. Reordenação por Drag & Drop

- **Arrastar e Soltar**: Os usuários podem arrastar clientes para qualquer posição na lista da rota
- **Feedback Visual**: Durante o arrasto, o cliente fica semi-transparente e com sombra
- **Posicionamento Inteligente**: O sistema detecta automaticamente onde o cliente será inserido
- **Reordenação em Tempo Real**: A lista se atualiza visualmente conforme o usuário arrasta

### 2. Adição de Clientes com Posição Específica

- **Menor número**: Adicionar cliente como primeiro da lista
- **Maior número**: Adicionar cliente como último da lista (padrão)
- **Posição Entre**: Escolher exatamente entre quais clientes inserir o novo cliente

### 3. Sistema de Mudanças Pendentes

- **Persistência Adiada**: As mudanças são apenas visuais até o usuário confirmar
- **Botão "Salvar Posições"**: Sempre ativo e disponível para o usuário
- **Transação Única**: Todas as mudanças são salvas em uma única operação

## Componentes Criados/Modificados

### Novos Componentes

1. **`DraggableRouteList.tsx`**
   - Lista de clientes com funcionalidade de drag & drop
   - Usa a biblioteca @dnd-kit/core para implementação estável
   - Suporte a layout de 1 coluna

2. **`DraggableTwoColumnLayout.tsx`**
   - Layout de 2 colunas com drag & drop entre colunas
   - Sistema unificado para reordenação flexível
   - Suporte completo a movimentação entre colunas

2. **`AddClientToRouteWithPositionDialog.tsx`**
   - Dialog para adicionar clientes com escolha de posição
   - Interface intuitiva com opções visuais para cada tipo de posição

### Componentes Modificados

1. **`useRoutes.ts`**
   - Nova função `reorderClients()` para reordenação via drag & drop
   - Função `addClientToRoute()` atualizada para suportar posições específicas
   - Sistema de mudanças pendentes aprimorado

2. **`RoutesPage.tsx`**
   - Integração com novo dialog de adição de clientes
   - Suporte à função de reordenação

3. **`RouteTab.tsx`**
   - Substituição da lista estática pela lista com drag & drop
   - Suporte a layout de 2 colunas com reordenação independente

## Tecnologias Utilizadas

- **@dnd-kit/core**: Biblioteca principal para drag & drop
- **@dnd-kit/sortable**: Extensão para listas ordenáveis
- **@dnd-kit/utilities**: Utilitários para transformações CSS
- **React Hooks**: useState, useCallback, useEffect
- **TypeScript**: Tipagem completa para todas as funcionalidades

## Como Usar

### Reordenar Clientes

1. **Arrastar e Soltar**:
   - Clique e segure em qualquer parte do card do cliente
   - Arraste para a posição desejada
   - Solte para confirmar a nova posição

2. **Layout de 2 Colunas**:
   - Clientes podem ser movidos entre colunas
   - Arraste de qualquer posição para qualquer posição
   - Sistema unificado mantém numeração sequencial

3. **Feedback Visual**:
   - O cliente fica semi-transparente durante o arrasto
   - A lista se reorganiza em tempo real
   - As posições são recalculadas automaticamente

### Adicionar Cliente

1. **Clique em "Adicionar Cliente"**
2. **Selecione o cliente desejado**
3. **Escolha a posição**:
   - 🟦 **Menor número**: Primeiro da lista
   - 🟦 **Maior número**: Último da lista
   - 🟦 **Entre Clientes**: Escolher posição específica
4. **Clique em "Adicionar Cliente"**

### Salvar Mudanças

1. **Clique em "Salvar Posições"** (sempre disponível)
2. **Aguarde a confirmação** do banco de dados

## Layout de 2 Colunas

- **Funcionamento**: Sistema unificado com drag & drop entre colunas
- **Reordenação**: Clientes podem ser movidos entre colunas livremente
- **Posições Globais**: O sistema mantém a numeração sequencial entre as colunas
- **Drag & Drop**: Funciona perfeitamente entre colunas e dentro de cada coluna
- **Flexibilidade**: Clientes podem ser reorganizados de qualquer posição para qualquer posição

## Estilos CSS

### Classes Principais

- `.draggable-client-card`: Card do cliente com transições suaves e cursor de arrasto
- `.dragging`: Estado durante o arrasto com efeitos visuais aprimorados

### Responsividade

- **Mobile**: Funciona perfeitamente em dispositivos touch
- **Desktop**: Suporte completo a mouse e teclado
- **Tablet**: Interface otimizada para telas médias

## Considerações Técnicas

### Performance

- **Reordenação Local**: Todas as mudanças são feitas no estado local primeiro
- **Lazy Loading**: O banco só é atualizado quando necessário
- **Otimizações**: Uso de useCallback e useMemo para evitar re-renders
- **Feedback Visual**: Mudanças são aplicadas visualmente durante o arrasto
- **Sem Loops Infinitos**: Sistema otimizado para evitar atualizações desnecessárias
- **Respeita Ordem Visual**: Sistema mantém a ordenação atual (crescente/decrescente)

### Acessibilidade

- **Suporte a Teclado**: Navegação completa via teclado
- **Screen Readers**: Compatível com leitores de tela
- **ARIA Labels**: Atributos apropriados para acessibilidade

### Compatibilidade

- **Navegadores Modernos**: Chrome, Firefox, Safari, Edge
- **Dispositivos**: Desktop, tablet e mobile
- **Touch**: Suporte nativo a gestos touch

## Troubleshooting

### Problemas Comuns

1. **Drag & Drop não funciona**:
   - Verifique se o JavaScript está habilitado
   - Clique e arraste em qualquer parte do card do cliente
   - Recarregue a página se necessário

2. **Posições não salvam**:
   - Clique em "Salvar Posições" (sempre disponível)
   - As mudanças são aplicadas visualmente durante o arrasto
   - O sistema respeita a ordenação atual (crescente/decrescente)
   - **✅ CORRIGIDO**: O sistema agora detecta corretamente as mudanças de posição

3. **Mudanças não são detectadas**:
   - **✅ CORRIGIDO**: O sistema agora compara corretamente as posições originais com as novas posições
   - **✅ CORRIGIDO**: As mudanças são detectadas baseadas no índice visual da nova ordem
   - **✅ CORRIGIDO**: O botão "Salvar Posições" aparece corretamente após reordenação

4. **Layout quebrado**:
   - Troque entre 1 e 2 colunas
   - Recarregue a página se persistir

### Logs e Debug

- **Console**: Mensagens de erro e sucesso
- **Estado**: Verificação das mudanças pendentes
- **Network**: Requisições ao banco de dados

## Próximas Melhorias

- [ ] Animações mais suaves
- [ ] Suporte a múltiplas rotas simultâneas
- [ ] Histórico de mudanças
- [ ] Desfazer/Refazer operações
- [ ] Exportação de rotas reordenadas

## Conclusão

As novas funcionalidades de drag & drop transformam a experiência de gerenciamento de rotas, tornando-a mais intuitiva e eficiente. O sistema mantém a robustez técnica existente enquanto adiciona uma camada de usabilidade moderna e responsiva.
