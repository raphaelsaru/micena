-- Migration: 028_add_team5_special_logic
-- Description: Adiciona suporte à equipe 5 com lógica especial para evitar duplicatas
-- Date: 2025-01-27

-- Atualizar constraints para permitir equipe 5
ALTER TABLE route_assignments DROP CONSTRAINT IF EXISTS route_assignments_team_id_check;
ALTER TABLE route_settings DROP CONSTRAINT IF EXISTS route_settings_team_id_check;

ALTER TABLE route_assignments ADD CONSTRAINT route_assignments_team_id_check CHECK (team_id >= 1 AND team_id <= 5);
ALTER TABLE route_settings ADD CONSTRAINT route_settings_team_id_check CHECK (team_id >= 1 AND team_id <= 5);

-- Inserir configurações iniciais para equipe 5
INSERT INTO route_settings (weekday, max_clients, team_id) VALUES 
    (1, 10, 5), (2, 10, 5), (3, 10, 5), (4, 10, 5), (5, 10, 5), (6, 10, 5) -- Equipe 5
ON CONFLICT (weekday, team_id) DO NOTHING;

-- Atualizar função save_positions para incluir equipe 5
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
  
  IF p_team_id < 1 OR p_team_id > 5 THEN
    RAISE EXCEPTION 'ID da equipe deve estar entre 1 e 5';
  END IF;
  
  IF p_ordered_client_ids IS NULL OR array_length(p_ordered_client_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Lista de clientes não pode estar vazia';
  END IF;
  
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
END;
$$;

-- Atualizar função get_day_state com lógica especial para equipe 5
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
  
  IF p_team_id < 1 OR p_team_id > 5 THEN
    RAISE EXCEPTION 'ID da equipe deve estar entre 1 e 5';
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
    
    -- Clientes disponíveis com lógica especial para equipe 5
    CASE 
      WHEN p_team_id = 5 THEN
        -- Equipe 5: pode adicionar clientes de outras equipes, mas não duplicatas dentro dela
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
            -- Excluir clientes que já estão na equipe 5 neste dia
            SELECT ra.client_id 
            FROM route_assignments ra 
            WHERE ra.weekday = p_weekday AND ra.team_id = 5
          )),
          '[]'::json
        )
      ELSE
        -- Equipes 1-4: lógica normal (clientes não atribuídos a nenhuma equipe)
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
        )
    END as available_clients;
END;
$$;

-- Atualizar função get_team_settings para incluir equipe 5
CREATE OR REPLACE FUNCTION get_team_settings(p_team_id INTEGER)
RETURNS TABLE(
  weekday INTEGER,
  max_clients INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar parâmetros
  IF p_team_id < 1 OR p_team_id > 5 THEN
    RAISE EXCEPTION 'ID da equipe deve estar entre 1 e 5';
  END IF;
  
  RETURN QUERY
  SELECT rs.weekday, rs.max_clients
  FROM route_settings rs
  WHERE rs.team_id = p_team_id
  ORDER BY rs.weekday;
END;
$$;

-- Atualizar função get_team_assignments para incluir equipe 5
CREATE OR REPLACE FUNCTION get_team_assignments(p_team_id INTEGER)
RETURNS TABLE(
  weekday INTEGER,
  client_id UUID,
  full_name TEXT,
  order_index INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar parâmetros
  IF p_team_id < 1 OR p_team_id > 5 THEN
    RAISE EXCEPTION 'ID da equipe deve estar entre 1 e 5';
  END IF;
  
  RETURN QUERY
  SELECT ra.weekday, ra.client_id, c.full_name, ra.order_index
  FROM route_assignments ra
  JOIN clients c ON c.id = ra.client_id
  WHERE ra.team_id = p_team_id
  ORDER BY ra.weekday, ra.order_index;
END;
$$;
