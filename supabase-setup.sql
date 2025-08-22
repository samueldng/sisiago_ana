-- Script SQL para criar as tabelas no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'OPERATOR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de produtos
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    sale_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'UN',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category_id TEXT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Criar tabela de vendas
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    total DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    final_total DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criar tabela de itens de venda
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sale_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Criar tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    amount DECIMAL(10,2) NOT NULL,
    method TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    transaction_id TEXT UNIQUE,
    pix_qr_code TEXT,
    pix_key TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    webhook_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sale_id TEXT UNIQUE NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_configs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados de exemplo para categorias
INSERT INTO categories (name, description) VALUES
('Bebidas', 'Refrigerantes, sucos, águas e outras bebidas'),
('Alimentos', 'Produtos alimentícios em geral'),
('Higiene', 'Produtos de higiene pessoal e limpeza'),
('Eletrônicos', 'Dispositivos eletrônicos e acessórios'),
('Roupas', 'Vestuário e acessórios de moda')
ON CONFLICT (name) DO NOTHING;

-- Inserir dados de exemplo para produtos
INSERT INTO products (name, barcode, sale_price, cost_price, stock, category_id, description) 
SELECT 
    'Coca-Cola 350ml',
    '7894900011517',
    4.50,
    3.20,
    50,
    c.id,
    'Refrigerante Coca-Cola lata 350ml'
FROM categories c WHERE c.name = 'Bebidas'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, sale_price, cost_price, stock, category_id, description) 
SELECT 
    'Pão de Açúcar',
    '7891000100103',
    6.90,
    4.50,
    25,
    c.id,
    'Pão de açúcar tradicional 500g'
FROM categories c WHERE c.name = 'Alimentos'
ON CONFLICT (barcode) DO NOTHING;

INSERT INTO products (name, barcode, sale_price, cost_price, stock, category_id, description) 
SELECT 
    'Sabonete Dove',
    '7891150056992',
    3.25,
    2.10,
    30,
    c.id,
    'Sabonete Dove hidratante 90g'
FROM categories c WHERE c.name = 'Higiene'
ON CONFLICT (barcode) DO NOTHING;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) se necessário
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

SELECT 'Tabelas criadas com sucesso!' as message;