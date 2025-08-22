'use client'

import { useState, useEffect, useCallback } from 'react'
import { dbDiagnostic, ConnectivityStatus, DiagnosticResult } from '@/utils/dbDiagnostic'

export interface UseDbConnectivityReturn {
  status: ConnectivityStatus
  isConnected: boolean
  isReconnecting: boolean
  lastDiagnostic: DiagnosticResult[]
  runDiagnostic: () => Promise<DiagnosticResult[]>
  forceReconnect: () => Promise<boolean>
  startAutoReconnect: () => void
  stopAutoReconnect: () => void
}

export function useDbConnectivity(): UseDbConnectivityReturn {
  const [status, setStatus] = useState<ConnectivityStatus>(dbDiagnostic.getStatus())
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [lastDiagnostic, setLastDiagnostic] = useState<DiagnosticResult[]>([])

  useEffect(() => {
    // Inscrever-se para atualizações de status
    const unsubscribe = dbDiagnostic.subscribe((newStatus) => {
      setStatus(newStatus)
    })

    // Executar diagnóstico inicial
    const initialDiagnostic = async () => {
      try {
        const results = await dbDiagnostic.runFullDiagnostic()
        setLastDiagnostic(results)
      } catch (error) {
        // Erro silencioso no diagnóstico inicial
      }
    }
    
    initialDiagnostic()

    return unsubscribe
  }, [])

  const runDiagnostic = useCallback(async (): Promise<DiagnosticResult[]> => {
    try {
      const results = await dbDiagnostic.runFullDiagnostic()
      setLastDiagnostic(results)
      return results
    } catch (error) {
      // Erro silencioso no diagnóstico
      return []
    }
  }, [])

  const forceReconnect = useCallback(async (): Promise<boolean> => {
    setIsReconnecting(true)
    try {
      const success = await dbDiagnostic.attemptReconnection()
      return success
    } finally {
      setIsReconnecting(false)
    }
  }, [])

  const startAutoReconnect = useCallback(() => {
    dbDiagnostic.startReconnectionAttempts()
  }, [])

  const stopAutoReconnect = useCallback(() => {
    dbDiagnostic.stopReconnectionAttempts()
  }, [])

  return {
    status,
    isConnected: status.supabaseConnected,
    isReconnecting,
    lastDiagnostic,
    runDiagnostic,
    forceReconnect,
    startAutoReconnect,
    stopAutoReconnect
  }
}

export default useDbConnectivity