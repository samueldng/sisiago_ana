-- Atualizar a senha do usuário admin com o hash correto
UPDATE users 
SET password = '$2a$10$rflKdNm6HMEaROeUFCPXt.FVqOrJ./vI6GRfm/jkuiLQbG/C2pU5a'
WHERE email = 'admin@sisiago.com';

-- Verificar se a atualização foi bem-sucedida
SELECT id, email, name, role, status, 
       CASE 
         WHEN password = '$2a$10$rflKdNm6HMEaROeUFCPXt.FVqOrJ./vI6GRfm/jkuiLQbG/C2pU5a' 
         THEN 'Senha atualizada corretamente' 
         ELSE 'Senha não foi atualizada' 
       END as password_status
FROM users 
WHERE email = 'admin@sisiago.com';