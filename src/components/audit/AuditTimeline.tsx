'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { 
  Clock, 
  User, 
  Database, 
  Search, 
  Filter, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditTimelineProps {
  className?: string
  maxItems?: number
  showFilters?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

interface TimelineGroup {
  date: string
  displayDate: string
  logs: any[]
}

const getOperationIcon = (operation: string) => {
  switch (operation.toUpperCase()) {
    case 'INSERT':
      return <Plus className="h-4 w-4 text-green-600" />
    case 'UPDATE':
      return <Edit className="h-4 w-4 text-blue-600" />
    case 'DELETE':
      return <Trash2 className="h-4 w-4 text-red-600" />
    default:
      return <Database className="h-4 w-4 text-gray-600" />
  }
}

const getOperationColor = (operation: string) => {
  switch (operation.toUpperCase()) {
    case 'INSERT':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'UPDATE':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'DELETE':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const formatTimelineDate = (date: Date): string => {
  if (isToday(date)) {
    return 'Hoje'
  }
  if (isYesterday(date)) {
    return 'Ontem'
  }
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}

const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: ptBR 
  })
}

export function AuditTimeline({ 
  className,
  maxItems = 50,
  showFilters = true,
  autoRefresh = true,
  refreshInterval = 30000
}: AuditTimelineProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOperation, setSelectedOperation] = useState<string>('')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Hoje']))
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact')

  const {
    logs,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    clearFilters,
    refresh,
    exportLogs
  } = useAuditLogs({
    limit: maxItems,
    autoRefresh,
    refreshInterval
  })

  // Group logs by date
  const timelineGroups = useMemo(() => {
    if (!logs.length) return []

    const groups: { [key: string]: any[] } = {}
    
    logs.forEach(log => {
      const date = new Date(log.timestamp)
      const dateKey = format(date, 'yyyy-MM-dd')
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(log)
    })

    return Object.entries(groups)
      .map(([dateKey, logs]) => ({
        date: dateKey,
        displayDate: formatTimelineDate(new Date(dateKey)),
        logs: logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [logs])

  // Filter logs based on search and filters
  const filteredGroups = useMemo(() => {
    return timelineGroups.map(group => ({
      ...group,
      logs: group.logs.filter(log => {
        const matchesSearch = !searchTerm || 
          log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.operation?.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesOperation = !selectedOperation || log.operation === selectedOperation
        const matchesTable = !selectedTable || log.table_name === selectedTable
        const matchesUser = !selectedUser || log.user_email === selectedUser
        
        return matchesSearch && matchesOperation && matchesTable && matchesUser
      })
    })).filter(group => group.logs.length > 0)
  }, [timelineGroups, searchTerm, selectedOperation, selectedTable, selectedUser])

  const toggleGroupExpansion = (date: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedGroups(newExpanded)
  }

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const handleApplyFilters = () => {
    setFilters({
      operation: selectedOperation || undefined,
      tableName: selectedTable || undefined,
      userEmail: selectedUser || undefined
    })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setSelectedOperation('')
    setSelectedTable('')
    setSelectedUser('')
    clearFilters()
  }

  const handleExport = async () => {
    try {
      await exportLogs('json')
      toast.success('Timeline exportada com sucesso')
    } catch (error) {
      toast.error('Erro ao exportar timeline')
    }
  }

  const uniqueOperations = [...new Set(logs.map(log => log.operation))].filter(Boolean)
  const uniqueTables = [...new Set(logs.map(log => log.table_name))].filter(Boolean)
  const uniqueUsers = [...new Set(logs.map(log => log.user_email))].filter(Boolean)

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Erro ao carregar timeline: {error}</p>
            <Button onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline de Auditoria
            </CardTitle>
            <CardDescription>
              Visualização cronológica das atividades do sistema
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: 'compact' | 'detailed') => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compacto</SelectItem>
                <SelectItem value="detailed">Detalhado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filtros</span>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                <SelectTrigger>
                  <SelectValue placeholder="Operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as operações</SelectItem>
                  {uniqueOperations.map(op => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Tabela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as tabelas</SelectItem>
                  {uniqueTables.map(table => (
                    <SelectItem key={table} value={table}>{table}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os usuários</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} size="sm">
                Aplicar Filtros
              </Button>
              <Button onClick={handleClearFilters} variant="outline" size="sm">
                Limpar
              </Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando timeline...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma atividade encontrada</p>
              <p className="text-sm text-gray-500 mt-2">
                Tente ajustar os filtros ou verificar se há dados no período selecionado
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredGroups.map((group, groupIndex) => (
                <div key={group.date} className="relative">
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 bg-white border-b pb-2 mb-4">
                    <Button
                      variant="ghost"
                      onClick={() => toggleGroupExpansion(group.displayDate)}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg w-full justify-start"
                    >
                      {expandedGroups.has(group.displayDate) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <Calendar className="h-4 w-4" />
                      <span className="font-semibold">{group.displayDate}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {group.logs.length}
                      </Badge>
                    </Button>
                  </div>

                  {/* Timeline Items */}
                  {expandedGroups.has(group.displayDate) && (
                    <div className="space-y-4 ml-6">
                      {group.logs.map((log, logIndex) => (
                        <div key={log.id} className="relative">
                          {/* Timeline Line */}
                          {logIndex < group.logs.length - 1 && (
                            <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200" />
                          )}
                          
                          {/* Timeline Item */}
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                              {getOperationIcon(log.operation)}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge className={getOperationColor(log.operation)}>
                                      {log.operation}
                                    </Badge>
                                    <span className="font-medium text-sm">
                                      {log.table_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                                    <span>({formatRelativeTime(new Date(log.timestamp))})</span>
                                  </div>
                                </div>
                                
                                {/* User Info */}
                                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                                  <User className="h-3 w-3" />
                                  <span>{log.user_email || 'Sistema'}</span>
                                  {log.user_id && (
                                    <span className="text-xs text-gray-400">ID: {log.user_id}</span>
                                  )}
                                </div>
                                
                                {/* Details */}
                                {viewMode === 'detailed' && (
                                  <div className="space-y-2">
                                    {log.record_id && (
                                      <div className="text-xs text-gray-500">
                                        <span className="font-medium">Registro ID:</span> {log.record_id}
                                      </div>
                                    )}
                                    
                                    {(log.old_values || log.new_values) && (
                                      <div className="mt-3">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleLogExpansion(log.id)}
                                          className="text-xs p-1 h-auto"
                                        >
                                          {expandedLogs.has(log.id) ? (
                                            <ChevronDown className="h-3 w-3 mr-1" />
                                          ) : (
                                            <ChevronRight className="h-3 w-3 mr-1" />
                                          )}
                                          Ver detalhes
                                        </Button>
                                        
                                        {expandedLogs.has(log.id) && (
                                          <div className="mt-2 space-y-2">
                                            {log.old_values && (
                                              <div className="bg-red-50 border border-red-200 rounded p-2">
                                                <div className="text-xs font-medium text-red-800 mb-1">
                                                  Valores Anteriores:
                                                </div>
                                                <pre className="text-xs text-red-700 whitespace-pre-wrap">
                                                  {JSON.stringify(log.old_values, null, 2)}
                                                </pre>
                                              </div>
                                            )}
                                            
                                            {log.new_values && (
                                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                                <div className="text-xs font-medium text-green-800 mb-1">
                                                  Novos Valores:
                                                </div>
                                                <pre className="text-xs text-green-700 whitespace-pre-wrap">
                                                  {JSON.stringify(log.new_values, null, 2)}
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Load More */}
        {pagination.hasMore && (
          <div className="text-center pt-4">
            <Button 
              onClick={() => {/* Implement load more */}} 
              variant="outline"
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Carregar Mais
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}