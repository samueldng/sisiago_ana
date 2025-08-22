/**
 * Script de teste de integração para verificar:
 * 1. Sistema de login
 * 2. Gerenciamento de usuários
 * 3. Sistema de auditoria
 * 4. Integração entre os sistemas
 */

const BASE_URL = 'http://localhost:3000';
let authData = null; // Variável global para dados de autenticação

// Função auxiliar para fazer requisições HTTP
async function makeRequest(url, options = {}) {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include',
      ...options
    };
    
    // Se temos um token de autenticação, adicionar como cookie
  if (typeof authData !== 'undefined' && authData && authData.token) {
    config.headers['Cookie'] = `auth-token=${authData.token}`;
  }
    
    const response = await fetch(`${BASE_URL}${url}`, config);
    
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Teste de login
async function testLogin() {
  console.log('\n🔐 Testando sistema de login...');
  
  // Teste com credenciais válidas
  const loginResult = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@sisiago.com',
      password: 'admin123'
    })
  });
  
  if (loginResult.success) {
    console.log('✅ Login realizado com sucesso');
    console.log(`   Token: ${loginResult.data.token ? 'Gerado' : 'Não gerado'}`);
    console.log(`   Usuário: ${loginResult.data.user?.name || 'N/A'}`);
    console.log(`   Role: ${loginResult.data.user?.role || 'N/A'}`);
    return loginResult.data;
  } else {
    console.log('❌ Falha no login:', loginResult.data?.error || loginResult.error);
    return null;
  }
}

// Teste de listagem de usuários
async function testUsersList(authData) {
  console.log('\n👥 Testando listagem de usuários...');
  
  if (!authData?.user?.id) {
    console.log('❌ Dados de autenticação inválidos');
    return;
  }
  
  const result = await makeRequest('/api/users', {
    method: 'GET',
    headers: {
      'x-user-id': authData.user.id,
      'x-user-role': authData.user.role,
      'x-user-email': authData.user.email
    }
  });
  
  if (result.success) {
    console.log('✅ Listagem de usuários funcionando');
    console.log(`   Total de usuários: ${result.data?.length || 0}`);
    if (result.data?.length > 0) {
      console.log(`   Primeiro usuário: ${result.data[0].name} (${result.data[0].email})`);
    }
  } else {
    console.log('❌ Falha na listagem de usuários:', result.data?.error || result.error);
  }
}

// Teste de criação de usuário
async function testUserCreation(authData) {
  console.log('\n➕ Testando criação de usuário...');
  
  if (!authData?.user?.id) {
    console.log('❌ Dados de autenticação inválidos');
    return null;
  }
  
  const testUser = {
    name: 'Usuário Teste',
    email: `teste${Date.now()}@sisiago.com`,
    password: 'teste123',
    role: 'user'
  };
  
  const result = await makeRequest('/api/users', {
    method: 'POST',
    headers: {
      'x-user-id': authData.user.id,
      'x-user-role': authData.user.role,
      'x-user-email': authData.user.email
    },
    body: JSON.stringify(testUser)
  });
  
  if (result.success) {
    console.log('✅ Usuário criado com sucesso');
    console.log(`   ID: ${result.data.user.id}`);
    console.log(`   Nome: ${result.data.user.name}`);
    console.log(`   Email: ${result.data.user.email}`);
    return result.data.user;
  } else {
    console.log('❌ Falha na criação de usuário:', result.data?.error || result.error);
    return null;
  }
}

// Teste de alteração de status de usuário
async function testUserStatusChange(authData, userId) {
  console.log('\n🔄 Testando alteração de status de usuário...');
  
  if (!authData?.user?.id || !userId) {
    console.log('❌ Dados insuficientes para teste');
    return;
  }
  
  const result = await makeRequest(`/api/users/${userId}/status`, {
    method: 'PATCH',
    headers: {
      'x-user-id': authData.user.id,
      'x-user-role': authData.user.role,
      'x-user-email': authData.user.email
    },
    body: JSON.stringify({
      is_active: false
    })
  });
  
  if (result.success) {
    console.log('✅ Status do usuário alterado com sucesso');
    console.log(`   Usuário ativo: ${result.data.is_active}`);
  } else {
    console.log('❌ Falha na alteração de status:', result.data?.error || result.error);
  }
}

// Teste de alteração de role de usuário
async function testUserRoleChange(authData, userId) {
  console.log('\n👑 Testando alteração de role de usuário...');
  
  if (!authData?.user?.id || !userId) {
    console.log('❌ Dados insuficientes para teste');
    return;
  }
  
  const result = await makeRequest(`/api/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'x-user-id': authData.user.id,
      'x-user-role': authData.user.role,
      'x-user-email': authData.user.email
    },
    body: JSON.stringify({
      role: 'manager'
    })
  });
  
  if (result.success) {
    console.log('✅ Role do usuário alterada com sucesso');
    console.log(`   Nova role: ${result.data.user?.role || 'N/A'}`);
  } else {
    console.log('❌ Falha na alteração de role:', result.data?.error || result.error);
  }
}

// Teste de logs de auditoria
async function testAuditLogs(authData) {
  console.log('\n📋 Testando logs de auditoria...');
  
  if (!authData?.user?.id) {
    console.log('❌ Dados de autenticação inválidos');
    return;
  }
  
  const result = await makeRequest('/api/audit-logs?limit=10', {
    method: 'GET',
    headers: {
      'x-user-id': authData.user.id,
      'x-user-role': authData.user.role,
      'x-user-email': authData.user.email
    }
  });
  
  if (result.success) {
    console.log('✅ Logs de auditoria funcionando');
    console.log(`   Total de logs: ${result.data.pagination?.total || 0}`);
    console.log(`   Logs retornados: ${result.data.data?.length || 0}`);
    
    if (result.data.data?.length > 0) {
      const firstLog = result.data.data[0];
      console.log(`   Último log: ${firstLog.operation} em ${firstLog.table_name} por ${firstLog.user_name}`);
    }
  } else {
    console.log('❌ Falha nos logs de auditoria:', result.data?.error || result.error);
  }
}

// Teste de filtros de auditoria
async function testAuditFilters(authData) {
  console.log('\n🔍 Testando filtros de auditoria...');
  
  if (!authData?.user?.id) {
    console.log('❌ Dados de autenticação inválidos');
    return;
  }
  
  // Teste filtro por tabela
  const result = await makeRequest('/api/audit-logs?table_name=users&limit=5', {
    method: 'GET',
    headers: {
      'x-user-id': authData.user.id,
      'x-user-role': authData.user.role,
      'x-user-email': authData.user.email
    }
  });
  
  if (result.success) {
    console.log('✅ Filtros de auditoria funcionando');
    console.log(`   Logs de usuários: ${result.data.data?.length || 0}`);
  } else {
    console.log('❌ Falha nos filtros de auditoria:', result.data?.error || result.error);
  }
}

// Teste de exclusão de usuário
async function testUserDeletion(authData, userId) {
  console.log('\n🗑️ Testando exclusão de usuário...');
  
  if (!authData?.user?.id || !userId) {
    console.log('❌ Dados insuficientes para teste');
    return;
  }
  
  const result = await makeRequest(`/api/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'x-user-id': authData.user.id,
      'x-user-role': authData.user.role,
      'x-user-email': authData.user.email
    }
  });
  
  if (result.success) {
    console.log('✅ Usuário excluído com sucesso');
  } else {
    console.log('❌ Falha na exclusão de usuário:', result.data?.error || result.error);
  }
}

// Função principal de teste
async function runIntegrationTests() {
  console.log('🚀 Iniciando testes de integração do SISIAGO');
  console.log('=' .repeat(50));
  
  try {
    // 1. Teste de login
    authData = await testLogin();
    if (!authData) {
      console.log('\n❌ Testes interrompidos - falha no login');
      return;
    }
    
    // 2. Teste de listagem de usuários
    await testUsersList(authData);
    
    // 3. Teste de criação de usuário
    const newUser = await testUserCreation(authData);
    
    if (newUser) {
      // 4. Teste de alteração de status
      await testUserStatusChange(authData, newUser.id);
      
      // 5. Teste de alteração de role
      await testUserRoleChange(authData, newUser.id);
      
      // 6. Aguardar um pouco para os logs serem criados
      console.log('\n⏳ Aguardando logs de auditoria...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 7. Teste de logs de auditoria
      await testAuditLogs(authData);
      
      // 8. Teste de filtros de auditoria
      await testAuditFilters(authData);
      
      // 9. Teste de exclusão de usuário
      await testUserDeletion(authData, newUser.id);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Testes de integração concluídos!');
    
  } catch (error) {
    console.error('\n💥 Erro durante os testes:', error.message);
  }
}

// Executar testes se o script for chamado diretamente
if (typeof window === 'undefined') {
  // Node.js environment
  (async () => {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
    await runIntegrationTests();
  })();
} else {
  // Browser environment
  console.log('Script carregado no navegador. Execute runIntegrationTests() para iniciar os testes.');
}

// Exportar função para uso no navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runIntegrationTests };
}