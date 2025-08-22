const BASE_URL = 'http://localhost:3000';

async function testCookieAuth() {
  // Importar fetch dinamicamente
  const { default: fetch } = await import('node-fetch');
  console.log('🔍 Testando autenticação com cookies...');
  
  try {
    // 1. Fazer login
    console.log('\n1. Fazendo login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@sisiago.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login status:', loginResponse.status);
    console.log('Login data:', loginData);
    
    // Extrair cookies da resposta
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies recebidos:', cookies);
    
    if (!loginData.success) {
      console.error('❌ Falha no login');
      return;
    }
    
    // 2. Testar API com cookie
    console.log('\n2. Testando API com cookie...');
    const apiResponse = await fetch(`${BASE_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || `auth-token=${loginData.token}`
      }
    });
    
    const apiData = await apiResponse.json();
    console.log('API status:', apiResponse.status);
    console.log('API data:', apiData);
    
    if (apiResponse.ok) {
      console.log('✅ Autenticação com cookie funcionando!');
    } else {
      console.log('❌ Falha na autenticação com cookie');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testCookieAuth();