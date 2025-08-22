const https = require('https');
const http = require('http');

// Função para fazer requisição HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

async function testAuditLogs() {
  try {
    console.log('🔐 Fazendo login...');
    
    // 1. Fazer login
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = JSON.stringify({
      email: 'admin@sisiago.com',
      password: 'admin123'
    });
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('Login Status:', loginResponse.statusCode);
    
    if (loginResponse.statusCode !== 200) {
      console.error('Erro no login:', loginResponse.body);
      return;
    }
    
    // Extrair cookie do login
    const setCookieHeader = loginResponse.headers['set-cookie'];
    let authCookie = '';
    if (setCookieHeader) {
      const cookieMatch = setCookieHeader[0].match(/auth-token=([^;]+)/);
      if (cookieMatch) {
        authCookie = `auth-token=${cookieMatch[1]}`;
      }
    }
    
    console.log('🍪 Cookie obtido:', authCookie ? 'Sim' : 'Não');
    
    // 2. Testar API de logs de auditoria
    console.log('📋 Testando API de logs de auditoria...');
    
    const auditOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/audit-logs?limit=5',
      method: 'GET',
      headers: {
        'Cookie': authCookie
      }
    };
    
    const auditResponse = await makeRequest(auditOptions);
    console.log('Audit Logs Status:', auditResponse.statusCode);
    
    if (auditResponse.statusCode === 200) {
      const data = JSON.parse(auditResponse.body);
      console.log('✅ Sucesso:', data.logs?.length || 0, 'logs encontrados');
      console.log('📊 Dados:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Erro na API de logs:', auditResponse.body);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testAuditLogs();