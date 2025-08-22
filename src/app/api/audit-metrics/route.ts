import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserPermission } from '@/lib/auth'

export interface MetricsFilters {
  period?: 'hour' | 'day' | 'week' | 'month'
  start_date?: string
  end_date?: string
  table?: string
  operation?: string
  user_id?: string
}

export interface AuditMetrics {
  overview: {
    total_logs: number
    unique_users: number
    unique_tables: number
    unique_operations: number
    risk_score: number
    trend: {
      logs: number
      users: number
      risk: number
    }
  }
  activity_by_hour: Array<{
    hour: string
    count: number
    risk_level: 'low' | 'medium' | 'high'
  }>
  operations_breakdown: Array<{
    operation: string
    count: number
    percentage: number
    risk_level: 'low' | 'medium' | 'high'
  }>
  tables_breakdown: Array<{
    table: string
    count: number
    percentage: number
    risk_level: 'low' | 'medium' | 'high'
  }>
  top_users: Array<{
    user_id: string
    user_email: string
    count: number
    risk_score: number
    last_activity: string
  }>
  security_events: Array<{
    type: string
    count: number
    severity: 'low' | 'medium' | 'high' | 'critical'
    trend: number
  }>
  geographic_distribution: Array<{
    country: string
    region: string
    count: number
    risk_level: 'low' | 'medium' | 'high'
  }>
  performance_metrics: {
    avg_response_time: number
    error_rate: number
    success_rate: number
    peak_hour: string
  }
}

// GET /api/audit-metrics - Obter métricas de auditoria
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão de administrador
    const hasPermission = await checkUserPermission(user.id, 'admin')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters: MetricsFilters = {
      period: (searchParams.get('period') as any) || 'day',
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      table: searchParams.get('table') || undefined,
      operation: searchParams.get('operation') || undefined,
      user_id: searchParams.get('user_id') || undefined
    }

    // Simular dados de métricas baseados no período
    const now = new Date()
    const hoursBack = filters.period === 'hour' ? 1 : 
                     filters.period === 'day' ? 24 : 
                     filters.period === 'week' ? 168 : 720 // month

    // Gerar dados de atividade por hora
    const activityByHour = []
    for (let i = hoursBack - 1; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
      const hourStr = hour.toISOString().slice(0, 13) + ':00:00Z'
      const baseCount = Math.floor(Math.random() * 100) + 10
      const isBusinessHour = hour.getHours() >= 8 && hour.getHours() <= 18
      const count = isBusinessHour ? baseCount * 2 : Math.floor(baseCount * 0.3)
      
      activityByHour.push({
        hour: hourStr,
        count,
        risk_level: count > 150 ? 'high' : count > 80 ? 'medium' : 'low'
      })
    }

    // Dados simulados para operações
    const operations = [
      { name: 'SELECT', weight: 0.6, risk: 'low' },
      { name: 'INSERT', weight: 0.2, risk: 'low' },
      { name: 'UPDATE', weight: 0.15, risk: 'medium' },
      { name: 'DELETE', weight: 0.04, risk: 'high' },
      { name: 'LOGIN', weight: 0.008, risk: 'low' },
      { name: 'LOGOUT', weight: 0.002, risk: 'low' }
    ]

    const totalOperations = activityByHour.reduce((sum, h) => sum + h.count, 0)
    const operationsBreakdown = operations.map(op => {
      const count = Math.floor(totalOperations * op.weight)
      return {
        operation: op.name,
        count,
        percentage: Math.round((count / totalOperations) * 100),
        risk_level: op.risk as 'low' | 'medium' | 'high'
      }
    })

    // Dados simulados para tabelas
    const tables = [
      { name: 'users', weight: 0.3, risk: 'medium' },
      { name: 'documents', weight: 0.25, risk: 'high' },
      { name: 'audit_logs', weight: 0.2, risk: 'low' },
      { name: 'sessions', weight: 0.15, risk: 'low' },
      { name: 'permissions', weight: 0.08, risk: 'high' },
      { name: 'settings', weight: 0.02, risk: 'medium' }
    ]

    const tablesBreakdown = tables.map(table => {
      const count = Math.floor(totalOperations * table.weight)
      return {
        table: table.name,
        count,
        percentage: Math.round((count / totalOperations) * 100),
        risk_level: table.risk as 'low' | 'medium' | 'high'
      }
    })

    // Top usuários simulados
    const topUsers = [
      {
        user_id: 'user_1',
        user_email: 'admin@sisiago.com',
        count: Math.floor(totalOperations * 0.3),
        risk_score: 25,
        last_activity: new Date(now.getTime() - Math.random() * 3600000).toISOString()
      },
      {
        user_id: 'user_2',
        user_email: 'manager@sisiago.com',
        count: Math.floor(totalOperations * 0.2),
        risk_score: 15,
        last_activity: new Date(now.getTime() - Math.random() * 3600000).toISOString()
      },
      {
        user_id: 'user_3',
        user_email: 'analyst@sisiago.com',
        count: Math.floor(totalOperations * 0.15),
        risk_score: 45,
        last_activity: new Date(now.getTime() - Math.random() * 3600000).toISOString()
      },
      {
        user_id: 'user_4',
        user_email: 'operator@sisiago.com',
        count: Math.floor(totalOperations * 0.1),
        risk_score: 10,
        last_activity: new Date(now.getTime() - Math.random() * 3600000).toISOString()
      },
      {
        user_id: 'user_5',
        user_email: 'guest@sisiago.com',
        count: Math.floor(totalOperations * 0.05),
        risk_score: 60,
        last_activity: new Date(now.getTime() - Math.random() * 3600000).toISOString()
      }
    ]

    // Eventos de segurança simulados
    const securityEvents = [
      {
        type: 'failed_login',
        count: Math.floor(Math.random() * 20) + 5,
        severity: 'medium' as const,
        trend: Math.floor(Math.random() * 40) - 20
      },
      {
        type: 'mass_deletion',
        count: Math.floor(Math.random() * 5),
        severity: 'high' as const,
        trend: Math.floor(Math.random() * 20) - 10
      },
      {
        type: 'privilege_escalation',
        count: Math.floor(Math.random() * 3),
        severity: 'critical' as const,
        trend: Math.floor(Math.random() * 10) - 5
      },
      {
        type: 'after_hours',
        count: Math.floor(Math.random() * 15) + 3,
        severity: 'low' as const,
        trend: Math.floor(Math.random() * 30) - 15
      },
      {
        type: 'suspicious_activity',
        count: Math.floor(Math.random() * 8) + 2,
        severity: 'medium' as const,
        trend: Math.floor(Math.random() * 20) - 10
      }
    ]

    // Distribuição geográfica simulada
    const geographicDistribution = [
      { country: 'Brasil', region: 'São Paulo', count: Math.floor(totalOperations * 0.6), risk_level: 'low' as const },
      { country: 'Brasil', region: 'Rio de Janeiro', count: Math.floor(totalOperations * 0.2), risk_level: 'low' as const },
      { country: 'Brasil', region: 'Minas Gerais', count: Math.floor(totalOperations * 0.1), risk_level: 'low' as const },
      { country: 'Estados Unidos', region: 'California', count: Math.floor(totalOperations * 0.05), risk_level: 'medium' as const },
      { country: 'China', region: 'Beijing', count: Math.floor(totalOperations * 0.03), risk_level: 'high' as const },
      { country: 'Rússia', region: 'Moscow', count: Math.floor(totalOperations * 0.02), risk_level: 'high' as const }
    ]

    // Calcular métricas de overview
    const uniqueUsers = topUsers.length
    const uniqueTables = tables.length
    const uniqueOperations = operations.length
    const avgRiskScore = topUsers.reduce((sum, u) => sum + u.risk_score, 0) / uniqueUsers
    
    const metrics: AuditMetrics = {
      overview: {
        total_logs: totalOperations,
        unique_users: uniqueUsers,
        unique_tables: uniqueTables,
        unique_operations: uniqueOperations,
        risk_score: Math.round(avgRiskScore),
        trend: {
          logs: Math.floor(Math.random() * 40) - 20, // -20% a +20%
          users: Math.floor(Math.random() * 20) - 10, // -10% a +10%
          risk: Math.floor(Math.random() * 30) - 15   // -15% a +15%
        }
      },
      activity_by_hour: activityByHour,
      operations_breakdown: operationsBreakdown,
      tables_breakdown: tablesBreakdown,
      top_users: topUsers,
      security_events: securityEvents,
      geographic_distribution: geographicDistribution,
      performance_metrics: {
        avg_response_time: Math.floor(Math.random() * 200) + 50, // 50-250ms
        error_rate: Math.round((Math.random() * 5) * 100) / 100, // 0-5%
        success_rate: Math.round((95 + Math.random() * 5) * 100) / 100, // 95-100%
        peak_hour: activityByHour.reduce((max, curr) => 
          curr.count > max.count ? curr : max
        ).hour
      }
    }

    return NextResponse.json({
      success: true,
      data: metrics,
      filters,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar métricas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/audit-metrics - Atualizar cache de métricas
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão de administrador
    const hasPermission = await checkUserPermission(user.id, 'admin')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'refresh_cache') {
      // Simular atualização do cache
      return NextResponse.json({
        success: true,
        message: 'Cache de métricas atualizado com sucesso',
        updated_at: new Date().toISOString()
      })
    }

    if (action === 'recalculate_risk') {
      // Simular recálculo de scores de risco
      return NextResponse.json({
        success: true,
        message: 'Scores de risco recalculados com sucesso',
        updated_at: new Date().toISOString()
      })
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro ao processar métricas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}