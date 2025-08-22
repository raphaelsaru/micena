-- Migration: 018_fix_service_type_constraint_violation
-- Description: Corrige violação de constraint na coluna service_type tratando valores vazios
-- Date: 2025-01-27

-- Corrigir função save_positions para tratar valores vazios corretamente
CREATE OR REPLACE FUNCTION save_positions(
  p_weekday INTEGER,
  p_team_id INTEGER,
  p_ordered_client_ids TEXT[],
  p_has_keys BOOLEAN[] DEFAULT NULL,
  p_service_types TEXT[] DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  client_id TEXT;
  order_index INTEGER := 1;
  has_key BOOLEAN := false;
  service_type TEXT := NULL;
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
  
  -- Validar arrays opcionais
  IF p_has_keys IS NOT NULL AND array_length(p_has_keys, 1) != array_length(p_ordered_client_ids, 1) THEN
    RAISE EXCEPTION 'Array de has_keys deve ter o mesmo tamanho do array de clientes';
  END IF;
  
  IF p_service_types IS NOT NULL AND array_length(p_service_types, 1) != array_length(p_ordered_client_ids, 1) THEN
    RAISE EXCEPTION 'Array de service_types deve ter o mesmo tamanho do array de clientes';
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
    
    -- Obter valores dos arrays opcionais
    IF p_has_keys IS NOT NULL THEN
      has_key := p_has_keys[order_index];
    END IF;
    
    IF p_service_types IS NOT NULL THEN
      -- Tratar valores vazios ou nulos corretamente
      IF p_service_types[order_index] IS NULL OR p_service_types[order_index] = '' THEN
        service_type := NULL;
      ELSE
        service_type := p_service_types[order_index];
      END IF;
    END IF;
    
    -- Inserir nova atribuição
    INSERT INTO route_assignments (client_id, weekday, order_index, team_id, has_key, service_type)
    VALUES (client_id::UUID, p_weekday, order_index, p_team_id, has_key, service_type);
    
    order_index := order_index + 1;
  END LOOP;
END;
$$;
