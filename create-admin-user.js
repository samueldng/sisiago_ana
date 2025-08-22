const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configurações temporárias para teste (substitua pelas suas)
const supabaseUrl = 'https://uzaclmtjkimccuibuily.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWNsbXRqa2ltY2N1aWJ1aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTg0ODgsImV4cCI6MjA3MDE5NDQ4OH0.t4kD5NpmCmAeopVP81Atk5i_3kN7PbbS1gXMWRGKyU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    console.log('🔐 Criando usuário administrador...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Criar usuário admin
    const { data: user, error } = await supabase
      .from('users')
      .upsert({
        id: 'admin-user-001',
        email: 'admin@sisiago.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'admin'
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar usuário admin:', error);
      return;
    }
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email: admin@sisiago.com');
    console.log('🔑 Senha: admin123');
    console.log('👤 Role: admin');
    
    // Verificar se foi criado
    const { data: verification, error: verifyError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@sisiago.com')
      .single();
    
    if (verifyError) {
      console.error('❌ Erro ao verificar usuário:', verifyError);
    } else {
      console.log('✅ Verificação: Usuário encontrado no banco');
      console.log('ID:', verification.id);
      console.log('Role:', verification.role);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createAdminUser();