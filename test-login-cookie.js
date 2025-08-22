// Teste para verificar se o cookie de autenticação está sendo definido corretamente

const testLogin = async () => {
  try {
    console.log('🔍 Testando login e configuração de cookie...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@sisiago.com',
        password: 'admin123'
      }),
      credentials: 'include' // Importante para incluir cookies
    });

    console.log('📊 Status da resposta:', response.status);
    console.log('🍪 Headers de Set-Cookie:', response.headers.get('set-cookie'));
    
    const data = await response.json();
    console.log('📝 Dados da resposta:', data);
    
    if (response.ok) {
      console.log('✅ Login bem-sucedido!');
      
      // Agora testar a verificação
      console.log('\n🔍 Testando verificação de autenticação...');
      
      const verifyResponse = await fetch('http://localhost:3000/api/auth/verify', {
        method: 'GET',
        credentials: 'include' // Incluir cookies
      });
      
      console.log('📊 Status da verificação:', verifyResponse.status);
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('✅ Verificação bem-sucedida:', verifyData);
      } else {
        console.log('❌ Falha na verificação');
        const errorData = await verifyResponse.json();
        console.log('📝 Erro:', errorData);
      }
    } else {
      console.log('❌ Falha no login:', data);
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
};

testLogin();