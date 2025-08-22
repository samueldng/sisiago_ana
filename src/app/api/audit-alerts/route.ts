import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserPermission } from '@/lib/auth'

export interface SecurityAlert {
  id: string
  type: 'failed_login' | 'mass_deletion' | 'privilege_escalation' | 'after_hours' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  details: any
  user_id?: string
  user_email?: string
  ip_address?: string
  user_agent?: string
  table_name?: string
  record_id?: string
  session_id?: string
  location?: string
  timestamp: string
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
  resolved: boolean
  resolved_by?: string
  resolved_at?: string
  rule_id?: string
  risk_score: number
  metadata?: any
  created_at: string
  updated_at: string
}

export interface AlertRule {
  id: string
  name: string
  description: string
  type: SecurityAlert['type']
  severity: SecurityAlert['severity']
  condition: string // SQL condition
  threshold: number
  time_window: number // minutes
  enabled: boolean
  created_by: string
  created_at: string
  updated_at: string
  last_triggered?: string
  trigger_count: number
}

export interface AlertFilters {
  type?: SecurityAlert['type']
  severity?: SecurityAlert['severity']
  acknowledged?: boolean
  resolved?: boolean
  user_id?: string
  date_from?: string
  date_to?: string
  search?: string
  rule_id?: string
}

// GET /api/audit-alerts - Buscar alertas
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
    const filters: AlertFilters = {
      type: searchParams.get('type') as SecurityAlert['type'] || undefined,
      severity: searchParams.get('severity') as SecurityAlert['severity'] || undefined,
      acknowledged: searchParams.get('acknowledged') ? searchParams.get('acknowledged') === 'true' : undefined,
      resolved: searchParams.get('resolved') ? searchParams.get('resolved') === 'true' : undefined,
      user_id: searchParams.get('user_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      rule_id: searchParams.get('rule_id') || undefined
    }
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Simular dados de alertas (em produção, viria do banco de dados)
    const mockAlerts: SecurityAlert[] = [
      {
        id: '1',
        type: 'failed_login',
        severity: 'medium',
        title: 'Múltiplas tentativas de login falhadas',
        description: 'Usuário tentou fazer login 5 vezes sem sucesso',
        details: {
          attempts: 5,
          last_attempt: new Date().toISOString(),
          blocked_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        },
        user_email: 'usuario@exemplo.com',
        ip_address: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'São Paulo, SP',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false,
        risk_score: 65,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'mass_deletion',
        severity: 'high',
        title: 'Exclusão em massa detectada',
        description: 'Usuário excluiu 25 registros em menos de 2 minutos',
        details: {
          records_deleted: 25,
          time_span: '1m 45s',
          tables_affected: ['documents', 'users']
        },
        user_id: user.id,
        user_email: 'admin@exemplo.com',
        ip_address: '10.0.0.1',
        table_name: 'documents',
        session_id: 'sess_123456',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        acknowledged: true,
        acknowledged_by: user.id,
        acknowledged_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        resolved: false,
        risk_score: 85,
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'after_hours',
        severity: 'low',
        title: 'Atividade fora do horário comercial',
        description: 'Usuário acessou o sistema às 23:45',
        details: {
          access_time: '23:45',
          business_hours: '08:00-18:00',
          actions_performed: ['view_documents', 'export_data']
        },
        user_id: user.id,
        user_email: 'funcionario@exemplo.com',
        ip_address: '192.168.1.50',
        location: 'Rio de Janeiro, RJ',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: false,
        resolved: false,
        risk_score: 25,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'privilege_escalation',
        severity: 'critical',
        title: 'Tentativa de escalação de privilégios',
        description: 'Usuário tentou acessar área administrativa sem permissão',
        details: {
          attempted_action: 'admin_panel_access',
          current_role: 'user',
          required_role: 'admin',
          blocked: true
        },
        user_id: user.id,
        user_email: 'usuario@exemplo.com',
        ip_address: '203.0.113.1',
        user_agent: 'curl/7.68.0',
        location: 'Localização desconhecida',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        acknowledged: false,
        resolved: false,
        risk_score: 95,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        type: 'suspicious_activity',
        severity: 'medium',
        title: 'Padrão de acesso suspeito',
        description: 'Múltiplos acessos de IPs diferentes em curto período',
        details: {
          ip_addresses: ['192.168.1.1', '10.0.0.1', '172.16.0.1'],
          time_span: '10 minutos',
          locations: ['São Paulo', 'Rio de Janeiro', 'Brasília']
        },
        user_id: user.id,
        user_email: 'usuario@exemplo.com',
        ip_address: '192.168.1.1',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        acknowledged: false,
        resolved: false,
        risk_score: 70,
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      }
    ]

    // Aplicar filtros
    let filteredAlerts = mockAlerts

    if (filters.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type)
    }

    if (filters.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity)
    }

    if (filters.acknowledged !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === filters.acknowledged)
    }

    if (filters.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === filters.resolved)
    }

    if (filters.user_id) {
      filteredAlerts = filteredAlerts.filter(alert => alert.user_id === filters.user_id)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.title.toLowerCase().includes(searchLower) ||
        alert.description.toLowerCase().includes(searchLower) ||
        alert.user_email?.toLowerCase().includes(searchLower)
      )
    }

    if (filters.date_from) {
      filteredAlerts = filteredAlerts.filter(alert => 
        new Date(alert.timestamp) >= new Date(filters.date_from!)
      )
    }

    if (filters.date_to) {
      filteredAlerts = filteredAlerts.filter(alert => 
        new Date(alert.timestamp) <= new Date(filters.date_to!)
      )
    }

    // Ordenar por timestamp (mais recentes primeiro)
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Aplicar paginação
    const total = filteredAlerts.length
    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit)

    return NextResponse.json({
      alerts: paginatedAlerts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      summary: {
        total_alerts: total,
        by_severity: {
          critical: filteredAlerts.filter(a => a.severity === 'critical').length,
          high: filteredAlerts.filter(a => a.severity === 'high').length,
          medium: filteredAlerts.filter(a => a.severity === 'medium').length,
          low: filteredAlerts.filter(a => a.severity === 'low').length
        },
        by_status: {
          unacknowledged: filteredAlerts.filter(a => !a.acknowledged).length,
          acknowledged: filteredAlerts.filter(a => a.acknowledged && !a.resolved).length,
          resolved: filteredAlerts.filter(a => a.resolved).length
        },
        avg_risk_score: Math.round(filteredAlerts.reduce((sum, a) => sum + a.risk_score, 0) / filteredAlerts.length) || 0
      }
    })

  } catch (error) {
    console.error('Erro ao buscar alertas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/audit-alerts - Criar alerta ou atualizar status
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
    const { action, alert_id, ...alertData } = body

    switch (action) {
      case 'acknowledge':
        // Reconhecer alerta
        return NextResponse.json({
          success: true,
          message: 'Alerta reconhecido com sucesso',
          alert: {
            id: alert_id,
            acknowledged: true,
            acknowledged_by: user.id,
            acknowledged_at: new Date().toISOString()
          }
        })

      case 'resolve':
        // Resolver alerta
        return NextResponse.json({
          success: true,
          message: 'Alerta resolvido com sucesso',
          alert: {
            id: alert_id,
            resolved: true,
            resolved_by: user.id,
            resolved_at: new Date().toISOString()
          }
        })

      case 'dismiss':
        // Descartar alerta
        return NextResponse.json({
          success: true,
          message: 'Alerta descartado com sucesso'
        })

      case 'create':
        // Criar novo alerta
        const newAlert: SecurityAlert = {
          id: Math.random().toString(36).substr(2, 9),
          type: alertData.type,
          severity: alertData.severity,
          title: alertData.title,
          description: alertData.description,
          details: alertData.details || {},
          user_id: alertData.user_id,
          user_email: alertData.user_email,
          ip_address: alertData.ip_address,
          user_agent: alertData.user_agent,
          table_name: alertData.table_name,
          record_id: alertData.record_id,
          session_id: alertData.session_id,
          location: alertData.location,
          timestamp: new Date().toISOString(),
          acknowledged: false,
          resolved: false,
          rule_id: alertData.rule_id,
          risk_score: alertData.risk_score || 50,
          metadata: alertData.metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        return NextResponse.json({
          success: true,
          message: 'Alerta criado com sucesso',
          alert: newAlert
        })

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro ao processar alerta:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/audit-alerts - Atualizar alerta
export async function PUT(request: NextRequest) {
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
    const { id, ...updateData } = body

    // Simular atualização
    return NextResponse.json({
      success: true,
      message: 'Alerta atualizado com sucesso',
      alert: {
        id,
        ...updateData,
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao atualizar alerta:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/audit-alerts - Deletar alerta
export async function DELETE(request: NextRequest) {
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
    const alertId = searchParams.get('id')

    if (!alertId) {
      return NextResponse.json(
        { error: 'ID do alerta é obrigatório' },
        { status: 400 }
      )
    }

    // Simular exclusão
    return NextResponse.json({
      success: true,
      message: 'Alerta deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar alerta:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}