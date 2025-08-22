// Teste corrigido para verificar login e autenticação

const testLoginAndVerify = async () => {
  try {
    console.log('🔍 Testando login...');
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sisiago.com',
        password: 'admin123'
      })
    });

    console.log('📊 Status do login:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('❌ Falha no login:', errorData);
      return;
    }

    // Extrair cookie da resposta
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('🍪 Set-Cookie header:', setCookieHeader);
    
    let authToken = null;
    if (setCookieHeader) {
      const match = setCookieHeader.match(/auth-token=([^;]+)/);
      if (match) {
        authToken = match[1];
        console.log('🔑 Token extraído:', authToken.substring(0, 50) + '...');
      }
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido!');
    console.log('👤 Usuário:', loginData.user.name, '(' + loginData.user.role + ')');
    
    if (!authToken) {
      console.log('❌ Não foi possível extrair o token do cookie');
      return;
    }

    // Testar verificação com o token
    console.log('\n🔍 Testando verificação de autenticação...');
    
    const verifyResponse = await fetch('http://localhost:3000/api/auth/verify', {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });

    console.log('📊 Status da verificação:', verifyResponse.status);
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('✅ Verificação bem-sucedida!');
      console.log('👤 Dados verificados:', verifyData.user.name, '(' + verifyData.user.role + ')');
    } else {
      const errorData = await verifyResponse.json();
      console.log('❌ Falha na verificação:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
};

testLoginAndVerify();