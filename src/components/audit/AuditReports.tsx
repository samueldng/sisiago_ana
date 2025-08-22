'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Calendar, 
  Clock, 
  Mail, 
  Download, 
  Settings, 
  Play, 
  Pause, 
  RefreshCw,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Shield,
  Activity,
  Database
} from 'lucide-react'
import { toast } from 'sonner'

interface AuditReport {
  id: string
  name: string
  description: string
  type: 'security' | 'compliance' | 'activity' | 'performance' | 'custom'
  format: 'pdf' | 'excel' | 'csv' | 'json'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand'
  schedule: {
    time: string // HH:MM format
    day_of_week?: number // 0-6 for weekly
    day_of_month?: number // 1-31 for monthly
    timezone: string
  }
  filters: {
    date_range: {
      start: string
      end: string
      relative?: string // 'last_7_days', 'last_30_days', etc.
    }
    users?: string[]
    tables?: string[]
    operations?: string[]
    severity?: string[]
    risk_threshold?: number
  }
  recipients: {
    emails: string[]
    notification_settings: {
      on_success: boolean
      on_failure: boolean
      on_anomaly: boolean
    }
  }
  template: {
    sections: string[]
    include_charts: boolean
    include_raw_data: boolean
    custom_fields?: Record<string, any>
  }
  status: 'active' | 'paused' | 'draft'
  created_at: string
  updated_at: string
  last_run?: string
  next_run?: string
  run_count: number
  success_rate: number
}

interface ReportExecution {
  id: string
  report_id: string
  report_name: string
  started_at: string
  completed_at?: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  file_size?: number
  file_path?: string
  error_message?: string
  execution_time?: number
  records_processed: number
  anomalies_detected: number
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: string
  sections: string[]
  default_filters: any
  preview_available: boolean
}

const AuditReports: React.FC = () => {
  const [reports, setReports] = useState<AuditReport[]>([])
  const [executions, setExecutions] = useState<ReportExecution[]>([])
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('reports')
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all'
  })

  // Mock data generators
  const generateMockTemplates = (): ReportTemplate[] => [
    {
      id: 'template_1',
      name: 'Relatório de Segurança',
      description: 'Análise completa de eventos de segurança e tentativas de acesso',
      type: 'security',
      sections: ['executive_summary', 'security_events', 'failed_logins', 'privilege_escalations', 'recommendations'],
      default_filters: { severity: ['high', 'critical'], risk_threshold: 70 },
      preview_available: true
    },
    {
      id: 'template_2',
      name: 'Relatório de Compliance',
      description: 'Conformidade com regulamentações e políticas internas',
      type: 'compliance',
      sections: ['compliance_overview', 'policy_violations', 'access_reviews', 'data_retention', 'audit_trail'],
      default_filters: { operations: ['CREATE', 'UPDATE', 'DELETE'] },
      preview_available: true
    },
    {
      id: 'template_3',
      name: 'Relatório de Atividade',
      description: 'Análise de atividades dos usuários e uso do sistema',
      type: 'activity',
      sections: ['user_activity', 'system_usage', 'peak_hours', 'geographic_distribution', 'trends'],
      default_filters: { date_range: { relative: 'last_30_days' } },
      preview_available: true
    },
    {
      id: 'template_4',
      name: 'Relatório de Performance',
      description: 'Métricas de performance e otimização do sistema',
      type: 'performance',
      sections: ['performance_metrics', 'slow_queries', 'error_rates', 'resource_usage', 'optimization_tips'],
      default_filters: {},
      preview_available: false
    }
  ]

  const generateMockReports = (): AuditReport[] => [
    {
      id: 'report_1',
      name: 'Relatório Semanal de Segurança',
      description: 'Análise semanal de eventos de segurança e anomalias detectadas',
      type: 'security',
      format: 'pdf',
      frequency: 'weekly',
      schedule: {
        time: '08:00',
        day_of_week: 1, // Monday
        timezone: 'America/Sao_Paulo'
      },
      filters: {
        date_range: {
          start: '',
          end: '',
          relative: 'last_7_days'
        },
        severity: ['high', 'critical'],
        risk_threshold: 70
      },
      recipients: {
        emails: ['admin@sisiago.com', 'security@sisiago.com'],
        notification_settings: {
          on_success: true,
          on_failure: true,
          on_anomaly: true
        }
      },
      template: {
        sections: ['executive_summary', 'security_events', 'recommendations'],
        include_charts: true,
        include_raw_data: false
      },
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      last_run: '2024-01-22T08:00:00Z',
      next_run: '2024-01-29T08:00:00Z',
      run_count: 12,
      success_rate: 95.8
    },
    {
      id: 'report_2',
      name: 'Relatório Mensal de Compliance',
      description: 'Relatório mensal de conformidade e auditoria regulatória',
      type: 'compliance',
      format: 'excel',
      frequency: 'monthly',
      schedule: {
        time: '09:00',
        day_of_month: 1,
        timezone: 'America/Sao_Paulo'
      },
      filters: {
        date_range: {
          start: '',
          end: '',
          relative: 'last_30_days'
        },
        operations: ['CREATE', 'UPDATE', 'DELETE']
      },
      recipients: {
        emails: ['compliance@sisiago.com', 'audit@sisiago.com'],
        notification_settings: {
          on_success: true,
          on_failure: true,
          on_anomaly: false
        }
      },
      template: {
        sections: ['compliance_overview', 'policy_violations', 'audit_trail'],
        include_charts: true,
        include_raw_data: true
      },
      status: 'active',
      created_at: '2024-01-10T15:00:00Z',
      updated_at: '2024-01-15T11:20:00Z',
      last_run: '2024-01-01T09:00:00Z',
      next_run: '2024-02-01T09:00:00Z',
      run_count: 3,
      success_rate: 100
    },
    {
      id: 'report_3',
      name: 'Dashboard Diário de Atividades',
      description: 'Resumo diário das atividades do sistema',
      type: 'activity',
      format: 'pdf',
      frequency: 'daily',
      schedule: {
        time: '07:00',
        timezone: 'America/Sao_Paulo'
      },
      filters: {
        date_range: {
          start: '',
          end: '',
          relative: 'yesterday'
        }
      },
      recipients: {
        emails: ['operations@sisiago.com'],
        notification_settings: {
          on_success: false,
          on_failure: true,
          on_anomaly: true
        }
      },
      template: {
        sections: ['user_activity', 'system_usage', 'trends'],
        include_charts: true,
        include_raw_data: false
      },
      status: 'paused',
      created_at: '2024-01-05T12:00:00Z',
      updated_at: '2024-01-18T16:45:00Z',
      last_run: '2024-01-18T07:00:00Z',
      run_count: 18,
      success_rate: 88.9
    }
  ]

  const generateMockExecutions = (): ReportExecution[] => [
    {
      id: 'exec_1',
      report_id: 'report_1',
      report_name: 'Relatório Semanal de Segurança',
      started_at: '2024-01-22T08:00:00Z',
      completed_at: '2024-01-22T08:03:45Z',
      status: 'completed',
      file_size: 2048576, // 2MB
      file_path: '/reports/security_weekly_20240122.pdf',
      execution_time: 225, // seconds
      records_processed: 15420,
      anomalies_detected: 3
    },
    {
      id: 'exec_2',
      report_id: 'report_2',
      report_name: 'Relatório Mensal de Compliance',
      started_at: '2024-01-01T09:00:00Z',
      completed_at: '2024-01-01T09:12:30Z',
      status: 'completed',
      file_size: 5242880, // 5MB
      file_path: '/reports/compliance_monthly_20240101.xlsx',
      execution_time: 750,
      records_processed: 45680,
      anomalies_detected: 0
    },
    {
      id: 'exec_3',
      report_id: 'report_1',
      report_name: 'Relatório Semanal de Segurança',
      started_at: '2024-01-23T10:30:00Z',
      status: 'running',
      records_processed: 8500,
      anomalies_detected: 1
    },
    {
      id: 'exec_4',
      report_id: 'report_3',
      report_name: 'Dashboard Diário de Atividades',
      started_at: '2024-01-18T07:00:00Z',
      completed_at: '2024-01-18T07:01:15Z',
      status: 'failed',
      error_message: 'Erro de conexão com o banco de dados',
      execution_time: 75,
      records_processed: 0,
      anomalies_detected: 0
    }
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      // Simular API calls
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setReports(generateMockReports())
      setExecutions(generateMockExecutions())
      setTemplates(generateMockTemplates())
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar relatórios')
    } finally {
      setLoading(false)
    }
  }

  const runReport = async (reportId: string) => {
    try {
      // Simular execução do relatório
      const newExecution: ReportExecution = {
        id: `exec_${Date.now()}`,
        report_id: reportId,
        report_name: reports.find(r => r.id === reportId)?.name || 'Relatório',
        started_at: new Date().toISOString(),
        status: 'running',
        records_processed: 0,
        anomalies_detected: 0
      }
      
      setExecutions(prev => [newExecution, ...prev])
      toast.success('Relatório iniciado com sucesso')
      
      // Simular conclusão após alguns segundos
      setTimeout(() => {
        setExecutions(prev => prev.map(exec => 
          exec.id === newExecution.id 
            ? {
                ...exec,
                status: 'completed',
                completed_at: new Date().toISOString(),
                file_size: Math.floor(Math.random() * 5000000) + 1000000,
                file_path: `/reports/${reportId}_${Date.now()}.pdf`,
                execution_time: Math.floor(Math.random() * 300) + 60,
                records_processed: Math.floor(Math.random() * 50000) + 10000,
                anomalies_detected: Math.floor(Math.random() * 5)
              }
            : exec
        ))
        toast.success('Relatório gerado com sucesso')
      }, 3000)
    } catch (error) {
      console.error('Erro ao executar relatório:', error)
      toast.error('Erro ao executar relatório')
    }
  }

  const toggleReportStatus = async (reportId: string) => {
    try {
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: report.status === 'active' ? 'paused' : 'active',
              updated_at: new Date().toISOString()
            }
          : report
      ))
      toast.success('Status do relatório atualizado')
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro ao atualizar status do relatório')
    }
  }

  const downloadReport = async (execution: ReportExecution) => {
    try {
      // Simular download
      toast.success(`Download iniciado: ${execution.report_name}`)
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      toast.error('Erro ao fazer download do relatório')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-yellow-500'
      case 'draft': return 'bg-gray-500'
      case 'completed': return 'bg-green-500'
      case 'running': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="h-4 w-4" />
      case 'compliance': return <CheckCircle className="h-4 w-4" />
      case 'activity': return <Activity className="h-4 w-4" />
      case 'performance': return <TrendingUp className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredReports = reports.filter(report => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!report.name.toLowerCase().includes(searchLower) && 
          !report.description.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    if (filters.type !== 'all' && report.type !== filters.type) return false
    if (filters.status !== 'all' && report.status !== filters.status) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Relatórios de Auditoria</h2>
          <p className="text-muted-foreground">
            Geração automática e agendamento de relatórios de auditoria
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Relatório
          </Button>
          <Button variant="outline" onClick={fetchData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="executions">Execuções</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nome ou descrição..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="security">Segurança</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="activity">Atividade</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="draft">Rascunho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredReports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  Nenhum relatório encontrado
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(report.type)}
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {report.frequency}
                          </Badge>
                        </div>
                        <CardDescription>{report.description}</CardDescription>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Próxima execução: {report.next_run ? new Date(report.next_run).toLocaleString() : 'N/A'}
                          </div>
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            Taxa de sucesso: {report.success_rate}%
                          </div>
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {report.run_count} execuções
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runReport(report.id)}
                          className="gap-2"
                        >
                          <Play className="h-3 w-3" />
                          Executar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleReportStatus(report.id)}
                          className="gap-2"
                        >
                          {report.status === 'active' ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          {report.status === 'active' ? 'Pausar' : 'Ativar'}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {getTypeIcon(report.type)}
                                {report.name}
                              </DialogTitle>
                              <DialogDescription>
                                Configurações detalhadas do relatório
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh]">
                              <div className="space-y-6">
                                {/* Basic Info */}
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <Label className="text-sm font-medium">Informações Básicas</Label>
                                    <div className="mt-2 space-y-2 text-sm">
                                      <div>Tipo: {report.type}</div>
                                      <div>Formato: {report.format.toUpperCase()}</div>
                                      <div>Frequência: {report.frequency}</div>
                                      <div>Status: {report.status}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Agendamento</Label>
                                    <div className="mt-2 space-y-2 text-sm">
                                      <div>Horário: {report.schedule.time}</div>
                                      {report.schedule.day_of_week && (
                                        <div>Dia da semana: {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][report.schedule.day_of_week]}</div>
                                      )}
                                      {report.schedule.day_of_month && (
                                        <div>Dia do mês: {report.schedule.day_of_month}</div>
                                      )}
                                      <div>Timezone: {report.schedule.timezone}</div>
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Recipients */}
                                <div>
                                  <Label className="text-sm font-medium">Destinatários</Label>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex flex-wrap gap-1">
                                      {report.recipients.emails.map((email, index) => (
                                        <Badge key={index} variant="outline">
                                          {email}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Notificações: 
                                      {report.recipients.notification_settings.on_success && ' Sucesso'}
                                      {report.recipients.notification_settings.on_failure && ' Falha'}
                                      {report.recipients.notification_settings.on_anomaly && ' Anomalia'}
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                {/* Template */}
                                <div>
                                  <Label className="text-sm font-medium">Template</Label>
                                  <div className="mt-2 space-y-2">
                                    <div className="flex flex-wrap gap-1">
                                      {report.template.sections.map((section, index) => (
                                        <Badge key={index} variant="secondary">
                                          {section}
                                        </Badge>
                                      ))}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Incluir gráficos: {report.template.include_charts ? 'Sim' : 'Não'} | 
                                      Incluir dados brutos: {report.template.include_raw_data ? 'Sim' : 'Não'}
                                    </div>
                                  </div>
                                </div>

                                {/* Statistics */}
                                <div className="grid gap-4 md:grid-cols-3">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{report.run_count}</div>
                                    <div className="text-sm text-muted-foreground">Execuções</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{report.success_rate}%</div>
                                    <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                      {report.last_run ? new Date(report.last_run).toLocaleDateString() : 'N/A'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">Última Execução</div>
                                  </div>
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>
                Acompanhe o status e resultados das execuções de relatórios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.map((execution) => (
                  <Card key={execution.id} className="border-l-4" style={{
                    borderLeftColor: execution.status === 'completed' ? '#10b981' :
                                    execution.status === 'running' ? '#3b82f6' :
                                    execution.status === 'failed' ? '#ef4444' : '#6b7280'
                  }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{execution.report_name}</CardTitle>
                            <Badge className={getStatusColor(execution.status)}>
                              {execution.status.toUpperCase()}
                            </Badge>
                            {execution.anomalies_detected > 0 && (
                              <Badge variant="destructive">
                                {execution.anomalies_detected} anomalias
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Iniciado: {new Date(execution.started_at).toLocaleString()}
                            </div>
                            {execution.completed_at && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Concluído: {new Date(execution.completed_at).toLocaleString()}
                              </div>
                            )}
                            {execution.execution_time && (
                              <div className="flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                Duração: {Math.floor(execution.execution_time / 60)}m {execution.execution_time % 60}s
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {execution.status === 'completed' && execution.file_path && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReport(execution)}
                              className="gap-2"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{execution.records_processed.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Registros Processados</div>
                        </div>
                        {execution.file_size && (
                          <div className="text-center">
                            <div className="text-lg font-semibold">{formatFileSize(execution.file_size)}</div>
                            <div className="text-sm text-muted-foreground">Tamanho do Arquivo</div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-lg font-semibold">{execution.anomalies_detected}</div>
                          <div className="text-sm text-muted-foreground">Anomalias Detectadas</div>
                        </div>
                        {execution.execution_time && (
                          <div className="text-center">
                            <div className="text-lg font-semibold">{execution.execution_time}s</div>
                            <div className="text-sm text-muted-foreground">Tempo de Execução</div>
                          </div>
                        )}
                      </div>
                      {execution.error_message && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">Erro:</span>
                          </div>
                          <div className="text-red-700 text-sm mt-1">{execution.error_message}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(template.type)}
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.preview_available && (
                          <Badge variant="outline">Preview</Badge>
                        )}
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      Usar Template
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Seções Incluídas:</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {template.sections.map((section, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { AuditReports }