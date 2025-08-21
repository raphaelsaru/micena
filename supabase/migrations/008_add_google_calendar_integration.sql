-- Migração para integração com Google Calendar
-- Adiciona campos necessários para sincronização automática

-- Verificar se o campo google_event_id já existe na tabela services
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'google_event_id'
    ) THEN
        -- Adicionar campo google_event_id se não existir
        ALTER TABLE services ADD COLUMN google_event_id TEXT;
        
        -- Criar índice para melhor performance nas consultas
        CREATE INDEX idx_services_google_event_id ON services(google_event_id);
        
        RAISE NOTICE 'Campo google_event_id adicionado à tabela services';
    ELSE
        RAISE NOTICE 'Campo google_event_id já existe na tabela services';
    END IF;
END $$;

-- Função para atualizar google_event_id de um serviço
CREATE OR REPLACE FUNCTION update_service_google_event_id(
    p_service_id UUID,
    p_google_event_id TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE services 
    SET google_event_id = p_google_event_id,
        updated_at = NOW()
    WHERE id = p_service_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Serviço com ID % não encontrado', p_service_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar serviços que precisam de sincronização com Google Calendar
CREATE OR REPLACE FUNCTION get_services_for_calendar_sync(
    p_team_id INTEGER DEFAULT 1
)
RETURNS TABLE (
    service_id UUID,
    client_name TEXT,
    service_type service_type,
    service_date DATE,
    next_service_date DATE,
    notes TEXT,
    google_event_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        c.full_name,
        s.service_type,
        s.service_date,
        s.next_service_date,
        s.notes,
        s.google_event_id
    FROM services s
    JOIN clients c ON s.client_id = c.id
    WHERE s.next_service_date IS NOT NULL
    AND s.next_service_date >= CURRENT_DATE
    ORDER BY s.next_service_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar google_event_id de serviços deletados
CREATE OR REPLACE FUNCTION cleanup_deleted_service_events()
RETURNS VOID AS $$
BEGIN
    -- Esta função pode ser chamada periodicamente para limpar
    -- eventos órfãos no Google Calendar
    -- Por enquanto, apenas um placeholder
    RAISE NOTICE 'Função de limpeza de eventos deletados criada';
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON COLUMN services.google_event_id IS 'ID do evento no Google Calendar para sincronização automática';
COMMENT ON FUNCTION update_service_google_event_id IS 'Atualiza o ID do evento Google Calendar de um serviço';
COMMENT ON FUNCTION get_services_for_calendar_sync IS 'Retorna serviços que precisam ser sincronizados com Google Calendar';
COMMENT ON FUNCTION cleanup_deleted_service_events IS 'Função para limpeza de eventos órfãos no Google Calendar';


