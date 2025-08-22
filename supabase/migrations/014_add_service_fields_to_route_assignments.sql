-- Migration: 014_add_service_fields_to_route_assignments
-- Description: Adiciona campos has_key e service_type à tabela route_assignments
-- Date: 2025-01-27

-- Adicionar campos de serviço à tabela route_assignments
ALTER TABLE route_assignments ADD COLUMN has_key BOOLEAN DEFAULT false;
ALTER TABLE route_assignments ADD COLUMN service_type TEXT CHECK (service_type IN ('ASPIRAR', 'ESFREGAR'));

-- Adicionar comentários para documentar os campos
COMMENT ON COLUMN route_assignments.has_key IS 'Indica se o cliente possui chave para acesso';
COMMENT ON COLUMN route_assignments.service_type IS 'Tipo de serviço: ASPIRAR ou ESFREGAR';
