'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuditMasterDashboard } from '@/components/audit/AuditMasterDashboard'
import { useAuth } from '@/contexts/AuthContext'
import { useAuditLogs } from '@/hooks/useAuditLogs'
import { useAuditStats } from '@/hooks/useAuditStats'
import { useAuditAlerts } from '@/hooks/useAuditAlerts'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AuditDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Initialize audit hooks with real-time configuration
  const auditLogs = useAuditLogs({
    autoRefresh: true,
    refreshInterval: 30000,
    enableRealTime: true,
    pageSize: 50
  })

  const auditStats = useAuditStats({
    autoRefresh: true,
    refreshInterval: 60000,
    enableRealTime: true,
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      end: new Date()
    }
  })

  const auditAlerts = useAuditAlerts({
    autoRefresh: true,
    refreshInterval: 15000,
    enableRealTime: true,
    maxAlerts: 100,
    autoAcknowledgeAfter: 60 // Auto-acknowledge after 1 hour
  })

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user has admin permissions
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      toast.error('Acesso negado. Apenas administradores podem acessar o dashboard de auditoria.')
      router.push('/dashboard')
      return
    }

    setIsAuthorized(true)
    toast.success('Bem-vindo ao Dashboard de Auditoria Avançado!')
  }, [user, loading, router])

  // Show loading state while any hook is loading
  if (loading || !isAuthorized || auditLogs.loading || auditStats.loading || auditAlerts.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard de auditoria...</p>
          {auditLogs.loading && <p className="text-xs text-muted-foreground mt-2">Carregando logs...</p>}
          {auditStats.loading && <p className="text-xs text-muted-foreground mt-2">Carregando estatísticas...</p>}
          {auditAlerts.loading && <p className="text-xs text-muted-foreground mt-2">Carregando alertas...</p>}
        </div>
      </div>
    )
  }

  // Show error state if any hook has errors
  if (auditLogs.error || auditStats.error || auditAlerts.error) {
    const errors = [auditLogs.error, auditStats.error, auditAlerts.error].filter(Boolean)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <h2 className="text-lg font-semibold">Erro ao carregar dashboard</h2>
            {errors.map((error, index) => (
              <p key={index} className="text-sm mt-2">{error}</p>
            ))}
          </div>
          <button 
            onClick={() => {
              auditLogs.refresh()
              auditStats.refresh()
              auditAlerts.refresh()
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <AuditMasterDashboard 
        auditLogs={auditLogs}
        auditStats={auditStats}
        auditAlerts={auditAlerts}
      />
    </div>
  )
}

/**
 * Configurações da página
 */
AuditDashboardPage.displayName = 'AuditDashboardPage'

// Metadata removido pois este é um componente client
// O metadata deve ser definido no layout.tsx