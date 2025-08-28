'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Product } from '@/types'
import { useState, useEffect } from 'react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'pending'
  message: string
  details?: string
}

// Componente que usa navigator - será carregado dinamicamente
function TestMobileFixContent() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Detectar status de conectividade
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const addTest = (test: TestResult) => {
    setTests(prev => [...prev, test])
  }

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test))
  }

  const runTests = async () => {
    setIsRunning(true)
    setTests([])
    setProducts([])

    // Teste 1: Verificar função debounce corrigida
    addTest({
      name: 'Função Debounce',
      status: 'pending',
      message: 'Testando função debounce corrigida...'
    })

    try {
      const { debounce } = await import('@/utils')
      let callCount = 0
      const testFunc = debounce(() => callCount++, 100)
      
      // Chamar múltiplas vezes rapidamente
      testFunc()
      testFunc()
      testFunc()
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      if (callCount === 1) {
        updateTest(0, {
          status: 'success',
          message: 'Debounce funcionando corretamente',
          details: 'Função chamada apenas 1 vez de 3 tentativas'
        })
      } else {
        updateTest(0, {
          status: 'error',
          message: 'Debounce não está funcionando',
          details: `Função chamada ${callCount} vezes em vez de 1`
        })
      }
    } catch (error) {
      updateTest(0, {
        status: 'error',
        message: 'Erro ao testar debounce',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // Teste 2: Carregar produtos com retry
    addTest({
      name: 'Carregamento de Produtos',
      status: 'pending',
      message: 'Testando carregamento com retry e timeout...'
    })

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch('/api/products?isActive=true', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data)
          updateTest(1, {
            status: 'success',
            message: `${data.data.length} produtos carregados com sucesso`,
            details: `Status: ${response.status}, Tempo: ${response.headers.get('x-response-time') || 'N/A'}`
          })
        } else {
          updateTest(1, {
            status: 'error',
            message: 'Resposta da API inválida',
            details: `Success: ${data.success}, Data type: ${typeof data.data}`
          })
        }
      } else {
        updateTest(1, {
          status: 'error',
          message: `Erro HTTP ${response.status}`,
          details: response.statusText
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        updateTest(1, {
          status: 'warning',
          message: 'Timeout na requisição (10s)',
          details: 'Conexão muito lenta ou instável'
        })
      } else {
        updateTest(1, {
          status: 'error',
          message: 'Erro na requisição',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    // Teste 3: Cache local
    addTest({
      name: 'Sistema de Cache',
      status: 'pending',
      message: 'Testando cache local...'
    })

    try {
      // Testar escrita no cache
      const testData = [{ id: 1, name: 'Produto Teste', barcode: '123456' }]
      localStorage.setItem('test_cache', JSON.stringify(testData))
      localStorage.setItem('test_cache_timestamp', Date.now().toString())
      
      // Testar leitura do cache
      const cached = localStorage.getItem('test_cache')
      const timestamp = localStorage.getItem('test_cache_timestamp')
      
      if (cached && timestamp) {
        const parsed = JSON.parse(cached)
        const age = Date.now() - parseInt(timestamp)
        
        updateTest(2, {
          status: 'success',
          message: 'Cache funcionando corretamente',
          details: `Dados salvos e recuperados. Idade: ${age}ms`
        })
        
        // Limpar teste
        localStorage.removeItem('test_cache')
        localStorage.removeItem('test_cache_timestamp')
      } else {
        updateTest(2, {
          status: 'error',
          message: 'Falha ao acessar cache',
          details: 'localStorage não disponível ou dados não salvos'
        })
      }
    } catch (error) {
      updateTest(2, {
        status: 'error',
        message: 'Erro no sistema de cache',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // Teste 4: Busca local
    addTest({
      name: 'Busca Local',
      status: 'pending',
      message: 'Testando busca local nos produtos...'
    })

    try {
      if (products.length > 0) {
        const searchTerm = products[0].name.substring(0, 3).toLowerCase()
        const results = products.filter(product => 
          product.name.toLowerCase().includes(searchTerm) ||
          product.barcode?.includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm)
        )
        
        updateTest(3, {
          status: 'success',
          message: `Busca local funcionando: ${results.length} resultados`,
          details: `Termo: "${searchTerm}", Total produtos: ${products.length}`
        })
      } else {
        updateTest(3, {
          status: 'warning',
          message: 'Sem produtos para testar busca',
          details: 'Carregue produtos primeiro'
        })
      }
    } catch (error) {
      updateTest(3, {
        status: 'error',
        message: 'Erro na busca local',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'pending': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'pending': return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Teste de Correções Mobile
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Status: {isOnline ? 'Online' : 'Offline'} | 
              User Agent: {navigator.userAgent.substring(0, 50)}...
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="w-full mb-4"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Executando Testes...
                </>
              ) : (
                'Executar Testes'
              )}
            </Button>
            
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(test.status)}
                    <h3 className="font-medium">{test.name}</h3>
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{test.message}</p>
                  {test.details && (
                    <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                      {test.details}
                    </p>
                  )}
                </div>
              ))}
            </div>
            
            {products.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">
                  Produtos Carregados: {products.length}
                </h4>
                <div className="text-sm text-green-700">
                  Primeiros 3: {products.slice(0, 3).map(p => p.name).join(', ')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Componente principal que carrega o conteúdo dinamicamente sem SSR
const TestMobileFix = dynamic(() => Promise.resolve(TestMobileFixContent), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-600">Carregando testes...</p>
      </div>
    </div>
  )
})

export default TestMobileFix