'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuditAlerts } from '@/hooks/useAuditAlerts'
import { 
  AlertTriangle, 
  Shield, 
  Bell, 
  BellOff,
  Eye,
  EyeOff,
  Check,
  X,
  Plus,
  Settings,
  Filter,
  Search,
  Clock,
  User,
  MapPin,
  Activity,
  RefreshCw,
  Download,
  Trash2,
  Edit,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditAlertsProps {
  className?: string
  showRules?: boolean
  autoRefresh?: boolean
}

const SEVERITY_CONFIG = {
  low: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle
  },
  medium: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: AlertCircle
  },
  high: {
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: AlertTriangle
  },
  critical: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: XCircle
  }
}

export function AuditAlerts({ 
  className,
  showRules = true,
  autoRefresh = true
}: AuditAlertsProps) {
  const [activeTab, setActiveTab] = useState('alerts')
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<any>(null)
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    condition: '',
    severity: 'medium' as const,
    enabled: true,
    threshold: 5,
    timeWindow: 300
  })

  const {
    alerts,
    rules,
    unacknowledgedCount,
    loading,
    error,
    acknowledgeAlert,
    dismissAlert,
    createRule,
    updateRule,
    deleteRule,
    testRule,
    refresh,
    simulateAlert
  } = useAuditAlerts({
    autoRefresh,
    enableRealTime: true,
    refreshInterval: 30000
  })

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !searchTerm || 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSeverity = !severityFilter || alert.severity === severityFilter
    const matchesStatus = !statusFilter || 
      (statusFilter === 'acknowledged' && alert.acknowledged) ||
      (statusFilter === 'unacknowledged' && !alert.acknowledged)
    
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId)
      toast.success('Alerta reconhecido')
    } catch (error) {
      toast.error('Erro ao reconhecer alerta')
    }
  }

  const handleDismissAlert = async (alertId: string) => {
    try {
      await dismissAlert(alertId)
      toast.success('Alerta descartado')
    } catch (error) {
      toast.error('Erro ao descartar alerta')
    }
  }

  const handleCreateRule = async () => {
    try {
      await createRule(newRule)
      setIsRuleDialogOpen(false)
      setNewRule({
        name: '',
        description: '',
        condition: '',
        severity: 'medium',
        enabled: true,
        threshold: 5,
        timeWindow: 300
      })
      toast.success('Regra criada com sucesso')
    } catch (error) {
      toast.error('Erro ao criar regra')
    }
  }

  const handleUpdateRule = async (ruleId: string, updates: any) => {
    try {
      await updateRule(ruleId, updates)
      toast.success('Regra atualizada')
    } catch (error) {
      toast.error('Erro ao atualizar regra')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule(ruleId)
      toast.success('Regra removida')
    } catch (error) {
      toast.error('Erro ao remover regra')
    }
  }

  const handleTestRule = async (ruleId: string) => {
    try {
      const result = await testRule(ruleId)
      toast.info(`Teste da regra: ${result.matches} correspondências encontradas`)
    } catch (error) {
      toast.error('Erro ao testar regra')
    }
  }

  const handleSimulateAlert = async () => {
    try {
      await simulateAlert()
      toast.success('Alerta de teste criado')
    } catch (error) {
      toast.error('Erro ao simular alerta')
    }
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Erro ao carregar alertas: {error}</p>
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
              <Shield className="h-5 w-5" />
              Alertas de Segurança
              {unacknowledgedCount > 0 && (
                <Badge variant="destructive">
                  {unacknowledgedCount}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Sistema de monitoramento e alertas em tempo real
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSimulateAlert} variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Simular
            </Button>
            <Button onClick={refresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alertas
              {unacknowledgedCount > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unacknowledgedCount}
                </Badge>
              )}
            </TabsTrigger>
            {showRules && (
              <TabsTrigger value="rules" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Regras ({rules.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar alertas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="acknowledged">Reconhecidos</SelectItem>
                  <SelectItem value="unacknowledged">Não reconhecidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alerts List */}
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Carregando alertas...</span>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum alerta encontrado</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {alerts.length === 0 ? 'Sistema seguro - nenhum alerta ativo' : 'Tente ajustar os filtros'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => {
                    const severityConfig = SEVERITY_CONFIG[alert.severity]
                    const SeverityIcon = severityConfig.icon
                    
                    return (
                      <Card 
                        key={alert.id} 
                        className={`${severityConfig.borderColor} ${alert.acknowledged ? 'opacity-60' : ''} hover:shadow-md transition-shadow cursor-pointer`}
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 p-2 rounded-full ${severityConfig.bgColor}`}>
                              <SeverityIcon className={`h-5 w-5 ${severityConfig.color}`} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-sm">{alert.title}</h4>
                                <Badge 
                                  variant={alert.acknowledged ? 'secondary' : 'destructive'}
                                  className="text-xs"
                                >
                                  {alert.severity}
                                </Badge>
                                {alert.acknowledged && (
                                  <Badge variant="outline" className="text-xs">
                                    <Check className="h-3 w-3 mr-1" />
                                    Reconhecido
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mb-3">
                                {alert.description}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                                </span>
                                <span>
                                  {formatDistanceToNow(new Date(alert.timestamp), { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </span>
                                {alert.userEmail && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {alert.userEmail}
                                  </span>
                                )}
                                {alert.ipAddress && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {alert.ipAddress}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!alert.acknowledged && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAcknowledgeAlert(alert.id)
                                  }}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Reconhecer
                                </Button>
                              )}
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDismissAlert(alert.id)
                                }}
                                size="sm"
                                variant="outline"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Descartar
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
          </TabsContent>

          {showRules && (
            <TabsContent value="rules" className="space-y-4">
              {/* Rules Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Regras de Alerta</h3>
                  <p className="text-sm text-gray-600">
                    Configure condições para detectar atividades suspeitas
                  </p>
                </div>
                <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Regra
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingRule ? 'Editar Regra' : 'Nova Regra de Alerta'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure as condições para gerar alertas automáticos
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="rule-name">Nome da Regra</Label>
                          <Input
                            id="rule-name"
                            value={newRule.name}
                            onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                            placeholder="Ex: Múltiplas tentativas de login"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rule-severity">Severidade</Label>
                          <Select 
                            value={newRule.severity} 
                            onValueChange={(value: any) => setNewRule({ ...newRule, severity: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                              <SelectItem value="critical">Crítica</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="rule-description">Descrição</Label>
                        <Textarea
                          id="rule-description"
                          value={newRule.description}
                          onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                          placeholder="Descreva quando este alerta deve ser acionado"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="rule-condition">Condição SQL</Label>
                        <Textarea
                          id="rule-condition"
                          value={newRule.condition}
                          onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                          placeholder="SELECT COUNT(*) FROM audit_logs WHERE operation = 'DELETE' AND timestamp > NOW() - INTERVAL '1 hour'"
                          className="font-mono text-sm"
                        />
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="rule-threshold">Limite (threshold)</Label>
                          <Input
                            id="rule-threshold"
                            type="number"
                            value={newRule.threshold}
                            onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) })}
                            min="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rule-timewindow">Janela de Tempo (segundos)</Label>
                          <Input
                            id="rule-timewindow"
                            type="number"
                            value={newRule.timeWindow}
                            onChange={(e) => setNewRule({ ...newRule, timeWindow: parseInt(e.target.value) })}
                            min="60"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="rule-enabled"
                          checked={newRule.enabled}
                          onCheckedChange={(checked) => setNewRule({ ...newRule, enabled: checked })}
                        />
                        <Label htmlFor="rule-enabled">Regra ativa</Label>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateRule}>
                        {editingRule ? 'Atualizar' : 'Criar'} Regra
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Rules List */}
              <div className="space-y-4">
                {rules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{rule.name}</h4>
                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                              {rule.enabled ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <Badge variant="outline">{rule.severity}</Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {rule.description}
                          </p>
                          
                          <div className="text-xs text-gray-500">
                            <span>Limite: {rule.threshold}</span>
                            <span className="mx-2">•</span>
                            <span>Janela: {rule.timeWindow}s</span>
                            {rule.lastTriggered && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Último disparo: {format(new Date(rule.lastTriggered), 'dd/MM/yyyy HH:mm')}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleTestRule(rule.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Testar
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingRule(rule)
                              setNewRule(rule)
                              setIsRuleDialogOpen(true)
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            onClick={() => handleDeleteRule(rule.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {rules.length === 0 && (
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma regra configurada</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Crie regras para detectar automaticamente atividades suspeitas
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
      
      {/* Alert Detail Dialog */}
      {selectedAlert && (
        <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {React.createElement(SEVERITY_CONFIG[selectedAlert.severity].icon, {
                  className: `h-5 w-5 ${SEVERITY_CONFIG[selectedAlert.severity].color}`
                })}
                {selectedAlert.title}
              </DialogTitle>
              <DialogDescription>
                Detalhes do alerta de segurança
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedAlert.description}
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Severidade</Label>
                  <Badge className="mt-1">{selectedAlert.severity}</Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedAlert.acknowledged ? 'secondary' : 'destructive'} className="mt-1">
                    {selectedAlert.acknowledged ? 'Reconhecido' : 'Pendente'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Data/Hora</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(selectedAlert.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <Label>Há quanto tempo</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDistanceToNow(new Date(selectedAlert.timestamp), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </p>
                </div>
              </div>
              
              {(selectedAlert.userEmail || selectedAlert.ipAddress) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {selectedAlert.userEmail && (
                    <div>
                      <Label>Usuário</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedAlert.userEmail}
                      </p>
                    </div>
                  )}
                  {selectedAlert.ipAddress && (
                    <div>
                      <Label>Endereço IP</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedAlert.ipAddress}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {selectedAlert.metadata && (
                <div>
                  <Label>Metadados</Label>
                  <pre className="text-xs bg-gray-50 p-3 rounded mt-1 overflow-auto">
                    {JSON.stringify(selectedAlert.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedAlert(null)}>
                Fechar
              </Button>
              {!selectedAlert.acknowledged && (
                <Button onClick={() => {
                  handleAcknowledgeAlert(selectedAlert.id)
                  setSelectedAlert(null)
                }}>
                  <Check className="h-4 w-4 mr-2" />
                  Reconhecer
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}