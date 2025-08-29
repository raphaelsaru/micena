-- Função para normalizar texto removendo acentos
CREATE OR REPLACE FUNCTION normalize_text(input_text TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT LOWER(
        TRANSLATE(
            input_text,
            'áàâãäéèêëíìîïóòôõöúùûüçñýÿÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑÝŸ',
            'aaaaaeeeeiiiioooooiuuuucnyyAAAAAEEEEIIIIOOOOOIUUUUCNYY'
        )
    );
$$;

-- Função para buscar clientes sem considerar acentos
CREATE OR REPLACE FUNCTION search_clients_accent_insensitive(search_query TEXT)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    document TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_recurring BOOLEAN,
    monthly_fee NUMERIC,
    subscription_start_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        c.id,
        c.full_name,
        c.document,
        c.phone,
        c.email,
        c.address,
        c.notes,
        c.is_recurring,
        c.monthly_fee,
        c.subscription_start_date,
        c.created_at,
        c.updated_at
    FROM clients c
    WHERE 
        normalize_text(c.full_name) LIKE '%' || normalize_text(search_query) || '%'
        OR normalize_text(COALESCE(c.document, '')) LIKE '%' || normalize_text(search_query) || '%'
        OR normalize_text(COALESCE(c.email, '')) LIKE '%' || normalize_text(search_query) || '%'
    ORDER BY c.full_name ASC;
$$;

-- Função para buscar mensalistas sem considerar acentos
CREATE OR REPLACE FUNCTION search_mensalistas_accent_insensitive(search_query TEXT)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    document TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_recurring BOOLEAN,
    monthly_fee NUMERIC,
    subscription_start_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        c.id,
        c.full_name,
        c.document,
        c.phone,
        c.email,
        c.address,
        c.notes,
        c.is_recurring,
        c.monthly_fee,
        c.subscription_start_date,
        c.created_at,
        c.updated_at
    FROM clients c
    WHERE 
        c.is_recurring = true
        AND (
            normalize_text(c.full_name) LIKE '%' || normalize_text(search_query) || '%'
            OR normalize_text(COALESCE(c.document, '')) LIKE '%' || normalize_text(search_query) || '%'
            OR normalize_text(COALESCE(c.email, '')) LIKE '%' || normalize_text(search_query) || '%'
        )
    ORDER BY c.full_name ASC;
$$;

-- Função para buscar serviços do catálogo sem considerar acentos
CREATE OR REPLACE FUNCTION search_service_catalog_accent_insensitive(search_query TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    unit_type TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        sc.id,
        sc.name,
        sc.unit_type,
        sc.created_at,
        sc.updated_at
    FROM service_catalog sc
    WHERE 
        normalize_text(sc.name) LIKE '%' || normalize_text(search_query) || '%'
    ORDER BY sc.name ASC;
$$;

-- Função para buscar materiais do catálogo sem considerar acentos
CREATE OR REPLACE FUNCTION search_material_catalog_accent_insensitive(search_query TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    unit_type TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        mc.id,
        mc.name,
        mc.unit_type,
        mc.created_at,
        mc.updated_at
    FROM material_catalog mc
    WHERE 
        normalize_text(mc.name) LIKE '%' || normalize_text(search_query) || '%'
    ORDER BY mc.name ASC;
$$;
