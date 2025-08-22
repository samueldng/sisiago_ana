'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils'
import { useDashboardStats } from '@/hooks/useDashboardStats'

interface DashboardStats {
  todaySales: number
  todayRevenue: number
  totalProducts: number
  lowStockProducts: number
  weekSales: number
  weekRevenue: number
  topProducts: Array<{
    product: {
      id: string
      name: string
      price: number
    } | null
    quantity: number
  }>
  lastUpdate: string
}

export default function TestDashboardPage() {
  const { stats, loading, error, refresh } = useDashboardStats()
  const [manualStats, setManualStats] = useState<DashboardStats | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string>('')

  // Log detalhado dos dados
  useEffect(() => {
    console.log('🧪 TEST DASHBOARD - Dados recebidos:', {
      stats,
      loading,
      error,
      timestamp: new Date().toISOString()
    })
  }, [stats, loading, error])

  // Função para buscar dados manualmente
  const fetchManualStats = async () => {
    try {
      console.log('🔄 Buscando dados manualmente...')
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        console.log('📡 Dados manuais recebidos:', data)
        setManualStats(data)
        setLastRefresh(new Date().toISOString())
      } else {
        console.error('❌ Erro na resposta:', response.status)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste do Dashboard</h1>
        
        {/* Controles */}
        <div className="mb-8 space-x-4">
          <Button onClick={refresh}>Atualizar Hook</Button>
          <Button onClick={fetchManualStats} variant="outline">Buscar Manual</Button>
        </div>

        {/* Status */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Status do Hook</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Loading:</strong> {loading ? 'Sim' : 'Não'}</p>
              <p><strong>Error:</strong> {error || 'Nenhum'}</p>
              <p><strong>Última atualização manual:</strong> {lastRefresh || 'Nunca'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Dados do Hook */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Dados do Hook useDashboardStats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todaySales}</p>
                <p className="text-xs text-gray-500">Hook</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600">Faturamento Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-xs text-gray-500">Hook</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600">Total Produtos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                <p className="text-xs text-gray-500">Hook</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
                <p className="text-xs text-gray-500">Hook</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dados Manuais */}
        {manualStats && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Dados da API (Manual)</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
                  <p className="text-2xl font-bold text-green-600">{manualStats.todaySales}</p>
                  <p className="text-xs text-gray-500">Manual</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Faturamento Hoje</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(manualStats.todayRevenue)}</p>
                  <p className="text-xs text-gray-500">Manual</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Total Produtos</p>
                  <p className="text-2xl font-bold text-green-600">{manualStats.totalProducts}</p>
                  <p className="text-xs text-gray-500">Manual</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-gray-600">Estoque Baixo</p>
                  <p className="text-2xl font-bold text-green-600">{manualStats.lowStockProducts}</p>
                  <p className="text-xs text-gray-500">Manual</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Debug Raw Data */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Debug - Dados Brutos</h2>
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold mb-2">Hook Stats:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(stats, null, 2)}
              </pre>
              
              {manualStats && (
                <>
                  <h3 className="font-bold mb-2 mt-4">Manual Stats:</h3>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(manualStats, null, 2)}
                  </pre>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}