const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://uzaclmtjkimccuibuily.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWNsbXRqa2ltY2N1aWJ1aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTg0ODgsImV4cCI6MjA3MDE5NDQ4OH0.t4kD5NpmCmAeopVP81Atk5i_3kN7PbbS1gXMWRGKyU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupAuditLogs() {
  try {
    console.log('🔧 Configurando tabela de logs de auditoria...');
    
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('create-audit-logs-table.sql', 'utf8');
    
    // Executar o SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Tentar criar a tabela diretamente
      console.log('🔄 Tentando criar tabela diretamente...');
      
      const { data: createResult, error: createError } = await supabase
        .from('audit_logs')
        .select('*')
        .limit(1);
      
      if (createError && createError.code === 'PGRST106') {
        console.log('✅ Tabela audit_logs não existe, isso é esperado.');
        console.log('📝 Por favor, execute o SQL manualmente no Supabase Dashboard:');
        console.log('\n' + sqlContent);
      } else if (createError) {
        console.error('❌ Erro ao verificar tabela:', createError);
      } else {
        console.log('✅ Tabela audit_logs já existe!');
      }
    } else {
      console.log('✅ SQL executado com sucesso:', data);
    }
    
    // Criar alguns logs de teste
    console.log('📊 Criando logs de teste...');
    
    const testLogs = [
      {
        table_name: 'users',
        record_id: 'admin-user-001',
        operation: 'INSERT',
        old_values: null,
        new_values: {
          email: 'admin@sisiago.com',
          name: 'Administrador',
          role: 'admin'
        },
        user_id: 'admin-user-001',
        ip_address: '127.0.0.1',
        user_agent: 'Setup Script'
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
        user_agent: 'Sistema PDV'
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
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ];
    
    const { data: logsData, error: logsError } = await supabase
      .from('audit_logs')
      .insert(testLogs)
      .select();
    
    if (logsError) {
      console.error('❌ Erro ao criar logs de teste:', logsError);
    } else {
      console.log('✅ Logs de teste criados:', logsData?.length || 0);
    }
    
    console.log('🎉 Configuração concluída!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

setupAuditLogs();