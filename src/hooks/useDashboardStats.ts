import { useState, useEffect, useCallback } from 'react'

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

const initialStats: DashboardStats = {
  todaySales: 0,
  todayRevenue: 0,
  totalProducts: 0,
  lowStockProducts: 0,
  weekSales: 0,
  weekRevenue: 0,
  topProducts: [],
  lastUpdate: new Date().toISOString()
}

// Event emitter para comunicação entre componentes
class DashboardStatsEmitter {
  private listeners: Array<() => void> = []

  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  emit() {
    this.listeners.forEach(listener => listener())
  }
}

const dashboardStatsEmitter = new DashboardStatsEmitter()

// Função para disparar atualização das estatísticas
export const triggerDashboardUpdate = () => {
  console.log('🔄 Disparando atualização do dashboard...')
  dashboardStatsEmitter.emit()
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboardStats = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Fazendo requisição para /api/dashboard/stats...')
      const response = await fetch('/api/dashboard/stats', {
        signal,
        credentials: 'include'
      })
      
      if (signal?.aborted) return
      
      if (response.ok) {
        const data = await response.json()
        console.log('📡 Dados recebidos da API dashboard/stats:', data)
        setStats(data)
        console.log('📊 Estatísticas do dashboard atualizadas:', {
          vendas: data.todaySales,
          receita: data.todayRevenue,
          dadosCompletos: data
        })
      } else {
        throw new Error(`Erro HTTP: ${response.status}`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🚫 Requisição cancelada')
        return
      }
      console.error('❌ Erro ao carregar estatísticas:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      // Manter dados anteriores em caso de erro
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    const controller = new AbortController()
    loadDashboardStats(controller.signal)
    return () => controller.abort()
  }, [loadDashboardStats])

  // Configurar atualização automática a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadDashboardStats])

  // Escutar eventos de atualização manual
  useEffect(() => {
    const unsubscribe = dashboardStatsEmitter.subscribe(() => {
      loadDashboardStats()
    })

    return unsubscribe
  }, [loadDashboardStats])

  return {
    stats,
    loading,
    error,
    refresh: loadDashboardStats
  }
}