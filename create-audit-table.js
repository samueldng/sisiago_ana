const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuditTable() {
  console.log('🔍 Verificando se a tabela audit_logs existe...');
  
  try {
    // Tentar fazer uma consulta simples na tabela
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST205') {
        console.log('❌ A tabela audit_logs NÃO existe no banco de dados.');
        console.log('\n📝 Para criar a tabela, execute o seguinte SQL no Supabase SQL Editor:');
        console.log('\n' + '='.repeat(60));
        console.log(`
-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);`);
        console.log('\n' + '='.repeat(60));
        console.log('\n🌐 Acesse: https://uzaclmtjkimccuibuily.supabase.co/project/default/sql');
        console.log('\n⚠️  Sem essa tabela, os logs de auditoria não funcionarão.');
      } else {
        console.error('❌ Erro ao verificar tabela:', error);
      }
    } else {
      console.log('✅ A tabela audit_logs existe e está acessível!');
      console.log(`📊 Registros encontrados: ${data ? data.length : 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkAuditTable();