-- Script para atualizar clientes mensalistas existentes com data de início da mensalidade
-- Execute este script no Supabase para definir datas de início para clientes existentes

-- Atualizar clientes mensalistas que não têm data de início definida
-- Definir como primeiro dia do mês atual para clientes existentes
UPDATE clients 
SET subscription_start_date = DATE_TRUNC('month', CURRENT_DATE)
WHERE is_recurring = true 
  AND subscription_start_date IS NULL;

-- Verificar os dados atualizados
SELECT 
  id,
  full_name,
  is_recurring,
  monthly_fee,
  subscription_start_date,
  created_at
FROM clients 
WHERE is_recurring = true
ORDER BY full_name;

-- Contar quantos clientes foram atualizados
SELECT 
  COUNT(*) as total_mensalistas,
  COUNT(subscription_start_date) as com_data_inicio,
  COUNT(CASE WHEN subscription_start_date IS NULL THEN 1 END) as sem_data_inicio
FROM clients 
WHERE is_recurring = true;
