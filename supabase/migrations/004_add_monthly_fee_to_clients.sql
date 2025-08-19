-- Adicionar campo monthly_fee à tabela clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_fee NUMERIC(12,2) DEFAULT 0;

-- Criar índice para melhor performance em consultas de mensalistas
CREATE INDEX IF NOT EXISTS idx_clients_recurring_fee ON clients(is_recurring, monthly_fee) WHERE is_recurring = true;

-- Atualizar comentários da tabela
COMMENT ON COLUMN clients.monthly_fee IS 'Valor mensal cobrado para clientes mensalistas';
COMMENT ON COLUMN clients.is_recurring IS 'Indica se o cliente é mensalista (true) ou pontual (false)';
