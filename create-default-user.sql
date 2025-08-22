-- Criar usuário padrão para desenvolvimento
-- Execute este script no Supabase SQL Editor

-- Inserir usuário padrão se não existir
INSERT INTO users (id, name, email, role, is_active, created_at, updated_at)
VALUES (
  '1',
  'Usuário Padrão',
  'admin@sisiago.com',
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar se o usuário foi criado
SELECT * FROM users WHERE id = '1';

SELECT 'Usuário padrão criado com sucesso!' as message;