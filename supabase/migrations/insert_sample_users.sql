-- Inserir usuários de exemplo para testar a funcionalidade

-- Verificar se já existem usuários
DO $$
BEGIN
  -- Só inserir se não houver usuários
  IF (SELECT COUNT(*) FROM users) = 0 THEN
    INSERT INTO users (id, name, email, password, role, is_active, created_at, updated_at) VALUES
    ('admin-001', 'Administrador Sistema', 'admin@sisiago.com', 'hashed_password_123', 'ADMIN', true, NOW(), NOW()),
    ('manager-001', 'João Silva', 'joao.silva@sisiago.com', 'hashed_password_123', 'MANAGER', true, NOW(), NOW()),
    ('manager-002', 'Maria Santos', 'maria.santos@sisiago.com', 'hashed_password_123', 'MANAGER', true, NOW(), NOW()),
    ('operator-001', 'Pedro Oliveira', 'pedro.oliveira@sisiago.com', 'hashed_password_123', 'OPERATOR', true, NOW(), NOW()),
    ('operator-002', 'Ana Costa', 'ana.costa@sisiago.com', 'hashed_password_123', 'OPERATOR', true, NOW(), NOW()),
    ('operator-003', 'Carlos Ferreira', 'carlos.ferreira@sisiago.com', 'hashed_password_123', 'OPERATOR', false, NOW(), NOW());
    
    RAISE NOTICE 'Usuários de exemplo inseridos com sucesso!';
  ELSE
    RAISE NOTICE 'Usuários já existem na tabela. Nenhum usuário foi inserido.';
  END IF;
END $$;

-- Verificar os usuários inseridos
SELECT 
  id,
  name,
  email,
  role,
  is_active,
  created_at
FROM users 
ORDER BY created_at DESC;