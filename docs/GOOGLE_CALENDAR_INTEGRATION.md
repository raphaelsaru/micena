# 🔗 Integração com Google Calendar

## 📋 Visão Geral

A integração com Google Calendar permite sincronizar automaticamente os próximos serviços com sua agenda pessoal. Quando você define uma data para o próximo serviço, o sistema cria automaticamente um evento no Google Calendar com lembretes configuráveis.

## ✨ Funcionalidades

### 🔐 **Autenticação OAuth 2.0**
- Conexão segura com sua conta Google
- Autorização apenas para acesso ao calendário
- Tokens de acesso armazenados localmente

### 📅 **Sincronização Automática**
- **Criação**: Eventos são criados automaticamente ao definir `next_service_date`
- **Atualização**: Eventos são atualizados quando o serviço é editado
- **Remoção**: Eventos são removidos quando o serviço é deletado

### 🎯 **Formato dos Eventos**
- **Título**: `Atendimento Micena — {Nome do Cliente}`
- **Descrição**: Tipo de serviço, observações e data do próximo serviço
- **Duração**: Dia inteiro (sem horário específico)
- **Fuso horário**: Não aplicável (eventos de dia inteiro)
- **Lembretes**: 
  - 1 dia antes (email)
  - 1 hora antes (popup)

### 🔄 **Sincronização em Lote**
- Sincronize múltiplos serviços de uma vez
- Visualização de status de sincronização
- Relatório de sucessos e falhas

## 🚀 Como Usar

### 1. **Conectar ao Google Calendar**
1. Acesse a página de **Serviços** (`/services`)
2. Clique em **"Conectar Google Calendar"**
3. Autorize o acesso na página do Google
4. Você será redirecionado de volta ao sistema

### 2. **Configurar Próximo Serviço**
1. Ao criar ou editar um serviço, defina a **Data do Próximo Serviço**
2. O evento será criado automaticamente no Google Calendar
3. Você receberá lembretes por email e popup

### 3. **Sincronização em Lote**
1. Na página de serviços, use o componente **"Sincronização em Lote"**
2. Clique em **"Sincronizar X Serviços"**
3. Acompanhe o progresso e resultados

### 4. **Verificar Status**
- **Verde**: Evento sincronizado com sucesso
- **Laranja**: Evento não sincronizado
- **Cinza**: Data do próximo serviço passou

## 🛠️ Configuração Técnica

### **Variáveis de Ambiente**
```bash
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_REDIRECT_URI=https://seudominio.com/api/auth/google/callback
```

### **Escopos de Permissão**
- `https://www.googleapis.com/auth/calendar` - Acesso completo ao calendário
- `https://www.googleapis.com/auth/calendar.events` - Apenas eventos

### **Estrutura de Arquivos**
```
src/
├── lib/
│   └── google-calendar.ts          # Cliente e funções do Google Calendar
├── hooks/
│   └── useGoogleCalendar.ts        # Hook para gerenciar autenticação
├── components/
│   ├── GoogleCalendarSync.tsx      # Componente de conexão
│   ├── BulkCalendarSync.tsx        # Sincronização em lote
│   └── CalendarSyncStatus.tsx      # Status nos cards de serviço
└── app/api/auth/google/
    ├── login/route.ts              # Iniciar autenticação
    └── callback/route.ts           # Receber autorização
```

## 🔧 API Endpoints

### **POST /api/auth/google/login**
Inicia o processo de autenticação OAuth 2.0.

### **GET /api/auth/google/callback**
Recebe a autorização do Google e troca o código por tokens.

## 📊 Banco de Dados

### **Campo Adicionado**
```sql
ALTER TABLE services ADD COLUMN google_event_id TEXT;
```

### **Funções SQL**
- `update_service_google_event_id()` - Atualiza o ID do evento
- `get_services_for_calendar_sync()` - Lista serviços para sincronização
- `cleanup_deleted_service_events()` - Limpeza de eventos órfãos

## 🔒 Segurança

### **OAuth 2.0**
- Fluxo de autorização padrão do Google
- Tokens de acesso temporários
- Sem armazenamento de senhas

### **Permissões**
- Acesso apenas ao calendário do usuário
- Não acessa outros dados da conta Google
- Usuário pode revogar acesso a qualquer momento

## 🐛 Solução de Problemas

### **Erro de Autenticação**
- Verifique se as credenciais do Google estão corretas
- Confirme se a URL de redirecionamento está configurada
- Verifique se a API do Google Calendar está ativada

### **Eventos Não Sincronizados**
- Confirme se está conectado ao Google Calendar
- Verifique se o serviço tem `next_service_date` definida
- Use a sincronização em lote para serviços existentes

### **Lembretes Não Funcionando**
- Verifique as configurações de notificação do Google Calendar
- Confirme se o fuso horário está correto
- Teste com eventos de teste no calendário

## 📱 Compatibilidade

### **Navegadores Suportados**
- Chrome (recomendado)
- Firefox
- Safari
- Edge

### **Dispositivos**
- Desktop (recomendado)
- Tablet
- Mobile (funcionalidade limitada)

## 🔄 Atualizações Futuras

### **Funcionalidades Planejadas**
- [ ] Sincronização bidirecional (Google → Sistema)
- [ ] Múltiplos calendários
- [ ] Templates de eventos personalizáveis
- [ ] Integração com Google Meet
- [ ] Notificações push

### **Melhorias Técnicas**
- [ ] Refresh tokens automático
- [ ] Cache de eventos
- [ ] Sincronização offline
- [ ] Webhooks para mudanças em tempo real

## 📞 Suporte

Para dúvidas ou problemas com a integração:

1. **Verifique os logs** do console do navegador
2. **Teste a conexão** com o Google Calendar
3. **Revogue e reconecte** a autorização se necessário
4. **Entre em contato** com o suporte técnico

---

**Nota**: Esta integração requer uma conta Google válida e conexão com a internet para funcionar corretamente.


