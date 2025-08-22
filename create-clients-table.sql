-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    document VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_document ON public.clients(document);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir todas as operações (ajustar conforme necessário)
CREATE POLICY "Enable all operations for clients" ON public.clients
    FOR ALL USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns dados de exemplo
INSERT INTO public.clients (name, email, phone, document, address, city, state, zip_code) VALUES
('João Silva', 'joao.silva@email.com', '(11) 99999-9999', '123.456.789-00', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567'),
('Maria Santos', 'maria.santos@email.com', '(11) 88888-8888', '987.654.321-00', 'Av. Paulista, 456', 'São Paulo', 'SP', '01310-100'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '(21) 77777-7777', '456.789.123-00', 'Rua Copacabana, 789', 'Rio de Janeiro', 'RJ', '22070-011')
ON CONFLICT (email) DO NOTHING;