-- Script para inserir todos os clientes mensalistas como PAGO do mês 1 ao 9 de 2025
-- Execute este script no Supabase para marcar todos os mensalistas como pagos

INSERT INTO payments (client_id, year, month, status, amount, paid_at, marked_by_receipt)
SELECT 
  c.id,
  2025,
  m.month,
  'PAGO',
  c.monthly_fee,
  NOW(),
  false
FROM clients c
CROSS JOIN (
  SELECT 1 as month UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION 
  SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
) m
WHERE c.is_recurring = true
  AND c.monthly_fee > 0  -- Apenas clientes com taxa mensal definida
ON CONFLICT (client_id, year, month) 
DO UPDATE SET
  status = 'PAGO',
  amount = EXCLUDED.amount,
  paid_at = EXCLUDED.paid_at,
  updated_at = NOW();

-- Verificar os dados inseridos/atualizados
SELECT 
  c.full_name,
  c.monthly_fee,
  COUNT(p.id) as total_payments_2025,
  COUNT(CASE WHEN p.status = 'PAGO' THEN 1 END) as paid_payments,
  COUNT(CASE WHEN p.status = 'EM_ABERTO' THEN 1 END) as pending_payments,
  SUM(CASE WHEN p.status = 'PAGO' THEN p.amount ELSE 0 END) as total_paid_amount
FROM clients c
LEFT JOIN payments p ON c.id = p.client_id AND p.year = 2025
WHERE c.is_recurring = true
GROUP BY c.id, c.full_name, c.monthly_fee
ORDER BY c.full_name;

-- Resumo geral dos pagamentos inseridos
SELECT 
  COUNT(*) as total_payments_inserted,
  COUNT(DISTINCT client_id) as unique_clients,
  SUM(amount) as total_amount,
  MIN(paid_at) as first_payment_date,
  MAX(paid_at) as last_payment_date
FROM payments 
WHERE year = 2025 
  AND month BETWEEN 1 AND 9 
  AND status = 'PAGO'
  AND paid_at >= NOW() - INTERVAL '1 minute';  -- Apenas os que acabaram de ser inseridos
