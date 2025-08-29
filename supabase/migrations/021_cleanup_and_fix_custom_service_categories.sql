-- Limpar duplicatas e corrigir funções RPC para categorias personalizadas

-- Primeiro, vamos limpar as duplicatas mantendo apenas a mais recente de cada grupo
WITH duplicates AS (
    SELECT 
        id,
        name,
        UPPER(TRIM(name)) as normalized_name,
        ROW_NUMBER() OVER (PARTITION BY UPPER(TRIM(name)) ORDER BY created_at DESC, id) as rn
    FROM custom_service_categories
),
to_delete AS (
    SELECT id FROM duplicates WHERE rn > 1
)
DELETE FROM custom_service_categories 
WHERE id IN (SELECT id FROM to_delete);

-- Agora normalizar os nomes existentes para uppercase
UPDATE custom_service_categories 
SET name = UPPER(TRIM(name)), updated_at = NOW()
WHERE name != UPPER(TRIM(name));

-- Função para adicionar categoria personalizada (com uppercase e melhor tratamento de erros)
CREATE OR REPLACE FUNCTION add_custom_service_category(
    category_name TEXT,
    category_description TEXT DEFAULT NULL,
    category_color TEXT DEFAULT '#6B7280'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_category_id UUID;
    normalized_name TEXT;
BEGIN
    -- Normalizar nome para uppercase e remover espaços extras
    normalized_name := UPPER(TRIM(category_name));
    
    -- Verificar se o nome não está vazio após normalização
    IF normalized_name = '' THEN
        RAISE EXCEPTION 'Nome da categoria não pode estar vazio';
    END IF;
    
    -- Verificar se já existe uma categoria com esse nome
    IF EXISTS (SELECT 1 FROM custom_service_categories WHERE UPPER(name) = normalized_name AND is_active = true) THEN
        RAISE EXCEPTION 'Já existe uma categoria com o nome "%"', normalized_name;
    END IF;
    
    -- Inserir nova categoria
    INSERT INTO custom_service_categories (name, description, color)
    VALUES (normalized_name, category_description, category_color)
    RETURNING id INTO new_category_id;
    
    RETURN new_category_id;
END;
$$;

-- Função para atualizar categoria personalizada (com uppercase e melhor tratamento de erros)
CREATE OR REPLACE FUNCTION update_custom_service_category(
    category_id UUID,
    category_name TEXT DEFAULT NULL,
    category_description TEXT DEFAULT NULL,
    category_color TEXT DEFAULT NULL,
    category_active BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    normalized_name TEXT;
    current_name TEXT;
BEGIN
    -- Verificar se a categoria existe
    SELECT name INTO current_name FROM custom_service_categories WHERE id = category_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Categoria não encontrada';
    END IF;
    
    -- Se está atualizando o nome
    IF category_name IS NOT NULL THEN
        -- Normalizar nome para uppercase e remover espaços extras
        normalized_name := UPPER(TRIM(category_name));
        
        -- Verificar se o nome não está vazio após normalização
        IF normalized_name = '' THEN
            RAISE EXCEPTION 'Nome da categoria não pode estar vazio';
        END IF;
        
        -- Verificar se já existe outra categoria ativa com esse nome (exceto a atual)
        IF EXISTS (
            SELECT 1 FROM custom_service_categories 
            WHERE UPPER(name) = normalized_name 
            AND id != category_id 
            AND is_active = true
        ) THEN
            RAISE EXCEPTION 'Já existe uma categoria com o nome "%"', normalized_name;
        END IF;
    ELSE
        -- Se não está atualizando o nome, usar o nome atual
        normalized_name := current_name;
    END IF;
    
    -- Atualizar categoria
    UPDATE custom_service_categories
    SET 
        name = COALESCE(normalized_name, name),
        description = COALESCE(category_description, description),
        color = COALESCE(category_color, color),
        is_active = COALESCE(category_active, is_active),
        updated_at = NOW()
    WHERE id = category_id;
    
    RETURN FOUND;
END;
$$;

-- Função para remover categoria personalizada (com melhor tratamento de erros)
CREATE OR REPLACE FUNCTION remove_custom_service_category(
    category_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se a categoria existe
    IF NOT EXISTS (SELECT 1 FROM custom_service_categories WHERE id = category_id) THEN
        RAISE EXCEPTION 'Categoria não encontrada';
    END IF;
    
    -- Marcar como inativa em vez de deletar para preservar referências
    UPDATE custom_service_categories
    SET 
        is_active = FALSE,
        updated_at = NOW()
    WHERE id = category_id;
    
    RETURN FOUND;
END;
$$;

-- Trigger para garantir que nomes sejam sempre uppercase ao inserir/atualizar diretamente na tabela
CREATE OR REPLACE FUNCTION ensure_category_name_uppercase()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.name := UPPER(TRIM(NEW.name));
    
    -- Verificar se o nome não está vazio
    IF NEW.name = '' THEN
        RAISE EXCEPTION 'Nome da categoria não pode estar vazio';
    END IF;
    
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS ensure_category_name_uppercase_trigger ON custom_service_categories;
CREATE TRIGGER ensure_category_name_uppercase_trigger
    BEFORE INSERT OR UPDATE ON custom_service_categories
    FOR EACH ROW
    EXECUTE FUNCTION ensure_category_name_uppercase();
