import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...')
  
  // Configurar variáveis de ambiente para testes
  process.env.NODE_ENV = 'test'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  
  // Verificar se o servidor está rodando
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Tentar acessar a página inicial
    await page.goto('http://localhost:3000', { timeout: 30000 })
    console.log('✅ Servidor Next.js está rodando')
    
    // Verificar se as rotas principais estão acessíveis
    const routes = ['/', '/pdv', '/produtos', '/test-scanner']
    
    for (const route of routes) {
      try {
        await page.goto(`http://localhost:3000${route}`, { timeout: 10000 })
        console.log(`✅ Rota ${route} acessível`)
      } catch (error) {
        console.warn(`⚠️  Rota ${route} não acessível:`, error.message)
      }
    }
    
    // Verificar se o banco de dados está configurado
    try {
      await page.goto('http://localhost:3000/api/produtos', { timeout: 10000 })
      console.log('✅ API está respondendo')
    } catch (error) {
      console.warn('⚠️  API não está respondendo:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Erro no setup global:', error.message)
    throw new Error('Servidor Next.js não está acessível. Execute `npm run dev` antes dos testes.')
  } finally {
    await browser.close()
  }
  
  console.log('✅ Setup global concluído com sucesso!')
}

export default globalSetup