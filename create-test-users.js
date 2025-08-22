const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = 'https://uzaclmtjkimccuibuily.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6YWNsbXRqa2ltY2N1aWJ1aWx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTg0ODgsImV4cCI6MjA3MDE5NDQ4OH0.t4kD5NpmCmAeopVP81Atk5i_3kN7PbbS1gXMWRGKyU0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUsers() {
  try {
    console.log('👥 Criando usuários de teste...');
    
    // Hash das senhas
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Usuários de teste
    const testUsers = [
      {
        id: 'manager-user-001',
        email: 'manager@sisiago.com',
        name: 'Gerente Teste',
        password: hashedPassword,
        role: 'manager'
      },
      {
        id: 'user-001',
        email: 'user@sisiago.com',
        name: 'Usuário Comum',
        password: hashedPassword,
        role: 'user'
      }
    ];
    
    for (const userData of testUsers) {
      const { data: user, error } = await supabase
        .from('users')
        .upsert(userData)
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Erro ao criar usuário ${userData.email}:`, error);
      } else {
        console.log(`✅ Usuário ${userData.role} criado: ${userData.email}`);
        console.log(`   Senha: 123456`);
      }
    }
    
    // Verificar usuários criados
    console.log('\n📋 Verificando usuários no banco:');
    const { data: allUsers, error: listError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .order('role');
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
    } else {
      allUsers.forEach(user => {
        console.log(`   ${user.role.toUpperCase()}: ${user.email} (${user.name})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestUsers();