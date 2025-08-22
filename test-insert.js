// Script para testar inserção de dados no Supabase
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://uzaclmtjkimccuibuily.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWNsbXRqa2ltY2N1aWJ1aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTg0ODgsImV4cCI6MjA3MDE5NDQ4OH0.t4kD5NpmCmAeopVP81Atk5i_3kN7PbbS1gXMWRGKyU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsertCategory() {
  console.log('🔄 Testando inserção de categoria...');
  
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: 'Bebidas',
        description: 'Refrigerantes, sucos, águas e outras bebidas'
      })
      .select();
    
    if (error) {
      console.error('❌ Erro ao inserir categoria:', error.message);
      console.log('💡 Detalhes do erro:', error);
      
      // Se a tabela não existe, vamos tentar criar via SQL direto
      if (error.message.includes('does not exist') || error.message.includes('table')) {
        console.log('\n🔧 Tentando criar tabela via SQL...');
        
        // Usar a API REST do Supabase para executar SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            sql: `CREATE TABLE IF NOT EXISTS categories (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              name TEXT UNIQUE NOT NULL,
              description TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );`
          })
        });
        
        if (response.ok) {
          console.log('✅ Tabela criada via API REST');
        } else {
          console.log('❌ Falha ao criar tabela via API REST:', await response.text());
        }
      }
      
      return false;
    }
    
    console.log('✅ Categoria inserida com sucesso:', data[0]);
    return true;
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
    return false;
  }
}

async function listTables() {
  console.log('\n🔍 Verificando tabelas existentes...');
  
  try {
    // Tentar listar tabelas usando uma query SQL
    const { data, error } = await supabase
      .rpc('get_tables');
    
    if (error) {
      console.log('❌ Não foi possível listar tabelas:', error.message);
    } else {
      console.log('📋 Tabelas encontradas:', data);
    }
    
  } catch (error) {
    console.log('❌ Erro ao listar tabelas:', error.message);
  }
}

async function main() {
  console.log('🚀 Testando inserção no Supabase...\n');
  
  await listTables();
  await testInsertCategory();
  
  console.log('\n✨ Teste concluído!');
  console.log('\n📋 Instruções:');
  console.log('1. Acesse https://supabase.com/dashboard/project/uzaclmtjkimccuibuily');
  console.log('2. Vá para "SQL Editor"');
  console.log('3. Execute o conteúdo do arquivo supabase-setup.sql');
  console.log('4. Depois execute: npm run dev');
}

main().catch(console.error);