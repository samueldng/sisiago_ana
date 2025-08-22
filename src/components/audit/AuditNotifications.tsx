'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useAuditNotifications } from '@/hooks/useAuditNotifications'
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  Settings, 
  Search,
  AlertTriangle,
  Shield,
  Activity,
  FileX,
  Database,
  Lock,
  Clock,
  User,
  MapPin,
  Wifi,
  WifiOff,
  Trash2,
  RefreshCw
} from 'lucide-react'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditNotificationsProps {
  className?: string
}

const severityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
}

const typeIcons = {
  security_alert: Shield,
  system_anomaly: Activity,
  compliance_violation: FileX,
  performance_issue: Database,
  data_breach: Lock,
  unauthorized_access: AlertTriangle
}

const typeLabels = {
  security_alert: 'Alerta de Segurança',
  system_anomaly: 'Anomalia do Sistema',
  compliance_violation: 'Violação de Conformidade',
  performance_issue: 'Problema de Performance',
  data_breach: 'Vazamento de Dados',
  unauthorized_access: 'Acesso Não Autorizado'
}

export const AuditNotifications: React.FC<AuditNotificationsProps> = ({ className }) => {
  const {
    notifications,
    unreadCount,
    settings,
    loading,
    error,
    acknowledgeNotification,
    acknowledgeAll,
    dismissNotification,
    clearAll,
    updateSettings,
    toggleNotificationType,
    createNotification,

    isConnected,
    reconnect
  } = useAuditNotifications()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)

  const [selectedNotification, setSelectedNotification] = useState<any>(null)

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || notification.type === selectedType
    const matchesSeverity = selectedSeverity === 'all' || notification.severity === selectedSeverity
    const matchesUnread = !showOnlyUnread || !notification.acknowledged
    
    return matchesSearch && matchesType && matchesSeverity && matchesUnread
  })

  const handleTestNotification = () => {
    createNotification({
      type: 'security_alert',
      severity: 'high',
      title: 'Notificação de Teste',
      message: 'Esta é uma notificação de teste para verificar o sistema.',
      details: {
        test: true,
        timestamp: new Date().toISOString()
      }
    })
  }

  const handleUpdateSeverityThreshold = (value: number[]) => {
    const thresholds: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical']
    const index = value[0]
    if (index !== undefined && index >= 0 && index < thresholds.length) {
      const threshold = thresholds[index]
      if (threshold) {
        updateSettings({ severity_threshold: threshold })
      }
    }
  }

  const handleUpdateAutoAcknowledge = (value: number[]) => {
    const autoAck = value[0]
    if (autoAck !== undefined) {
      updateSettings({ auto_acknowledge_after: autoAck })
    }
  }

  const handleUpdateMaxNotifications = (value: number[]) => {
    const maxNotif = value[0]
    if (maxNotif !== undefined) {
      updateSettings({ max_notifications: maxNotif })
    }
  }

  const handleUpdateRateLimit = (field: 'max_per_minute' | 'max_per_hour', value: number[]) => {
    updateSettings({
      rate_limit: {
        ...settings.rate_limit,
        [field]: value[0]
      }
    })
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Carregando notificações...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <Tabs defaultValue="notifications" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notificações</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            
            {!isConnected && (
              <Button size="sm" variant="outline" onClick={reconnect}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reconectar
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Central de Notificações</CardTitle>
                  <CardDescription>
                    Monitore alertas de segurança e eventos críticos em tempo real
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestNotification}
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    Teste
                  </Button>
                  
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      onClick={acknowledgeAll}
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      Marcar Todas
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearAll}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar notificações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    {Object.entries(typeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Severidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Severidades</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showOnlyUnread}
                    onCheckedChange={setShowOnlyUnread}
                  />
                  <Label>Apenas não lidas</Label>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[600px]">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma notificação encontrada</h3>
                    <p className="text-muted-foreground">
                      {notifications.length === 0 
                        ? 'Não há notificações no momento'
                        : 'Tente ajustar os filtros para ver mais resultados'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotifications.map((notification) => {
                      const IconComponent = typeIcons[notification.type]
                      
                      return (
                        <Card 
                          key={notification.id} 
                          className={`transition-all hover:shadow-md ${
                            !notification.acknowledged ? 'border-l-4 border-l-blue-500' : ''
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3 flex-1">
                                <div className={`p-2 rounded-full ${
                                  notification.severity === 'critical' ? 'bg-red-100' :
                                  notification.severity === 'high' ? 'bg-orange-100' :
                                  notification.severity === 'medium' ? 'bg-yellow-100' :
                                  'bg-blue-100'
                                }`}>
                                  <IconComponent className={`h-4 w-4 ${
                                    notification.severity === 'critical' ? 'text-red-600' :
                                    notification.severity === 'high' ? 'text-orange-600' :
                                    notification.severity === 'medium' ? 'text-yellow-600' :
                                    'text-blue-600'
                                  }`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <h4 className="font-medium text-sm">{notification.title}</h4>
                                    <Badge 
                                      variant="outline" 
                                      className={severityColors[notification.severity]}
                                    >
                                      {notification.severity === 'critical' ? 'Crítica' :
                                       notification.severity === 'high' ? 'Alta' :
                                       notification.severity === 'medium' ? 'Média' : 'Baixa'}
                                    </Badge>
                                    <Badge variant="secondary">
                                      {typeLabels[notification.type]}
                                    </Badge>
                                  </div>
                                  
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {notification.message}
                                  </p>
                                  
                                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {formatDistanceToNow(new Date(notification.timestamp), {
                                          addSuffix: true,
                                          locale: ptBR
                                        })}
                                      </span>
                                    </div>
                                    
                                    {notification.user_id && (
                                      <div className="flex items-center space-x-1">
                                        <User className="h-3 w-3" />
                                        <span>{notification.user_id}</span>
                                      </div>
                                    )}
                                    
                                    {notification.ip_address && (
                                      <div className="flex items-center space-x-1">
                                        <MapPin className="h-3 w-3" />
                                        <span>{notification.ip_address}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {notification.acknowledged && (
                                    <div className="mt-2 text-xs text-green-600">
                                      ✓ Reconhecida por {notification.acknowledged_by} em{' '}
                                      {formatDistanceToNow(new Date(notification.acknowledged_at!), {
                                        addSuffix: true,
                                        locale: ptBR
                                      })}
                                    </div>
                                  )}
                                  
                                  {notification.actions && notification.actions.length > 0 && (
                                    <div className="mt-3 flex items-center space-x-2">
                                      {notification.actions.map((action) => (
                                        <Button
                                          key={action.id}
                                          size="sm"
                                          variant={action.type === 'danger' ? 'destructive' : 
                                                  action.type === 'primary' ? 'default' : 'outline'}
                                          onClick={action.action}
                                        >
                                          {action.label}
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1 ml-4">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedNotification(notification)}
                                >
                                  <Search className="h-4 w-4" />
                                </Button>
                                
                                {!notification.acknowledged && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => acknowledgeNotification(notification.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => dismissNotification(notification.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Configure como e quando receber notificações de auditoria
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* General Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Configurações Gerais</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações Habilitadas</Label>
                      <p className="text-sm text-muted-foreground">
                        Ativar ou desativar todas as notificações
                      </p>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => updateSettings({ enabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Som das Notificações</Label>
                      <p className="text-sm text-muted-foreground">
                        Reproduzir som ao receber notificações
                      </p>
                    </div>
                    <Switch
                      checked={settings.sound_enabled}
                      onCheckedChange={(checked) => updateSettings({ sound_enabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações Desktop</Label>
                      <p className="text-sm text-muted-foreground">
                        Mostrar notificações do sistema operacional
                      </p>
                    </div>
                    <Switch
                      checked={settings.desktop_notifications}
                      onCheckedChange={(checked) => updateSettings({ desktop_notifications: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar notificações críticas por email
                      </p>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={(checked) => updateSettings({ email_notifications: checked })}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Notification Types */}
              <div>
                <h3 className="text-lg font-medium mb-4">Tipos de Notificação</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {React.createElement(typeIcons[key as keyof typeof typeIcons], {
                          className: 'h-4 w-4'
                        })}
                        <span className="font-medium">{label}</span>
                      </div>
                      <Switch
                        checked={settings.types[key as keyof typeof settings.types]}
                        onCheckedChange={() => toggleNotificationType(key as keyof typeof settings.types)}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Advanced Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Configurações Avançadas</h3>
                
                <div className="space-y-6">
                  <div>
                    <Label>Limite de Severidade</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Receber apenas notificações acima desta severidade
                    </p>
                    <div className="px-3">
                      <Slider
                        value={[['low', 'medium', 'high', 'critical'].indexOf(settings.severity_threshold)]}
                        onValueChange={handleUpdateSeverityThreshold}
                        max={3}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Baixa</span>
                        <span>Média</span>
                        <span>Alta</span>
                        <span>Crítica</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Auto-reconhecimento (minutos)</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Reconhecer automaticamente notificações após este tempo
                    </p>
                    <div className="px-3">
                      <Slider
                        value={[settings.auto_acknowledge_after]}
                        onValueChange={handleUpdateAutoAcknowledge}
                        min={0}
                        max={120}
                        step={5}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-muted-foreground mt-1">
                        {settings.auto_acknowledge_after === 0 ? 'Desabilitado' : `${settings.auto_acknowledge_after} minutos`}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label>Máximo de Notificações</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Número máximo de notificações mantidas no histórico
                    </p>
                    <div className="px-3">
                      <Slider
                        value={[settings.max_notifications]}
                        onValueChange={handleUpdateMaxNotifications}
                        min={10}
                        max={500}
                        step={10}
                        className="w-full"
                      />
                      <div className="text-center text-sm text-muted-foreground mt-1">
                        {settings.max_notifications} notificações
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Rate Limiting */}
              <div>
                <h3 className="text-lg font-medium mb-4">Controle de Taxa</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Controle de Taxa Habilitado</Label>
                      <p className="text-sm text-muted-foreground">
                        Limitar o número de notificações por período
                      </p>
                    </div>
                    <Switch
                      checked={settings.rate_limit.enabled}
                      onCheckedChange={(checked) => updateSettings({
                        rate_limit: { ...settings.rate_limit, enabled: checked }
                      })}
                    />
                  </div>
                  
                  {settings.rate_limit.enabled && (
                    <>
                      <div>
                        <Label>Máximo por Minuto</Label>
                        <div className="px-3 mt-2">
                          <Slider
                            value={[settings.rate_limit.max_per_minute]}
                            onValueChange={(value) => handleUpdateRateLimit('max_per_minute', value)}
                            min={1}
                            max={50}
                            step={1}
                            className="w-full"
                          />
                          <div className="text-center text-sm text-muted-foreground mt-1">
                            {settings.rate_limit.max_per_minute} notificações/minuto
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Máximo por Hora</Label>
                        <div className="px-3 mt-2">
                          <Slider
                            value={[settings.rate_limit.max_per_hour]}
                            onValueChange={(value) => handleUpdateRateLimit('max_per_hour', value)}
                            min={10}
                            max={200}
                            step={5}
                            className="w-full"
                          />
                          <div className="text-center text-sm text-muted-foreground mt-1">
                            {settings.rate_limit.max_per_hour} notificações/hora
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Details Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Notificação</DialogTitle>
            <DialogDescription>
              Informações completas sobre a notificação selecionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <p className="text-sm">{typeLabels[selectedNotification.type as keyof typeof typeLabels]}</p>
                </div>
                <div>
                  <Label>Severidade</Label>
                  <Badge className={severityColors[selectedNotification.severity as keyof typeof severityColors]}>
                    {selectedNotification.severity === 'critical' ? 'Crítica' :
                     selectedNotification.severity === 'high' ? 'Alta' :
                     selectedNotification.severity === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Título</Label>
                <p className="text-sm">{selectedNotification.title}</p>
              </div>
              
              <div>
                <Label>Mensagem</Label>
                <p className="text-sm">{selectedNotification.message}</p>
              </div>
              
              {selectedNotification.details && (
                <div>
                  <Label>Detalhes</Label>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                    {JSON.stringify(selectedNotification.details, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Timestamp</Label>
                  <p className="text-sm">
                    {new Date(selectedNotification.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="text-sm">
                    {selectedNotification.acknowledged ? 'Reconhecida' : 'Pendente'}
                  </p>
                </div>
              </div>
              
              {selectedNotification.acknowledged && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reconhecida por</Label>
                    <p className="text-sm">{selectedNotification.acknowledged_by}</p>
                  </div>
                  <div>
                    <Label>Reconhecida em</Label>
                    <p className="text-sm">
                      {new Date(selectedNotification.acknowledged_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}