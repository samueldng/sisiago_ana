import { toast } from 'react-hot-toast'

// Tipos para configuração da API
interface ApiConfig {
  baseURL?: string
  timeout?: number
  retries?: number
  retryDelay?: number
  enableCache?: boolean
  cacheTimeout?: number
}

interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
  enableCache?: boolean
  cacheKey?: string
  skipErrorToast?: boolean
}

interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
}

interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
}

// Cache em memória para requisições
class ApiCache {
  private cache = new Map<string, CacheEntry>()
  private readonly defaultTimeout = 5 * 60 * 1000 // 5 minutos

  set(key: string, data: any, timeout?: number): void {
    const now = Date.now()
    const expiresAt = now + (timeout || this.defaultTimeout)
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) return false
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Limpar entradas expiradas
  cleanup(): void {
    const now = Date.now()
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  // Estatísticas do cache
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        expiresIn: entry.expiresAt - Date.now()
      }))
    }
  }
}

class ApiService {
  private config: Required<ApiConfig>
  private cache: ApiCache
  private abortControllers = new Map<string, AbortController>()

  constructor(config: ApiConfig = {}) {
    this.config = {
      baseURL: config.baseURL || '',
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      enableCache: config.enableCache ?? true,
      cacheTimeout: config.cacheTimeout || 5 * 60 * 1000
    }
    
    this.cache = new ApiCache()
    
    // Limpeza periódica do cache
    setInterval(() => this.cache.cleanup(), 60000) // A cada minuto
  }

  // Criar chave de cache baseada na URL e parâmetros
  private createCacheKey(url: string, options: RequestConfig = {}): string {
    if (options.cacheKey) return options.cacheKey
    
    const method = options.method || 'GET'
    const body = options.body ? JSON.stringify(options.body) : ''
    
    return `${method}:${url}:${body}`
  }

  // Verificar se a requisição deve usar cache
  private shouldUseCache(method: string, enableCache?: boolean): boolean {
    if (enableCache === false) return false
    if (!this.config.enableCache) return false
    
    // Apenas métodos GET usam cache por padrão
    return method.toUpperCase() === 'GET'
  }

  // Criar erro customizado
  private createError(message: string, status?: number, details?: any): ApiError {
    const error = new Error(message) as ApiError
    error.status = status
    error.details = details
    
    return error
  }

  // Delay para retry
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Verificar se o erro é recuperável
  private isRetryableError(error: any): boolean {
    // Erros de rede são recuperáveis
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return true
    }
    
    // Timeouts são recuperáveis
    if (error.name === 'AbortError') {
      return true
    }
    
    // Status HTTP recuperáveis
    if (error.status) {
      return error.status >= 500 || error.status === 408 || error.status === 429
    }
    
    return false
  }

  // Fazer requisição com retry logic
  private async makeRequest(
    url: string, 
    options: RequestConfig = {}, 
    attempt = 1
  ): Promise<Response> {
    const {
      timeout = this.config.timeout,
      retries = this.config.retries,
      retryDelay = this.config.retryDelay,
      ...fetchOptions
    } = options

    // Criar AbortController para timeout
    const controller = new AbortController()
    const requestId = `${Date.now()}-${Math.random()}`
    
    this.abortControllers.set(requestId, controller)
    
    // Configurar timeout
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      this.abortControllers.delete(requestId)
      
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      this.abortControllers.delete(requestId)
      
      // Se não é o último attempt e o erro é recuperável, tentar novamente
      if (attempt < retries && this.isRetryableError(error)) {
        console.warn(`🔄 Tentativa ${attempt}/${retries} falhou, tentando novamente em ${retryDelay}ms:`, error.message)
        
        await this.delay(retryDelay * attempt) // Backoff exponencial
        return this.makeRequest(url, options, attempt + 1)
      }
      
      throw error
    }
  }

  // Método principal para fazer requisições
  async request<T = any>(
    endpoint: string, 
    options: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${endpoint}`
    const method = options.method || 'GET'
    const cacheKey = this.createCacheKey(url, options)
    const useCache = this.shouldUseCache(method, options.enableCache)
    
    // Verificar cache primeiro
    if (useCache && this.cache.has(cacheKey)) {
      console.log(`📦 Cache hit para: ${method} ${endpoint}`)
      return this.cache.get(cacheKey)
    }

    try {
      console.log(`🌐 Fazendo requisição: ${method} ${endpoint}`, {
        timeout: options.timeout || this.config.timeout,
        retries: options.retries || this.config.retries,
        useCache
      })
      
      const response = await this.makeRequest(url, options)
      
      // Verificar se a resposta é válida
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorDetails: any = null
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
          errorDetails = errorData
        } catch {
          // Ignorar erro ao parsear JSON de erro
        }
        
        throw this.createError(errorMessage, response.status, errorDetails)
      }
      
      // Parsear resposta
      const contentType = response.headers.get('content-type')
      let data: T
      
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text() as any
      }
      
      // Salvar no cache se aplicável
      if (useCache) {
        this.cache.set(cacheKey, data, this.config.cacheTimeout)
        console.log(`💾 Dados salvos no cache: ${method} ${endpoint}`)
      }
      
      return data
    } catch (error: any) {
      console.error(`❌ Erro na requisição ${method} ${endpoint}:`, error)
      
      // Mostrar toast de erro (se não desabilitado)
      if (!options.skipErrorToast) {
        let errorMessage = 'Erro de conexão'
        
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout na requisição'
        } else if (error.status) {
          errorMessage = `Erro ${error.status}: ${error.message}`
        } else if (error.message) {
          errorMessage = error.message
        }
        
        toast.error(errorMessage, {
          duration: 4000,
          id: `api-error-${endpoint}` // Evitar toasts duplicados
        })
      }
      
      throw error
    }
  }

  // Métodos de conveniência
  async get<T = any>(endpoint: string, options: Omit<RequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, data?: any, options: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async put<T = any>(endpoint: string, data?: any, options: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async patch<T = any>(endpoint: string, data?: any, options: Omit<RequestConfig, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined
    })
  }

  async delete<T = any>(endpoint: string, options: Omit<RequestConfig, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // Cancelar todas as requisições pendentes
  cancelAllRequests(): void {
    for (const [id, controller] of this.abortControllers.entries()) {
      controller.abort()
      this.abortControllers.delete(id)
    }
    
    console.log('🚫 Todas as requisições foram canceladas')
  }

  // Limpar cache
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ Cache limpo')
  }

  // Invalidar cache por padrão
  invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.clearCache()
      return
    }
    
    const stats = this.cache.getStats()
    let removed = 0
    
    for (const entry of stats.entries) {
      if (entry.key.includes(pattern)) {
        this.cache.delete(entry.key)
        removed++
      }
    }
    
    console.log(`🗑️ ${removed} entradas de cache removidas (padrão: ${pattern})`)
  }

  // Estatísticas da API
  getStats() {
    return {
      config: this.config,
      cache: this.cache.getStats(),
      pendingRequests: this.abortControllers.size
    }
  }
}

// Instância global da API
export const apiService = new ApiService({
  baseURL: process.env.NODE_ENV === 'development' ? '' : '',
  timeout: 15000, // 15 segundos
  retries: 3,
  retryDelay: 1000,
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000 // 5 minutos
})

// Instância específica para produtos (com configurações otimizadas)
export const productsApi = new ApiService({
  baseURL: '/api',
  timeout: 10000, // 10 segundos
  retries: 2,
  retryDelay: 500,
  enableCache: true,
  cacheTimeout: 3 * 60 * 1000 // 3 minutos
})

export default apiService
export type { ApiConfig, RequestConfig, ApiError }