import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface AuditStats {
  totalLogs: number
  operationStats: {
    INSERT: number
    UPDATE: number
    DELETE: number
  }
  tableStats: Array<{
    table_name: string
    count: number
  }>
  userStats: Array<{
    user_id: string
    user_email: string
    count: number
  }>
  hourlyStats?: Array<{
    hour: string
    count: number
  }>
  dailyStats?: Array<{
    date: string
    count: number
  }>
  riskMetrics?: {
    suspiciousActivities: number
    failedLogins: number
    unusualPatterns: number
    riskScore: number
  }
}

export interface StatsFilters {
  startDate?: string
  endDate?: string
  tableName?: string
  userId?: string
  timeRange?: '1h' | '24h' | '7d' | '30d' | 'custom'
}

export interface UseAuditStatsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  includeHourlyStats?: boolean
  includeDailyStats?: boolean
  includeRiskMetrics?: boolean
}

export interface UseAuditStatsReturn {
  stats: AuditStats | null
  loading: boolean
  error: string | null
  filters: StatsFilters
  setFilters: (filters: StatsFilters) => void
  refresh: () => void
  getTimeRangeStats: (range: '1h' | '24h' | '7d' | '30d') => void
  compareWithPrevious: () => Promise<{ current: AuditStats; previous: AuditStats } | null>
}

const DEFAULT_REFRESH_INTERVAL = 60000 // 1 minute

export function useAuditStats(options: UseAuditStatsOptions = {}): UseAuditStatsReturn {
  const {
    autoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    includeHourlyStats = false,
    includeDailyStats = false,
    includeRiskMetrics = false
  } = options

  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<StatsFilters>({
    timeRange: '24h'
  })

  const calculateTimeRange = useCallback((range: '1h' | '24h' | '7d' | '30d') => {
    const now = new Date()
    const start = new Date()
    
    switch (range) {
      case '1h':
        start.setHours(now.getHours() - 1)
        break
      case '24h':
        start.setDate(now.getDate() - 1)
        break
      case '7d':
        start.setDate(now.getDate() - 7)
        break
      case '30d':
        start.setDate(now.getDate() - 30)
        break
    }
    
    return {
      startDate: start.toISOString(),
      endDate: now.toISOString()
    }
  }, [])

  const fetchStats = useCallback(async (currentFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      
      let dateRange = {}
      if (currentFilters.timeRange && currentFilters.timeRange !== 'custom') {
        dateRange = calculateTimeRange(currentFilters.timeRange)
      } else if (currentFilters.startDate && currentFilters.endDate) {
        dateRange = {
          startDate: currentFilters.startDate,
          endDate: currentFilters.endDate
        }
      }

      // Buscar todas as estatísticas da API (incluindo horárias, diárias e métricas de risco)
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('start_date', dateRange.startDate)
      if (dateRange.endDate) params.append('end_date', dateRange.endDate)
      if (currentFilters.tableName) params.append('table_name', currentFilters.tableName)
      if (currentFilters.userId) params.append('user_id', currentFilters.userId)

      const response = await fetch(`/api/audit-logs/stats?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Falha ao buscar estatísticas')
      }
      
      const allStats = await response.json()
      setStats(allStats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas de auditoria'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters, calculateTimeRange, includeHourlyStats, includeDailyStats, includeRiskMetrics])

  // As estatísticas horárias, diárias e métricas de risco agora vêm diretamente da API
  // através da função getAuditStats atualizada no backend

  const setFilters = useCallback((newFilters: StatsFilters) => {
    setFiltersState(newFilters)
    fetchStats(newFilters)
  }, [fetchStats])

  const refresh = useCallback(() => {
    fetchStats()
  }, [fetchStats])

  const getTimeRangeStats = useCallback((range: '1h' | '24h' | '7d' | '30d') => {
    const newFilters = { ...filters, timeRange: range }
    setFilters(newFilters)
  }, [filters, setFilters])

  const compareWithPrevious = useCallback(async () => {
    if (!stats) return null
    
    try {
      setLoading(true)
      
      // Calculate previous period dates
      const timeRange = filters.timeRange === 'custom' ? '24h' : (filters.timeRange || '24h')
      const currentStart = new Date(filters.startDate || calculateTimeRange(timeRange).startDate)
      const currentEnd = new Date(filters.endDate || calculateTimeRange(timeRange).endDate)
      const duration = currentEnd.getTime() - currentStart.getTime()
      
      const previousStart = new Date(currentStart.getTime() - duration)
      const previousEnd = new Date(currentStart.getTime())
      
      // Fazer chamada para a API route para estatísticas anteriores
      const params = new URLSearchParams()
      params.append('start_date', previousStart.toISOString())
      params.append('end_date', previousEnd.toISOString())
      if (filters.tableName) params.append('table_name', filters.tableName)
      if (filters.userId) params.append('user_id', filters.userId)

      const response = await fetch(`/api/audit-logs/stats?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`Erro ao buscar estatísticas anteriores: ${response.statusText}`)
      }
      const previousStats = await response.json()
      
      return {
        current: stats,
        previous: previousStats
      }
    } catch (err) {
      toast.error('Erro ao comparar com período anterior')
      return null
    } finally {
      setLoading(false)
    }
  }, [stats, filters, calculateTimeRange])

  // Initial load
  useEffect(() => {
    fetchStats()
  }, [])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchStats()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchStats])

  return {
    stats,
    loading,
    error,
    filters,
    setFilters,
    refresh,
    getTimeRangeStats,
    compareWithPrevious
  }
}