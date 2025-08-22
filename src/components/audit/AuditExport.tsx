'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Download, 
  FileText, 
  Table, 
  FileSpreadsheet, 
  FileJson, 
 
  Mail, 
  Calendar, 
  Settings, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Play, 
  Pause, 
  RotateCcw,
  Save,
  Share,
  Archive,
  Database,
  Cloud,
  HardDrive
} from 'lucide-react'
import { toast } from 'sonner'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AuditFilters } from './AuditFilters'
import { exportAuditLogs } from '@/lib/audit'

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'pdf'
  includeMetadata: boolean
  includeChanges: boolean
  includeUserInfo: boolean
  includeSystemInfo: boolean
  dateFormat: 'iso' | 'local' | 'timestamp'
  compression: boolean
  password?: string
  customFields?: string[]
  groupBy?: string
  sortBy?: string
  sortOrder: 'asc' | 'desc'
  maxRecords?: number
  splitFiles?: boolean
  splitSize?: number
}

export interface ScheduledExport {
  id: string
  name: string
  filters: AuditFilters
  options: ExportOptions
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  destination: {
    type: 'email' | 'ftp' | 'cloud' | 'local'
    config: any
  }
  enabled: boolean
  lastRun?: Date
  nextRun?: Date
  createdAt: Date
}

interface AuditExportProps {
  filters?: AuditFilters
  onExport?: (options: ExportOptions) => Promise<void>
  className?: string
  showScheduled?: boolean
  scheduledExports?: ScheduledExport[]
  onCreateScheduled?: (exportData: Omit<ScheduledExport, 'id' | 'createdAt'>) => void
  onUpdateScheduled?: (id: string, exportData: Partial<ScheduledExport>) => void
  onDeleteScheduled?: (id: string) => void
}

const FORMAT_OPTIONS = [
  {
    value: 'csv',
    label: 'CSV',
    description: 'Arquivo de valores separados por vírgula',
    icon: FileText,
    color: 'text-green-600'
  },
  {
    value: 'json',
    label: 'JSON',
    description: 'Formato JavaScript Object Notation',
    icon: FileJson,
    color: 'text-blue-600'
  },
  {
    value: 'xlsx',
    label: 'Excel',
    description: 'Planilha do Microsoft Excel',
    icon: FileSpreadsheet,
    color: 'text-green-700'
  },
  {
    value: 'pdf',
    label: 'PDF',
    description: 'Documento PDF formatado',
    icon: FileText,
    color: 'text-red-600'
  }
]

const FIELD_OPTIONS = [
  { value: 'id', label: 'ID do Log', category: 'basic' },
  { value: 'timestamp', label: 'Data/Hora', category: 'basic' },
  { value: 'operation', label: 'Operação', category: 'basic' },
  { value: 'table_name', label: 'Tabela', category: 'basic' },
  { value: 'record_id', label: 'ID do Registro', category: 'basic' },
  { value: 'user_id', label: 'ID do Usuário', category: 'user' },
  { value: 'user_email', label: 'Email do Usuário', category: 'user' },
  { value: 'ip_address', label: 'Endereço IP', category: 'system' },
  { value: 'user_agent', label: 'User Agent', category: 'system' },
  { value: 'session_id', label: 'ID da Sessão', category: 'system' },
  { value: 'old_data', label: 'Dados Antigos', category: 'changes' },
  { value: 'new_data', label: 'Dados Novos', category: 'changes' },
  { value: 'changes', label: 'Alterações', category: 'changes' },
  { value: 'metadata', label: 'Metadados', category: 'metadata' }
]

const DESTINATION_OPTIONS = [
  {
    value: 'local',
    label: 'Download Local',
    description: 'Baixar arquivo diretamente',
    icon: HardDrive
  },
  {
    value: 'email',
    label: 'Email',
    description: 'Enviar por email',
    icon: Mail
  },
  {
    value: 'cloud',
    label: 'Nuvem',
    description: 'Salvar na nuvem',
    icon: Cloud
  }
]

export function AuditExport({
  filters = {},
  onExport,
  className,
  showScheduled = true,
  scheduledExports = [],
  onCreateScheduled,
  onUpdateScheduled,
  onDeleteScheduled
}: AuditExportProps) {
  const [activeTab, setActiveTab] = useState('export')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeMetadata: true,
    includeChanges: true,
    includeUserInfo: true,
    includeSystemInfo: false,
    dateFormat: 'local',
    compression: false,
    sortBy: 'timestamp',
    sortOrder: 'desc',
    splitFiles: false
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [estimatedSize, setEstimatedSize] = useState<string>('')
  const [estimatedRecords, setEstimatedRecords] = useState<number>(0)
  
  // Scheduled Export State
  const [newScheduledExport, setNewScheduledExport] = useState<Partial<ScheduledExport>>({
    name: '',
    filters: {},
    options: exportOptions,
    schedule: {
      frequency: 'daily',
      time: '09:00'
    },
    destination: {
      type: 'email',
      config: {}
    },
    enabled: true
  })
  const [showScheduleDialog, setShowScheduleDialog] = useState(false)

  const updateExportOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleExport = async () => {
    if (!onExport) {
      // Fallback to default export function
      try {
        setIsExporting(true)
        setExportProgress(0)
        
        // Simulate progress
        const progressInterval = setInterval(() => {
          setExportProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)
        
        await exportAuditLogs(filters, exportOptions.format)
        
        clearInterval(progressInterval)
        setExportProgress(100)
        
        setTimeout(() => {
          setIsExporting(false)
          setExportProgress(0)
          toast.success('Exportação concluída com sucesso!')
        }, 500)
      } catch (error) {
        setIsExporting(false)
        setExportProgress(0)
        toast.error('Erro na exportação: ' + (error as Error).message)
      }
    } else {
      try {
        setIsExporting(true)
        await onExport(exportOptions)
        toast.success('Exportação concluída!')
      } catch (error) {
        toast.error('Erro na exportação: ' + (error as Error).message)
      } finally {
        setIsExporting(false)
      }
    }
  }

  const handlePreview = async () => {
    try {
      setShowPreview(true)
      // Simulate preview data
      setPreviewData([
        {
          id: '1',
          timestamp: new Date().toISOString(),
          operation: 'CREATE',
          table_name: 'users',
          user_email: 'admin@exemplo.com'
        },
        {
          id: '2',
          timestamp: new Date().toISOString(),
          operation: 'UPDATE',
          table_name: 'documents',
          user_email: 'user@exemplo.com'
        }
      ])
      setEstimatedRecords(1250)
      setEstimatedSize('2.3 MB')
    } catch (error) {
      toast.error('Erro ao gerar preview')
    }
  }

  const handleCreateScheduled = () => {
    if (onCreateScheduled && newScheduledExport.name) {
      onCreateScheduled({
        ...newScheduledExport,
        filters,
        options: exportOptions
      } as Omit<ScheduledExport, 'id' | 'createdAt'>)
      setShowScheduleDialog(false)
      setNewScheduledExport({
        name: '',
        filters: {},
        options: exportOptions,
        schedule: {
          frequency: 'daily',
          time: '09:00'
        },
        destination: {
          type: 'email',
          config: {}
        },
        enabled: true
      })
      toast.success('Exportação agendada criada!')
    }
  }

  const getSelectedFields = () => {
    const fields = []
    if (exportOptions.includeMetadata) fields.push(...FIELD_OPTIONS.filter(f => f.category === 'basic' || f.category === 'metadata'))
    if (exportOptions.includeUserInfo) fields.push(...FIELD_OPTIONS.filter(f => f.category === 'user'))
    if (exportOptions.includeSystemInfo) fields.push(...FIELD_OPTIONS.filter(f => f.category === 'system'))
    if (exportOptions.includeChanges) fields.push(...FIELD_OPTIONS.filter(f => f.category === 'changes'))
    if (exportOptions.customFields) fields.push(...FIELD_OPTIONS.filter(f => exportOptions.customFields?.includes(f.value)))
    return [...new Set(fields)]
  }

  const selectedFormat = FORMAT_OPTIONS.find(f => f.value === exportOptions.format)
  const FormatIcon = selectedFormat?.icon || FileText

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exportação de Auditoria
            </CardTitle>
            <CardDescription>
              Configure e exporte dados de auditoria em diversos formatos
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handlePreview} variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              size="sm"
            >
              {isExporting ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
          </div>
        </div>
        
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso da exportação</span>
              <span>{exportProgress}%</span>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Exportação Imediata</TabsTrigger>
            {showScheduled && (
              <TabsTrigger value="scheduled">Exportações Agendadas</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="export" className="space-y-6">
            {/* Format Selection */}
            <div>
              <Label className="text-base font-semibold">Formato de Exportação</Label>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mt-3">
                {FORMAT_OPTIONS.map((format) => {
                  const Icon = format.icon
                  const isSelected = exportOptions.format === format.value
                  return (
                    <Card 
                      key={format.value}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => updateExportOption('format', format.value)}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className={`h-8 w-8 mx-auto mb-2 ${format.color}`} />
                        <h4 className="font-semibold text-sm">{format.label}</h4>
                        <p className="text-xs text-gray-600 mt-1">{format.description}</p>
                        {isSelected && (
                          <CheckCircle className="h-4 w-4 text-blue-500 mx-auto mt-2" />
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Content Options */}
            <div>
              <Label className="text-base font-semibold">Conteúdo da Exportação</Label>
              <div className="grid gap-4 md:grid-cols-2 mt-3">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-metadata"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => updateExportOption('includeMetadata', checked)}
                    />
                    <Label htmlFor="include-metadata" className="cursor-pointer">
                      Incluir metadados básicos
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-changes"
                      checked={exportOptions.includeChanges}
                      onCheckedChange={(checked) => updateExportOption('includeChanges', checked)}
                    />
                    <Label htmlFor="include-changes" className="cursor-pointer">
                      Incluir dados de alterações
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-user-info"
                      checked={exportOptions.includeUserInfo}
                      onCheckedChange={(checked) => updateExportOption('includeUserInfo', checked)}
                    />
                    <Label htmlFor="include-user-info" className="cursor-pointer">
                      Incluir informações do usuário
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-system-info"
                      checked={exportOptions.includeSystemInfo}
                      onCheckedChange={(checked) => updateExportOption('includeSystemInfo', checked)}
                    />
                    <Label htmlFor="include-system-info" className="cursor-pointer">
                      Incluir informações do sistema
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Advanced Options */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label className="text-base font-semibold">Opções Avançadas</Label>
                <div className="space-y-4 mt-3">
                  <div>
                    <Label htmlFor="date-format">Formato de Data</Label>
                    <Select 
                      value={exportOptions.dateFormat} 
                      onValueChange={(value: any) => updateExportOption('dateFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local (DD/MM/AAAA HH:mm)</SelectItem>
                        <SelectItem value="iso">ISO 8601 (AAAA-MM-DDTHH:mm:ssZ)</SelectItem>
                        <SelectItem value="timestamp">Timestamp Unix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="sort-by">Ordenar por</Label>
                    <Select 
                      value={exportOptions.sortBy} 
                      onValueChange={(value) => updateExportOption('sortBy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="timestamp">Data/Hora</SelectItem>
                        <SelectItem value="operation">Operação</SelectItem>
                        <SelectItem value="table_name">Tabela</SelectItem>
                        <SelectItem value="user_email">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="sort-order">Ordem</Label>
                    <Select 
                      value={exportOptions.sortOrder} 
                      onValueChange={(value: any) => updateExportOption('sortOrder', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Decrescente</SelectItem>
                        <SelectItem value="asc">Crescente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-base font-semibold">Limitações</Label>
                <div className="space-y-4 mt-3">
                  <div>
                    <Label htmlFor="max-records">Máximo de registros</Label>
                    <Input
                      id="max-records"
                      type="number"
                      placeholder="Sem limite"
                      value={exportOptions.maxRecords || ''}
                      onChange={(e) => updateExportOption('maxRecords', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="compression"
                      checked={exportOptions.compression}
                      onCheckedChange={(checked) => updateExportOption('compression', checked)}
                    />
                    <Label htmlFor="compression" className="cursor-pointer">
                      Compressão ZIP
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="split-files"
                      checked={exportOptions.splitFiles}
                      onCheckedChange={(checked) => updateExportOption('splitFiles', checked)}
                    />
                    <Label htmlFor="split-files" className="cursor-pointer">
                      Dividir arquivos grandes
                    </Label>
                  </div>
                  
                  {exportOptions.splitFiles && (
                    <div>
                      <Label htmlFor="split-size">Tamanho máximo (MB)</Label>
                      <Input
                        id="split-size"
                        type="number"
                        value={exportOptions.splitSize || 10}
                        onChange={(e) => updateExportOption('splitSize', parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Security */}
            {(exportOptions.format === 'xlsx' || exportOptions.format === 'pdf') && (
              <div>
                <Label className="text-base font-semibold">Segurança</Label>
                <div className="mt-3">
                  <Label htmlFor="password">Senha de proteção (opcional)</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Digite uma senha para proteger o arquivo"
                    value={exportOptions.password || ''}
                    onChange={(e) => updateExportOption('password', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Resumo da Exportação</h4>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Formato:</span>
                  <Badge variant="outline">
                    <FormatIcon className="h-3 w-3 mr-1" />
                    {selectedFormat?.label}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Campos selecionados:</span>
                  <span>{getSelectedFields().length} campos</span>
                </div>
                {estimatedRecords > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span>Registros estimados:</span>
                      <span>{estimatedRecords.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tamanho estimado:</span>
                      <span>{estimatedSize}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {showScheduled && (
            <TabsContent value="scheduled" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Exportações Agendadas</h3>
                  <p className="text-sm text-gray-600">
                    Configure exportações automáticas recorrentes
                  </p>
                </div>
                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Calendar className="h-4 w-4 mr-2" />
                      Nova Exportação Agendada
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Agendar Exportação</DialogTitle>
                      <DialogDescription>
                        Configure uma exportação automática recorrente
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="schedule-name">Nome da Exportação</Label>
                        <Input
                          id="schedule-name"
                          value={newScheduledExport.name || ''}
                          onChange={(e) => setNewScheduledExport(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ex: Relatório Diário de Auditoria"
                        />
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="frequency">Frequência</Label>
                          <Select 
                            value={newScheduledExport.schedule?.frequency} 
                            onValueChange={(value: any) => setNewScheduledExport(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule!, frequency: value }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Diário</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="time">Horário</Label>
                          <Input
                            id="time"
                            type="time"
                            value={newScheduledExport.schedule?.time || '09:00'}
                            onChange={(e) => setNewScheduledExport(prev => ({
                              ...prev,
                              schedule: { ...prev.schedule!, time: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="destination">Destino</Label>
                        <Select 
                          value={newScheduledExport.destination?.type} 
                          onValueChange={(value: any) => setNewScheduledExport(prev => ({
                            ...prev,
                            destination: { ...prev.destination!, type: value }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DESTINATION_OPTIONS.map((dest) => {
                              const Icon = dest.icon
                              return (
                                <SelectItem key={dest.value} value={dest.value}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <div>
                                      <div>{dest.label}</div>
                                      <div className="text-xs text-gray-500">{dest.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {newScheduledExport.destination?.type === 'email' && (
                        <div>
                          <Label htmlFor="email">Email de Destino</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="admin@exemplo.com"
                            value={newScheduledExport.destination?.config?.email || ''}
                            onChange={(e) => setNewScheduledExport(prev => ({
                              ...prev,
                              destination: {
                                ...prev.destination!,
                                config: { ...prev.destination?.config, email: e.target.value }
                              }
                            }))}
                          />
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateScheduled}>
                        Criar Agendamento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {scheduledExports.map((scheduledExport) => (
                  <Card key={scheduledExport.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{scheduledExport.name}</h4>
                            <Badge variant={scheduledExport.enabled ? 'default' : 'secondary'}>
                              {scheduledExport.enabled ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Frequência: {scheduledExport.schedule.frequency} às {scheduledExport.schedule.time}</div>
                            <div>Formato: {scheduledExport.options.format.toUpperCase()}</div>
                            <div>Destino: {scheduledExport.destination.type}</div>
                            {scheduledExport.lastRun && (
                              <div>Última execução: {format(scheduledExport.lastRun, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                            )}
                            {scheduledExport.nextRun && (
                              <div>Próxima execução: {format(scheduledExport.nextRun, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => onUpdateScheduled?.(scheduledExport.id, { enabled: !scheduledExport.enabled })}
                            size="sm"
                            variant="outline"
                          >
                            {scheduledExport.enabled ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            onClick={() => onDeleteScheduled?.(scheduledExport.id)}
                            size="sm"
                            variant="outline"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {scheduledExports.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma exportação agendada</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Crie exportações automáticas para receber relatórios regulares
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* Preview Dialog */}
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Preview da Exportação</DialogTitle>
              <DialogDescription>
                Visualização dos dados que serão exportados
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{estimatedRecords.toLocaleString('pt-BR')}</div>
                  <div className="text-sm text-blue-600">Registros</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{getSelectedFields().length}</div>
                  <div className="text-sm text-green-600">Campos</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">{estimatedSize}</div>
                  <div className="text-sm text-orange-600">Tamanho</div>
                </div>
              </div>
              
              <ScrollArea className="h-64 border rounded">
                <div className="p-4">
                  <h4 className="font-semibold mb-2">Amostra dos Dados</h4>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </div>
              </ScrollArea>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                setShowPreview(false)
                handleExport()
              }}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Agora
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}