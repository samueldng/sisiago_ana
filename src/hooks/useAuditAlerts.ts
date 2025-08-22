import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export interface SecurityAlert {
  id: string
  type: 'suspicious_activity' | 'failed_login' | 'unusual_pattern' | 'data_breach' | 'privilege_escalation' | 'bulk_operation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  userId?: string
  userEmail?: string
  tableName?: string
  operation?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
  metadata?: Record<string, any>
}

export interface AlertRule {
  id: string
  name: string
  type: SecurityAlert['type']
  enabled: boolean
  conditions: {
    timeWindow?: number // minutes
    threshold?: number
    pattern?: string
    tables?: string[]
    operations?: string[]
    userRoles?: string[]
  }
  severity: SecurityAlert['severity']
  notificationChannels: ('toast' | 'email' | 'webhook')[] 
}

export interface UseAuditAlertsOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  enableRealTime?: boolean
  maxAlerts?: number
  autoAcknowledgeAfter?: number // minutes
}

export interface UseAuditAlertsReturn {
  alerts: SecurityAlert[]
  unacknowledgedCount: number
  loading: boolean
  error: string | null
  rules: AlertRule[]
  acknowledgeAlert: (alertId: string) => Promise<void>
  acknowledgeAll: () => Promise<void>
  dismissAlert: (alertId: string) => Promise<void>
  createRule: (rule: Omit<AlertRule, 'id'>) => Promise<void>
  updateRule: (ruleId: string, updates: Partial<AlertRule>) => Promise<void>
  deleteRule: (ruleId: string) => Promise<void>
  testRule: (rule: AlertRule) => Promise<SecurityAlert[]>
  refresh: () => void
  clearAll: () => void
}

const DEFAULT_REFRESH_INTERVAL = 30000 // 30 seconds
const DEFAULT_MAX_ALERTS = 100

// Default alert rules
const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'failed-logins',
    name: 'Múltiplas tentativas de login falhadas',
    type: 'failed_login',
    enabled: true,
    conditions: {
      timeWindow: 15,
      threshold: 5
    },
    severity: 'high',
    notificationChannels: ['toast', 'email']
  },
  {
    id: 'bulk-delete',
    name: 'Operações de exclusão em massa',
    type: 'bulk_operation',
    enabled: true,
    conditions: {
      timeWindow: 5,
      threshold: 10,
      operations: ['DELETE']
    },
    severity: 'critical',
    notificationChannels: ['toast', 'email', 'webhook']
  },
  {
    id: 'privilege-escalation',
    name: 'Possível escalação de privilégios',
    type: 'privilege_escalation',
    enabled: true,
    conditions: {
      timeWindow: 60,
      threshold: 1,
      tables: ['users', 'user_roles']
    },
    severity: 'critical',
    notificationChannels: ['toast', 'email', 'webhook']
  },
  {
    id: 'unusual-hours',
    name: 'Atividade fora do horário comercial',
    type: 'unusual_pattern',
    enabled: true,
    conditions: {
      timeWindow: 60,
      threshold: 5
    },
    severity: 'medium',
    notificationChannels: ['toast']
  }
]

export function useAuditAlerts(options: UseAuditAlertsOptions = {}): UseAuditAlertsReturn {
  const {
    autoRefresh = true,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    enableRealTime = true,
    maxAlerts = DEFAULT_MAX_ALERTS,
    autoAcknowledgeAfter
  } = options

  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rules, setRules] = useState<AlertRule[]>(DEFAULT_RULES)
  const realtimeSubscription = useRef<any>(null)

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // In a real implementation, this would fetch from an API
      // For now, we'll simulate some alerts
      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'failed_login',
          severity: 'high',
          title: 'Múltiplas tentativas de login falhadas',
          description: '5 tentativas de login falhadas em 10 minutos do IP 192.168.1.100',
          userId: 'user123',
          userEmail: 'usuario@exemplo.com',
          ipAddress: '192.168.1.100',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          acknowledged: false,
          metadata: {
            attemptCount: 5,
            timeWindow: 10
          }
        },
        {
          id: '2',
          type: 'bulk_operation',
          severity: 'critical',
          title: 'Operação de exclusão em massa detectada',
          description: '15 registros excluídos da tabela produtos em 2 minutos',
          userId: 'admin456',
          userEmail: 'admin@exemplo.com',
          tableName: 'produtos',
          operation: 'DELETE',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          acknowledged: false,
          metadata: {
            recordCount: 15,
            timeWindow: 2
          }
        }
      ]
      
      setAlerts(prev => {
        const combined = [...mockAlerts, ...prev.filter(alert => 
          !mockAlerts.some(mock => mock.id === alert.id)
        )]
        return combined.slice(0, maxAlerts)
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar alertas'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [maxAlerts])

  const analyzeAuditLogs = useCallback(async () => {
    // This would analyze recent audit logs against rules to generate alerts
    // For now, we'll simulate the analysis
    const newAlerts: SecurityAlert[] = []
    
    for (const rule of rules.filter(r => r.enabled)) {
      // Simulate rule evaluation
      if (Math.random() > 0.95) { // 5% chance of triggering an alert
        const alert: SecurityAlert = {
          id: `alert-${Date.now()}-${Math.random()}`,
          type: rule.type,
          severity: rule.severity,
          title: rule.name,
          description: `Regra "${rule.name}" foi acionada`,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          metadata: {
            ruleId: rule.id,
            conditions: rule.conditions
          }
        }
        
        newAlerts.push(alert)
        
        // Show notification based on rule settings
        if (rule.notificationChannels.includes('toast')) {
          toast.error(`🚨 ${alert.title}`, {
            description: alert.description,
            duration: 10000
          })
        }
      }
    }
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, maxAlerts))
    }
  }, [rules, maxAlerts])

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              acknowledged: true, 
              acknowledgedAt: new Date().toISOString(),
              acknowledgedBy: 'current-user' // In real app, get from auth context
            }
          : alert
      ))
      
      toast.success('Alerta reconhecido')
    } catch (err) {
      toast.error('Erro ao reconhecer alerta')
    }
  }, [])

  const acknowledgeAll = useCallback(async () => {
    try {
      const now = new Date().toISOString()
      setAlerts(prev => prev.map(alert => ({
        ...alert,
        acknowledged: true,
        acknowledgedAt: now,
        acknowledgedBy: 'current-user'
      })))
      
      toast.success('Todos os alertas foram reconhecidos')
    } catch (err) {
      toast.error('Erro ao reconhecer todos os alertas')
    }
  }, [])

  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      toast.success('Alerta removido')
    } catch (err) {
      toast.error('Erro ao remover alerta')
    }
  }, [])

  const createRule = useCallback(async (rule: Omit<AlertRule, 'id'>) => {
    try {
      const newRule: AlertRule = {
        ...rule,
        id: `rule-${Date.now()}`
      }
      
      setRules(prev => [...prev, newRule])
      toast.success('Regra de alerta criada')
    } catch (err) {
      toast.error('Erro ao criar regra')
    }
  }, [])

  const updateRule = useCallback(async (ruleId: string, updates: Partial<AlertRule>) => {
    try {
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ))
      
      toast.success('Regra atualizada')
    } catch (err) {
      toast.error('Erro ao atualizar regra')
    }
  }, [])

  const deleteRule = useCallback(async (ruleId: string) => {
    try {
      setRules(prev => prev.filter(rule => rule.id !== ruleId))
      toast.success('Regra removida')
    } catch (err) {
      toast.error('Erro ao remover regra')
    }
  }, [])

  const testRule = useCallback(async (rule: AlertRule): Promise<SecurityAlert[]> => {
    // Simulate rule testing
    const testAlert: SecurityAlert = {
      id: `test-${Date.now()}`,
      type: rule.type,
      severity: rule.severity,
      title: `[TESTE] ${rule.name}`,
      description: 'Este é um alerta de teste',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      metadata: {
        isTest: true,
        ruleId: rule.id
      }
    }
    
    return [testAlert]
  }, [])

  const refresh = useCallback(() => {
    fetchAlerts()
    analyzeAuditLogs()
  }, [fetchAlerts, analyzeAuditLogs])

  const clearAll = useCallback(() => {
    setAlerts([])
    toast.success('Todos os alertas foram removidos')
  }, [])

  // Auto-acknowledge old alerts
  useEffect(() => {
    if (!autoAcknowledgeAfter) return
    
    const interval = setInterval(() => {
      const cutoff = new Date(Date.now() - autoAcknowledgeAfter * 60 * 1000)
      
      setAlerts(prev => prev.map(alert => {
        if (!alert.acknowledged && new Date(alert.timestamp) < cutoff) {
          return {
            ...alert,
            acknowledged: true,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: 'system-auto'
          }
        }
        return alert
      }))
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [autoAcknowledgeAfter])

  // Initial load
  useEffect(() => {
    fetchAlerts()
  }, [])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      analyzeAuditLogs()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, analyzeAuditLogs])

  // Real-time subscription
  useEffect(() => {
    if (!enableRealTime) return

    // Subscribe to audit_logs table for real-time analysis
    realtimeSubscription.current = supabase
      .channel('audit-alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'audit_logs' },
        (payload) => {
          // Analyze new audit log entry against rules
          analyzeAuditLogs()
        }
      )
      .subscribe()

    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe()
      }
    }
  }, [enableRealTime, analyzeAuditLogs])

  return {
    alerts,
    unacknowledgedCount,
    loading,
    error,
    rules,
    acknowledgeAlert,
    acknowledgeAll,
    dismissAlert,
    createRule,
    updateRule,
    deleteRule,
    testRule,
    refresh,
    clearAll
  }
}