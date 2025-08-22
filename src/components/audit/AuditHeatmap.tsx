'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, eachHourOfInterval, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface HeatmapData {
  date: string
  hour?: number
  location?: string
  ip_address?: string
  activity_count: number
  risk_score: number
  operations: {
    CREATE: number
    READ: number
    UPDATE: number
    DELETE: number
  }
  tables: Record<string, number>
  users: Record<string, number>
  severity_distribution: {
    low: number
    medium: number
    high: number
    critical: number
  }
}

interface AuditHeatmapProps {
  className?: string
}

type ViewMode = 'daily' | 'hourly' | 'geographic' | 'user_activity'
type MetricType = 'activity_count' | 'risk_score' | 'operations' | 'severity'

const generateMockHeatmapData = (viewMode: ViewMode, dateRange: { from: Date; to: Date }): HeatmapData[] => {
  const data: HeatmapData[] = []
  
  if (viewMode === 'daily') {
    const days = eachDayOfInterval(dateRange)
    days.forEach(day => {
      const activityCount = Math.floor(Math.random() * 500) + 50
      const riskScore = Math.floor(Math.random() * 100)
      
      data.push({
        date: format(day, 'yyyy-MM-dd'),
        activity_count: activityCount,
        risk_score: riskScore,
        operations: {
          CREATE: Math.floor(activityCount * 0.2),
          read: Math.floor(activityCount * 0.5),
          UPDATE: Math.floor(activityCount * 0.2),
          DELETE: Math.floor(activityCount * 0.1)
        },
        tables: {
          users: Math.floor(activityCount * 0.3),
          products: Math.floor(activityCount * 0.25),
          orders: Math.floor(activityCount * 0.2),
          audit_logs: Math.floor(activityCount * 0.15),
          sessions: Math.floor(activityCount * 0.1)
        },
        users: {
          'admin@sisiago.com': Math.floor(activityCount * 0.4),
          'user1@sisiago.com': Math.floor(activityCount * 0.3),
          'user2@sisiago.com': Math.floor(activityCount * 0.2),
          'guest@sisiago.com': Math.floor(activityCount * 0.1)
        },
        severity_distribution: {
          low: Math.floor(activityCount * 0.5),
          medium: Math.floor(activityCount * 0.3),
          high: Math.floor(activityCount * 0.15),
          critical: Math.floor(activityCount * 0.05)
        }
      })
    })
  } else if (viewMode === 'hourly') {
    const hours = eachHourOfInterval({
      start: startOfDay(dateRange.from),
      end: endOfDay(dateRange.to)
    })
    
    hours.forEach(hour => {
      const activityCount = Math.floor(Math.random() * 100) + 10
      const riskScore = Math.floor(Math.random() * 100)
      
      data.push({
        date: format(hour, 'yyyy-MM-dd'),
        hour: hour.getHours(),
        activity_count: activityCount,
        risk_score: riskScore,
        operations: {
          CREATE: Math.floor(activityCount * 0.2),
          read: Math.floor(activityCount * 0.5),
          UPDATE: Math.floor(activityCount * 0.2),
          DELETE: Math.floor(activityCount * 0.1)
        },
        tables: {
          users: Math.floor(activityCount * 0.3),
          products: Math.floor(activityCount * 0.25),
          orders: Math.floor(activityCount * 0.2)
        },
        users: {
          'admin@sisiago.com': Math.floor(activityCount * 0.4),
          'user1@sisiago.com': Math.floor(activityCount * 0.3),
          'user2@sisiago.com': Math.floor(activityCount * 0.3)
        },
        severity_distribution: {
          low: Math.floor(activityCount * 0.5),
          medium: Math.floor(activityCount * 0.3),
          high: Math.floor(activityCount * 0.15),
          critical: Math.floor(activityCount * 0.05)
        }
      })
    })
  } else if (viewMode === 'geographic') {
    const locations = [
      { name: 'São Paulo, BR', ip: '192.168.1.0/24' },
      { name: 'Rio de Janeiro, BR', ip: '192.168.2.0/24' },
      { name: 'Belo Horizonte, BR', ip: '192.168.3.0/24' },
      { name: 'Salvador, BR', ip: '192.168.4.0/24' },
      { name: 'Brasília, BR', ip: '192.168.5.0/24' },
      { name: 'Fortaleza, BR', ip: '192.168.6.0/24' },
      { name: 'Recife, BR', ip: '192.168.7.0/24' },
      { name: 'Porto Alegre, BR', ip: '192.168.8.0/24' }
    ]
    
    locations.forEach(location => {
      const activityCount = Math.floor(Math.random() * 1000) + 100
      const riskScore = Math.floor(Math.random() * 100)
      
      data.push({
        date: format(new Date(), 'yyyy-MM-dd'),
        location: location.name,
        ip_address: location.ip,
        activity_count: activityCount,
        risk_score: riskScore,
        operations: {
          CREATE: Math.floor(activityCount * 0.2),
          read: Math.floor(activityCount * 0.5),
          UPDATE: Math.floor(activityCount * 0.2),
          DELETE: Math.floor(activityCount * 0.1)
        },
        tables: {
          users: Math.floor(activityCount * 0.3),
          products: Math.floor(activityCount * 0.25),
          orders: Math.floor(activityCount * 0.2)
        },
        users: {
          'admin@sisiago.com': Math.floor(activityCount * 0.4),
          'user1@sisiago.com': Math.floor(activityCount * 0.3),
          'user2@sisiago.com': Math.floor(activityCount * 0.3)
        },
        severity_distribution: {
          low: Math.floor(activityCount * 0.5),
          medium: Math.floor(activityCount * 0.3),
          high: Math.floor(activityCount * 0.15),
          critical: Math.floor(activityCount * 0.05)
        }
      })
    })
  }
  
  return data
}

const getColorIntensity = (value: number, max: number, min: number = 0): string => {
  if (max === min) return 'bg-blue-100'
  
  const normalized = (value - min) / (max - min)
  
  if (normalized >= 0.8) return 'bg-red-500'
  if (normalized >= 0.6) return 'bg-red-400'
  if (normalized >= 0.4) return 'bg-orange-400'
  if (normalized >= 0.2) return 'bg-yellow-400'
  if (normalized > 0) return 'bg-blue-300'
  return 'bg-gray-100'
}

const getRiskColorIntensity = (riskScore: number): string => {
  if (riskScore >= 80) return 'bg-red-500'
  if (riskScore >= 60) return 'bg-red-400'
  if (riskScore >= 40) return 'bg-orange-400'
  if (riskScore >= 20) return 'bg-yellow-400'
  if (riskScore > 0) return 'bg-green-300'
  return 'bg-gray-100'
}

export const AuditHeatmap: React.FC<AuditHeatmapProps> = ({ className }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily')
  const [metricType, setMetricType] = useState<MetricType>('activity_count')
  const [dateRange, setDateRange] = useState({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date())
  })
  const [showLegend, setShowLegend] = useState(true)
  const [showTooltips, setShowTooltips] = useState(true)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<HeatmapData[]>([])

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      const mockData = generateMockHeatmapData(viewMode, dateRange)
      setData(mockData)
    } catch (error) {
      console.error('Erro ao carregar dados do heatmap:', error)
      toast.error('Erro ao carregar dados do heatmap')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [viewMode, dateRange])

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!data.length) return { max: 0, min: 0, avg: 0, total: 0 }
    
    let values: number[] = []
    
    switch (metricType) {
      case 'activity_count':
        values = data.map(d => d.activity_count)
        break
      case 'risk_score':
        values = data.map(d => d.risk_score)
        break
      case 'operations':
        values = data.map(d => Object.values(d.operations).reduce((a, b) => a + b, 0))
        break
      case 'severity':
        values = data.map(d => d.severity_distribution.high + d.severity_distribution.critical)
        break
    }
    
    return {
      max: Math.max(...values),
      min: Math.min(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      total: values.reduce((a, b) => a + b, 0)
    }
  }, [data, metricType])

  const handleExport = () => {
    const csvContent = [
      ['Data', 'Hora', 'Localização', 'Atividades', 'Score de Risco', 'CREATE', 'READ', 'UPDATE', 'DELETE'].join(','),
      ...data.map(item => [
        item.date,
        item.hour || '',
        item.location || '',
        item.activity_count,
        item.risk_score,
        item.operations.CREATE,
        item.operations.read,
        item.operations.UPDATE,
        item.operations.DELETE
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-heatmap-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Dados exportados com sucesso')
  }

  const renderDailyHeatmap = () => {
    const days = eachDayOfInterval(dateRange)
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const dayData = data.find(d => d.date === format(day, 'yyyy-MM-dd'))
            const value = dayData ? (
              metricType === 'activity_count' ? dayData.activity_count :
              metricType === 'risk_score' ? dayData.risk_score :
              metricType === 'operations' ? Object.values(dayData.operations).reduce((a, b) => a + b, 0) :
              dayData.severity_distribution.high + dayData.severity_distribution.critical
            ) : 0
            
            const colorClass = metricType === 'risk_score' 
              ? getRiskColorIntensity(value)
              : getColorIntensity(value, metrics.max, metrics.min)
            
            return (
              <TooltipProvider key={day.toISOString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`h-16 rounded-lg border-2 border-white cursor-pointer transition-all hover:scale-105 ${colorClass}`}
                    >
                      <div className="p-2 h-full flex flex-col justify-between">
                        <div className="text-xs font-medium text-center">
                          {format(day, 'd')}
                        </div>
                        <div className="text-xs text-center font-bold">
                          {value}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  {showTooltips && (
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">{format(day, 'dd/MM/yyyy', { locale: ptBR })}</p>
                        <p>Atividades: {dayData?.activity_count || 0}</p>
                        <p>Score de Risco: {dayData?.risk_score || 0}</p>
                        {dayData && (
                          <div className="text-xs">
                            <p>CREATE: {dayData.operations.CREATE}</p>
                            <p>READ: {dayData.operations.read}</p>
                            <p>UPDATE: {dayData.operations.UPDATE}</p>
                            <p>DELETE: {dayData.operations.DELETE}</p>
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </div>
      </div>
    )
  }

  const renderHourlyHeatmap = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const days = eachDayOfInterval(dateRange)
    
    return (
      <div className="space-y-4">
        <div className="flex">
          <div className="w-12"></div>
          <div className="grid grid-cols-24 gap-1 flex-1">
            {hours.map(hour => (
              <div key={hour} className="text-center text-xs text-muted-foreground">
                {hour.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        
        {days.map(day => (
          <div key={day.toISOString()} className="flex items-center">
            <div className="w-12 text-xs text-muted-foreground">
              {format(day, 'dd/MM')}
            </div>
            <div className="grid grid-cols-24 gap-1 flex-1">
              {hours.map(hour => {
                const hourData = data.find(d => 
                  d.date === format(day, 'yyyy-MM-dd') && d.hour === hour
                )
                const value = hourData ? (
                  metricType === 'activity_count' ? hourData.activity_count :
                  metricType === 'risk_score' ? hourData.risk_score :
                  metricType === 'operations' ? Object.values(hourData.operations).reduce((a, b) => a + b, 0) :
                  hourData.severity_distribution.high + hourData.severity_distribution.critical
                ) : 0
                
                const colorClass = metricType === 'risk_score' 
                  ? getRiskColorIntensity(value)
                  : getColorIntensity(value, metrics.max, metrics.min)
                
                return (
                  <TooltipProvider key={`${day.toISOString()}-${hour}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`h-8 rounded cursor-pointer transition-all hover:scale-110 ${colorClass}`}
                        />
                      </TooltipTrigger>
                      {showTooltips && (
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {format(day, 'dd/MM/yyyy', { locale: ptBR })} - {hour.toString().padStart(2, '0')}:00
                            </p>
                            <p>Atividades: {hourData?.activity_count || 0}</p>
                            <p>Score de Risco: {hourData?.risk_score || 0}</p>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderGeographicHeatmap = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item, index) => {
          const value = metricType === 'activity_count' ? item.activity_count :
                       metricType === 'risk_score' ? item.risk_score :
                       metricType === 'operations' ? Object.values(item.operations).reduce((a, b) => a + b, 0) :
                       item.severity_distribution.high + item.severity_distribution.critical
          
          const colorClass = metricType === 'risk_score' 
            ? getRiskColorIntensity(value)
            : getColorIntensity(value, metrics.max, metrics.min)
          
          return (
            <Card key={index} className={`cursor-pointer transition-all hover:shadow-lg ${colorClass} border-2`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium text-sm">{item.location}</span>
                  </div>
                  <Badge variant="outline">{value}</Badge>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>IP Range:</span>
                    <span className="font-mono">{item.ip_address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Atividades:</span>
                    <span>{item.activity_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Score de Risco:</span>
                    <span>{item.risk_score}</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>CREATE: {item.operations.CREATE}</div>
                      <div>READ: {item.operations.read}</div>
                      <div>UPDATE: {item.operations.UPDATE}</div>
                      <div>DELETE: {item.operations.DELETE}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Carregando mapa de calor...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mapa de Calor de Auditoria</CardTitle>
              <CardDescription>
                Visualização de atividades e padrões de auditoria por tempo e localização
              </CardDescription>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Atualizar
              </Button>
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label>Modo de Visualização</Label>
              <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="hourly">Por Hora</SelectItem>
                  <SelectItem value="geographic">Geográfico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Métrica</Label>
              <Select value={metricType} onValueChange={(value: MetricType) => setMetricType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activity_count">Contagem de Atividades</SelectItem>
                  <SelectItem value="risk_score">Score de Risco</SelectItem>
                  <SelectItem value="operations">Operações</SelectItem>
                  <SelectItem value="severity">Severidade Alta/Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Período</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                      : 'Selecionar período'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to })
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch checked={showLegend} onCheckedChange={setShowLegend} />
                <Label>Mostrar Legenda</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={showTooltips} onCheckedChange={setShowTooltips} />
                <Label>Mostrar Tooltips</Label>
              </div>
            </div>
          </div>

          {/* Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">{metrics.total.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Máximo</p>
                    <p className="text-lg font-bold">{metrics.max.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mínimo</p>
                    <p className="text-lg font-bold">{metrics.min.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Média</p>
                    <p className="text-lg font-bold">{Math.round(metrics.avg).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Legend */}
          {showLegend && (
            <div className="mb-6">
              <Label className="text-sm font-medium mb-2 block">Legenda de Intensidade</Label>
              <div className="flex items-center space-x-2">
                <span className="text-xs">Baixa</span>
                <div className="flex space-x-1">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <div className="w-4 h-4 bg-blue-300 rounded"></div>
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <div className="w-4 h-4 bg-red-400 rounded"></div>
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                </div>
                <span className="text-xs">Alta</span>
              </div>
            </div>
          )}

          {/* Heatmap Visualization */}
          <div className="min-h-[400px]">
            {viewMode === 'daily' && renderDailyHeatmap()}
            {viewMode === 'hourly' && renderHourlyHeatmap()}
            {viewMode === 'geographic' && renderGeographicHeatmap()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}