-- Adicionar novos campos à tabela services
ALTER TABLE services ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS payment_details TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0;

-- Criar tabela para itens de serviço
CREATE TABLE service_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    value NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela para materiais
CREATE TABLE service_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC(10,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar enum para unidades de medida
CREATE TYPE material_unit AS ENUM ('un', 'kg', 'cx', 'm', 'm2', 'm3', 'L');

-- Criar enum para métodos de pagamento
CREATE TYPE payment_method AS ENUM ('PIX', 'TRANSFERENCIA', 'DINHEIRO', 'CARTAO', 'BOLETO');

-- Atualizar as colunas para usar os enums
ALTER TABLE services ALTER COLUMN payment_method TYPE payment_method USING payment_method::payment_method;
ALTER TABLE service_materials ALTER COLUMN unit TYPE material_unit USING unit::material_unit;

-- Criar índices para melhor performance
CREATE INDEX idx_service_items_service_id ON service_items(service_id);
CREATE INDEX idx_service_materials_service_id ON service_materials(service_id);

-- Aplicar trigger de updated_at nas novas tabelas
CREATE TRIGGER update_service_items_updated_at BEFORE UPDATE ON service_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_materials_updated_at BEFORE UPDATE ON service_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular o total de um serviço
CREATE OR REPLACE FUNCTION calculate_service_total(service_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    services_total NUMERIC := 0;
    materials_total NUMERIC := 0;
BEGIN
    -- Calcular total dos itens de serviço
    SELECT COALESCE(SUM(value), 0) INTO services_total
    FROM service_items
    WHERE service_id = service_uuid;
    
    -- Calcular total dos materiais
    SELECT COALESCE(SUM(total_price), 0) INTO materials_total
    FROM service_materials
    WHERE service_id = service_uuid;
    
    -- Retornar total geral
    RETURN services_total + materials_total;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o total_amount quando itens ou materiais são alterados
CREATE OR REPLACE FUNCTION update_service_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar o total na tabela services
    UPDATE services 
    SET total_amount = calculate_service_total(NEW.service_id)
    WHERE id = NEW.service_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers para manter o total atualizado
CREATE TRIGGER trigger_update_service_total_items
    AFTER INSERT OR UPDATE OR DELETE ON service_items
    FOR EACH ROW EXECUTE FUNCTION update_service_total();

CREATE TRIGGER trigger_update_service_total_materials
    AFTER INSERT OR UPDATE OR DELETE ON service_materials
    FOR EACH ROW EXECUTE FUNCTION update_service_total();
