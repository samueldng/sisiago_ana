-- Script SQL para adicionar campos de produto perecível na tabela products
-- Execute este script no SQL Editor do Supabase

-- Adicionar campo is_perishable (produto perecível)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT false;

-- Adicionar campo expiry_date (data de vencimento)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação
COMMENT ON COLUMN products.is_perishable IS 'Indica se o produto é perecível';
COMMENT ON COLUMN products.expiry_date IS 'Data de vencimento do produto (apenas para produtos perecíveis)';

SELECT 'Campos de produto perecível adicionados com sucesso!' as message;