module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/pdv',
        'http://localhost:3000/produtos',
        'http://localhost:3000/test-scanner',
        'http://localhost:3000/vendas',
        'http://localhost:3000/clientes'
      ],
      startServerCommand: 'npm start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': 'off',
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Outras métricas importantes
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
        
        // Acessibilidade específica
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        
        // SEO específico
        'document-title': 'error',
        'meta-description': 'warn',
        'viewport': 'error',
        
        // Melhores práticas
        'uses-https': 'off', // Desabilitado para desenvolvimento local
        'is-on-https': 'off', // Desabilitado para desenvolvimento local
        'no-vulnerable-libraries': 'error',
        'charset': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: './lighthouse-results'
    }
  }
}