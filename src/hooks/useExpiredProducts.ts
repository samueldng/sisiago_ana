import { useState, useEffect, useCallback } from 'react'

interface Product {
  id: string
  name: string
  barcode: string
  salePrice: number
  stock: number
  isPerishable: boolean
  expiryDate: string
  categoryId: string
  category: {
    id: string
    name: string
  }
  daysUntilExpiry: number
  status: 'expired' | 'expiring_soon'
}

interface ExpiredProductsData {
  expired: Product[]
  expiringSoon: Product[]
  total: number
}

interface ExpiredProductsSummary {
  totalExpiredProducts: number
  expiredCount: number
  expiringSoonCount: number
  daysAhead: number
  checkDate: string
  limitDate: string
}

interface UseExpiredProductsReturn {
  data: ExpiredProductsData | null
  summary: ExpiredProductsSummary | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useExpiredProducts(daysAhead: number = 7): UseExpiredProductsReturn {
  const [data, setData] = useState<ExpiredProductsData | null>(null)
  const [summary, setSummary] = useState<ExpiredProductsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchExpiredProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Buscando produtos vencidos/próximos ao vencimento...')
      
      const response = await fetch(`/api/products/expired?days=${daysAhead}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
        signal,
        credentials: 'include'
      })

      if (signal?.aborted) return

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar produtos vencidos')
      }

      console.log('📊 Produtos vencidos encontrados:', result.summary)
      
      setData(result.data)
      setSummary(result.summary)
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('🚫 Requisição de produtos vencidos cancelada')
        return
      }
      console.error('❌ Erro ao buscar produtos vencidos:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setData(null)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [daysAhead])

  const refresh = useCallback(async () => {
    await fetchExpiredProducts()
  }, [fetchExpiredProducts])

  useEffect(() => {
    const controller = new AbortController()
    fetchExpiredProducts(controller.signal)
    return () => controller.abort()
  }, [fetchExpiredProducts])

  return {
    data,
    summary,
    loading,
    error,
    refresh
  }
}