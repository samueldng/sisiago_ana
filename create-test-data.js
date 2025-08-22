const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://uzaclmtjkimccuibuily.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWNsbXRqa2ltY2N1aWJ1aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTg0ODgsImV4cCI6MjA3MDE5NDQ4OH0.t4kD5NpmCmAeopVP81Atk5i_3kN7PbbS1gXMWRGKyU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  try {
    console.log('📊 Criando dados de teste...');
    
    // Criar algumas categorias
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .upsert([
        { id: 'cat-001', name: 'Bebidas', description: 'Bebidas em geral' },
        { id: 'cat-002', name: 'Alimentos', description: 'Produtos alimentícios' },
        { id: 'cat-003', name: 'Limpeza', description: 'Produtos de limpeza' }
      ])
      .select();
    
    if (catError) {
      console.error('❌ Erro ao criar categorias:', catError);
    } else {
      console.log('✅ Categorias criadas:', categories?.length || 0);
    }
    
    // Criar alguns produtos
    const { data: products, error: prodError } = await supabase
      .from('products')
      .upsert([
        {
          id: 'prod-001',
          name: 'Coca-Cola 350ml',
          barcode: '7894900011517',
          sale_price: 3.50,
          cost_price: 2.00,
          stock: 100,
          unit: 'un',
          description: 'Refrigerante Coca-Cola lata 350ml',
          is_active: true,
          category_id: 'cat-001'
        },
        {
          id: 'prod-002',
          name: 'Pão de Açúcar',
          barcode: '1234567890123',
          sale_price: 5.99,
          cost_price: 3.50,
          stock: 50,
          unit: 'un',
          description: 'Pão de açúcar tradicional',
          is_active: true,
          category_id: 'cat-002'
        }
      ])
      .select();
    
    if (prodError) {
      console.error('❌ Erro ao criar produtos:', prodError);
    } else {
      console.log('✅ Produtos criados:', products?.length || 0);
    }
    
    // Criar alguns logs de auditoria
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .insert([
        {
          table_name: 'products',
          record_id: 'prod-001',
          operation: 'INSERT',
          old_values: null,
          new_values: {
            name: 'Coca-Cola 350ml',
            sale_price: 3.50,
            stock: 100
          },
          user_id: 'admin-user-001',
          ip_address: '127.0.0.1',
          user_agent: 'Test Script'
        },
        {
          table_name: 'products',
          record_id: 'prod-001',
          operation: 'UPDATE',
          old_values: {
            stock: 100
          },
          new_values: {
            stock: 95
          },
          user_id: 'admin-user-001',
          ip_address: '127.0.0.1',
          user_agent: 'Test Script'
        },
        {
          table_name: 'categories',
          record_id: 'cat-001',
          operation: 'INSERT',
          old_values: null,
          new_values: {
            name: 'Bebidas',
            description: 'Bebidas em geral'
          },
          user_id: 'admin-user-001',
          ip_address: '127.0.0.1',
          user_agent: 'Test Script'
        }
      ])
      .select();
    
    if (auditError) {
      console.error('❌ Erro ao criar logs de auditoria:', auditError);
    } else {
      console.log('✅ Logs de auditoria criados:', auditLogs?.length || 0);
    }
    
    console.log('🎉 Dados de teste criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestData();