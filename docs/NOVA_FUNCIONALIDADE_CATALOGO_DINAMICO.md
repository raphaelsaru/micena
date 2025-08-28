# Nova Funcionalidade: Catálogo Dinâmico de Serviços e Materiais

## Visão Geral

Esta funcionalidade permite que usuários adicionem novos serviços e materiais aos catálogos diretamente durante a criação de um serviço, caso o item desejado não exista na lista.

## Funcionalidades Implementadas

### 1. Adição Dinâmica de Serviços
- **Botão "+"**: Ao lado do campo de seleção de serviço, há um botão com ícone de círculo com "+"
- **Formulário Inline**: Ao clicar no botão, abre um formulário para inserir o nome do novo serviço
- **Validação**: Campo obrigatório com validação em tempo real
- **Integração Automática**: Após adicionar, o novo serviço é automaticamente selecionado

### 2. Adição Dinâmica de Materiais
- **Botão "+"**: Similar ao de serviços, localizado ao lado do campo de seleção de material
- **Formulário Avançado**: Permite definir nome e unidade de medida
- **Seleção de Unidade**: Dropdown com todas as unidades disponíveis (un, kg, cx, m, m², m³, L)
- **Integração Automática**: Após adicionar, o novo material é automaticamente selecionado

### 3. Fluxo de Trabalho
1. Usuário tenta selecionar um serviço/material
2. Se não encontrar na lista, clica no botão "+"
3. Preenche o formulário com as informações necessárias
4. Sistema adiciona ao catálogo e atualiza a lista
5. Item é automaticamente selecionado para uso imediato

## Componentes Modificados

### `ServiceItemsManagerWithCatalog`
- Adicionado botão "+" para novos serviços
- Formulário inline para inserção de nome
- Integração com `insertServiceCatalogItem`
- Atualização automática do catálogo local

### `ServiceMaterialsManagerWithCatalog`
- Adicionado botão "+" para novos materiais
- Formulário inline para nome e unidade
- Integração com `insertMaterialCatalogItem`
- Atualização automática do catálogo local

## Funções Adicionadas

### `insertServiceCatalogItem(name: string, unitType?: string)`
- Insere novo serviço no catálogo
- Retorna o item criado ou null em caso de erro
- Validação de nome obrigatório

### `insertMaterialCatalogItem(name: string, unitType: string)`
- Insere novo material no catálogo
- Requer nome e unidade de medida
- Retorna o item criado ou null em caso de erro

## Interface do Usuário

### Botão de Adição
- **Ícone**: PlusCircle (círculo com "+")
- **Estilo**: Outline, tamanho "icon" (quadrado perfeito)
- **Tooltip**: "Adicionar novo serviço/material ao catálogo"
- **Posicionamento**: Ao lado direito do campo de seleção
- **Alinhamento**: Perfeitamente alinhado verticalmente com o select

### Layout e Alinhamento
- **Label Separado**: Label "Serviço" e "Material" posicionado acima dos campos
- **Container Flexível**: Campo de seleção ocupa espaço disponível (flex-1)
- **Botão Compacto**: Botão de adição com tamanho fixo (shrink-0)
- **Gap Consistente**: Espaçamento de 8px (gap-2) entre elementos

### Formulário Inline
- **Design**: Borda arredondada, fundo branco
- **Layout**: Responsivo com grid adaptativo
- **Validação**: Campos obrigatórios destacados
- **Ações**: Botões "Adicionar" e "Cancelar"

### Estados de Carregamento
- **Adicionando**: Botão mostra "Adicionando..." e fica desabilitado
- **Sucesso**: Formulário fecha automaticamente
- **Erro**: Log no console para debugging

## Melhorias de UI Implementadas

### 1. Alinhamento Vertical Perfeito
- **Problema Resolvido**: Botão "+" agora está perfeitamente alinhado com o campo de seleção
- **Solução**: Uso do tamanho "icon" do componente Button do Shadcn
- **Layout**: Container flex com gap consistente

### 2. Componentes Shadcn Padrão
- **Button**: Usando variantes outline, size="icon", size="sm"
- **Label**: Componente padrão com espaçamento consistente
- **Input**: Componente padrão para formulários inline
- **Select**: Componente padrão para seleção de unidades

### 3. Espaçamento e Tipografia
- **Margens**: mb-2 para labels, mt-3 para formulários inline
- **Padding**: p-3 para formulários, p-4 para containers principais
- **Gap**: gap-2 para elementos inline, gap-4 para grid

### 4. Responsividade
- **Grid Adaptativo**: grid-cols-1 md:grid-cols-2 para diferentes tamanhos de tela
- **Flexbox**: flex-1 para campos de seleção, shrink-0 para botões
- **Breakpoints**: md: para tablets e desktop

### 5. Comportamento do Dropdown
- **Fechamento Automático**: Dropdown fecha automaticamente ao clicar fora dele
- **Event Listener**: Detecta cliques fora do componente usando mousedown
- **Cleanup Automático**: Remove listeners quando não necessário
- **Performance**: Listener só é ativo quando dropdown está aberto

## Validações

### Serviços
- Nome obrigatório (não pode ser vazio)
- Trim automático de espaços
- Verificação de duplicatas (controlada pelo banco)

### Materiais
- Nome obrigatório (não pode ser vazio)
- Unidade obrigatória (padrão: 'un')
- Trim automático de espaços
- Verificação de duplicatas (controlada pelo banco)

## Benefícios

### Para o Usuário
- **Flexibilidade**: Pode adicionar itens conforme necessário
- **Eficiência**: Não precisa sair do fluxo de criação
- **Consistência**: Novos itens seguem o padrão do catálogo
- **Histórico**: Preços são automaticamente rastreados
- **UX Melhorada**: Interface limpa e bem alinhada
- **Comportamento Intuitivo**: Dropdown fecha ao clicar fora

### Para o Sistema
- **Catálogo Crescente**: Base de dados se expande organicamente
- **Padronização**: Todos os itens seguem a mesma estrutura
- **Rastreabilidade**: Histórico completo de preços
- **Performance**: Cache local para consultas rápidas
- **Manutenibilidade**: Código limpo usando componentes padrão

## Casos de Uso

### 1. Serviço Especializado
- Cliente solicita serviço não padrão
- Usuário adiciona "Instalação de Sistema de Ozonização"
- Serviço fica disponível para futuras seleções

### 2. Material Específico
- Projeto requer material especial
- Usuário adiciona "Tubo de PVC 50mm" com unidade "m"
- Material é catalogado com unidade correta

### 3. Variações Regionais
- Diferentes regiões têm necessidades específicas
- Usuários podem adaptar o catálogo localmente
- Sistema mantém consistência global

## Considerações Técnicas

### Performance
- Atualização local do catálogo sem recarregar
- Cache mantido durante a sessão
- Operações assíncronas não bloqueiam a UI
- Event listeners otimizados (só ativos quando necessário)

### Segurança
- Validação de entrada no frontend e backend
- Sanitização de strings (trim)
- Controle de erros com fallbacks

### Manutenibilidade
- Código modular e reutilizável
- Estados bem definidos e gerenciados
- Logs para debugging e monitoramento
- Uso consistente de componentes Shadcn

### Componentes Utilizados
- **Button**: Variantes outline, ghost, size="icon", size="sm"
- **Label**: Componente padrão com espaçamento
- **Input**: Componente padrão para entrada de texto
- **Select**: Componente padrão para dropdowns
- **SearchableSelect**: Componente customizado para busca com fechamento automático

## Implementação Técnica do Fechamento Automático

### 1. Event Listener Inteligente
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      open &&
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target as Node)
    ) {
      setOpen(false)
      setSearchTerm('')
    }
  }

  // Adicionar listener apenas quando o dropdown estiver aberto
  if (open) {
    document.addEventListener('mousedown', handleClickOutside)
  }

  // Cleanup do listener
  return () => {
    document.removeEventListener('mousedown', handleClickOutside)
  }
}, [open])
```

### 2. Referências Múltiplas
- **dropdownRef**: Referência para o container principal do dropdown
- **triggerRef**: Referência para o botão que abre o dropdown
- **searchInputRef**: Referência para o campo de busca

### 3. Lógica de Detecção
- Verifica se o clique foi fora do dropdown E fora do botão trigger
- Usa `mousedown` em vez de `click` para melhor responsividade
- Cleanup automático quando dropdown fecha

## Próximos Passos

### 1. Melhorias de UX
- Confirmação antes de adicionar
- Sugestões de itens similares
- Validação de nomes muito similares

### 2. Funcionalidades Avançadas
- Edição de itens existentes
- Remoção de itens não utilizados
- Categorização automática

### 3. Administração
- Interface para gerenciar catálogos
- Relatórios de uso
- Auditoria de alterações

## Conclusão

Esta funcionalidade transforma o sistema de catálogos de estático para dinâmico, permitindo que usuários adaptem o sistema às suas necessidades específicas sem interrupção do fluxo de trabalho. A implementação mantém a consistência e performance do sistema existente, enquanto adiciona flexibilidade significativa para os usuários finais.

### Principais Melhorias Implementadas
1. **Alinhamento Vertical Perfeito**: Botão "+" agora está perfeitamente alinhado com o campo de seleção
2. **Componentes Shadcn Padrão**: Uso consistente de componentes da biblioteca oficial
3. **Layout Responsivo**: Interface adaptável a diferentes tamanhos de tela
4. **Espaçamento Consistente**: Margens e padding padronizados em todo o componente
5. **UX Polida**: Interface limpa, intuitiva e profissional
6. **Fechamento Automático**: Dropdown fecha automaticamente ao clicar fora dele

A funcionalidade está pronta para uso em produção e oferece uma experiência de usuário superior com interface bem alinhada, componentes consistentes e comportamento intuitivo dos dropdowns.
