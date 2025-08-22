const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function updateDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('Conectando ao Supabase...');

    // Adicionar campo is_perishable
    const { data: data1, error: error1 } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT false;`
    });
    
    if (error1) {
      console.log('Tentando adicionar is_perishable via query direta...');
      // Tentar abordagem alternativa
      const { data: checkData } = await supabase
        .from('products')
        .select('*')
        .limit(1);
      
      console.log('Conexão com Supabase estabelecida com sucesso!');
      console.log('Estrutura atual da tabela products verificada.');
    } else {
      console.log('Campo is_perishable adicionado com sucesso');
    }

    // Verificar estrutura atual da tabela
    const { data: products, error: selectError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('Erro ao verificar tabela products:', selectError);
    } else {
      console.log('\nEstrutura atual da tabela products:');
      if (products && products.length > 0) {
        const columns = Object.keys(products[0]);
        console.log('Colunas existentes:', columns.join(', '));
        
        const hasPerishable = columns.includes('is_perishable');
        const hasExpiryDate = columns.includes('expiry_date');
        
        console.log(`\nCampos de perecibilidade:`);
        console.log(`- is_perishable: ${hasPerishable ? '✅ Existe' : '❌ Não existe'}`);
        console.log(`- expiry_date: ${hasExpiryDate ? '✅ Existe' : '❌ Não existe'}`);
        
        if (!hasPerishable || !hasExpiryDate) {
          console.log('\n⚠️  Os campos de perecibilidade precisam ser adicionados manualmente no painel do Supabase.');
          console.log('\nExecute os seguintes comandos SQL no SQL Editor do Supabase:');
          console.log('\nALTER TABLE products ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT false;');
          console.log('ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE;');
        }
      } else {
        console.log('Tabela products está vazia, mas conexão foi estabelecida.');
      }
    }

  } catch (error) {
    console.error('Erro ao conectar com Supabase:', error);
  }
}

updateDatabase();