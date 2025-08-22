-- Adicionar campo is_active à tabela users se não existir
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Atualizar usuários existentes para ativo por padrão
UPDATE users 
SET is_active = true 
WHERE is_active IS NULL;

-- Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'is_active';