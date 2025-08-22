-- Script simplificado para habilitar RLS com políticas de desenvolvimento
-- Execute este script após executar o supabase-setup.sql
-- IMPORTANTE: Este script é para desenvolvimento. Em produção, use políticas mais restritivas.

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Políticas simples para desenvolvimento
-- Permitir acesso total para usuários autenticados

-- Políticas para categories
CREATE POLICY "Allow all for authenticated users" ON categories
    FOR ALL USING (true);

-- Políticas para products
CREATE POLICY "Allow all for authenticated users" ON products
    FOR ALL USING (true);

-- Políticas para users
CREATE POLICY "Allow all for authenticated users" ON users
    FOR ALL USING (true);

-- Políticas para sales
CREATE POLICY "Allow all for authenticated users" ON sales
    FOR ALL USING (true);

-- Políticas para sale_items
CREATE POLICY "Allow all for authenticated users" ON sale_items
    FOR ALL USING (true);

-- Políticas para payments
CREATE POLICY "Allow all for authenticated users" ON payments
    FOR ALL USING (true);

-- Políticas para system_configs
CREATE POLICY "Allow all for authenticated users" ON system_configs
    FOR ALL USING (true);

SELECT 'RLS habilitado com políticas simples para desenvolvimento!' as message;