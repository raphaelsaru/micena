-- Adicionar catalog_item_id às tabelas service_items e service_materials
-- Esta migração resolve o erro de inserção dos itens de serviço

-- Adicionar catalog_item_id à tabela service_items
ALTER TABLE service_items ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_service_items_catalog_item_id ON service_items(catalog_item_id);

-- Adicionar catalog_item_id à tabela service_materials
ALTER TABLE service_materials ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES material_catalog(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_service_materials_catalog_item_id ON service_materials(catalog_item_id);

-- Comentários para documentar as mudanças
COMMENT ON COLUMN service_items.catalog_item_id IS 'Referência ao item do catálogo de serviços';
COMMENT ON COLUMN service_materials.catalog_item_id IS 'Referência ao item do catálogo de materiais';
