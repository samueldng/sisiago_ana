const http = require('http');

// Função para fazer requisições HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

// Função para fazer login e obter cookie
async function login(email, password) {
  const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const loginData = JSON.stringify({ email, password });
  const response = await makeRequest(loginOptions, loginData);
  
  if (response.statusCode !== 200) {
    throw new Error(`Login falhou: ${JSON.stringify(response.body)}`);
  }
  
  // Extrair cookie
  const setCookieHeader = response.headers['set-cookie'];
  let authCookie = '';
  if (setCookieHeader) {
    const cookieMatch = setCookieHeader[0].match(/auth-token=([^;]+)/);
    if (cookieMatch) {
      authCookie = `auth-token=${cookieMatch[1]}`;
    }
  }
  
  return { user: response.body.user, cookie: authCookie };
}

// Função para testar acesso a um endpoint
async function testEndpoint(path, cookie, expectedStatus = 200) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET',
    headers: {
      'Cookie': cookie
    }
  };
  
  try {
    const response = await makeRequest(options);
    return {
      path,
      status: response.statusCode,
      success: response.statusCode === expectedStatus,
      message: response.body.error || response.body.message || 'OK'
    };
  } catch (error) {
    return {
      path,
      status: 'ERROR',
      success: false,
      message: error.message
    };
  }
}

// Função principal de teste
async function testAccessControl() {
  console.log('🔐 Testando Controle de Acesso do Sistema\n');
  
  const testUsers = [
    { email: 'admin@sisiago.com', password: 'admin123', role: 'admin' },
    { email: 'manager@sisiago.com', password: '123456', role: 'manager' },
    { email: 'user@sisiago.com', password: '123456', role: 'user' }
  ];
  
  const endpoints = [
    { path: '/api/users', description: 'Gerenciamento de Usuários', adminOnly: true },
    { path: '/api/audit-logs', description: 'Logs de Auditoria', adminOnly: true },
    { path: '/api/products', description: 'Produtos', managerOrAdmin: true },
    { path: '/api/categories', description: 'Categorias', managerOrAdmin: true },
    { path: '/api/dashboard/stats', description: 'Estatísticas Dashboard', authenticated: true }
  ];
  
  for (const testUser of testUsers) {
    console.log(`\n👤 Testando usuário: ${testUser.email} (${testUser.role.toUpperCase()})`);
    console.log('=' .repeat(60));
    
    try {
      // Fazer login
      const { user, cookie } = await login(testUser.email, testUser.password);
      console.log(`✅ Login realizado com sucesso`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Nome: ${user.name}`);
      
      // Testar cada endpoint
      for (const endpoint of endpoints) {
        let expectedStatus = 200;
        let shouldHaveAccess = false;
        
        // Determinar se o usuário deveria ter acesso
        if (endpoint.adminOnly) {
          shouldHaveAccess = user.role === 'admin';
          expectedStatus = shouldHaveAccess ? 200 : 403;
        } else if (endpoint.managerOrAdmin) {
          shouldHaveAccess = ['admin', 'manager'].includes(user.role);
          expectedStatus = shouldHaveAccess ? 200 : 403;
        } else if (endpoint.authenticated) {
          shouldHaveAccess = true; // Qualquer usuário autenticado
          expectedStatus = 200;
        }
        
        const result = await testEndpoint(endpoint.path, cookie, expectedStatus);
        
        const accessIcon = shouldHaveAccess ? '🟢' : '🔴';
        const statusIcon = result.success ? '✅' : '❌';
        
        console.log(`   ${accessIcon} ${statusIcon} ${endpoint.description}`);
        console.log(`      Endpoint: ${endpoint.path}`);
        console.log(`      Status: ${result.status} (esperado: ${expectedStatus})`);
        
        if (!result.success) {
          console.log(`      Erro: ${result.message}`);
        }
        
        if (result.success && shouldHaveAccess) {
          console.log(`      ✅ Acesso permitido corretamente`);
        } else if (result.status === 403 && !shouldHaveAccess) {
          console.log(`      ✅ Acesso negado corretamente`);
        } else {
          console.log(`      ⚠️  Comportamento inesperado!`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Erro no login: ${error.message}`);
    }
  }
  
  console.log('\n🏁 Teste de controle de acesso concluído!');
}

// Executar teste
testAccessControl().catch(console.error);