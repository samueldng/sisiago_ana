'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  BarChart3,
  Clock,
  AlertTriangle,
  Filter,
  Download,
  TrendingUp,
  Activity,
  Users,
  Database,
  Shield,
  MapPin,
  Zap,
  Bell,
  FileText,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { toast } from 'sonner'

// Import all audit components
import { AuditDashboard } from './AuditDashboard'
import { AuditTimeline } from './AuditTimeline'
import { AuditAlerts } from './AuditAlerts'
import { AuditFilters } from './AuditFilters'
import { AuditExport } from './AuditExport'
import { AuditPatterns } from './AuditPatterns'
import { AuditSessions } from './AuditSessions'
import { AuditReports } from './AuditReports'
import { AuditNotifications } from './AuditNotifications'
import { AuditHeatmap } from './AuditHeatmap'
import { AuditPerformance } from './AuditPerformance'
import { UseAuditLogsReturn } from '@/hooks/useAuditLogs'
import { UseAuditStatsReturn } from '@/hooks/useAuditStats'
import { UseAuditAlertsReturn } from '@/hooks/useAuditAlerts'

interface AuditMasterDashboardProps {
  className?: string
  auditLogs: UseAuditLogsReturn
  auditStats: UseAuditStatsReturn
  auditAlerts: UseAuditAlertsReturn
}

type DashboardView = 
  | 'overview'
  | 'timeline'
  | 'alerts'
  | 'patterns'
  | 'sessions'
  | 'reports'
  | 'notifications'
  | 'heatmap'
  | 'performance'
  | 'export'

interface DashboardConfig {
  autoRefresh: boolean
  refreshInterval: number
  compactMode: boolean
  showNotifications: boolean
  defaultView: DashboardView
  enableRealTime: boolean
}

const defaultConfig: DashboardConfig = {
  autoRefresh: true,
  refreshInterval: 30,
  compactMode: false,
  showNotifications: true,
  defaultView: 'overview',
  enableRealTime: true
}

const dashboardViews = [
  {
    id: 'overview' as DashboardView,
    label: 'Visão Geral',
    icon: BarChart3,
    description: 'Dashboard principal com métricas e gráficos'
  },
  {
    id: 'timeline' as DashboardView,
    label: 'Timeline',
    icon: Clock,
    description: 'Linha do tempo das ações de auditoria'
  },
  {
    id: 'alerts' as DashboardView,
    label: 'Alertas',
    icon: AlertTriangle,
    description: 'Sistema de alertas de segurança'
  },
  {
    id: 'patterns' as DashboardView,
    label: 'Padrões',
    icon: TrendingUp,
    description: 'Análise de padrões de comportamento'
  },
  {
    id: 'sessions' as DashboardView,
    label: 'Sessões',
    icon: Users,
    description: 'Monitoramento de sessões de usuário'
  },
  {
    id: 'heatmap' as DashboardView,
    label: 'Mapa de Calor',
    icon: MapPin,
    description: 'Visualização de atividades por tempo e localização'
  },
  {
    id: 'performance' as DashboardView,
    label: 'Performance',
    icon: Zap,
    description: 'Métricas de performance do sistema'
  },
  {
    id: 'reports' as DashboardView,
    label: 'Relatórios',
    icon: FileText,
    description: 'Relatórios automáticos de auditoria'
  },
  {
    id: 'notifications' as DashboardView,
    label: 'Notificações',
    icon: Bell,
    description: 'Central de notificações'
  },
  {
    id: 'export' as DashboardView,
    label: 'Exportação',
    icon: Download,
    description: 'Exportação avançada de dados'
  }
]

export const AuditMasterDashboard: React.FC<AuditMasterDashboardProps> = ({ 
  className, 
  auditLogs, 
  auditStats, 
  auditAlerts 
}) => {
  const [currentView, setCurrentView] = useState<DashboardView>('overview')
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  // Auto refresh
  useEffect(() => {
    if (!config.autoRefresh) return

    const interval = setInterval(() => {
      setLastRefresh(new Date())
      toast.info('Dashboard atualizado automaticamente')
    }, config.refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [config.autoRefresh, config.refreshInterval])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault()
            setCurrentView('overview')
            toast.info('Navegando para: Visão Geral')
            break
          case '2':
            event.preventDefault()
            setCurrentView('timeline')
            toast.info('Navegando para: Timeline')
            break
          case '3':
            event.preventDefault()
            setCurrentView('alerts')
            toast.info('Navegando para: Alertas')
            break
          case '4':
            event.preventDefault()
            setCurrentView('patterns')
            toast.info('Navegando para: Padrões')
            break
          case '5':
            event.preventDefault()
            setCurrentView('sessions')
            toast.info('Navegando para: Sessões')
            break
          case '6':
            event.preventDefault()
            setCurrentView('heatmap')
            toast.info('Navegando para: Mapa de Calor')
            break
          case '7':
            event.preventDefault()
            setCurrentView('performance')
            toast.info('Navegando para: Performance')
            break
          case '8':
            event.preventDefault()
            setCurrentView('reports')
            toast.info('Navegando para: Relatórios')
            break
          case '9':
            event.preventDefault()
            setCurrentView('notifications')
            toast.info('Navegando para: Notificações')
            break
          case '0':
            event.preventDefault()
            setCurrentView('export')
            toast.info('Navegando para: Exportação')
            break
          case 'r':
            event.preventDefault()
            handleRefresh()
            break
          case 'f':
            event.preventDefault()
            setIsFullscreen(!isFullscreen)
            toast.info(isFullscreen ? 'Saindo do modo tela cheia' : 'Entrando em modo tela cheia')
            break
          case 's':
            event.preventDefault()
            setShowSidebar(!showSidebar)
            toast.info(showSidebar ? 'Ocultando sidebar' : 'Mostrando sidebar')
            break
          case 'c':
            event.preventDefault()
            updateConfig({ compactMode: !config.compactMode })
            toast.info(config.compactMode ? 'Modo expandido ativado' : 'Modo compacto ativado')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isFullscreen, showSidebar, config.compactMode])

  const handleRefresh = () => {
    setLastRefresh(new Date())

    // Refresh all audit data
    auditLogs.refresh()
    auditStats.refresh()
    auditAlerts.refresh()

    toast.success('Dashboard atualizado manualmente')
  }

  const updateConfig = (updates: Partial<DashboardConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
    toast.success('Configurações atualizadas')
  }

  const getCurrentViewComponent = () => {
    const commonProps = {
      className: config.compactMode ? 'space-y-2' : 'space-y-4',
      auditLogs,
      auditStats,
      auditAlerts
    }

    switch (currentView) {
      case 'overview':
        return <AuditDashboard {...commonProps} />
      case 'timeline':
        return <AuditTimeline {...commonProps} />
      case 'alerts':
        return <AuditAlerts {...commonProps} />
      case 'patterns':
        return <AuditPatterns {...commonProps} />
      case 'sessions':
        return <AuditSessions {...commonProps} />
      case 'heatmap':
        return <AuditHeatmap {...commonProps} />
      case 'performance':
        return <AuditPerformance {...commonProps} />
      case 'reports':
        return <AuditReports {...commonProps} />
      case 'notifications':
        return <AuditNotifications {...commonProps} />
      case 'export':
        return <AuditExport {...commonProps} />
      default:
        return <AuditDashboard {...commonProps} />
    }
  }

  const currentViewInfo = dashboardViews.find(view => view.id === currentView)

  return (
    <div className={`h-screen flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Sistema de Auditoria</h1>
            </div>
            
            {currentViewInfo && (
              <div className="flex items-center space-x-2">
                <currentViewInfo.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{currentViewInfo.label}</span>
              </div>
            )}
          </div>
          
          <div className="ml-auto flex items-center space-x-2">
            {/* Quick Actions */}
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            
            {/* Settings */}
            <Select value={currentView} onValueChange={(value: DashboardView) => setCurrentView(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dashboardViews.map(view => (
                  <SelectItem key={view.id} value={view.id}>
                    <div className="flex items-center space-x-2">
                      <view.icon className="h-4 w-4" />
                      <span>{view.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 border-r bg-muted/10">
            <div className="p-4 space-y-4">
              {/* Navigation */}
              <div>
                <h3 className="text-sm font-medium mb-2">Navegação</h3>
                <div className="space-y-1">
                  {dashboardViews.map(view => {
                    const isActive = currentView === view.id
                    return (
                      <Button
                        key={view.id}
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setCurrentView(view.id)}
                      >
                        <view.icon className="h-4 w-4 mr-2" />
                        {view.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Última atualização:</span>
                    <span className="text-muted-foreground">
                      {lastRefresh.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Auto-refresh:</span>
                    <Badge variant={config.autoRefresh ? 'default' : 'secondary'} className="text-xs">
                      {config.autoRefresh ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Tempo real:</span>
                    <Badge variant={config.enableRealTime ? 'default' : 'secondary'} className="text-xs">
                      {config.enableRealTime ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-refresh" className="text-xs">Auto-refresh</Label>
                    <Switch
                      id="auto-refresh"
                      checked={config.autoRefresh}
                      onCheckedChange={(checked) => updateConfig({ autoRefresh: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-mode" className="text-xs">Modo compacto</Label>
                    <Switch
                      id="compact-mode"
                      checked={config.compactMode}
                      onCheckedChange={(checked) => updateConfig({ compactMode: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="real-time" className="text-xs">Tempo real</Label>
                    <Switch
                      id="real-time"
                      checked={config.enableRealTime}
                      onCheckedChange={(checked) => updateConfig({ enableRealTime: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications" className="text-xs">Notificações</Label>
                    <Switch
                      id="notifications"
                      checked={config.showNotifications}
                      onCheckedChange={(checked) => updateConfig({ showNotifications: checked })}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Intervalo (segundos)</Label>
                    <Select 
                      value={config.refreshInterval.toString()} 
                      onValueChange={(value) => updateConfig({ refreshInterval: parseInt(value) })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10s</SelectItem>
                        <SelectItem value="30">30s</SelectItem>
                        <SelectItem value="60">1min</SelectItem>
                        <SelectItem value="300">5min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Keyboard Shortcuts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Atalhos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Ctrl+1</span>
                      <span>Visão Geral</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+2</span>
                      <span>Timeline</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+3</span>
                      <span>Alertas</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+4</span>
                      <span>Padrões</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+5</span>
                      <span>Sessões</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+6</span>
                      <span>Mapa de Calor</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+7</span>
                      <span>Performance</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+8</span>
                      <span>Relatórios</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+9</span>
                      <span>Notificações</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ctrl+0</span>
                      <span>Exportação</span>
                    </div>
                    <div className="border-t pt-1 mt-2">
                      <div className="flex justify-between">
                        <span>Ctrl+R</span>
                        <span>Atualizar</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ctrl+F</span>
                        <span>Tela cheia</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ctrl+S</span>
                        <span>Sidebar</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ctrl+C</span>
                        <span>Modo compacto</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Breadcrumb */}
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Auditoria</span>
                <span>/</span>
                <span className="text-foreground">{currentViewInfo?.label}</span>
              </div>
              {currentViewInfo && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentViewInfo.description}
                </p>
              )}
            </div>

            {/* Current View */}
            <div key={currentView}>
              {getCurrentViewComponent()}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/10 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Sistema de Auditoria SisIAGO</span>
            <span>•</span>
            <span>Última atualização: {lastRefresh.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {config.autoRefresh && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Auto-refresh ativo</span>
              </div>
            )}
            
            {config.enableRealTime && (
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3 text-blue-500" />
                <span>Tempo real</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}