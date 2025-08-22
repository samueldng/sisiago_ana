/**
 * Utilitário para diagnóstico de problemas de autenticação
 */

export const runAuthDiagnostic = async () => {
  console.group('📊 Diagnóstico de Autenticação');
  
  // Verificar ambiente
  console.log('🌍 Ambiente:', process.env.NODE_ENV || 'não definido');
  console.log('🔗 URL da aplicação:', window.location.origin);
  
  // Verificar cookies disponíveis
  console.log('🍪 Cookies disponíveis:', document.cookie || 'nenhum');
  
  // Verificar se o cookie auth-token existe
  const hasAuthCookie = document.cookie.includes('auth-token');
  console.log('🔑 Cookie auth-token presente:', hasAuthCookie);
  
  // Testar endpoint de verificação
  try {
    console.log('🔍 Testando endpoint /api/auth/verify...');
    const response = await fetch('/api/auth/verify', {
      credentials: 'include',
      cache: 'no-store'
    });
    
    console.log('📡 Status da resposta:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Verificação bem-sucedida:', data);
    } else {
      console.log('❌ Falha na verificação');
      try {
        const errorText = await response.text();
        console.log('❌ Detalhes do erro:', errorText);
      } catch (e) {
        console.log('❌ Não foi possível ler detalhes do erro');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao testar verificação:', error);
  }
  
  // Verificar headers
  try {
    console.log('🔍 Verificando headers da requisição...');
    const response = await fetch('/api/auth/debug-headers');
    const data = await response.json();
    console.log('📋 Headers recebidos pelo servidor:', data);
  } catch (error) {
    console.error('❌ Erro ao verificar headers:', error);
  }
  
  console.groupEnd();
};

export default runAuthDiagnostic;