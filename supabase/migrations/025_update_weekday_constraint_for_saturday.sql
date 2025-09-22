-- Migration: 025_update_weekday_constraint_for_saturday
-- Description: Atualiza constraint de weekday para incluir sábado (6)
-- Date: 2025-01-27

-- Remover constraint antiga de weekday
ALTER TABLE route_settings DROP CONSTRAINT IF EXISTS route_settings_weekday_check;
ALTER TABLE route_assignments DROP CONSTRAINT IF EXISTS route_assignments_weekday_check;

-- Adicionar nova constraint que inclui sábado (1-6)
ALTER TABLE route_settings ADD CONSTRAINT route_settings_weekday_check CHECK (weekday >= 1 AND weekday <= 6);
ALTER TABLE route_assignments ADD CONSTRAINT route_assignments_weekday_check CHECK (weekday >= 1 AND weekday <= 6);
