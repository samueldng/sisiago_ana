'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface AuditNotification {
  id: string
  type: 'security_alert' | 'system_anomaly' | 'compliance_violation' | 'performance_issue' | 'data_breach' | 'unauthorized_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  details?: Record<string, any>
  user_id?: string
  session_id?: string
  ip_address?: string
  user_agent?: string
  table_name?: string
  operation?: string
  timestamp: string
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
  auto_dismiss?: boolean
  dismiss_after?: number // seconds
  actions?: NotificationAction[]
  metadata?: Record<string, any>
}

interface NotificationAction {
  id: string
  label: string
  type: 'primary' | 'secondary' | 'danger'
  action: () => void | Promise<void>
}

interface NotificationSettings {
  enabled: boolean
  types: {
    security_alert: boolean
    system_anomaly: boolean
    compliance_violation: boolean
    performance_issue: boolean
    data_breach: boolean
    unauthorized_access: boolean
  }
  severity_threshold: 'low' | 'medium' | 'high' | 'critical'
  sound_enabled: boolean
  desktop_notifications: boolean
  email_notifications: boolean
  auto_acknowledge_after: number // minutes
  max_notifications: number
  rate_limit: {
    enabled: boolean
    max_per_minute: number
    max_per_hour: number
  }
}

interface UseAuditNotificationsOptions {
  enableRealTime?: boolean
  enableSound?: boolean
  enableDesktop?: boolean
  maxNotifications?: number
  autoAcknowledgeAfter?: number
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical'
}

interface UseAuditNotificationsReturn {
  notifications: AuditNotification[]
  unreadCount: number
  settings: NotificationSettings
  loading: boolean
  error: string | null
  
  // Notification management
  acknowledgeNotification: (id: string) => Promise<void>
  acknowledgeAll: () => Promise<void>
  dismissNotification: (id: string) => void
  clearAll: () => void
  
  // Settings management
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>
  toggleNotificationType: (type: keyof NotificationSettings['types']) => Promise<void>
  
  // Manual notifications
  createNotification: (notification: Omit<AuditNotification, 'id' | 'timestamp' | 'acknowledged'>) => void
  
  // Utility functions
  getNotificationsByType: (type: AuditNotification['type']) => AuditNotification[]
  getNotificationsBySeverity: (severity: AuditNotification['severity']) => AuditNotification[]
  getUnacknowledgedNotifications: () => AuditNotification[]
  
  // Real-time status
  isConnected: boolean
  reconnect: () => void
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  types: {
    security_alert: true,
    system_anomaly: true,
    compliance_violation: true,
    performance_issue: false,
    data_breach: true,
    unauthorized_access: true
  },
  severity_threshold: 'medium',
  sound_enabled: true,
  desktop_notifications: true,
  email_notifications: false,
  auto_acknowledge_after: 30,
  max_notifications: 100,
  rate_limit: {
    enabled: true,
    max_per_minute: 10,
    max_per_hour: 50
  }
}

export const useAuditNotifications = (options: UseAuditNotificationsOptions = {}): UseAuditNotificationsReturn => {
  const {
    enableRealTime = true,
    enableSound = true,
    enableDesktop = true,
    maxNotifications = 100,
    autoAcknowledgeAfter = 30,
    severityThreshold = 'medium'
  } = options

  const [notifications, setNotifications] = useState<AuditNotification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  const subscriptionRef = useRef<any>(null)
  const rateLimitRef = useRef({ minute: 0, hour: 0, lastMinute: 0, lastHour: 0 })
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio for notifications
  useEffect(() => {
    if (enableSound) {
      audioRef.current = new Audio('/sounds/notification.mp3')
      audioRef.current.volume = 0.5
    }
  }, [enableSound])

  // Request desktop notification permission
  useEffect(() => {
    if (enableDesktop && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [enableDesktop])

  // Load initial data and settings
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Simulate API call to fetch notifications
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockNotifications: AuditNotification[] = [
        {
          id: 'notif_1',
          type: 'security_alert',
          severity: 'high',
          title: 'Tentativas de Login Suspeitas',
          message: 'Detectadas 5 tentativas de login falhadas em 2 minutos do IP 192.168.1.100',
          details: {
            ip_address: '192.168.1.100',
            attempts: 5,
            time_window: '2 minutos',
            user_attempted: 'admin@sisiago.com'
          },
          ip_address: '192.168.1.100',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          acknowledged: false,
          actions: [
            {
              id: 'block_ip',
              label: 'Bloquear IP',
              type: 'danger',
              action: async () => {
                toast.success('IP bloqueado com sucesso')
              }
            },
            {
              id: 'investigate',
              label: 'Investigar',
              type: 'primary',
              action: async () => {
                toast.info('Abrindo investigação...')
              }
            }
          ]
        },
        {
          id: 'notif_2',
          type: 'data_breach',
          severity: 'critical',
          title: 'Possível Vazamento de Dados',
          message: 'Acesso não autorizado detectado na tabela de usuários',
          details: {
            table_name: 'users',
            operation: 'SELECT',
            records_accessed: 1500,
            unauthorized_user: 'guest_user'
          },
          table_name: 'users',
          operation: 'SELECT',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          acknowledged: false,
          actions: [
            {
              id: 'revoke_access',
              label: 'Revogar Acesso',
              type: 'danger',
              action: async () => {
                toast.success('Acesso revogado')
              }
            },
            {
              id: 'audit_trail',
              label: 'Ver Trilha de Auditoria',
              type: 'secondary',
              action: async () => {
                toast.info('Abrindo trilha de auditoria...')
              }
            }
          ]
        },
        {
          id: 'notif_3',
          type: 'compliance_violation',
          severity: 'medium',
          title: 'Violação de Política de Retenção',
          message: 'Dados mantidos além do período permitido pela LGPD',
          details: {
            policy: 'LGPD Data Retention',
            violation_type: 'Retention Period Exceeded',
            affected_records: 250,
            days_overdue: 15
          },
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          acknowledged: true,
          acknowledged_by: 'compliance@sisiago.com',
          acknowledged_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
        },
        {
          id: 'notif_4',
          type: 'system_anomaly',
          severity: 'high',
          title: 'Atividade Anômala Detectada',
          message: 'Padrão de acesso incomum detectado fora do horário comercial',
          details: {
            user_id: 'user_123',
            access_time: '02:30 AM',
            location: 'São Paulo, BR',
            usual_location: 'Rio de Janeiro, BR',
            risk_score: 85
          },
          user_id: 'user_123',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          acknowledged: false,
          auto_dismiss: true,
          dismiss_after: 3600
        }
      ]
      
      setNotifications(mockNotifications)
      
      // Load settings from localStorage or API
      const savedSettings = localStorage.getItem('audit_notification_settings')
      if (savedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err)
      setError('Erro ao carregar notificações')
      toast.error('Erro ao carregar notificações')
    } finally {
      setLoading(false)
    }
  }, [])

  // Setup real-time subscription
  const setupRealTimeSubscription = useCallback(() => {
    if (!enableRealTime) return

    try {
      // Simulate real-time connection
      setIsConnected(true)
      
      // Simulate receiving real-time notifications
      const interval = setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance every 30 seconds
          const newNotification: AuditNotification = {
            id: `notif_${Date.now()}`,
            type: ['security_alert', 'system_anomaly', 'compliance_violation'][Math.floor(Math.random() * 3)] as any,
            severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
            title: 'Nova Atividade Detectada',
            message: 'Uma nova atividade suspeita foi detectada no sistema',
            timestamp: new Date().toISOString(),
            acknowledged: false
          }
          
          handleNewNotification(newNotification)
        }
      }, 30000) // Check every 30 seconds
      
      subscriptionRef.current = { unsubscribe: () => clearInterval(interval) }
    } catch (err) {
      console.error('Erro ao configurar subscrição em tempo real:', err)
      setIsConnected(false)
    }
  }, [enableRealTime])

  // Handle new notification
  const handleNewNotification = useCallback((notification: AuditNotification) => {
    // Check rate limiting
    const now = Date.now()
    const currentMinute = Math.floor(now / 60000)
    const currentHour = Math.floor(now / 3600000)
    
    if (settings.rate_limit.enabled) {
      if (rateLimitRef.current.lastMinute !== currentMinute) {
        rateLimitRef.current.minute = 0
        rateLimitRef.current.lastMinute = currentMinute
      }
      if (rateLimitRef.current.lastHour !== currentHour) {
        rateLimitRef.current.hour = 0
        rateLimitRef.current.lastHour = currentHour
      }
      
      if (rateLimitRef.current.minute >= settings.rate_limit.max_per_minute ||
          rateLimitRef.current.hour >= settings.rate_limit.max_per_hour) {
        console.warn('Rate limit exceeded for notifications')
        return
      }
      
      rateLimitRef.current.minute++
      rateLimitRef.current.hour++
    }
    
    // Check if notification type is enabled
    if (!settings.enabled || !settings.types[notification.type]) {
      return
    }
    
    // Check severity threshold
    const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 }
    if (severityLevels[notification.severity] < severityLevels[settings.severity_threshold]) {
      return
    }
    
    // Add notification
    setNotifications(prev => {
      const updated = [notification, ...prev]
      return updated.slice(0, settings.max_notifications)
    })
    
    // Show toast notification
    const toastOptions = {
      duration: notification.severity === 'critical' ? 10000 : 5000,
      action: notification.actions ? {
        label: notification.actions[0]?.label || 'Ação',
        onClick: notification.actions[0]?.action
      } : undefined
    }
    
    switch (notification.severity) {
      case 'critical':
        toast.error(notification.title, toastOptions)
        break
      case 'high':
        toast.warning(notification.title, toastOptions)
        break
      case 'medium':
        toast.info(notification.title, toastOptions)
        break
      default:
        toast(notification.title, toastOptions)
    }
    
    // Play sound
    if (settings.sound_enabled && audioRef.current) {
      audioRef.current.play().catch(console.error)
    }
    
    // Show desktop notification
    if (settings.desktop_notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/notification.png',
        tag: notification.id
      })
    }
    
    // Auto-acknowledge if configured
    if (notification.auto_dismiss && notification.dismiss_after) {
      setTimeout(() => {
        acknowledgeNotification(notification.id)
      }, notification.dismiss_after * 1000)
    }
  }, [settings])

  // Acknowledge notification
  const acknowledgeNotification = useCallback(async (id: string) => {
    try {
      setNotifications(prev => prev.map(notif => 
        notif.id === id 
          ? { 
              ...notif, 
              acknowledged: true, 
              acknowledged_by: 'current_user@sisiago.com',
              acknowledged_at: new Date().toISOString()
            }
          : notif
      ))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200))
      
      toast.success('Notificação reconhecida')
    } catch (err) {
      console.error('Erro ao reconhecer notificação:', err)
      toast.error('Erro ao reconhecer notificação')
    }
  }, [])

  // Acknowledge all notifications
  const acknowledgeAll = useCallback(async () => {
    try {
      const unacknowledged = notifications.filter(n => !n.acknowledged)
      
      setNotifications(prev => prev.map(notif => 
        !notif.acknowledged 
          ? { 
              ...notif, 
              acknowledged: true, 
              acknowledged_by: 'current_user@sisiago.com',
              acknowledged_at: new Date().toISOString()
            }
          : notif
      ))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast.success(`${unacknowledged.length} notificações reconhecidas`)
    } catch (err) {
      console.error('Erro ao reconhecer todas as notificações:', err)
      toast.error('Erro ao reconhecer notificações')
    }
  }, [notifications])

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
    toast.success('Notificação removida')
  }, [])

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([])
    toast.success('Todas as notificações foram removidas')
  }, [])

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updated = { ...settings, ...newSettings }
      setSettings(updated)
      
      // Save to localStorage
      localStorage.setItem('audit_notification_settings', JSON.stringify(updated))
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 200))
      
      toast.success('Configurações atualizadas')
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err)
      toast.error('Erro ao atualizar configurações')
    }
  }, [settings])

  // Toggle notification type
  const toggleNotificationType = useCallback(async (type: keyof NotificationSettings['types']) => {
    const newTypes = {
      ...settings.types,
      [type]: !settings.types[type]
    }
    
    await updateSettings({ types: newTypes })
  }, [settings, updateSettings])

  // Create manual notification
  const createNotification = useCallback((notification: Omit<AuditNotification, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newNotification: AuditNotification = {
      ...notification,
      id: `manual_${Date.now()}`,
      timestamp: new Date().toISOString(),
      acknowledged: false
    }
    
    handleNewNotification(newNotification)
  }, [handleNewNotification])

  // Utility functions
  const getNotificationsByType = useCallback((type: AuditNotification['type']) => {
    return notifications.filter(n => n.type === type)
  }, [notifications])

  const getNotificationsBySeverity = useCallback((severity: AuditNotification['severity']) => {
    return notifications.filter(n => n.severity === severity)
  }, [notifications])

  const getUnacknowledgedNotifications = useCallback(() => {
    return notifications.filter(n => !n.acknowledged)
  }, [notifications])

  // Reconnect function
  const reconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }
    setupRealTimeSubscription()
  }, [setupRealTimeSubscription])

  // Auto-acknowledge based on settings
  useEffect(() => {
    if (settings.auto_acknowledge_after > 0) {
      const interval = setInterval(() => {
        const cutoff = new Date(Date.now() - settings.auto_acknowledge_after * 60 * 1000)
        
        setNotifications(prev => prev.map(notif => {
          if (!notif.acknowledged && new Date(notif.timestamp) < cutoff) {
            return {
              ...notif,
              acknowledged: true,
              acknowledged_by: 'system_auto',
              acknowledged_at: new Date().toISOString()
            }
          }
          return notif
        }))
      }, 60000) // Check every minute
      
      return () => clearInterval(interval)
    }
  }, [settings.auto_acknowledge_after])

  // Initialize
  useEffect(() => {
    fetchNotifications()
    setupRealTimeSubscription()
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.acknowledged).length

  return {
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
    getNotificationsByType,
    getNotificationsBySeverity,
    getUnacknowledgedNotifications,
    isConnected,
    reconnect
  }
}