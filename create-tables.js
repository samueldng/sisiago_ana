// Script para criar tabelas no Supabase via SQL
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://uzaclmtjkimccuibuily.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWNsbXRqa2ltY2N1aWJ1aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTg0ODgsImV4cCI6MjA3MDE5NDQ4OH0.t4kD5NpmCmAeopVP81Atk5i_3kN7PbbS1gXMWRGKyU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🔄 Criando tabelas no Supabase...');
  
  const sqlCommands = [
    // Criar tabela de categorias
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Criar tabela de produtos
    `CREATE TABLE IF NOT EXISTS products (
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
    );`,
    
    // Inserir categorias de exemplo
    `INSERT INTO categories (name, description) VALUES
    ('Bebidas', 'Refrigerantes, sucos, águas e outras bebidas'),
    ('Alimentos', 'Produtos alimentícios em geral'),
    ('Higiene', 'Produtos de higiene pessoal e limpeza'),
    ('Eletrônicos', 'Dispositivos eletrônicos e acessórios'),
    ('Roupas', 'Vestuário e acessórios de moda')
    ON CONFLICT (name) DO NOTHING;`
  ];
  
  try {
    for (let i = 0; i < sqlCommands.length; i++) {
      console.log(`📝 Executando comando ${i + 1}/${sqlCommands.length}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: sqlCommands[i]
      });
      
      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message);
        // Tentar método alternativo
        console.log('🔄 Tentando método alternativo...');
        
        const { data: altData, error: altError } = await supabase
          .from('_sql')
          .select('*')
          .eq('query', sqlCommands[i]);
        
        if (altError) {
          console.error('❌ Método alternativo também falhou:', altError.message);
        }
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    }
    
    // Testar se as tabelas foram criadas
    console.log('\n🔍 Verificando se as tabelas foram criadas...');
    
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (catError) {
      console.error('❌ Tabela categories não foi criada:', catError.message);
    } else {
      console.log('✅ Tabela categories criada com sucesso!');
      console.log(`📊 ${categories.length} categorias encontradas`);
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

async function insertSampleData() {
  console.log('\n🔄 Inserindo dados de exemplo...');
  
  try {
    // Buscar uma categoria para usar como referência
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('name', 'Bebidas')
      .single();
    
    if (catError || !categories) {
      console.error('❌ Categoria "Bebidas" não encontrada:', catError?.message);
      return;
    }
    
    // Inserir produto de exemplo
    const { data: product, error: prodError } = await supabase
      .from('products')
      .insert({
        name: 'Coca-Cola 350ml',
        barcode: '7894900011517',
        sale_price: 4.50,
        cost_price: 3.20,
        stock: 50,
        category_id: categories.id,
        description: 'Refrigerante Coca-Cola lata 350ml'
      })
      .select();
    
    if (prodError) {
      console.error('❌ Erro ao inserir produto:', prodError.message);
    } else {
      console.log('✅ Produto inserido com sucesso:', product[0].name);
    }
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando criação das tabelas no Supabase...\n');
  
  await createTables();
  await insertSampleData();
  
  console.log('\n✨ Processo concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
  console.log('2. Vá para SQL Editor e execute o arquivo supabase-setup.sql se necessário');
  console.log('3. Teste a aplicação: npm run dev');
}

main().catch(console.error);