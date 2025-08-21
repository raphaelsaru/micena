-- Migração para corrigir acesso público às tabelas
-- Garante que as tabelas sejam acessíveis via chave anônima

-- Verificar se RLS está habilitado em alguma tabela e desabilitar se necessário
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('clients', 'services', 'payments', 'route_settings', 'route_assignments')
    LOOP
        -- Desabilitar RLS se estiver habilitado
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
        
        -- Garantir que a tabela seja acessível publicamente
        EXECUTE format('GRANT ALL ON TABLE %I TO anon', r.tablename);
        EXECUTE format('GRANT ALL ON TABLE %I TO authenticated', r.tablename);
        
        RAISE NOTICE 'Tabela % configurada para acesso público', r.tablename;
    END LOOP;
END $$;

-- Verificar configuração final
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'RLS HABILITADO - PROBLEMA!'
        ELSE 'RLS DESABILITADO - OK'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'services', 'payments', 'route_settings', 'route_assignments')
ORDER BY tablename;
