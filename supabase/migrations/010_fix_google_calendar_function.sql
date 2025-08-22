-- Migração para corrigir a função update_service_google_event_id
-- Corrige problemas de validação e adiciona logs para debug

-- Recriar a função com melhor validação e logs
CREATE OR REPLACE FUNCTION update_service_google_event_id(
    p_service_id UUID,
    p_google_event_id TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Verificar se o serviço existe
    IF NOT EXISTS (SELECT 1 FROM services WHERE id = p_service_id) THEN
        RAISE EXCEPTION 'Serviço com ID % não encontrado', p_service_id;
    END IF;
    
    -- Atualizar o google_event_id
    UPDATE services 
    SET google_event_id = p_google_event_id,
        updated_at = NOW()
    WHERE id = p_service_id;
    
    -- Verificar se a atualização foi bem-sucedida
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Erro ao atualizar serviço com ID %', p_service_id;
    END IF;
    
    RAISE NOTICE 'Serviço % atualizado com google_event_id: %', p_service_id, p_google_event_id;
END;
$$ LANGUAGE plpgsql;

-- Verificar se a função foi criada corretamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_service_google_event_id'
    ) THEN
        RAISE NOTICE 'Função update_service_google_event_id criada/atualizada com sucesso';
    ELSE
        RAISE EXCEPTION 'Erro ao criar função update_service_google_event_id';
    END IF;
END $$;
