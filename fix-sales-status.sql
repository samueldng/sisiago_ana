-- Script para corrigir status das vendas de COMPLETED para PAID
-- Isso é necessário porque o enum SaleStatus não inclui COMPLETED

UPDATE sales 
SET status = 'PAID' 
WHERE status = 'COMPLETED';

-- Verificar quantas vendas foram atualizadas
SELECT COUNT(*) as vendas_atualizadas 
FROM sales 
WHERE status = 'PAID';

-- Verificar se ainda existem vendas com status inválido
SELECT status, COUNT(*) as quantidade
FROM sales 
GROUP BY status;