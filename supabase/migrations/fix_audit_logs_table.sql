-- Adicionar colunas faltantes na tabela audit_logs
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS user_email TEXT,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();

-- Garantir permissões para os roles anon e authenticated
GRANT SELECT, INSERT ON audit_logs TO anon;
GRANT ALL PRIVILEGES ON audit_logs TO authenticated;

-- Verificar as permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'audit_logs' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;