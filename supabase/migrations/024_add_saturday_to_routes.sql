-- Migration: 024_add_saturday_to_routes
-- Description: Adiciona sábado (weekday 6) ao sistema de rotas
-- Date: 2025-01-27

-- Atualizar função save_positions para incluir sábado
CREATE OR REPLACE FUNCTION save_positions(
  p_weekday INTEGER,
  p_ordered_client_ids TEXT[],
  p_team_id INTEGER DEFAULT 1,
  p_has_keys BOOLEAN[] DEFAULT NULL,
  p_service_types TEXT[] DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  client_id TEXT;
  order_index INTEGER := 1;
  has_key BOOLEAN;
  service_type TEXT;
BEGIN
  -- Validar parâmetros
  IF p_weekday < 1 OR p_weekday > 6 THEN
    RAISE EXCEPTION 'Dia da semana deve estar entre 1 e 6';
  END IF;
  
  IF p_team_id < 1 OR p_team_id > 4 THEN
    RAISE EXCEPTION 'ID da equipe deve estar entre 1 e 4';
  END IF;
  
  IF p_ordered_client_ids IS NULL OR array_length(p_ordered_client_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Lista de clientes não pode estar vazia';
  END IF;
  
  -- Iniciar transação
  BEGIN
    -- Remover todas as atribuições existentes para este dia da semana e equipe
    DELETE FROM route_assignments WHERE weekday = p_weekday AND team_id = p_team_id;
    
    -- Inserir novas atribuições na ordem especificada
    FOREACH client_id IN ARRAY p_ordered_client_ids
    LOOP
      -- Verificar se o cliente existe
      IF NOT EXISTS (SELECT 1 FROM clients WHERE id = client_id::UUID) THEN
        RAISE EXCEPTION 'Cliente com ID % não encontrado', client_id;
      END IF;
      
      -- Obter valores opcionais
      has_key := NULL;
      service_type := NULL;
      
      IF p_has_keys IS NOT NULL AND array_length(p_has_keys, 1) >= order_index THEN
        has_key := p_has_keys[order_index];
      END IF;
      
      IF p_service_types IS NOT NULL AND array_length(p_service_types, 1) >= order_index THEN
        service_type := p_service_types[order_index];
      END IF;
      
      -- Inserir nova atribuição
      INSERT INTO route_assignments (client_id, weekday, order_index, team_id, has_key, service_type)
      VALUES (client_id::UUID, p_weekday, order_index, p_team_id, has_key, service_type);
      
      order_index := order_index + 1;
    END LOOP;
    
    -- Commit da transação
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      -- Rollback em caso de erro
      ROLLBACK;
      RAISE;
  END;
END;
$$;

-- Atualizar função get_day_state para incluir sábado
CREATE OR REPLACE FUNCTION get_day_state(p_weekday INTEGER, p_team_id INTEGER)
RETURNS TABLE(
  assignments JSON,
  available_clients JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar parâmetros
  IF p_weekday < 1 OR p_weekday > 6 THEN
    RAISE EXCEPTION 'Dia da semana deve estar entre 1 e 6';
  END IF;
  
  IF p_team_id < 1 OR p_team_id > 4 THEN
    RAISE EXCEPTION 'ID da equipe deve estar entre 1 e 4';
  END IF;
  
  RETURN QUERY
  SELECT
    -- Assignments para este dia e equipe
    COALESCE(
      (SELECT json_agg(
        json_build_object(
          'client_id', ra.client_id,
          'full_name', c.full_name,
          'neighborhood', COALESCE(c.neighborhood, ''),
          'order_index', ra.order_index,
          'has_key', COALESCE(ra.has_key, false),
          'service_type', COALESCE(ra.service_type, '')
        ) ORDER BY ra.order_index
      )
      FROM route_assignments ra
      JOIN clients c ON c.id = ra.client_id
      WHERE ra.weekday = p_weekday AND ra.team_id = p_team_id),
      '[]'::json
    ) as assignments,
    
    -- Clientes disponíveis (não atribuídos a nenhuma equipe neste dia)
    COALESCE(
      (SELECT json_agg(
        json_build_object(
          'id', c.id,
          'full_name', c.full_name,
          'document', COALESCE(c.document, ''),
          'phone', COALESCE(c.phone, ''),
          'neighborhood', COALESCE(c.neighborhood, '')
        ) ORDER BY c.full_name
      )
      FROM clients c
      WHERE c.id NOT IN (
        SELECT ra.client_id 
        FROM route_assignments ra 
        WHERE ra.weekday = p_weekday
      )),
      '[]'::json
    ) as available_clients;
END;
$$;

-- Inserir configurações iniciais para sábado (weekday 6) para todas as equipes
INSERT INTO route_settings (weekday, max_clients, team_id) VALUES 
    (6, 10, 1), -- Equipe 1 - Sábado
    (6, 10, 2), -- Equipe 2 - Sábado
    (6, 10, 3), -- Equipe 3 - Sábado
    (6, 10, 4)  -- Equipe 4 - Sábado
ON CONFLICT (weekday, team_id) DO NOTHING;
