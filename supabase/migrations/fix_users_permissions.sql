-- Garantir que as permissões estão corretas para a tabela users

-- Conceder permissões para o role anon (usuários não autenticados)
GRANT SELECT ON users TO anon;

-- Conceder permissões completas para o role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Verificar se RLS está habilitado
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas se não existirem
DROP POLICY IF EXISTS "Users can view all users" ON users;
CREATE POLICY "Users can view all users" ON users
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert users" ON users;
CREATE POLICY "Users can insert users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update users" ON users;
CREATE POLICY "Users can update users" ON users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete users" ON users;
CREATE POLICY "Users can delete users" ON users
  FOR DELETE
  TO authenticated
  USING (true);

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;