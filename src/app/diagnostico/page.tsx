'use client'

import { useState, useEffect } from 'react'
import { supabase, db } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

interface TestResult {
  name: string
  status: 'success' | 'error' | 'warning' | 'loading'
  message: string
  details?: any
  duration?: number
}

export default function DiagnosticoPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addTest = (test: TestResult) => {
    setTests(prev => {
      const existing = prev.findIndex(t => t.name === test.name)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = test
        return updated
      }
      return [...prev, test]
    })
  }

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    const startTime = Date.now()
    addTest({ name, status: 'loading', message: 'Executando...' })
    
    try {
      const result = await testFn()
      const duration = Date.now() - startTime
      addTest({
        name,
        status: 'success',
        message: `Sucesso (${duration}ms)`,
        details: result,
        duration
      })
    } catch (error: any) {
      const duration = Date.now() - startTime
      addTest({
        name,
        status: 'error',
        message: error.message || 'Erro desconhecido',
        details: error,
        duration
      })
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setTests([])

    // Teste 1: Configuração das variáveis de ambiente
    await runTest('Variáveis de Ambiente', async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!url || !key) {
        throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas')
      }
      
      return { url: url.substring(0, 30) + '...', keyLength: key.length }
    })

    // Teste 2: Conexão básica com Supabase
    await runTest('Conexão Supabase', async () => {
      const { data, error } = await supabase.from('categories').select('count').limit(1)
      if (error) throw error
      return data
    })

    // Teste 3: Consulta de categorias
    await runTest('Consulta Categorias', async () => {
      const { data, error } = await db.categories.findMany()
      if (error) throw error
      return { count: data?.length || 0, categories: data?.slice(0, 3) }
    })

    // Teste 4: Consulta de produtos
    await runTest('Consulta Produtos', async () => {
      const { data, error } = await db.products.findMany()
      if (error) throw error
      return { count: data?.length || 0, products: data?.slice(0, 3) }
    })

    // Teste 5: Teste de inserção (rollback)
    await runTest('Teste de Escrita', async () => {
      const testCategory = {
        name: `test-${Date.now()}`,
        description: 'Categoria de teste - será removida'
      }
      
      const { data: created, error: createError } = await db.categories.create(testCategory)
      if (createError) throw createError
      
      // Remove a categoria de teste
      const { error: deleteError } = await db.categories.delete(created.id)
      if (deleteError) throw deleteError
      
      return { created: created.id, deleted: true }
    })

    // Teste 6: Performance de consulta
    await runTest('Performance de Consulta', async () => {
      const start = Date.now()
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sale_price')
        .limit(10)
      
      if (error) throw error
      const duration = Date.now() - start
      
      if (duration > 2000) {
        throw new Error(`Consulta muito lenta: ${duration}ms`)
      }
      
      return { duration, count: data?.length }
    })

    setIsRunning(false)
  }

  useEffect(() => {
    runAllTests()
  }, [])

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'loading':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      loading: 'outline'
    } as const
    
    return (
      <Badge variant={variants[status]}>
        {status === 'loading' ? 'Executando' : status}
      </Badge>
    )
  }

  const successCount = tests.filter(t => t.status === 'success').length
  const errorCount = tests.filter(t => t.status === 'error').length
  const totalTests = tests.length

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Diagnóstico do Sistema</h1>
        <p className="text-muted-foreground">
          Verificação da conectividade e funcionalidade do banco de dados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-muted-foreground">Testes Aprovados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-muted-foreground">Testes com Erro</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalTests}</div>
            <div className="text-sm text-muted-foreground">Total de Testes</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Executando Testes...' : 'Executar Testes'}
        </Button>
      </div>

      <div className="space-y-4">
        {tests.map((test, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <CardTitle className="text-lg">{test.name}</CardTitle>
                </div>
                {getStatusBadge(test.status)}
              </div>
              <CardDescription>{test.message}</CardDescription>
            </CardHeader>
            {test.details && (
              <CardContent className="pt-0">
                <details className="cursor-pointer">
                  <summary className="text-sm font-medium mb-2">Detalhes</summary>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(test.details, null, 2)}
                  </pre>
                </details>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {tests.length === 0 && !isRunning && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum teste executado ainda.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}