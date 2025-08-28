-- Criar usuário de teste para login
-- Senha: admin123 (hash bcrypt)
INSERT INTO users (email, name, password, role, status)
VALUES (
  'admin@sisiago.com',
  'Administrador',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: admin123
  'ADMIN',
  'ACTIVE'
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();

-- Verificar se o usuário foi criado
SELECT id, email, name, role, status, created_at FROM users WHERE email = 'admin@sisiago.com';