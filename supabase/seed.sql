-- Seed data for testing

-- Insert sample clients
INSERT INTO clients (full_name, document, email, phone, address, neighborhood, postal_code, pix_key, is_recurring, notes) VALUES
('João Silva', '12345678901', 'joao.silva@email.com', '11987654321', 'Rua das Flores, 123', 'Jardim Primavera', '01234-567', 'joao.silva@email.com', true, 'Cliente mensalista, piscina de 8x4m'),
('Maria Santos', '98765432100', 'maria.santos@email.com', '11912345678', 'Av. Paulista, 1000', 'Bela Vista', '01310-100', '11912345678', false, 'Piscina de 6x3m, manutenção quinzenal'),
('Carlos Oliveira', '45678912300', 'carlos.oliveira@email.com', '11955556666', 'Rua Augusta, 500', 'Consolação', '01212-000', '45678912300', true, 'Cliente VIP, piscina de 10x5m'),
('Ana Costa', '78912345600', 'ana.costa@email.com', '11977778888', 'Rua Oscar Freire, 200', 'Jardins', '01426-001', 'ana.costa@email.com', false, 'Piscina de 4x2m, manutenção mensal'),
('Roberto Lima', '32165498700', 'roberto.lima@email.com', '11999990000', 'Alameda Santos, 1500', 'Jardins', '01418-002', '11999990000', true, 'Cliente mensalista, piscina de 12x6m')
ON CONFLICT (document) DO NOTHING;

-- Insert sample services for João Silva
INSERT INTO services (client_id, service_date, service_type, equipment_details, notes, next_service_date, work_order_number) VALUES
((SELECT id FROM clients WHERE document = '12345678901' LIMIT 1), '2025-01-15', 'AREIA', NULL, 'Troca de areia do filtro', '2025-02-15', 'OS-001-2025'),
((SELECT id FROM clients WHERE document = '12345678901' LIMIT 1), '2025-01-15', 'EQUIPAMENTO', 'Bomba Dancor 1HP', 'Manutenção preventiva da bomba', '2025-04-15', 'OS-001-2025')
ON CONFLICT DO NOTHING;

-- Insert sample services for Maria Santos
INSERT INTO services (client_id, service_date, service_type, equipment_details, notes, next_service_date, work_order_number) VALUES
((SELECT id FROM clients WHERE document = '98765432100' LIMIT 1), '2025-01-10', 'AREIA', NULL, 'Limpeza e troca de areia', '2025-01-24', 'OS-002-2025'),
((SELECT id FROM clients WHERE document = '98765432100' LIMIT 1), '2025-01-10', 'CAPA', NULL, 'Instalação de capa térmica', '2025-01-24', 'OS-002-2025')
ON CONFLICT DO NOTHING;

-- Insert sample payments for João Silva (2025)
INSERT INTO payments (client_id, year, month, status, amount, paid_at) VALUES
((SELECT id FROM clients WHERE document = '12345678901' LIMIT 1), 2025, 1, 'PAGO', 150.00, '2025-01-05 10:00:00'),
((SELECT id FROM clients WHERE document = '12345678901' LIMIT 1), 2025, 2, 'EM_ABERTO', 150.00, NULL)
ON CONFLICT (client_id, year, month) DO NOTHING;

-- Insert sample payments for Maria Santos (2025)
INSERT INTO payments (client_id, year, month, status, amount, paid_at) VALUES
((SELECT id FROM clients WHERE document = '98765432100' LIMIT 1), 2025, 1, 'PAGO', 120.00, '2025-01-03 14:30:00'),
((SELECT id FROM clients WHERE document = '98765432100' LIMIT 1), 2025, 2, 'EM_ABERTO', 120.00, NULL)
ON CONFLICT (client_id, year, month) DO NOTHING;

-- Insert sample route assignments for Monday (weekday = 1)
INSERT INTO route_assignments (client_id, weekday, order_index) VALUES
    ((SELECT id FROM clients WHERE document = '12345678901' LIMIT 1), 1, 1),
    ((SELECT id FROM clients WHERE document = '98765432100' LIMIT 1), 1, 2),
    ((SELECT id FROM clients WHERE document = '45678912300' LIMIT 1), 1, 3);

-- Insert sample route assignments for Tuesday (weekday = 2)
INSERT INTO route_assignments (client_id, weekday, order_index) VALUES
    ((SELECT id FROM clients WHERE document = '78912345600' LIMIT 1), 2, 1),
    ((SELECT id FROM clients WHERE document = '12345678901' LIMIT 1), 2, 2);

-- Insert sample route assignments for Wednesday (weekday = 3)
INSERT INTO route_assignments (client_id, weekday, order_index) VALUES
    ((SELECT id FROM clients WHERE document = '98765432100' LIMIT 1), 3, 1),
    ((SELECT id FROM clients WHERE document = '45678912300' LIMIT 1), 3, 2),
    ((SELECT id FROM clients WHERE document = '78912345600' LIMIT 1), 3, 3);

-- Insert sample audit log entries
INSERT INTO audit_log (actor_user_id, action, entity, entity_id, payload) VALUES
    (NULL, 'CREATE', 'client', (SELECT id FROM clients WHERE document = '12345678901' LIMIT 1), '{"full_name": "João Silva", "document": "12345678901"}'),
    (NULL, 'CREATE', 'service', (SELECT id FROM services WHERE work_order_number = 'OS-001-2025' LIMIT 1), '{"service_type": "AREIA"}'),
    (NULL, 'CREATE', 'payment', (SELECT id FROM payments WHERE client_id = (SELECT id FROM clients WHERE document = '12345678901' LIMIT 1) AND month = 1 LIMIT 1), '{"status": "PAGO", "amount": 150.00}');
