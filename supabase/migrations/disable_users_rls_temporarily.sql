-- Desabilitar RLS temporariamente na tabela users para testar o login
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verificar o status do RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';