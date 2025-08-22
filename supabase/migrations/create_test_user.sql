-- Criar usuário de teste para login
-- Senha: 123456 (hash bcrypt)
INSERT INTO users (email, name, password, role, is_active, created_at, updated_at)
VALUES (
  'admin@test.com',
  'Administrador Teste',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
  'ADMIN',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Verificar se o usuário foi criado
SELECT id, email, name, role, is_active, created_at 
FROM users 
WHERE email = 'admin@test.com';