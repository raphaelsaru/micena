-- Adicionar função para salvar posições das rotas
CREATE OR REPLACE FUNCTION save_positions(
  p_weekday INTEGER,
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
  
  IF p_ordered_client_ids IS NULL OR array_length(p_ordered_client_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Lista de clientes não pode estar vazia';
  END IF;
  
  -- Iniciar transação
  BEGIN
    -- Remover todas as atribuições existentes para este dia da semana
    DELETE FROM route_assignments WHERE weekday = p_weekday;
    
    -- Inserir novas atribuições na ordem especificada
    FOREACH client_id IN ARRAY p_ordered_client_ids
    LOOP
      -- Verificar se o cliente existe
      IF NOT EXISTS (SELECT 1 FROM clients WHERE id = client_id::UUID) THEN
        RAISE EXCEPTION 'Cliente com ID % não encontrado', client_id;
      END IF;
      
      -- Inserir nova atribuição
      INSERT INTO route_assignments (client_id, weekday, order_index)
      VALUES (client_id::UUID, p_weekday, order_index);
      
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

-- Adicionar função para obter estado completo de um dia
CREATE OR REPLACE FUNCTION get_day_state(p_weekday INTEGER)
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
  
  RETURN QUERY
  SELECT
    -- Assignments para este dia
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
      WHERE ra.weekday = p_weekday),
      '[]'::json
    ) as assignments,
    
    -- Clientes disponíveis (não atribuídos a este dia)
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
