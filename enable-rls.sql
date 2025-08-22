-- Script para habilitar RLS (Row Level Security) e configurar políticas de segurança
-- Execute este script após executar o supabase-setup.sql

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela users
-- Permitir que usuários vejam apenas seus próprios dados
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

-- Permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- Políticas para tabela categories
-- Permitir leitura para usuários autenticados
CREATE POLICY "Authenticated users can view categories" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserção/atualização/exclusão apenas para administradores
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role = 'ADMIN'
        )
    );

-- Políticas para tabela products
-- Permitir leitura para usuários autenticados
CREATE POLICY "Authenticated users can view products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permitir inserção/atualização/exclusão apenas para administradores
CREATE POLICY "Admins can manage products" ON products
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role = 'ADMIN'
        )
    );

-- Políticas para tabela sales
-- Permitir que usuários vejam apenas suas próprias vendas
CREATE POLICY "Users can view own sales" ON sales
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        user_id = auth.uid()::text
    );

-- Permitir que usuários criem vendas
CREATE POLICY "Authenticated users can create sales" ON sales
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        user_id = auth.uid()::text
    );

-- Permitir que usuários atualizem suas próprias vendas
CREATE POLICY "Users can update own sales" ON sales
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        user_id = auth.uid()::text
    );

-- Políticas para tabela sale_items
-- Permitir acesso aos itens de vendas do usuário
CREATE POLICY "Users can view own sale items" ON sale_items
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM sales 
            WHERE id = sale_id 
            AND user_id = auth.uid()::text
        )
    );

-- Permitir inserção de itens de venda
CREATE POLICY "Users can create sale items" ON sale_items
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM sales 
            WHERE id = sale_id 
            AND user_id = auth.uid()::text
        )
    );

-- Políticas para tabela payments
-- Permitir acesso aos pagamentos das vendas do usuário
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM sales 
            WHERE id = sale_id 
            AND user_id = auth.uid()::text
        )
    );

-- Permitir criação de pagamentos
CREATE POLICY "Users can create payments" ON payments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM sales 
            WHERE id = sale_id 
            AND user_id = auth.uid()::text
        )
    );

-- Permitir atualização de pagamentos
CREATE POLICY "Users can update payments" ON payments
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM sales 
            WHERE id = sale_id 
            AND user_id = auth.uid()::text
        )
    );

-- Políticas para tabela system_configs
-- Apenas administradores podem acessar configurações do sistema
CREATE POLICY "Only admins can access system configs" ON system_configs
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role = 'ADMIN'
        )
    );

-- Criar função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid()::text 
        AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política alternativa mais simples para desenvolvimento (OPCIONAL)
-- Descomente as linhas abaixo se quiser permitir acesso total para usuários autenticados durante desenvolvimento
-- IMPORTANTE: Remova essas políticas em produção!

/*
-- Políticas de desenvolvimento (REMOVER EM PRODUÇÃO)
DROP POLICY IF EXISTS "Authenticated users can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Dev: Full access to categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Dev: Full access to products" ON products FOR ALL USING (auth.role() = 'authenticated');
*/

SELECT 'RLS habilitado e políticas de segurança configuradas!' as message;