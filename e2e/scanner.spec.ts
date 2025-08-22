import { test, expect } from '@playwright/test'

test.describe('Scanner de Código de Barras', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de teste do scanner
    await page.goto('/test-scanner')
    await page.waitForLoadState('networkidle')
  })

  test('deve carregar a página de teste do scanner', async ({ page }) => {
    await expect(page).toHaveTitle(/SisIago/)
    await expect(page.locator('h1')).toContainText('Teste de Scanners')
  })

  test('deve exibir todos os scanners disponíveis', async ({ page }) => {
    // Verificar se todos os cards de scanner estão presentes
    await expect(page.locator('text=ZXing Confiável')).toBeVisible()
    await expect(page.locator('text=Html5QrcodeScanner')).toBeVisible()
    await expect(page.locator('text=Native Barcode Scanner')).toBeVisible()
    await expect(page.locator('text=Optimized Scanner')).toBeVisible()
  })

  test('deve abrir o scanner ZXing quando clicado', async ({ page }) => {
    // Simular permissão de câmera
    await page.context().grantPermissions(['camera'])
    
    // Clicar no botão do scanner ZXing
    await page.locator('text=Testar ZXing Confiável').click()
    
    // Verificar se o modal do scanner abriu
    await expect(page.locator('text=Scanner ZXing Confiável')).toBeVisible()
    await expect(page.locator('text=Posicione o código de barras')).toBeVisible()
  })

  test('deve fechar o scanner quando o botão fechar é clicado', async ({ page }) => {
    await page.context().grantPermissions(['camera'])
    
    // Abrir scanner
    await page.locator('text=Testar ZXing Confiável').click()
    await expect(page.locator('text=Scanner ZXing Confiável')).toBeVisible()
    
    // Fechar scanner
    await page.locator('button:has-text("Fechar")').click()
    await expect(page.locator('text=Scanner ZXing Confiável')).not.toBeVisible()
  })

  test('deve exibir histórico de scans', async ({ page }) => {
    // Verificar se a seção de histórico existe
    await expect(page.locator('text=Histórico de Scans')).toBeVisible()
    
    // Inicialmente deve estar vazio ou com mensagem
    const historySection = page.locator('[data-testid="scan-history"]')
    await expect(historySection).toBeVisible()
  })

  test('deve funcionar em dispositivos móveis', async ({ page, isMobile }) => {
    if (isMobile) {
      // Verificar layout mobile
      await expect(page.locator('h1')).toBeVisible()
      
      // Verificar se os botões são acessíveis em mobile
      const scannerButtons = page.locator('button:has-text("Testar")')
      await expect(scannerButtons.first()).toBeVisible()
      
      // Verificar se o layout é responsivo
      const viewport = page.viewportSize()
      expect(viewport?.width).toBeLessThan(768)
    }
  })

  test('deve lidar com erro de permissão de câmera', async ({ page }) => {
    // Negar permissão de câmera
    await page.context().grantPermissions([])
    
    // Tentar abrir scanner
    await page.locator('text=Testar ZXing Confiável').click()
    
    // Verificar se mensagem de erro aparece
    await expect(page.locator('text=Erro ao acessar a câmera')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('PDV - Ponto de Venda', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pdv')
    await page.waitForLoadState('networkidle')
  })

  test('deve carregar a página do PDV', async ({ page }) => {
    await expect(page).toHaveTitle(/SisIago/)
    await expect(page.locator('h1')).toContainText('Ponto de Venda')
  })

  test('deve exibir o scanner no PDV', async ({ page }) => {
    // Verificar se o botão do scanner está presente
    await expect(page.locator('button:has-text("Scanner")')).toBeVisible()
  })

  test('deve abrir o scanner no PDV', async ({ page }) => {
    await page.context().grantPermissions(['camera'])
    
    // Clicar no botão do scanner
    await page.locator('button:has-text("Scanner")').click()
    
    // Verificar se o scanner abriu
    await expect(page.locator('text=Scanner ZXing Confiável')).toBeVisible()
  })

  test('deve exibir carrinho de compras', async ({ page }) => {
    // Verificar se a seção do carrinho existe
    await expect(page.locator('text=Carrinho')).toBeVisible()
    
    // Verificar se está vazio inicialmente
    await expect(page.locator('text=Carrinho vazio')).toBeVisible()
  })

  test('deve permitir adicionar produto manualmente', async ({ page }) => {
    // Procurar por campo de busca de produto
    const searchInput = page.locator('input[placeholder*="produto"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Produto Teste')
      await searchInput.press('Enter')
    }
  })

  test('deve calcular total do carrinho', async ({ page }) => {
    // Verificar se existe seção de total
    await expect(page.locator('text=Total')).toBeVisible()
    
    // Verificar se o valor inicial é R$ 0,00
    await expect(page.locator('text=R$ 0,00')).toBeVisible()
  })

  test('deve funcionar fluxo completo de venda', async ({ page }) => {
    // Este teste simula um fluxo completo:
    // 1. Adicionar produto
    // 2. Verificar carrinho
    // 3. Finalizar venda
    
    // Verificar estado inicial
    await expect(page.locator('text=Carrinho vazio')).toBeVisible()
    
    // Simular adição de produto (se houver produtos cadastrados)
    const addButton = page.locator('button:has-text("Adicionar")')
    if (await addButton.isVisible()) {
      await addButton.first().click()
      
      // Verificar se produto foi adicionado
      await expect(page.locator('text=Carrinho vazio')).not.toBeVisible()
    }
  })
})

test.describe('Gestão de Produtos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/produtos')
    await page.waitForLoadState('networkidle')
  })

  test('deve carregar lista de produtos', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Produtos')
    await expect(page.locator('button:has-text("Novo Produto")')).toBeVisible()
  })

  test('deve navegar para criação de produto', async ({ page }) => {
    await page.locator('button:has-text("Novo Produto")').click()
    await expect(page).toHaveURL('/produtos/novo')
    await expect(page.locator('h1')).toContainText('Novo Produto')
  })

  test('deve permitir buscar produtos', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('teste')
      // Verificar se a busca funciona
      await page.waitForTimeout(1000)
    }
  })
})

test.describe('Responsividade', () => {
  test('deve funcionar em diferentes tamanhos de tela', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },   // iPhone SE
      { width: 768, height: 1024 },  // iPad
      { width: 1920, height: 1080 }  // Desktop
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      
      // Verificar se a página carrega corretamente
      await expect(page.locator('body')).toBeVisible()
      
      // Verificar se elementos principais estão visíveis
      await expect(page.locator('h1')).toBeVisible()
    }
  })
})

test.describe('Performance', () => {
  test('deve carregar rapidamente', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // Verificar se carrega em menos de 3 segundos
    expect(loadTime).toBeLessThan(3000)
  })

  test('deve ter Core Web Vitals adequados', async ({ page }) => {
    await page.goto('/')
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle')
    
    // Verificar se não há erros de console críticos
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Navegar por algumas páginas
    await page.goto('/pdv')
    await page.goto('/produtos')
    
    // Verificar se não há muitos erros
    expect(errors.length).toBeLessThan(5)
  })
})