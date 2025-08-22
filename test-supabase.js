// Script para testar a conexão com Supabase e verificar as tabelas
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://uzaclmtjkimccuibuily.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWNsbXRqa2ltY2N1aWJ1aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTg0ODgsImV4cCI6MjA3MDE5NDQ4OH0.t4kD5NpmCmAeopVP81Atk5i_3kN7PbbS1gXMWRGKyU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🔄 Testando conexão com Supabase...');
  
  try {
    // Testar conexão básica
    const { data, error } = await supabase
      .from('categories')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com Supabase estabelecida!');
    console.log(`📊 Total de categorias: ${data || 0}`);
    
    // Listar categorias
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    if (catError) {
      console.error('❌ Erro ao buscar categorias:', catError.message);
    } else {
      console.log('📋 Categorias encontradas:');
      categories.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.description}`);
      });
    }
    
    // Listar produtos
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*, categories(name)');
    
    if (prodError) {
      console.error('❌ Erro ao buscar produtos:', prodError.message);
    } else {
      console.log('🛍️ Produtos encontrados:');
      products.forEach(prod => {
        console.log(`  - ${prod.name} (${prod.barcode}) - R$ ${prod.sale_price} - Categoria: ${prod.categories?.name}`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

async function createTestCategory() {
  console.log('\n🔄 Testando criação de categoria...');
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: 'Teste Categoria',
        description: 'Categoria criada para teste'
      })
      .select();
    
    if (error) {
      console.error('❌ Erro ao criar categoria:', error.message);
      return false;
    }
    
    console.log('✅ Categoria criada com sucesso:', data[0]);
    
    // Deletar a categoria de teste
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', data[0].id);
    
    if (deleteError) {
      console.error('⚠️ Erro ao deletar categoria de teste:', deleteError.message);
    } else {
      console.log('🗑️ Categoria de teste removida');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado ao criar categoria:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando testes do Supabase...\n');
  
  const connectionOk = await testSupabaseConnection();
  
  if (connectionOk) {
    await createTestCategory();
  }
  
  console.log('\n✨ Testes concluídos!');
}

main().catch(console.error);