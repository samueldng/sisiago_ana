import { useState, useEffect, useCallback } from 'react'
import { getAuditLogs, exportAuditLogs, type PaginatedAuditLogs } from '@/lib/audit'
import { toast } from 'sonner'

export interface AuditLog {
  id: string
  table_name: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  user_id: string
  user_email?: string
  old_data?: any
  new_data?: any
  timestamp: string
  ip_address?: string
  user_agent?: string
  session_id?: string
}

export interface AuditFilters {
  table?: string
  operation?: string
  userId?: string
  startDate?: string
  endDate?: string
  search?: string
  ipAddress?: string
  sessionId?: string
}

export interface UseAuditLogsOptions {
  limit?: number
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseAuditLogsReturn {
  logs: AuditLog[]
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  totalPages: number
  filters: AuditFilters
  setFilters: (filters: AuditFilters) => void
  clearFilters: () => void
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
  refresh: () => void
  exportLogs: (format: 'csv' | 'json') => Promise<void>
  searchLogs: (query: string) => void
}

const DEFAULT_LIMIT = 20
const DEFAULT_REFRESH_INTERVAL = 30000 // 30 seconds

export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsReturn {
  const {
    limit = DEFAULT_LIMIT,
    autoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL
  } = options

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFiltersState] = useState<AuditFilters>({})

  const totalPages = Math.ceil(totalCount / limit)

  const fetchLogs = useCallback(async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true)
      setError(null)
      
      const offset = (page - 1) * limit
      const result: PaginatedAuditLogs = await getAuditLogs({
        limit,
        offset,
        tableName: currentFilters.table,
        operation: currentFilters.operation,
        userId: currentFilters.userId,
        startDate: currentFilters.startDate,
        endDate: currentFilters.endDate,
        search: currentFilters.search,
        ipAddress: currentFilters.ipAddress,
        sessionId: currentFilters.sessionId
      })

      setLogs(result.logs)
      setTotalCount(result.totalCount)
      setCurrentPage(page)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar logs de auditoria'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [limit, filters])

  const setFilters = useCallback((newFilters: AuditFilters) => {
    setFiltersState(newFilters)
    setCurrentPage(1)
    fetchLogs(1, newFilters)
  }, [fetchLogs])

  const clearFilters = useCallback(() => {
    const emptyFilters = {}
    setFiltersState(emptyFilters)
    setCurrentPage(1)
    fetchLogs(1, emptyFilters)
  }, [fetchLogs])

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1
      fetchLogs(newPage)
    }
  }, [currentPage, totalPages, fetchLogs])

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1
      fetchLogs(newPage)
    }
  }, [currentPage, fetchLogs])

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchLogs(page)
    }
  }, [totalPages, fetchLogs])

  const refresh = useCallback(() => {
    fetchLogs(currentPage)
  }, [fetchLogs, currentPage])

  const exportLogs = useCallback(async (format: 'csv' | 'json') => {
    try {
      setLoading(true)
      await exportAuditLogs({
        format,
        tableName: filters.table,
        operation: filters.operation,
        userId: filters.userId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search,
        ipAddress: filters.ipAddress,
        sessionId: filters.sessionId
      })
      toast.success(`Logs exportados em formato ${format.toUpperCase()}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar logs'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const searchLogs = useCallback((query: string) => {
    const newFilters = { ...filters, search: query }
    setFilters(newFilters)
  }, [filters, setFilters])

  // Initial load
  useEffect(() => {
    fetchLogs(1)
  }, [])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchLogs(currentPage)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchLogs, currentPage])

  return {
    logs,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    filters,
    setFilters,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    exportLogs,
    searchLogs
  }
}