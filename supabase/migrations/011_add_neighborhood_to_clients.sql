-- Migration: 011_add_neighborhood_to_clients
-- Description: Adiciona campo neighborhood (bairro) à tabela clients
-- Date: 2025-01-27

-- Adicionar campo neighborhood (bairro) à tabela clients
ALTER TABLE clients ADD COLUMN neighborhood TEXT;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN clients.neighborhood IS 'Bairro do cliente';

-- Atualizar dados existentes (opcional - para clientes que já têm bairro no endereço)
-- Esta migração não modifica dados existentes, apenas adiciona o novo campo
