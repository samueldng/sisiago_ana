'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap
} from 'lucide-react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts'
import { format, subHours, subDays } from 'date-fns'
import { toast } from 'sonner'

interface PerformanceMetric {
  timestamp: string
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  network_io: number
  database_connections: number
  query_response_time: number
  audit_log_write_time: number
  audit_log_read_time: number
  concurrent_users: number
  requests_per_second: number
  error_rate: number
  cache_hit_rate: number
  queue_size: number
  processing_time: number
}

interface SystemAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  resolved: boolean
  metric: string
  threshold: number
  current_value: number
}

interface AuditPerformanceProps {
  className?: string
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'
type MetricCategory = 'system' | 'database' | 'audit' | 'network'

const generateMockPerformanceData = (timeRange: TimeRange): PerformanceMetric[] => {
  const data: PerformanceMetric[] = []
  const now = new Date()
  let intervals: Date[] = []
  
  switch (timeRange) {
    case '1h':
      intervals = Array.from({ length: 12 }, (_, i) => subHours(now, (11 - i) * 0.083)) // 5 min intervals
      break
    case '6h':
      intervals = Array.from({ length: 24 }, (_, i) => subHours(now, (23 - i) * 0.25)) // 15 min intervals
      break
    case '24h':
      intervals = Array.from({ length: 24 }, (_, i) => subHours(now, 23 - i)) // 1 hour intervals
      break
    case '7d':
      intervals = Array.from({ length: 7 }, (_, i) => subDays(now, 6 - i)) // 1 day intervals
      break
    case '30d':
      intervals = Array.from({ length: 30 }, (_, i) => subDays(now, 29 - i)) // 1 day intervals
      break
  }
  
  intervals.forEach(timestamp => {
    const baseLoad = 30 + Math.sin(timestamp.getHours() / 24 * Math.PI * 2) * 20
    const randomVariation = (Math.random() - 0.5) * 20
    const load = Math.max(0, Math.min(100, baseLoad + randomVariation))
    
    data.push({
      timestamp: timestamp.toISOString(),
      cpu_usage: Math.max(0, Math.min(100, load + (Math.random() - 0.5) * 10)),
      memory_usage: Math.max(0, Math.min(100, load + (Math.random() - 0.5) * 15)),
      disk_usage: Math.max(0, Math.min(100, 60 + (Math.random() - 0.5) * 10)),
      network_io: Math.max(0, load * 2 + (Math.random() - 0.5) * 50),
      database_connections: Math.max(0, Math.min(100, Math.floor(load / 2) + Math.floor(Math.random() * 20))),
      query_response_time: Math.max(10, load * 2 + (Math.random() - 0.5) * 30),
      audit_log_write_time: Math.max(5, load / 2 + (Math.random() - 0.5) * 10),
      audit_log_read_time: Math.max(3, load / 3 + (Math.random() - 0.5) * 5),
      concurrent_users: Math.max(0, Math.floor(load * 2) + Math.floor(Math.random() * 50)),
      requests_per_second: Math.max(0, Math.floor(load * 3) + Math.floor(Math.random() * 100)),
      error_rate: Math.max(0, Math.min(10, (100 - load) / 20 + (Math.random() - 0.5) * 2)),
      cache_hit_rate: Math.max(70, Math.min(99, 90 - load / 10 + (Math.random() - 0.5) * 5)),
      queue_size: Math.max(0, Math.floor((100 - load) / 5) + Math.floor(Math.random() * 10)),
      processing_time: Math.max(50, load * 5 + (Math.random() - 0.5) * 100)
    })
  })
  
  return data
}

const generateMockAlerts = (): SystemAlert[] => {
  return [
    {
      id: '1',
      type: 'warning',
      title: 'Alto uso de CPU',
      message: 'O uso de CPU está acima de 80% por mais de 5 minutos',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      resolved: false,
      metric: 'cpu_usage',
      threshold: 80,
      current_value: 85
    },
    {
      id: '2',
      type: 'error',
      title: 'Tempo de resposta elevado',
      message: 'Consultas ao banco de dados estão demorando mais que 100ms',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      resolved: false,
      metric: 'query_response_time',
      threshold: 100,
      current_value: 125
    },
    {
      id: '3',
      type: 'info',
      title: 'Cache otimizado',
      message: 'Taxa de acerto do cache melhorou para 95%',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      resolved: true,
      metric: 'cache_hit_rate',
      threshold: 90,
      current_value: 95
    }
  ]
}



export const AuditPerformance: React.FC<AuditPerformanceProps> = ({ className }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [metricCategory, setMetricCategory] = useState<MetricCategory>('system')
  const [data, setData] = useState<PerformanceMetric[]>([])
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [autoRefresh] = useState(true)

  // Load performance data
  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockData = generateMockPerformanceData(timeRange)
      const mockAlerts = generateMockAlerts()
      setData(mockData)
      setAlerts(mockAlerts)
    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error)
      toast.error('Erro ao carregar dados de performance')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [timeRange])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      loadData()
    }, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [autoRefresh, timeRange])

  // Calculate current metrics
  const currentMetrics = useMemo(() => {
    if (!data.length) return null
    
    const latest = data[data.length - 1]
    const previous = data[data.length - 2]
    
    if (!latest) return null
    
    const calculateTrend = (current: number, prev: number) => {
      if (!prev) return 0
      return ((current - prev) / prev) * 100
    }
    
    return {
      cpu_usage: {
        value: latest.cpu_usage,
        trend: previous ? calculateTrend(latest.cpu_usage, previous.cpu_usage) : 0,
        status: latest.cpu_usage > 80 ? 'error' : latest.cpu_usage > 60 ? 'warning' : 'ok'
      },
      memory_usage: {
        value: latest.memory_usage,
        trend: previous ? calculateTrend(latest.memory_usage, previous.memory_usage) : 0,
        status: latest.memory_usage > 85 ? 'error' : latest.memory_usage > 70 ? 'warning' : 'ok'
      },
      query_response_time: {
        value: latest.query_response_time,
        trend: previous ? calculateTrend(latest.query_response_time, previous.query_response_time) : 0,
        status: latest.query_response_time > 100 ? 'error' : latest.query_response_time > 50 ? 'warning' : 'ok'
      },
      concurrent_users: {
        value: latest.concurrent_users,
        trend: previous ? calculateTrend(latest.concurrent_users, previous.concurrent_users) : 0,
        status: 'ok'
      },
      error_rate: {
        value: latest.error_rate,
        trend: previous ? calculateTrend(latest.error_rate, previous.error_rate) : 0,
        status: latest.error_rate > 5 ? 'error' : latest.error_rate > 2 ? 'warning' : 'ok'
      },
      cache_hit_rate: {
        value: latest.cache_hit_rate,
        trend: previous ? calculateTrend(latest.cache_hit_rate, previous.cache_hit_rate) : 0,
        status: latest.cache_hit_rate < 80 ? 'error' : latest.cache_hit_rate < 90 ? 'warning' : 'ok'
      }
    }
  }, [data])

  const handleExport = () => {
    const csvContent = [
      ['Timestamp', 'CPU %', 'Memory %', 'Disk %', 'Network I/O', 'DB Connections', 'Query Time (ms)', 'Audit Write (ms)', 'Audit Read (ms)', 'Users', 'RPS', 'Error Rate %', 'Cache Hit %'].join(','),
      ...data.map(item => [
        item.timestamp,
        item.cpu_usage.toFixed(2),
        item.memory_usage.toFixed(2),
        item.disk_usage.toFixed(2),
        item.network_io.toFixed(2),
        item.database_connections,
        item.query_response_time.toFixed(2),
        item.audit_log_write_time.toFixed(2),
        item.audit_log_read_time.toFixed(2),
        item.concurrent_users,
        item.requests_per_second,
        item.error_rate.toFixed(2),
        item.cache_hit_rate.toFixed(2)
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-performance-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Dados de performance exportados com sucesso')
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
    toast.success('Alerta resolvido')
  }



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const formatChartData = (data: PerformanceMetric[]) => {
    return data.map(item => ({
      ...item,
      time: format(new Date(item.timestamp), timeRange === '1h' || timeRange === '6h' ? 'HH:mm' : timeRange === '24h' ? 'HH:mm' : 'dd/MM')
    }))
  }

  const chartData = formatChartData(data)

  if (loading && !data.length) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Carregando dados de performance...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance do Sistema de Auditoria</CardTitle>
              <CardDescription>
                Monitoramento em tempo real de métricas de performance e recursos do sistema
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hora</SelectItem>
                  <SelectItem value="6h">6 Horas</SelectItem>
                  <SelectItem value="24h">24 Horas</SelectItem>
                  <SelectItem value="7d">7 Dias</SelectItem>
                  <SelectItem value="30d">30 Dias</SelectItem>
                </SelectContent>
              </Select>
              
              <Button size="sm" variant="outline" onClick={loadData}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {alerts.filter(alert => !alert.resolved).length > 0 && (
        <div className="space-y-2">
          {alerts.filter(alert => !alert.resolved).map(alert => (
            <Alert key={alert.id} className={alert.type === 'error' ? 'border-red-200 bg-red-50' : alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <strong>{alert.title}</strong> - {alert.message}
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm')}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)}>
                  Resolver
                </Button>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Current Metrics */}
      {currentMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                {getStatusIcon(currentMetrics.cpu_usage.status)}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">CPU</p>
                <p className="text-lg font-bold">{currentMetrics.cpu_usage.value.toFixed(1)}%</p>
                <div className="flex items-center space-x-1">
                  {currentMetrics.cpu_usage.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`text-xs ${currentMetrics.cpu_usage.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(currentMetrics.cpu_usage.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <HardDrive className="h-4 w-4 text-green-500" />
                {getStatusIcon(currentMetrics.memory_usage.status)}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Memória</p>
                <p className="text-lg font-bold">{currentMetrics.memory_usage.value.toFixed(1)}%</p>
                <div className="flex items-center space-x-1">
                  {currentMetrics.memory_usage.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`text-xs ${currentMetrics.memory_usage.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(currentMetrics.memory_usage.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Database className="h-4 w-4 text-purple-500" />
                {getStatusIcon(currentMetrics.query_response_time.status)}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Query Time</p>
                <p className="text-lg font-bold">{currentMetrics.query_response_time.value.toFixed(0)}ms</p>
                <div className="flex items-center space-x-1">
                  {currentMetrics.query_response_time.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`text-xs ${currentMetrics.query_response_time.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(currentMetrics.query_response_time.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-4 w-4 text-orange-500" />
                {getStatusIcon(currentMetrics.concurrent_users.status)}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Usuários</p>
                <p className="text-lg font-bold">{currentMetrics.concurrent_users.value}</p>
                <div className="flex items-center space-x-1">
                  {currentMetrics.concurrent_users.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${currentMetrics.concurrent_users.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(currentMetrics.concurrent_users.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {getStatusIcon(currentMetrics.error_rate.status)}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Taxa de Erro</p>
                <p className="text-lg font-bold">{currentMetrics.error_rate.value.toFixed(2)}%</p>
                <div className="flex items-center space-x-1">
                  {currentMetrics.error_rate.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`text-xs ${currentMetrics.error_rate.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(currentMetrics.error_rate.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                {getStatusIcon(currentMetrics.cache_hit_rate.status)}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Cache Hit</p>
                <p className="text-lg font-bold">{currentMetrics.cache_hit_rate.value.toFixed(1)}%</p>
                <div className="flex items-center space-x-1">
                  {currentMetrics.cache_hit_rate.trend > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${currentMetrics.cache_hit_rate.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(currentMetrics.cache_hit_rate.trend).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs value={metricCategory} onValueChange={(value) => setMetricCategory(value as MetricCategory)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="network">Rede</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Uso de CPU e Memória</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu_usage" stackId="1" stroke="#8884d8" fill="#8884d8" name="CPU %" />
                    <Area type="monotone" dataKey="memory_usage" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Memória %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usuários Concorrentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="concurrent_users" stroke="#ff7300" name="Usuários" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tempo de Resposta de Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="query_response_time" stroke="#8884d8" name="Tempo (ms)" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conexões e Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="database_connections" stroke="#82ca9d" name="Conexões" />
                    <Line type="monotone" dataKey="cache_hit_rate" stroke="#ffc658" name="Cache Hit %" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance de Auditoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="audit_log_write_time" stroke="#8884d8" name="Escrita (ms)" />
                    <Line type="monotone" dataKey="audit_log_read_time" stroke="#82ca9d" name="Leitura (ms)" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taxa de Erro e Processamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="error_rate" stroke="#ff7300" name="Taxa de Erro %" />
                    <Line type="monotone" dataKey="processing_time" stroke="#8dd1e1" name="Tempo Proc. (ms)" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">I/O de Rede</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="network_io" stroke="#8884d8" fill="#8884d8" name="Network I/O" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requisições por Segundo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests_per_second" fill="#82ca9d" name="RPS" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}