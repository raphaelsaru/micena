# Persistência da Integração com Google Calendar

## Visão Geral

Este documento descreve a implementação da persistência da integração com o Google Calendar, que permite que os usuários não precisem reautenticar toda vez que usarem o sistema.

## Arquitetura

### 1. Tabela de Tokens (`user_google_tokens`)

A tabela armazena os tokens de autenticação do Google OAuth para cada usuário:

```sql
CREATE TABLE user_google_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL, -- Criptografado com pgcrypto
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    needs_reconnect BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos importantes:**
- `access_token`: Token de acesso atual (não criptografado)
- `refresh_token`: Token de atualização (criptografado com pgcrypto)
- `expires_at`: Data/hora de expiração do access_token
- `needs_reconnect`: Flag indicando se o usuário precisa reautenticar

### 2. Funções do Banco de Dados

#### `upsert_user_google_tokens(user_id, access_token, refresh_token, expires_at)`
- Insere ou atualiza tokens de um usuário
- Criptografa automaticamente o refresh_token
- Retorna o ID do registro

#### `get_user_google_tokens(user_id)`
- Obtém tokens de um usuário
- Descriptografa automaticamente o refresh_token
- Retorna todos os campos da tabela

#### `mark_user_google_tokens_needs_reconnect(user_id)`
- Marca tokens como precisando de reconexão
- Usado quando há erro `invalid_grant`

#### `has_valid_google_tokens(user_id)`
- Verifica se um usuário tem tokens válidos
- Considera expiração e flag de reconexão

### 3. Helper Server-Side (`google-calendar-server.ts`)

#### `getGoogleClient(userId)`
Função principal que retorna sempre um client válido:

1. **Verifica tokens existentes** no banco
2. **Valida expiração** do access_token
3. **Renova automaticamente** se necessário usando refresh_token
4. **Marca para reconexão** se refresh_token for inválido
5. **Retorna access_token válido** ou indica necessidade de reconexão

#### `getGoogleConnectionStatus(userId)`
Verifica o status atual da conexão:
- `connected`: Se está conectado e funcionando
- `expiresAt`: Quando expira o próximo token
- `needsReconnect`: Se precisa reautenticar

## Fluxo de Autenticação

### 1. Primeira Autenticação
```
Usuário → Google OAuth → Callback → Salvar tokens no banco → Redirecionar
```

### 2. Uso Normal
```
Chamada API → getGoogleClient() → Token válido → Executar operação
```

### 3. Renovação Automática
```
Token expirado → getGoogleClient() → Refresh automático → Novo access_token
```

### 4. Falha na Renovação
```
Refresh falha → Marcar needs_reconnect → Usuário deve reautenticar
```

## Endpoints da API

### `GET /api/google/status?userId=...`
Retorna o status da conexão:
```json
{
  "connected": true,
  "expiresAt": "2024-01-15T10:30:00Z",
  "needsReconnect": false
}
```

### `POST /api/google/disconnect`
Desconecta o usuário removendo tokens do banco.

## Segurança

### Criptografia
- **refresh_token**: Criptografado com pgcrypto usando `app.jwt_secret`
- **access_token**: Não criptografado (temporário, expira rapidamente)

### Variáveis de Ambiente
- `GOOGLE_CLIENT_ID`: ID do cliente OAuth
- `GOOGLE_CLIENT_SECRET`: Segredo do cliente (nunca exposto ao frontend)
- `SUPABASE_SERVICE_ROLE_KEY`: Para operações server-side

## Uso no Frontend

### Hook `useGoogleCalendar`
```typescript
const { 
  isAuthenticated, 
  needsReconnect, 
  startAuth,
  disconnect 
} = useGoogleCalendar()
```

### Estados Importantes
- `isAuthenticated`: Usuário está conectado
- `needsReconnect`: Precisa reautenticar (refresh_token inválido)
- `startAuth`: Iniciar processo de autenticação
- `disconnect`: Desconectar e limpar tokens

### Verificação de Status
```typescript
// Verificar status via API
const response = await fetch(`/api/google/status?userId=${userId}`)
const status = await response.json()

if (status.needsReconnect) {
  // Mostrar botão de reconexão
}
```

## Tratamento de Erros

### `invalid_grant`
- Ocorre quando refresh_token expira ou é revogado
- Sistema marca `needs_reconnect = true`
- Usuário deve reautenticar manualmente

### `unauthorized` (401)
- Access_token expirado
- Sistema tenta renovar automaticamente
- Se falhar, marca para reconexão

### Falhas de Rede
- Sistema mantém estado anterior
- Tenta renovar na próxima operação
- Logs detalhados para debugging

## Monitoramento

### Logs Importantes
- Renovação de tokens
- Falhas de autenticação
- Operações de criptografia
- Erros de API do Google

### Métricas
- Taxa de renovação automática
- Frequência de reconexões necessárias
- Tempo médio de resposta das APIs

## Manutenção

### Limpeza de Tokens
- Tokens expirados são mantidos para auditoria
- Função `cleanup_deleted_service_events()` para limpeza futura

### Backup
- Tabela `user_google_tokens` incluída no backup automático
- refresh_tokens criptografados são seguros para backup

### Atualizações
- Migração `025_add_user_google_tokens_table.sql`
- Compatível com sistema existente
- Não quebra funcionalidades atuais

## Troubleshooting

### Problema: "Precisa reconectar" sempre aparece
**Causa:** refresh_token inválido ou expirado
**Solução:** Usuário deve clicar em "Reconectar"

### Problema: Tokens não são salvos
**Causa:** Erro na função `upsert_user_google_tokens`
**Verificar:** Logs do banco, permissões da função

### Problema: Criptografia falha
**Causa:** `app.jwt_secret` não configurado
**Verificar:** Configuração do Supabase, variáveis de ambiente

## Próximos Passos

1. **Implementar sistema de usuários** para substituir ID fixo
2. **Adicionar auditoria** de operações de token
3. **Implementar notificações** quando reconexão for necessária
4. **Adicionar métricas** de uso e performance
5. **Implementar backup** automático dos tokens
