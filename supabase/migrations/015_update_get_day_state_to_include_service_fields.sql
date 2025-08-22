-- Migration: 015_update_get_day_state_to_include_service_fields
-- Description: Atualiza função get_day_state para incluir campos has_key e service_type
-- Date: 2025-01-27

-- Atualizar função get_day_state para incluir os novos campos de serviço
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
