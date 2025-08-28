-- Remover todas as políticas existentes da tabela users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can manage all users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON users;

-- Criar políticas simples e sem recursão
CREATE POLICY "Allow service role full access" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated users to read all users" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow anon users to read for login" ON users
  FOR SELECT USING (auth.role() = 'anon');

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';