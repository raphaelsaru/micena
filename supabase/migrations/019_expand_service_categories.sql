-- Expandir categorias de serviços e adicionar suporte a categorias personalizadas

-- Criar tabela para categorias personalizadas
CREATE TABLE IF NOT EXISTS custom_service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_service_categories_updated_at 
    BEFORE UPDATE ON custom_service_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE custom_service_categories ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados
CREATE POLICY "Usuários autenticados podem gerenciar categorias personalizadas" ON custom_service_categories
    FOR ALL USING (auth.role() = 'authenticated');

-- Inserir TODAS as categorias padrão em MAIÚSCULO
INSERT INTO custom_service_categories (name, description, color) VALUES
    -- Categorias antigas (agora no banco)
    ('AREIA', 'Serviços relacionados à troca ou manutenção de areia do filtro', '#F59E0B'),
    ('EQUIPAMENTO', 'Serviços relacionados a equipamentos da piscina (bomba, filtro, motor, etc.)', '#3B82F6'),
    ('CAPA', 'Serviços relacionados a capas, lonas e coberturas da piscina', '#10B981'),
    ('OUTRO', 'Outros tipos de serviços não categorizados', '#6B7280'),
    
    -- Categorias expandidas (novas)
    ('LIMPEZA_PROFUNDA', 'Serviços de limpeza profunda e completa da piscina', '#06B6D4'),
    ('TRATAMENTO_QUIMICO', 'Serviços relacionados ao tratamento químico da água', '#8B5CF6'),
    ('REPARO_ESTRUTURAL', 'Serviços de reparo estrutural da piscina', '#F97316'),
    ('INSTALACAO', 'Serviços de instalação de novos equipamentos ou sistemas', '#EC4899'),
    ('INSPECAO_TECNICA', 'Serviços de inspeção técnica e diagnóstico', '#EF4444'),
    ('MANUTENCAO_PREVENTIVA', 'Serviços de manutenção preventiva e regular', '#0EA5E9'),
    ('DECORACAO', 'Serviços decorativos e de iluminação', '#F43F5E'),
    ('SAZONAL', 'Serviços sazonais e temporários', '#84CC16')
ON CONFLICT (name) DO NOTHING;

-- Criar função para obter todas as categorias
CREATE OR REPLACE FUNCTION get_all_service_categories()
RETURNS TABLE (
    id TEXT,
    name TEXT,
    description TEXT,
    color TEXT,
    is_custom BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        csc.id::TEXT,
        csc.name,
        COALESCE(csc.description, '') as description,
        csc.color,
        true as is_custom
    FROM custom_service_categories csc
    WHERE csc.is_active = true
    ORDER BY csc.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar categoria personalizada
CREATE OR REPLACE FUNCTION add_custom_service_category(
    category_name TEXT,
    category_description TEXT DEFAULT NULL,
    category_color TEXT DEFAULT '#6B7280'
)
RETURNS UUID AS $$
DECLARE
    new_category_id UUID;
BEGIN
    INSERT INTO custom_service_categories (name, description, color)
    VALUES (category_name, category_description, category_color)
    RETURNING id INTO new_category_id;
    
    RETURN new_category_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar categoria personalizada
CREATE OR REPLACE FUNCTION update_custom_service_category(
    category_id UUID,
    category_name TEXT DEFAULT NULL,
    category_description TEXT DEFAULT NULL,
    category_color TEXT DEFAULT NULL,
    category_active BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE custom_service_categories
    SET 
        name = COALESCE(category_name, name),
        description = COALESCE(category_description, description),
        color = COALESCE(category_color, color),
        is_active = COALESCE(category_active, is_active)
    WHERE id = category_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover categoria personalizada (soft delete)
CREATE OR REPLACE FUNCTION remove_custom_service_category(category_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE custom_service_categories
    SET is_active = false
    WHERE id = category_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_custom_service_categories_name ON custom_service_categories(name);
CREATE INDEX IF NOT EXISTS idx_custom_service_categories_active ON custom_service_categories(is_active);

