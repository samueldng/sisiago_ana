'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { 
  Filter, 
  Search, 
  Calendar, 
  User, 
  Database, 
  Activity, 
  MapPin, 
  Clock, 
  X, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Save,
  Bookmark,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { addDays, subDays, startOfDay, endOfDay } from 'date-fns'

export interface AuditFilters {
  searchTerm?: string
  tableName?: string
  operation?: string
  userId?: string
  userEmail?: string
  ipAddress?: string
  dateRange?: DateRange
  timeRange?: {
    start: string
    end: string
  }
  severity?: string[]
  hasChanges?: boolean
  recordId?: string
  sessionId?: string
  userAgent?: string
  location?: string
  tags?: string[]
}

interface AuditFiltersProps {
  filters: AuditFilters
  onFiltersChange: (filters: AuditFilters) => void
  onApplyFilters?: () => void
  onClearFilters?: () => void
  className?: string
  showAdvanced?: boolean
  savedFilters?: SavedFilter[]
  onSaveFilter?: (name: string, filters: AuditFilters) => void
  onLoadFilter?: (filter: SavedFilter) => void
  onDeleteFilter?: (filterId: string) => void
}

interface SavedFilter {
  id: string
  name: string
  filters: AuditFilters
  createdAt: Date
  isDefault?: boolean
}

const OPERATION_OPTIONS = [
  { value: 'CREATE', label: 'Criar', color: 'bg-green-100 text-green-800' },
  { value: 'READ', label: 'Ler', color: 'bg-blue-100 text-blue-800' },
  { value: 'UPDATE', label: 'Atualizar', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'DELETE', label: 'Excluir', color: 'bg-red-100 text-red-800' },
  { value: 'LOGIN', label: 'Login', color: 'bg-purple-100 text-purple-800' },
  { value: 'LOGOUT', label: 'Logout', color: 'bg-gray-100 text-gray-800' },
  { value: 'EXPORT', label: 'Exportar', color: 'bg-orange-100 text-orange-800' },
  { value: 'IMPORT', label: 'Importar', color: 'bg-indigo-100 text-indigo-800' }
]

const TABLE_OPTIONS = [
  'users', 'audit_logs', 'sessions', 'permissions', 'roles',
  'documents', 'files', 'settings', 'notifications', 'reports'
]

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Baixa', color: 'bg-green-100 text-green-800' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Crítica', color: 'bg-red-100 text-red-800' }
]

const QUICK_DATE_RANGES = [
  {
    label: 'Hoje',
    value: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date())
    })
  },
  {
    label: 'Ontem',
    value: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1))
    })
  },
  {
    label: 'Últimos 7 dias',
    value: () => ({
      from: startOfDay(subDays(new Date(), 7)),
      to: endOfDay(new Date())
    })
  },
  {
    label: 'Últimos 30 dias',
    value: () => ({
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date())
    })
  },
  {
    label: 'Este mês',
    value: () => {
      const now = new Date()
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0))
      }
    }
  }
]

export function AuditFilters({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  className,
  showAdvanced = true,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter
}: AuditFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isSavedFiltersOpen, setIsSavedFiltersOpen] = useState(false)
  const [saveFilterName, setSaveFilterName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const updateFilter = (key: keyof AuditFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleClearFilters = () => {
    onFiltersChange({})
    onClearFilters?.()
  }

  const handleSaveFilter = () => {
    if (saveFilterName.trim() && onSaveFilter) {
      onSaveFilter(saveFilterName.trim(), filters)
      setSaveFilterName('')
      setShowSaveDialog(false)
    }
  }

  const handleQuickDateRange = (rangeFunc: () => DateRange) => {
    updateFilter('dateRange', rangeFunc())
  }

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'searchTerm') return value && value.trim() !== ''
      if (key === 'dateRange') return value && (value.from || value.to)
      if (key === 'timeRange') return value && (value.start || value.end)
      if (key === 'severity') return value && value.length > 0
      if (key === 'tags') return value && value.length > 0
      return value !== undefined && value !== '' && value !== null
    }).length
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros de Auditoria
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">
                  {activeFiltersCount} ativo{activeFiltersCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure filtros para refinar a busca nos logs de auditoria
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {onSaveFilter && (
              <Button
                onClick={() => setShowSaveDialog(true)}
                variant="outline"
                size="sm"
                disabled={activeFiltersCount === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            )}
            <Button onClick={handleClearFilters} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            {onApplyFilters && (
              <Button onClick={onApplyFilters} size="sm">
                <Search className="h-4 w-4 mr-2" />
                Aplicar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Filters */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Search Term */}
            <div>
              <Label htmlFor="search-term">Busca Geral</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-term"
                  placeholder="Buscar em todos os campos..."
                  value={filters.searchTerm || ''}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Table Name */}
            <div>
              <Label htmlFor="table-name">Tabela</Label>
              <Select value={filters.tableName || ''} onValueChange={(value) => updateFilter('tableName', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tabela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as tabelas</SelectItem>
                  {TABLE_OPTIONS.map((table) => (
                    <SelectItem key={table} value={table}>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        {table}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Operation */}
            <div>
              <Label htmlFor="operation">Operação</Label>
              <Select value={filters.operation || ''} onValueChange={(value) => updateFilter('operation', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar operação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as operações</SelectItem>
                  {OPERATION_OPTIONS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        <span>{op.label}</span>
                        <Badge className={op.color} variant="secondary">
                          {op.value}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label>Período</Label>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(range) => updateFilter('dateRange', range)}
                className="w-auto"
              />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex flex-wrap gap-1">
                {QUICK_DATE_RANGES.map((range) => (
                  <Button
                    key={range.label}
                    onClick={() => handleQuickDateRange(range.value)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Filtros Avançados
                </span>
                {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* User Email */}
                <div>
                  <Label htmlFor="user-email">Email do Usuário</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="user-email"
                      placeholder="usuario@exemplo.com"
                      value={filters.userEmail || ''}
                      onChange={(e) => updateFilter('userEmail', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* IP Address */}
                <div>
                  <Label htmlFor="ip-address">Endereço IP</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="ip-address"
                      placeholder="192.168.1.1"
                      value={filters.ipAddress || ''}
                      onChange={(e) => updateFilter('ipAddress', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Record ID */}
                <div>
                  <Label htmlFor="record-id">ID do Registro</Label>
                  <Input
                    id="record-id"
                    placeholder="ID específico do registro"
                    value={filters.recordId || ''}
                    onChange={(e) => updateFilter('recordId', e.target.value)}
                  />
                </div>

                {/* Session ID */}
                <div>
                  <Label htmlFor="session-id">ID da Sessão</Label>
                  <Input
                    id="session-id"
                    placeholder="ID da sessão do usuário"
                    value={filters.sessionId || ''}
                    onChange={(e) => updateFilter('sessionId', e.target.value)}
                  />
                </div>

                {/* User Agent */}
                <div>
                  <Label htmlFor="user-agent">User Agent</Label>
                  <Input
                    id="user-agent"
                    placeholder="Navegador/dispositivo"
                    value={filters.userAgent || ''}
                    onChange={(e) => updateFilter('userAgent', e.target.value)}
                  />
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    placeholder="Cidade, País"
                    value={filters.location || ''}
                    onChange={(e) => updateFilter('location', e.target.value)}
                  />
                </div>
              </div>

              {/* Time Range */}
              <div>
                <Label>Horário Específico</Label>
                <div className="grid gap-4 md:grid-cols-2 mt-2">
                  <div>
                    <Label htmlFor="start-time" className="text-sm text-gray-600">Hora Inicial</Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={filters.timeRange?.start || ''}
                      onChange={(e) => updateFilter('timeRange', {
                        ...filters.timeRange,
                        start: e.target.value
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time" className="text-sm text-gray-600">Hora Final</Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={filters.timeRange?.end || ''}
                      onChange={(e) => updateFilter('timeRange', {
                        ...filters.timeRange,
                        end: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Severity */}
              <div>
                <Label>Severidade</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SEVERITY_OPTIONS.map((severity) => {
                    const isSelected = filters.severity?.includes(severity.value) || false
                    return (
                      <div key={severity.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`severity-${severity.value}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const currentSeverity = filters.severity || []
                            if (checked) {
                              updateFilter('severity', [...currentSeverity, severity.value])
                            } else {
                              updateFilter('severity', currentSeverity.filter(s => s !== severity.value))
                            }
                          }}
                        />
                        <Label htmlFor={`severity-${severity.value}`} className="cursor-pointer">
                          <Badge className={severity.color} variant="secondary">
                            {severity.label}
                          </Badge>
                        </Label>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Has Changes */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-changes"
                  checked={filters.hasChanges || false}
                  onCheckedChange={(checked) => updateFilter('hasChanges', checked)}
                />
                <Label htmlFor="has-changes" className="cursor-pointer">
                  Apenas registros com alterações de dados
                </Label>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <Collapsible open={isSavedFiltersOpen} onOpenChange={setIsSavedFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0">
                <span className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  Filtros Salvos ({savedFilters.length})
                </span>
                {isSavedFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-4">
              {savedFilters.map((savedFilter) => (
                <div key={savedFilter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{savedFilter.name}</h4>
                      {savedFilter.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Criado em {savedFilter.createdAt.toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => onLoadFilter?.(savedFilter)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Carregar
                    </Button>
                    <Button
                      onClick={() => onDeleteFilter?.(savedFilter.id)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900 mb-2">
              Filtros Ativos ({activeFiltersCount})
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null
                
                let displayValue = value
                if (key === 'dateRange' && value.from) {
                  displayValue = `${value.from.toLocaleDateString('pt-BR')} - ${value.to?.toLocaleDateString('pt-BR') || 'hoje'}`
                } else if (key === 'timeRange') {
                  displayValue = `${value.start || '00:00'} - ${value.end || '23:59'}`
                } else if (Array.isArray(value)) {
                  displayValue = value.join(', ')
                } else if (typeof value === 'boolean') {
                  displayValue = value ? 'Sim' : 'Não'
                }
                
                return (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {key === 'searchTerm' && 'Busca'}
                    {key === 'tableName' && 'Tabela'}
                    {key === 'operation' && 'Operação'}
                    {key === 'userEmail' && 'Usuário'}
                    {key === 'ipAddress' && 'IP'}
                    {key === 'dateRange' && 'Período'}
                    {key === 'timeRange' && 'Horário'}
                    {key === 'severity' && 'Severidade'}
                    {key === 'hasChanges' && 'Com alterações'}
                    {key === 'recordId' && 'ID Registro'}
                    {key === 'sessionId' && 'ID Sessão'}
                    {key === 'userAgent' && 'User Agent'}
                    {key === 'location' && 'Localização'}
                    : {String(displayValue)}
                    <Button
                      onClick={() => updateFilter(key as keyof AuditFilters, undefined)}
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Salvar Filtro</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="filter-name">Nome do Filtro</Label>
                <Input
                  id="filter-name"
                  placeholder="Ex: Logs de hoje com alta severidade"
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                onClick={() => {
                  setShowSaveDialog(false)
                  setSaveFilterName('')
                }}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveFilter}
                disabled={!saveFilterName.trim()}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}