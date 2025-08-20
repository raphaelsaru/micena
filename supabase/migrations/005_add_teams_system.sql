-- Adicionar sistema de equipes ao sistema de rotas
-- Cada equipe terá sua própria agenda independente

-- Adicionar coluna team_id às tabelas de rotas
ALTER TABLE route_assignments ADD COLUMN team_id INTEGER NOT NULL DEFAULT 1 CHECK (team_id >= 1 AND team_id <= 4);
ALTER TABLE route_settings ADD COLUMN team_id INTEGER NOT NULL DEFAULT 1 CHECK (team_id >= 1 AND team_id <= 4);

-- Remover constraints únicas antigas que não consideravam equipes
ALTER TABLE route_assignments DROP CONSTRAINT IF EXISTS route_assignments_weekday_order_index_key;
ALTER TABLE route_settings DROP CONSTRAINT IF EXISTS route_settings_weekday_key;

-- Adicionar novas constraints únicas considerando equipes
ALTER TABLE route_assignments ADD CONSTRAINT route_assignments_weekday_order_index_team_key UNIQUE (weekday, order_index, team_id);
ALTER TABLE route_settings ADD CONSTRAINT route_settings_weekday_team_key UNIQUE (weekday, team_id);

-- Adicionar constraint para garantir que um cliente só pode estar em uma equipe por dia
ALTER TABLE route_assignments ADD CONSTRAINT route_assignments_weekday_client_team_key UNIQUE (weekday, client_id, team_id);

-- Criar índices para melhorar performance das consultas por equipe
CREATE INDEX idx_route_assignments_team_weekday ON route_assignments(team_id, weekday);
CREATE INDEX idx_route_settings_team_weekday ON route_settings(team_id, weekday);

-- Inserir configurações iniciais para todas as equipes (1 a 4)
INSERT INTO route_settings (weekday, max_clients, team_id) VALUES 
    (1, 10, 1), (2, 10, 1), (3, 10, 1), (4, 10, 1), (5, 10, 1), -- Equipe 1
    (1, 10, 2), (2, 10, 2), (3, 10, 2), (4, 10, 2), (5, 10, 2), -- Equipe 2
    (1, 10, 3), (2, 10, 3), (3, 10, 3), (4, 10, 3), (5, 10, 3), -- Equipe 3
    (1, 10, 4), (2, 10, 4), (3, 10, 4), (4, 10, 4), (5, 10, 4)  -- Equipe 4
ON CONFLICT (weekday, team_id) DO NOTHING;

-- Atualizar função save_positions para incluir equipe
CREATE OR REPLACE FUNCTION save_positions(
  p_weekday INTEGER,
  p_team_id INTEGER,
  p_ordered_client_ids TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  client_id TEXT;
  order_index INTEGER := 1;
BEGIN
  -- Validar parâmetros
  IF p_weekday < 1 OR p_weekday > 5 THEN
    RAISE EXCEPTION 'Dia da semana deve estar entre 1 e 5';
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
      
      -- Inserir nova atribuição
      INSERT INTO route_assignments (client_id, weekday, order_index, team_id)
      VALUES (client_id::UUID, p_weekday, order_index, p_team_id);
      
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

-- Atualizar função get_day_state para incluir equipe
CREATE OR REPLACE FUNCTION get_day_state(p_weekday INTEGER, p_team_id INTEGER)
RETURNS TABLE(
  assignments JSON,
  available_clients JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar parâmetros
  IF p_weekday < 1 OR p_weekday > 5 THEN
    RAISE EXCEPTION 'Dia da semana deve estar entre 1 e 5';
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
          'order_index', ra.order_index
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
          'phone', COALESCE(c.phone, '')
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

-- Função para obter configurações de uma equipe específica
CREATE OR REPLACE FUNCTION get_team_settings(p_team_id INTEGER)
RETURNS TABLE(
  weekday INTEGER,
  max_clients INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validar parâmetros
  IF p_team_id < 1 OR p_team_id > 4 THEN
    RAISE EXCEPTION 'ID da equipe deve estar entre 1 e 4';
  END IF;
  
  RETURN QUERY
  SELECT rs.weekday, rs.max_clients
  FROM route_settings rs
  WHERE rs.team_id = p_team_id
  ORDER BY rs.weekday;
END;
$$;

-- Função para obter todas as atribuições de uma equipe
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
  IF p_team_id < 1 OR p_team_id > 4 THEN
    RAISE EXCEPTION 'ID da equipe deve estar entre 1 e 4';
  END IF;
  
  RETURN QUERY
  SELECT ra.weekday, ra.client_id, c.full_name, ra.order_index
  FROM route_assignments ra
  JOIN clients c ON c.id = ra.client_id
  WHERE ra.team_id = p_team_id
  ORDER BY ra.weekday, ra.order_index;
END;
$$;
