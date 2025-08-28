-- Verificar se o usuário de teste existe
SELECT id, email, name, role, status, created_at 
FROM users 
WHERE email = 'admin@sisiago.com';

-- Se não existir, criar o usuário
INSERT INTO users (email, name, password, role, status)
VALUES (
  'admin@sisiago.com',
  'Administrador',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: admin123
  'ADMIN',
  'ACTIVE'
)
ON CONFLICT (email) 
DO UPDATE SET 
  password = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  role = 'ADMIN',
  status = 'ACTIVE';

-- Verificar novamente
SELECT id, email, name, role, status, created_at 
FROM users 
WHERE email = 'admin@sisiago.com';