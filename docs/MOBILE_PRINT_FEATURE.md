# Funcionalidade de Impressão Mobile - Imprimir Selecionados

## Visão Geral

Esta funcionalidade permite que usuários em dispositivos móveis selecionem clientes específicos da página de rotas e gerem um PDF com o layout idêntico ao da impressão do desktop.

## Arquitetura da Solução

### 1. Frontend (Mobile)
- **Seleção múltipla**: Interface já existente para selecionar clientes
- **Botão FAB**: Floating Action Button que aparece quando em modo de seleção
- **Geração no servidor**: Envia HTML para API gerar PDF

### 2. Backend (API)
- **Rota**: `/api/routes/print-pdf`
- **Tecnologia**: Puppeteer para geração de PDF server-side
- **Input**: HTML renderizado do componente de impressão
- **Output**: PDF com layout idêntico ao desktop

## Como Funciona

### 1. Detecção de Dispositivo
```javascript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
```

### 2. Fluxo Mobile vs Desktop
- **Desktop**: Usa `window.print()` (comportamento original mantido)
- **Mobile**: Gera PDF no servidor e faz download

### 3. Processo de Geração PDF
1. Usuário seleciona clientes e clica no botão FAB
2. Sistema clona o componente de impressão
3. Captura HTML renderizado
4. Envia para API `/api/routes/print-pdf`
5. Puppeteer renderiza HTML em PDF
6. PDF é retornado e baixado automaticamente

## Componentes Modificados

### 1. `RouteTab.tsx`
- Função `handlePrintSelected` atualizada
- Detecção mobile/desktop
- Integração com API de PDF
- Melhor tratamento de erros

### 2. `MobilePrintFAB.tsx`
- Adicionado loading state
- Tooltips informativos
- Visual feedback durante geração

### 3. Nova API: `print-pdf/route.ts`
- Usa Puppeteer para renderização
- CSS completo embutido para fidelidade visual
- Configurações de página A4
- Headers apropriados para download

## Garantias Implementadas

### ✅ Layout Preservado
- CSS idêntico ao desktop embutido na API
- Mesmas margens, fontes e espaçamentos
- Cores e ícones preservados

### ✅ Desktop Intocado
- Função original `window.print()` mantida
- Zero impacto no comportamento desktop
- Detecção confiável mobile/desktop

### ✅ UX Mobile Otimizada
- FAB intuitivo com contador
- Loading states visuais
- Tooltips informativos
- Download automático do PDF

## Tecnologias Utilizadas

- **Puppeteer**: Geração de PDF server-side
- **Next.js API Routes**: Endpoint backend
- **React Hooks**: Estado e interação
- **Tailwind CSS**: Estilos preservados no PDF

## Arquivos Criados/Modificados

### Novos Arquivos
- `src/app/api/routes/print-pdf/route.ts` - API de geração PDF

### Arquivos Modificados
- `src/components/routes/RouteTab.tsx` - Lógica mobile/desktop
- `src/components/routes/MobilePrintFAB.tsx` - UI aprimorada
- `package.json` - Dependências puppeteer

## Como Testar

1. Acesse a página de rotas em um dispositivo mobile
2. Clique em "Selecionar" para entrar no modo de seleção
3. Selecione um ou mais clientes
4. Clique no botão FAB azul (ícone de impressora)
5. Aguarde a geração e download do PDF
6. Verifique que o layout é idêntico ao desktop

## Benefícios

1. **Experiência Consistente**: Mesmo visual desktop/mobile
2. **Facilidade de Uso**: Interface mobile otimizada
3. **Flexibilidade**: Selecionar apenas clientes necessários
4. **Qualidade**: PDF vetorial de alta qualidade
5. **Compatibilidade**: Funciona em todos navegadores mobile

## Considerações Técnicas

- PDF gerado server-side para máxima fidelidade
- Fallback gracioso para desktop (print nativo)
- CSS específico de impressão preservado
- Gestão eficiente de memória (cleanup automático)
- Timeout adequado para processamento

Esta implementação atende completamente aos requisitos especificados, mantendo o layout desktop intacto e adicionando funcionalidade mobile robusta.
