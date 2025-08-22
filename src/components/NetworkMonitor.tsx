'use client'

import { useEffect, useState } from 'react'
import { usePDVStore } from '@/stores/pdvStore'
import { toast } from 'react-hot-toast'
import { Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NetworkStatus {
  isOnline: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
  saveData?: boolean
}

interface NetworkMonitorProps {
  showIndicator?: boolean
  className?: string
}

export function NetworkMonitor({ 
  showIndicator = true, 
  className 
}: NetworkMonitorProps) {
  const { isOnline, setIsOnline, updateLastSyncTime } = usePDVStore()
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true
  })
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good')
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // Detectar mudanças de conectividade
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setNetworkStatus(prev => ({ ...prev, isOnline: online }))
      setIsOnline(online)
      
      if (online) {
        if (lastOfflineTime) {
          const offlineDuration = Date.now() - lastOfflineTime.getTime()
          const durationMinutes = Math.round(offlineDuration / 60000)
          
          toast.success(
            `🌐 Conexão restaurada${durationMinutes > 0 ? ` após ${durationMinutes}min offline` : ''}`,
            { 
              duration: 3000,
              id: 'connection-restored' // Evitar toasts duplicados
            }
          )
          
          setLastOfflineTime(null)
          setReconnectAttempts(0)
        }
        updateLastSyncTime()
      } else {
        setLastOfflineTime(new Date())
        toast.error(
          '📴 Conexão perdida. Funcionando offline.',
          { 
            duration: 5000,
            id: 'connection-lost' // Evitar toasts duplicados
          }
        )
      }
    }

    // Event listeners para mudanças de conectividade
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Verificação inicial
    updateOnlineStatus()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [setIsOnline, updateLastSyncTime, lastOfflineTime])

  // Monitorar qualidade da conexão (se disponível)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const updateNetworkInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        
        setNetworkStatus(prev => ({
          ...prev,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        }))
        
        // Determinar qualidade da conexão
        if (connection.effectiveType === '4g' && connection.downlink > 1.5) {
          setConnectionQuality('good')
        } else if (connection.effectiveType === '3g' || connection.downlink > 0.5) {
          setConnectionQuality('fair')
        } else {
          setConnectionQuality('poor')
        }
      }
    }

    updateNetworkInfo()
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection.addEventListener('change', updateNetworkInfo)
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [])

  // Teste de conectividade periódico
  useEffect(() => {
    if (typeof window === 'undefined' || !isOnline) return

    const testConnectivity = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('/api/health', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          setReconnectAttempts(0)
          updateLastSyncTime()
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        console.warn('⚠️ Teste de conectividade falhou:', error)
        setReconnectAttempts(prev => prev + 1)
        
        // Se falhar muitas vezes, considerar offline
        if (reconnectAttempts >= 3) {
          setIsOnline(false)
          toast.error(
            '📡 Problemas de conectividade detectados',
            { 
              duration: 4000,
              id: 'connectivity-issues' // Evitar toasts duplicados
            }
          )
        }
      }
    }

    // Testar conectividade a cada 30 segundos
    const interval = setInterval(testConnectivity, 30000)
    
    // Teste inicial após 5 segundos
    const initialTest = setTimeout(testConnectivity, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(initialTest)
    }
  }, [isOnline, reconnectAttempts, setIsOnline, updateLastSyncTime])

  // Não renderizar se não deve mostrar indicador
  if (!showIndicator) return null

  const getStatusIcon = () => {
    if (!networkStatus.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />
    }
    
    switch (connectionQuality) {
      case 'good':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'fair':
        return <Wifi className="w-4 h-4 text-yellow-500" />
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    if (!networkStatus.isOnline) {
      return 'Offline'
    }
    
    if (networkStatus.effectiveType) {
      return `${networkStatus.effectiveType.toUpperCase()}${networkStatus.saveData ? ' (Economia)' : ''}`
    }
    
    return 'Online'
  }

  const getStatusColor = () => {
    if (!networkStatus.isOnline) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    
    switch (connectionQuality) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'poor':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200',
      getStatusColor(),
      className
    )}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {/* Indicador de tentativas de reconexão */}
      {reconnectAttempts > 0 && networkStatus.isOnline && (
        <span className="text-xs opacity-75">
          ({reconnectAttempts} tentativas)
        </span>
      )}
      
      {/* Informações técnicas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && networkStatus.downlink && (
        <span className="text-xs opacity-75 ml-1">
          {networkStatus.downlink.toFixed(1)}Mbps
        </span>
      )}
    </div>
  )
}

// Hook para usar status de rede em outros componentes
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
  })

  useEffect(() => {
    const updateStatus = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine
      }))
    }

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  return networkStatus
}

// Componente de alerta de conectividade
export const NetworkAlert = () => {
  const { isOnline } = usePDVStore()
  const [showAlert, setShowAlert] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isOnline) {
      setShowAlert(true)
      const timer = setTimeout(() => setShowAlert(false), 10000) // Ocultar após 10s
      return () => clearTimeout(timer)
    } else {
      setShowAlert(false)
    }
  }, [isOnline])

  if (!isHydrated || !showAlert || isOnline) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm">
      <div className="bg-orange-100 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">Modo Offline</p>
          <p className="text-xs opacity-90">
            Algumas funcionalidades podem estar limitadas
          </p>
        </div>
        <button
          onClick={() => setShowAlert(false)}
          className="text-orange-600 hover:text-orange-800 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Exportação default
export default NetworkMonitor