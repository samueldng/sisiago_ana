// Arquivo de instrumentação do Next.js para monitoramento e observabilidade

export async function register() {
  // Verificar se estamos no servidor
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🔧 Inicializando instrumentação do servidor...')
    
    // Configurar monitoramento de performance
    const { performance, PerformanceObserver } = await import('perf_hooks')
    
    // Observer para métricas de HTTP
    const httpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          console.log(`📊 Performance: ${entry.name} - ${entry.duration.toFixed(2)}ms`)
        }
      })
    })
    
    httpObserver.observe({ entryTypes: ['measure'] })
    
    // Configurar logging estruturado
    const winston = await import('winston').catch(() => null)
    
    if (winston) {
      const transports: any[] = []
      
      // Apenas adicionar file transports se não estivermos no Vercel
      if (!process.env.VERCEL && !process.env.NEXT_RUNTIME) {
        try {
          const fs = await import('fs')
          const path = await import('path')
          
          // Criar diretório de logs se não existir
          const logsDir = path.join(process.cwd(), 'logs')
          if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true })
          }
          
          transports.push(
            new winston.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.default.transports.File({ filename: 'logs/combined.log' })
          )
        } catch (error) {
          console.warn('⚠️ Não foi possível configurar file logging:', error)
        }
      }
      
      // Sempre adicionar console transport
      transports.push(
        new winston.default.transports.Console({
          format: winston.default.format.simple()
        })
      )
      
      const logger = winston.default.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: winston.default.format.combine(
          winston.default.format.timestamp(),
          winston.default.format.errors({ stack: true }),
          winston.default.format.json()
        ),
        defaultMeta: { service: 'sisiago' },
        transports
      })
      
      // Tornar o logger disponível globalmente
      ;(global as any).logger = logger
    }
    
    // Configurar monitoramento de memória
    setInterval(() => {
      const memUsage = process.memoryUsage()
      const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB'
      
      console.log('💾 Uso de memória:', {
        rss: formatBytes(memUsage.rss),
        heapUsed: formatBytes(memUsage.heapUsed),
        heapTotal: formatBytes(memUsage.heapTotal),
        external: formatBytes(memUsage.external)
      })
    }, 60000) // A cada minuto
    
    // Configurar tratamento de erros não capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Erro não capturado:', error)
      if ((global as any).logger) {
        ;(global as any).logger.error('Uncaught Exception', { error: error.message, stack: error.stack })
      }
    })
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promise rejeitada não tratada:', reason)
      if ((global as any).logger) {
        ;(global as any).logger.error('Unhandled Rejection', { reason, promise })
      }
    })
    
    // Configurar graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`🛑 Recebido sinal ${signal}. Iniciando shutdown graceful...`)
      
      if ((global as any).logger) {
        ;(global as any).logger.info('Graceful shutdown initiated', { signal })
      }
      
      // Fechar conexões do banco de dados
      // Supabase connections are handled automatically
      
      process.exit(0)
    }
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
    process.on('SIGINT', () => gracefulShutdown('SIGINT'))
    
    console.log('✅ Instrumentação do servidor configurada com sucesso!')
  }
  
  // Configurações para Edge Runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    console.log('🔧 Inicializando instrumentação do Edge Runtime...')
    
    // Configurações específicas para Edge Runtime
    // (limitadas devido às restrições do ambiente)
    
    console.log('✅ Instrumentação do Edge Runtime configurada!')
  }
}

// Função para criar métricas customizadas
export function createMetric(name: string, startTime?: number) {
  const start = startTime || performance.now()
  
  return {
    end: () => {
      const duration = performance.now() - start
      performance.mark(`${name}-end`)
      performance.measure(name, { start, end: performance.now() })
      return duration
    },
    mark: (label: string) => {
      performance.mark(`${name}-${label}`)
    }
  }
}

// Função para logging estruturado
export function log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta
  }
  
  if ((global as any).logger) {
    ;(global as any).logger[level](message, meta)
  } else {
    console[level === 'info' ? 'log' : level](`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta || '')
  }
}

// Função para monitorar performance de funções
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    const metric = createMetric(name)
    
    try {
      const result = fn(...args)
      
      // Se for uma Promise, aguardar a resolução
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          const duration = metric.end()
          log('info', `Performance: ${name} completed`, { duration: `${duration.toFixed(2)}ms` })
        })
      }
      
      const duration = metric.end()
      log('info', `Performance: ${name} completed`, { duration: `${duration.toFixed(2)}ms` })
      
      return result
    } catch (error) {
      const duration = metric.end()
      log('error', `Performance: ${name} failed`, { 
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }) as T
}