-- Query para verificar dados de usuários
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Contar total de usuários
SELECT COUNT(*) as total_users FROM users;

-- Verificar permissões
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;