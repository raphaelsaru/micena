-- Script para inserir dados de exemplo de mensalistas
-- Execute este script no Supabase para testar a funcionalidade

-- Atualizar alguns clientes existentes para serem mensalistas
UPDATE clients 
SET is_recurring = true, monthly_fee = 150.00
WHERE full_name LIKE '%João%' OR full_name LIKE '%Maria%' OR full_name LIKE '%Pedro%'
LIMIT 3;

-- Inserir alguns pagamentos de exemplo para o ano atual
INSERT INTO payments (client_id, year, month, status, amount, paid_at)
SELECT 
  c.id,
  2025,
  m.month,
  CASE 
    WHEN m.month <= 6 THEN 'PAGO'  -- Primeiros 6 meses pagos
    ELSE 'EM_ABERTO'                -- Últimos 6 meses em aberto
  END,
  c.monthly_fee,
  CASE 
    WHEN m.month <= 6 THEN NOW() - INTERVAL '1 day' * (30 * (7 - m.month))
    ELSE NULL
  END
FROM clients c
CROSS JOIN (
  SELECT 1 as month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION
  SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
) m
WHERE c.is_recurring = true
ON CONFLICT (client_id, year, month) DO NOTHING;

-- Verificar os dados inseridos
SELECT 
  c.full_name,
  c.monthly_fee,
  c.is_recurring,
  COUNT(p.id) as total_payments,
  COUNT(CASE WHEN p.status = 'PAGO' THEN 1 END) as paid_payments,
  COUNT(CASE WHEN p.status = 'EM_ABERTO' THEN 1 END) as pending_payments
FROM clients c
LEFT JOIN payments p ON c.id = p.client_id AND p.year = 2025
WHERE c.is_recurring = true
GROUP BY c.id, c.full_name, c.monthly_fee, c.is_recurring
ORDER BY c.full_name;
