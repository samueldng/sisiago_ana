const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUserManagement() {
  try {
    console.log('🔍 Testando funcionalidades de gerenciamento de usuários...');
    
    // 1. Listar usuários
    console.log('\n1. Listando usuários:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError);
    } else {
      console.log('✅ Usuários encontrados:', users.length);
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - Ativo: ${user.is_active ?? 'N/A'}`);
      });
    }
    
    // 2. Verificar se a coluna is_active existe
    console.log('\n2. Verificando se a coluna is_active existe:');
    const hasIsActiveColumn = users.some(user => user.hasOwnProperty('is_active') && user.is_active !== undefined);
    
    if (hasIsActiveColumn) {
      console.log('✅ Coluna is_active existe');
    } else {
      console.log('⚠️  Coluna is_active não existe ou está vazia');
    }
    
    // 3. Testar se podemos adicionar o campo is_active
    if (users && users.length > 0) {
      const testUser = users[0];
      console.log(`\n3. Testando atualização do usuário ${testUser.email}:`);
      
      // Tentar atualizar com is_active
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ is_active: true })
        .eq('id', testUser.id)
        .select()
        .single();
      
      if (updateError) {
        if (updateError.message.includes('column "is_active" of relation "users" does not exist')) {
          console.log('⚠️  Coluna is_active não existe - precisa ser adicionada ao banco');
          console.log('   Execute o seguinte SQL no Supabase:');
          console.log('   ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;');
        } else {
          console.error('❌ Erro ao atualizar usuário:', updateError);
        }
      } else {
        console.log('✅ Usuário atualizado com sucesso:', updatedUser.email);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testUserManagement();