-- Migration: Corrigir tipos de dados na função update_route_client_attributes
-- Data: 2025-01-27

-- Remover função antiga com tipos incorretos
DROP FUNCTION IF EXISTS update_route_client_attributes(TEXT, INTEGER, INTEGER, BOOLEAN, TEXT);

-- Função corrigida com tipos de dados apropriados
CREATE OR REPLACE FUNCTION update_route_client_attributes(
  p_client_id UUID,  -- Corrigido: TEXT -> UUID
  p_weekday INTEGER, -- Corrigido: p_day_of_week -> p_weekday
  p_team_id INTEGER,
  p_has_key BOOLEAN DEFAULT NULL,
  p_service_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Validar parâmetros
  IF p_client_id IS NULL OR p_weekday IS NULL OR p_team_id IS NULL THEN
    RAISE EXCEPTION 'Parâmetros obrigatórios não podem ser NULL';
  END IF;
  
  -- Validar service_type se fornecido
  IF p_service_type IS NOT NULL AND p_service_type NOT IN ('ASPIRAR', 'ESFREGAR') THEN
    RAISE EXCEPTION 'service_type deve ser ASPIRAR ou ESFREGAR';
  END IF;
  
  -- Atualizar apenas os campos fornecidos
  UPDATE route_assignments 
  SET 
    has_key = COALESCE(p_has_key, has_key),
    service_type = CASE 
      WHEN p_service_type IS NULL THEN service_type
      WHEN p_service_type = '' THEN NULL
      ELSE p_service_type
    END,
    updated_at = NOW()
  WHERE 
    client_id = p_client_id 
    AND weekday = p_weekday  -- Corrigido: day_of_week -> weekday
    AND team_id = p_team_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Retornar true se pelo menos uma linha foi atualizada
  RETURN v_updated_count > 0;
END;
$$;

-- Comentários da função
COMMENT ON FUNCTION update_route_client_attributes IS 'Atualiza atributos específicos de um cliente na rota (has_key e service_type) - Tipos corrigidos';

-- Conceder permissões para usuários anônimos e autenticados
GRANT EXECUTE ON FUNCTION update_route_client_attributes(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) TO anon, authenticated;
