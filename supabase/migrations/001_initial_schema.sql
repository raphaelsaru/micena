-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE service_type AS ENUM ('AREIA', 'EQUIPAMENTO', 'CAPA', 'OUTRO');
CREATE TYPE payment_status AS ENUM ('PAGO', 'EM_ABERTO');

-- Create clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    document TEXT NOT NULL UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    postal_code TEXT,
    pix_key TEXT,
    is_recurring BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_type service_type NOT NULL,
    equipment_details TEXT,
    notes TEXT,
    next_service_date DATE,
    work_order_number TEXT,
    google_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    status payment_status DEFAULT 'EM_ABERTO',
    receipt_url TEXT,
    marked_by_receipt BOOLEAN DEFAULT false,
    amount NUMERIC(12,2),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, year, month)
);

-- Create route_settings table
CREATE TABLE route_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    weekday INTEGER NOT NULL CHECK (weekday >= 1 AND weekday <= 5),
    max_clients INTEGER NOT NULL CHECK (max_clients >= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(weekday)
);

-- Create route_assignments table
CREATE TABLE route_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    weekday INTEGER NOT NULL CHECK (weekday >= 1 AND weekday <= 5),
    order_index INTEGER NOT NULL CHECK (order_index >= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(weekday, order_index)
);

-- Create audit_log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id UUID,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_clients_document ON clients(document);
CREATE INDEX idx_clients_name_trgm ON clients USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_services_client_date ON services(client_id, service_date);
CREATE INDEX idx_services_next_date ON services(next_service_date);
CREATE INDEX idx_payments_client_year_month ON payments(client_id, year, month);
CREATE INDEX idx_route_assignments_weekday ON route_assignments(weekday);
CREATE INDEX idx_route_assignments_day_client ON route_assignments(weekday, client_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_route_settings_updated_at BEFORE UPDATE ON route_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_route_assignments_updated_at BEFORE UPDATE ON route_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial route settings for weekdays
INSERT INTO route_settings (weekday, max_clients) VALUES 
    (1, 10), -- Monday
    (2, 10), -- Tuesday
    (3, 10), -- Wednesday
    (4, 10), -- Thursday
    (5, 10)  -- Friday
ON CONFLICT (weekday) DO NOTHING;
