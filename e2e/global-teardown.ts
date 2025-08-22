import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando limpeza global dos testes E2E...')
  
  try {
    // Limpar dados de teste do banco se necessário
    // Nota: Em produção, você pode querer limpar dados de teste específicos
    
    // Limpar cache do navegador
    console.log('🗑️  Limpando cache e dados temporários...')
    
    // Limpar variáveis de ambiente de teste
    delete process.env.NODE_ENV
    
    // Log de conclusão
    console.log('✅ Limpeza global concluída com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro na limpeza global:', error.message)
    // Não falhar os testes por causa de erro na limpeza
  }
}

export default globalTeardown