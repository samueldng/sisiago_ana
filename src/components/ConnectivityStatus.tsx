'use client'

import React from 'react'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useDbConnectivity } from '@/hooks/useDbConnectivity'
import { cn } from '@/lib/utils'

interface ConnectivityStatusProps {
  className?: string
  showDetails?: boolean
  compact?: boolean
}

export function ConnectivityStatus({ 
  className, 
  showDetails = false, 
  compact = false 
}: ConnectivityStatusProps) {
  const { 
    status, 
    isConnected, 
    isReconnecting, 
    lastDiagnostic, 
    runDiagnostic, 
    forceReconnect 
  } = useDbConnectivity()

  const getStatusIcon = () => {
    if (isReconnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin" />
    }
    
    if (isConnected) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    
    if (status.networkConnected) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusText = () => {
    if (isReconnecting) {
      return 'Reconectando...'
    }
    
    if (isConnected) {
      return 'Conectado'
    }
    
    if (status.networkConnected) {
      return 'Sem conexão com BD'
    }
    
    return 'Offline'
  }

  const getStatusColor = () => {
    if (isReconnecting) {
      return 'text-blue-600 bg-blue-50 border-blue-200'
    }
    
    if (isConnected) {
      return 'text-green-600 bg-green-50 border-green-200'
    }
    
    if (status.networkConnected) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    }
    
    return 'text-red-600 bg-red-50 border-red-200'
  }

  if (compact) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-2 py-1 rounded-md border text-xs font-medium',
        getStatusColor(),
        className
      )}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    )
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      getStatusColor(),
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium">{getStatusText()}</h3>
            <p className="text-sm opacity-75">
              {status.networkConnected ? (
                <span className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  Rede: OK
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <WifiOff className="h-3 w-3" />
                  Sem rede
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={runDiagnostic}
            disabled={isReconnecting}
            className="px-3 py-1 text-xs bg-white/50 hover:bg-white/75 rounded border transition-colors disabled:opacity-50"
          >
            Testar
          </button>
          
          {!isConnected && (
            <button
              onClick={forceReconnect}
              disabled={isReconnecting}
              className="px-3 py-1 text-xs bg-white/50 hover:bg-white/75 rounded border transition-colors disabled:opacity-50"
            >
              {isReconnecting ? 'Reconectando...' : 'Reconectar'}
            </button>
          )}
        </div>
      </div>
      
      {showDetails && lastDiagnostic.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Diagnóstico:</h4>
          <div className="space-y-1">
            {lastDiagnostic.map((result, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                {result.status === 'success' ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="font-medium">{result.test}:</span>
                <span className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                  {result.message}
                </span>
                {result.details?.duration && (
                  <span className="text-gray-500">({result.details.duration}ms)</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectivityStatus