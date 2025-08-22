// Teste do cliente Supabase com as variáveis de ambiente do Next.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Extrair informações da DATABASE_URL para obter a chave correta
const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔄 Testando cliente Supabase...');
console.log('Database URL:', databaseUrl ? 'Configurada' : 'Não configurada');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Configurada' : 'Não configurada');

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não configurada!');
  process.exit(1);
}

// Usar uma chave anon temporária para teste
// IMPORTANTE: Esta é uma chave de exemplo, você precisa obter a chave real do painel do Supabase
const tempAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWNsbXRqa2ltY2N1aWJ1aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NzU0NzQsImV4cCI6MjA0OTI1MTQ3NH0.YOUR_ACTUAL_SIGNATURE_HERE';

console.log('\n⚠️  IMPORTANTE: Você precisa obter a chave anon real do painel do Supabase!');
console.log('1. Acesse: https://supabase.com/dashboard/project/uzaclmtjkimccuibuily/settings/api');
console.log('2. Copie a "anon public" key');
console.log('3. Substitua NEXT_PUBLIC_SUPABASE_ANON_KEY no arquivo .env');
console.log('\n🔄 Tentando conectar mesmo assim...');

const supabase = createClient(supabaseUrl, supabaseKey || tempAnonKey);

async function testSupabaseClient() {
  try {
    console.log('\n✅ Cliente Supabase criado!');
    
    // Testar conexão básica
    console.log('\n🔄 Testando conexão básica...');
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      console.log('\n📋 Instruções para corrigir:');
      console.log('1. Vá para: https://supabase.com/dashboard/project/uzaclmtjkimccuibuily/settings/api');
      console.log('2. Copie a "anon public" key (começa com eyJhbGciOiJIUzI1NiIs...)');
      console.log('3. Substitua no arquivo .env: NEXT_PUBLIC_SUPABASE_ANON_KEY="sua_chave_aqui"');
      console.log('4. Execute novamente: node test-supabase-client.js');
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Se chegou até aqui, testar operações
    console.log('\n🔄 Testando consulta de categorias...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    if (categoriesError) {
      console.error('❌ Erro ao buscar categorias:', categoriesError.message);
      return;
    }
    
    console.log(`✅ Categorias encontradas: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description}`);
    });
    
    console.log('\n🎉 Cliente Supabase funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testSupabaseClient();
