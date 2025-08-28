-- Verificar usuários existentes
SELECT id, email, name, role, status, created_at FROM users;

-- Se não houver usuários, criar um usuário de teste
-- Senha: admin123 (hash bcrypt)
INSERT INTO users (email, name, password, role, status)
SELECT 
  'admin@sisiago.com',
  'Administrador',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'ADMIN',
  'ACTIVE'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@sisiago.com'
);

-- Verificar novamente após inserção
SELECT id, email, name, role, status, created_at FROM users;