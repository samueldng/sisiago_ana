import { supabase } from '@/lib/supabase'

export interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  details?: any
  timestamp: Date
}

export interface ConnectivityStatus {
  isOnline: boolean
  supabaseConnected: boolean
  lastSuccessfulConnection?: Date
  errorCount: number
  lastError?: string
}

class DatabaseDiagnostic {
  private static instance: DatabaseDiagnostic
  private connectivityStatus: ConnectivityStatus = {
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    supabaseConnected: false,
    errorCount: 0
  }
  private listeners: ((status: ConnectivityStatus) => void)[] = []
  private reconnectInterval?: NodeJS.Timeout
  private healthCheckInterval?: NodeJS.Timeout

  static getInstance(): DatabaseDiagnostic {
    if (!DatabaseDiagnostic.instance) {
      DatabaseDiagnostic.instance = new DatabaseDiagnostic()
    }
    return DatabaseDiagnostic.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupNetworkListeners()
      this.startHealthCheck()
    }
  }

  private setupNetworkListeners() {
    if (typeof window === 'undefined') return
    
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true })
      this.testSupabaseConnection()
    })

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false, supabaseConnected: false })
    })
  }

  private startHealthCheck() {
    // Verificar conexão a cada 30 segundos
    this.healthCheckInterval = setInterval(() => {
      if (this.connectivityStatus.isOnline) {
        this.testSupabaseConnection()
      }
    }, 30000)
  }

  private updateStatus(updates: Partial<ConnectivityStatus>) {
    this.connectivityStatus = { ...this.connectivityStatus, ...updates }
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.connectivityStatus))
  }

  public subscribe(listener: (status: ConnectivityStatus) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  public getStatus(): ConnectivityStatus {
    return { ...this.connectivityStatus }
  }

  public async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = []

    // Teste 1: Verificar variáveis de ambiente
    results.push(await this.testEnvironmentVariables())

    // Teste 2: Verificar conectividade de rede
    results.push(await this.testNetworkConnectivity())

    // Teste 3: Testar conexão com Supabase
    results.push(await this.testSupabaseConnection())

    // Teste 4: Testar operações básicas do banco
    results.push(await this.testDatabaseOperations())

    // Teste 5: Verificar cache local
    results.push(await this.testLocalCache())

    return results
  }

  private async testEnvironmentVariables(): Promise<DiagnosticResult> {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        return {
          test: 'Variáveis de Ambiente',
          status: 'error',
          message: 'Variáveis do Supabase não configuradas',
          details: {
            hasUrl: !!supabaseUrl,
            hasKey: !!supabaseKey,
            urlFormat: supabaseUrl?.includes('supabase.co')
          },
          timestamp: new Date()
        }
      }

      return {
        test: 'Variáveis de Ambiente',
        status: 'success',
        message: 'Variáveis configuradas corretamente',
        details: {
          url: supabaseUrl.substring(0, 30) + '...',
          keyLength: supabaseKey.length
        },
        timestamp: new Date()
      }
    } catch (error) {
      return {
        test: 'Variáveis de Ambiente',
        status: 'error',
        message: 'Erro ao verificar variáveis',
        details: error,
        timestamp: new Date()
      }
    }
  }

  private async testNetworkConnectivity(): Promise<DiagnosticResult> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        this.updateStatus({ isOnline: true })
        return {
          test: 'Conectividade de Rede',
          status: 'success',
          message: 'Conexão com internet ativa',
          details: {
            status: response.status,
            responseTime: Date.now()
          },
          timestamp: new Date()
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      this.updateStatus({ isOnline: false })
      return {
        test: 'Conectividade de Rede',
        status: 'error',
        message: 'Sem conexão com internet',
        details: error,
        timestamp: new Date()
      }
    }
  }

  public async testSupabaseConnection(): Promise<DiagnosticResult> {
    try {
      const startTime = Date.now()
      
      // Teste simples de conexão
      const { data, error } = await supabase
        .from('categories')
        .select('count')
        .limit(1)

      const responseTime = Date.now() - startTime

      if (error) {
        this.updateStatus({ 
          supabaseConnected: false, 
          errorCount: this.connectivityStatus.errorCount + 1,
          lastError: error.message 
        })
        
        return {
          test: 'Conexão Supabase',
          status: 'error',
          message: `Erro na conexão: ${error.message}`,
          details: {
            error: error,
            responseTime,
            errorCode: error.code
          },
          timestamp: new Date()
        }
      }

      this.updateStatus({ 
        supabaseConnected: true, 
        lastSuccessfulConnection: new Date(),
        errorCount: 0,
        lastError: undefined
      })

      return {
        test: 'Conexão Supabase',
        status: 'success',
        message: `Conexão estabelecida (${responseTime}ms)`,
        details: {
          responseTime,
          data
        },
        timestamp: new Date()
      }
    } catch (error) {
      this.updateStatus({ 
        supabaseConnected: false,
        errorCount: this.connectivityStatus.errorCount + 1,
        lastError: error instanceof Error ? error.message : 'Erro desconhecido'
      })

      return {
        test: 'Conexão Supabase',
        status: 'error',
        message: 'Falha na conexão com Supabase',
        details: error,
        timestamp: new Date()
      }
    }
  }

  private async testDatabaseOperations(): Promise<DiagnosticResult> {
    try {
      // Testar operação de leitura
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name')
        .limit(5)

      if (error) {
        return {
          test: 'Operações do Banco',
          status: 'error',
          message: `Erro ao ler produtos: ${error.message}`,
          details: error,
          timestamp: new Date()
        }
      }

      return {
        test: 'Operações do Banco',
        status: 'success',
        message: `${products?.length || 0} produtos encontrados`,
        details: {
          productsCount: products?.length || 0,
          sampleProducts: products?.slice(0, 3)
        },
        timestamp: new Date()
      }
    } catch (error) {
      return {
        test: 'Operações do Banco',
        status: 'error',
        message: 'Falha nas operações do banco',
        details: error,
        timestamp: new Date()
      }
    }
  }

  private async testLocalCache(): Promise<DiagnosticResult> {
    try {
      const cacheKey = 'pdv_products_cache'
      const timestampKey = 'pdv_products_cache_timestamp'
      
      const cachedData = localStorage.getItem(cacheKey)
      const timestamp = localStorage.getItem(timestampKey)
      
      if (!cachedData || !timestamp) {
        return {
          test: 'Cache Local',
          status: 'warning',
          message: 'Nenhum cache encontrado',
          details: {
            hasCachedData: !!cachedData,
            hasTimestamp: !!timestamp
          },
          timestamp: new Date()
        }
      }

      const cacheAge = Date.now() - parseInt(timestamp)
      const products = JSON.parse(cachedData)
      
      return {
        test: 'Cache Local',
        status: 'success',
        message: `Cache com ${products.length} produtos`,
        details: {
          productsCount: products.length,
          cacheAge: Math.round(cacheAge / 1000 / 60), // minutos
          isValid: cacheAge < 30 * 60 * 1000 // 30 minutos
        },
        timestamp: new Date()
      }
    } catch (error) {
      return {
        test: 'Cache Local',
        status: 'error',
        message: 'Erro ao verificar cache',
        details: error,
        timestamp: new Date()
      }
    }
  }

  public async attemptReconnection(): Promise<boolean> {
    // Só mostrar log a cada 5 tentativas para reduzir spam
    if (this.connectivityStatus.errorCount % 5 === 0) {
      console.log('🔄 Tentando reconectar...')
    }
    
    const result = await this.testSupabaseConnection()
    
    if (result.status === 'success') {
      console.log('✅ Reconexão bem-sucedida')
      this.stopReconnectionAttempts()
      return true
    }
    
    return false
  }

  public startReconnectionAttempts() {
    if (this.reconnectInterval) return
    
    // Reduzir logs para evitar spam
    if (this.connectivityStatus.errorCount === 0) {
      console.log('🔄 Iniciando tentativas de reconexão...')
    }
    
    this.reconnectInterval = setInterval(async () => {
      if (this.connectivityStatus.isOnline && !this.connectivityStatus.supabaseConnected) {
        await this.attemptReconnection()
      }
    }, 30000) // Tentar a cada 30 segundos (reduzido de 10s)
  }

  public stopReconnectionAttempts() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
      this.reconnectInterval = undefined
      console.log('⏹️ Tentativas de reconexão interrompidas')
    }
  }

  public async backupDataToLocal(data: any, key: string) {
    try {
      localStorage.setItem(`backup_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      }))
      console.log(`💾 Backup salvo: ${key}`)
    } catch (error) {
      console.error('❌ Erro ao salvar backup:', error)
    }
  }

  public async restoreDataFromLocal(key: string): Promise<any> {
    try {
      const backup = localStorage.getItem(`backup_${key}`)
      if (backup) {
        const parsed = JSON.parse(backup)
        console.log(`📂 Backup restaurado: ${key}`)
        return parsed.data
      }
      return null
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error)
      return null
    }
  }

  public async getLocalFallbackData(type: string): Promise<any> {
    try {
      const cacheKey = `${type}_cache`
      const cached = localStorage.getItem(cacheKey)
      
      if (cached) {
        return JSON.parse(cached)
      }
      
      return null
    } catch (error) {
      console.error('Erro ao obter dados de fallback:', error)
      return null
    }
  }

  public cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
    }
    this.listeners = []
  }
}

export const dbDiagnostic = DatabaseDiagnostic.getInstance()
export default DatabaseDiagnostic