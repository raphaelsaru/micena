-- Adicionar função RPC para inserir preços no histórico para itens customizados
-- Esta função permite que o sistema mantenha histórico de preços mesmo para serviços/materiais que não estão no catálogo

-- Função para inserir preço no histórico para itens customizados
CREATE OR REPLACE FUNCTION insert_custom_price_history(
  p_description TEXT,
  p_item_type TEXT,
  p_price_numeric NUMERIC,
  p_org_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Inserir na tabela price_history com um ID único baseado na descrição
  INSERT INTO price_history (
    id,
    item_type,
    item_id,
    price_numeric,
    org_id,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_item_type,
    gen_random_uuid(), -- ID único para item customizado
    p_price_numeric,
    p_org_id,
    NOW()
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Comentário para documentar a função
COMMENT ON FUNCTION insert_custom_price_history IS 'Insere preço no histórico para itens customizados que não estão no catálogo';

-- Garantir que a função seja executável pelos usuários autenticados
GRANT EXECUTE ON FUNCTION insert_custom_price_history TO authenticated;

