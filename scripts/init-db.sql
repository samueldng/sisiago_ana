-- Script de inicialização do banco de dados PostgreSQL
-- Este script é executado automaticamente quando o container do PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configurar timezone
SET timezone = 'America/Sao_Paulo';

-- Criar usuário para a aplicação (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'sisiago_app') THEN
        CREATE ROLE sisiago_app WITH LOGIN PASSWORD 'sisiago_app_password';
    END IF;
END
$$;

-- Conceder permissões
GRANT CONNECT ON DATABASE sisiago TO sisiago_app;
GRANT USAGE ON SCHEMA public TO sisiago_app;
GRANT CREATE ON SCHEMA public TO sisiago_app;

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Configurações de logging
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Recarregar configurações
SELECT pg_reload_conf();

-- Criar índices úteis para a aplicação
-- Nota: As tabelas são criadas via Supabase, índices podem ser adicionados aqui

-- Log de inicialização
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0) ON CONFLICT DO NOTHING;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados SisIago inicializado com sucesso!';
    RAISE NOTICE 'Timezone configurado para: %', current_setting('timezone');
    RAISE NOTICE 'Versão do PostgreSQL: %', version();
END
$$;