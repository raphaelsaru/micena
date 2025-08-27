-- Migração para adicionar tabela de tokens do Google Calendar
-- Implementa persistência de tokens para evitar reautenticação

-- Habilitar extensão pgcrypto se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar tabela para armazenar tokens do Google Calendar
CREATE TABLE IF NOT EXISTS user_google_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL, -- Será criptografado
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    needs_reconnect BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_user_id ON user_google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_expires_at ON user_google_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_google_tokens_needs_reconnect ON user_google_tokens(needs_reconnect);

-- Criar constraint única para user_id
ALTER TABLE user_google_tokens ADD CONSTRAINT unique_user_google_tokens UNIQUE (user_id);

-- Função para inserir ou atualizar tokens de um usuário
CREATE OR REPLACE FUNCTION upsert_user_google_tokens(
    p_user_id UUID,
    p_access_token TEXT,
    p_refresh_token TEXT,
    p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
    v_token_id UUID;
    v_encrypted_refresh_token TEXT;
BEGIN
    -- Criptografar o refresh_token
    v_encrypted_refresh_token := encrypt(p_refresh_token::bytea, current_setting('app.jwt_secret')::bytea, 'aes');
    
    -- Tentar inserir, se falhar (por constraint unique), atualizar
    INSERT INTO user_google_tokens (user_id, access_token, refresh_token, expires_at, needs_reconnect)
    VALUES (p_user_id, p_access_token, v_encrypted_refresh_token, p_expires_at, FALSE)
    ON CONFLICT (user_id) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        expires_at = EXCLUDED.expires_at,
        needs_reconnect = FALSE,
        updated_at = NOW()
    RETURNING id INTO v_token_id;
    
    RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter tokens de um usuário
CREATE OR REPLACE FUNCTION get_user_google_tokens(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    needs_reconnect BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_encrypted_refresh_token TEXT;
    v_decrypted_refresh_token TEXT;
BEGIN
    SELECT 
        t.id,
        t.access_token,
        t.refresh_token,
        t.expires_at,
        t.needs_reconnect,
        t.created_at,
        t.updated_at
    INTO 
        id,
        access_token,
        v_encrypted_refresh_token,
        expires_at,
        needs_reconnect,
        created_at,
        updated_at
    FROM user_google_tokens t
    WHERE t.user_id = p_user_id;
    
    -- Descriptografar o refresh_token
    IF v_encrypted_refresh_token IS NOT NULL THEN
        v_decrypted_refresh_token := decrypt(v_encrypted_refresh_token::bytea, current_setting('app.jwt_secret')::bytea, 'aes');
        refresh_token := v_decrypted_refresh_token;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar tokens como precisando de reconexão
CREATE OR REPLACE FUNCTION mark_user_google_tokens_needs_reconnect(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_google_tokens 
    SET needs_reconnect = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para deletar tokens de um usuário
CREATE OR REPLACE FUNCTION delete_user_google_tokens(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM user_google_tokens 
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se um usuário tem tokens válidos
CREATE OR REPLACE FUNCTION has_valid_google_tokens(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_google_tokens 
        WHERE user_id = p_user_id 
        AND needs_reconnect = FALSE
        AND expires_at > NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE user_google_tokens IS 'Armazena tokens de autenticação do Google Calendar para usuários';
COMMENT ON COLUMN user_google_tokens.access_token IS 'Token de acesso do Google OAuth (não criptografado)';
COMMENT ON COLUMN user_google_tokens.refresh_token IS 'Token de atualização do Google OAuth (criptografado com pgcrypto)';
COMMENT ON COLUMN user_google_tokens.expires_at IS 'Data/hora de expiração do access_token';
COMMENT ON COLUMN user_google_tokens.needs_reconnect IS 'Indica se o usuário precisa reautenticar (ex: invalid_grant)';
COMMENT ON FUNCTION upsert_user_google_tokens IS 'Insere ou atualiza tokens do Google Calendar para um usuário';
COMMENT ON FUNCTION get_user_google_tokens IS 'Obtém tokens do Google Calendar de um usuário (descriptografa refresh_token)';
COMMENT ON FUNCTION mark_user_google_tokens_needs_reconnect IS 'Marca tokens como precisando de reconexão';
COMMENT ON FUNCTION delete_user_google_tokens IS 'Remove tokens do Google Calendar de um usuário';
COMMENT ON FUNCTION has_valid_google_tokens IS 'Verifica se um usuário tem tokens válidos do Google Calendar';
