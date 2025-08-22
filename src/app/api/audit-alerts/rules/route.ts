import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserPermission } from '@/lib/auth'
import { AlertRule } from '../route'

export interface RuleFilters {
  type?: string
  severity?: string
  enabled?: boolean
  search?: string
  created_by?: string
}

// GET /api/audit-alerts/rules - Buscar regras de alerta
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão de administrador
    const authResult = await checkUserPermission(request, 'audit-alerts', 'admin')
    if (!authResult.success) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters: RuleFilters = {
      type: searchParams.get('type') || undefined,
      severity: searchParams.get('severity') || undefined,
      enabled: searchParams.get('enabled') ? searchParams.get('enabled') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      created_by: searchParams.get('created_by') || undefined
    }
    
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Regras padrão do sistema
    const defaultRules: AlertRule[] = [
      {
        id: 'rule_1',
        name: 'Tentativas de Login Falhadas',
        description: 'Detecta múltiplas tentativas de login sem sucesso',
        type: 'failed_login',
        severity: 'medium',
        condition: `
          SELECT COUNT(*) as attempts
          FROM audit_logs 
          WHERE operation = 'LOGIN_FAILED' 
            AND user_email = $user_email 
            AND timestamp >= NOW() - INTERVAL '$time_window minutes'
          HAVING attempts >= $threshold
        `,
        threshold: 5,
        time_window: 15, // 15 minutos
        enabled: true,
        created_by: 'system',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        trigger_count: 12
      },
      {
        id: 'rule_2',
        name: 'Exclusão em Massa',
        description: 'Detecta quando um usuário exclui muitos registros rapidamente',
        type: 'mass_deletion',
        severity: 'high',
        condition: `
          SELECT COUNT(*) as deletions
          FROM audit_logs 
          WHERE operation = 'DELETE' 
            AND user_id = $user_id 
            AND timestamp >= NOW() - INTERVAL '$time_window minutes'
          HAVING deletions >= $threshold
        `,
        threshold: 10,
        time_window: 5, // 5 minutos
        enabled: true,
        created_by: 'system',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        trigger_count: 3
      },
      {
        id: 'rule_3',
        name: 'Escalação de Privilégios',
        description: 'Detecta tentativas de acesso não autorizado a recursos administrativos',
        type: 'privilege_escalation',
        severity: 'critical',
        condition: `
          SELECT COUNT(*) as attempts
          FROM audit_logs 
          WHERE (metadata->>'error' LIKE '%permission denied%' OR metadata->>'error' LIKE '%access denied%')
            AND user_id = $user_id 
            AND timestamp >= NOW() - INTERVAL '$time_window minutes'
          HAVING attempts >= $threshold
        `,
        threshold: 3,
        time_window: 10, // 10 minutos
        enabled: true,
        created_by: 'system',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        trigger_count: 1
      },
      {
        id: 'rule_4',
        name: 'Atividade Fora do Horário',
        description: 'Detecta atividades fora do horário comercial',
        type: 'after_hours',
        severity: 'low',
        condition: `
          SELECT COUNT(*) as activities
          FROM audit_logs 
          WHERE user_id = $user_id 
            AND (EXTRACT(HOUR FROM timestamp) < 8 OR EXTRACT(HOUR FROM timestamp) > 18)
            AND timestamp >= NOW() - INTERVAL '$time_window minutes'
          HAVING activities >= $threshold
        `,
        threshold: 1,
        time_window: 60, // 1 hora
        enabled: true,
        created_by: 'system',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        trigger_count: 8
      },
      {
        id: 'rule_5',
        name: 'Múltiplos IPs',
        description: 'Detecta quando um usuário acessa de múltiplos IPs em pouco tempo',
        type: 'suspicious_activity',
        severity: 'medium',
        condition: `
          SELECT COUNT(DISTINCT ip_address) as unique_ips
          FROM audit_logs 
          WHERE user_id = $user_id 
            AND timestamp >= NOW() - INTERVAL '$time_window minutes'
          HAVING unique_ips >= $threshold
        `,
        threshold: 3,
        time_window: 30, // 30 minutos
        enabled: true,
        created_by: 'system',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        trigger_count: 5
      },
      {
        id: 'rule_6',
        name: 'Acesso a Dados Sensíveis',
        description: 'Detecta acesso excessivo a dados sensíveis',
        type: 'data_breach',
        severity: 'high',
        condition: `
          SELECT COUNT(*) as accesses
          FROM audit_logs 
          WHERE operation = 'SELECT' 
            AND table_name IN ('users', 'documents', 'financial_data')
            AND user_id = $user_id 
            AND timestamp >= NOW() - INTERVAL '$time_window minutes'
          HAVING accesses >= $threshold
        `,
        threshold: 50,
        time_window: 60, // 1 hora
        enabled: true,
        created_by: 'system',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        trigger_count: 2
      },
      {
        id: 'rule_7',
        name: 'Exportação Massiva',
        description: 'Detecta exportações excessivas de dados',
        type: 'data_breach',
        severity: 'high',
        condition: `
          SELECT COUNT(*) as exports
          FROM audit_logs 
          WHERE operation = 'EXPORT' 
            AND user_id = $user_id 
            AND timestamp >= NOW() - INTERVAL '$time_window minutes'
          HAVING exports >= $threshold
        `,
        threshold: 5,
        time_window: 60, // 1 hora
        enabled: true,
        created_by: 'system',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        trigger_count: 1
      },
      {
        id: 'rule_8',
        name: 'User Agent Suspeito',
        description: 'Detecta acessos com user agents automatizados ou suspeitos',
        type: 'unauthorized_access',
        severity: 'medium',
        condition: `
          SELECT COUNT(*) as suspicious_accesses
          FROM audit_logs 
          WHERE (user_agent LIKE '%bot%' OR user_agent LIKE '%curl%' OR user_agent LIKE '%wget%' OR user_agent LIKE '%python%')
            AND user_id = $user_id 
            AND timestamp >= NOW() - INTERVAL '$time_window minutes'
          HAVING suspicious_accesses >= $threshold
        `,
        threshold: 1,
        time_window: 5, // 5 minutos
        enabled: true,
        created_by: 'system',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        trigger_count: 0
      }
    ]

    // Aplicar filtros
    let filteredRules = defaultRules

    if (filters.type) {
      filteredRules = filteredRules.filter(rule => rule.type === filters.type)
    }

    if (filters.severity) {
      filteredRules = filteredRules.filter(rule => rule.severity === filters.severity)
    }

    if (filters.enabled !== undefined) {
      filteredRules = filteredRules.filter(rule => rule.enabled === filters.enabled)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filteredRules = filteredRules.filter(rule => 
        rule.name.toLowerCase().includes(searchLower) ||
        rule.description.toLowerCase().includes(searchLower)
      )
    }

    if (filters.created_by) {
      filteredRules = filteredRules.filter(rule => rule.created_by === filters.created_by)
    }

    // Ordenar por nome
    filteredRules.sort((a, b) => a.name.localeCompare(b.name))

    // Aplicar paginação
    const total = filteredRules.length
    const paginatedRules = filteredRules.slice(offset, offset + limit)

    return NextResponse.json({
      rules: paginatedRules,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      },
      summary: {
        total_rules: total,
        enabled_rules: filteredRules.filter(r => r.enabled).length,
        disabled_rules: filteredRules.filter(r => !r.enabled).length,
        by_severity: {
          critical: filteredRules.filter(r => r.severity === 'critical').length,
          high: filteredRules.filter(r => r.severity === 'high').length,
          medium: filteredRules.filter(r => r.severity === 'medium').length,
          low: filteredRules.filter(r => r.severity === 'low').length
        },
        total_triggers: filteredRules.reduce((sum, r) => sum + r.trigger_count, 0)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar regras:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/audit-alerts/rules - Criar nova regra
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão de administrador
    const authResult = await checkUserPermission(request, 'audit-alerts', 'admin')
    if (!authResult.success) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, type, severity, condition, threshold, time_window } = body

    // Validações
    if (!name || !description || !type || !severity || !condition || !threshold || !time_window) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Severidade inválida' },
        { status: 400 }
      )
    }

    if (threshold <= 0 || time_window <= 0) {
      return NextResponse.json(
        { error: 'Threshold e time_window devem ser maiores que zero' },
        { status: 400 }
      )
    }

    // Criar nova regra
    const newRule: AlertRule = {
      id: `rule_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      type,
      severity,
      condition,
      threshold,
      time_window,
      enabled: true,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      trigger_count: 0
    }

    return NextResponse.json({
      success: true,
      message: 'Regra criada com sucesso',
      rule: newRule
    })

  } catch (error) {
    console.error('Erro ao criar regra:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/audit-alerts/rules - Atualizar regra
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão de administrador
    const authResult = await checkUserPermission(request, 'audit-alerts', 'admin')
    if (!authResult.success) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID da regra é obrigatório' },
        { status: 400 }
      )
    }

    // Validações para campos atualizados
    if (updateData.severity && !['low', 'medium', 'high', 'critical'].includes(updateData.severity)) {
      return NextResponse.json(
        { error: 'Severidade inválida' },
        { status: 400 }
      )
    }

    if ((updateData.threshold !== undefined && updateData.threshold <= 0) || 
        (updateData.time_window !== undefined && updateData.time_window <= 0)) {
      return NextResponse.json(
        { error: 'Threshold e time_window devem ser maiores que zero' },
        { status: 400 }
      )
    }

    // Simular atualização
    return NextResponse.json({
      success: true,
      message: 'Regra atualizada com sucesso',
      rule: {
        id,
        ...updateData,
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Erro ao atualizar regra:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/audit-alerts/rules - Deletar regra
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão de administrador
    const authResult = await checkUserPermission(request, 'audit-alerts', 'admin')
    if (!authResult.success) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('id')

    if (!ruleId) {
      return NextResponse.json(
        { error: 'ID da regra é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se é regra do sistema (não pode ser deletada)
    if (ruleId.startsWith('rule_') && ruleId.length === 6) {
      return NextResponse.json(
        { error: 'Regras do sistema não podem ser deletadas' },
        { status: 400 }
      )
    }

    // Simular exclusão
    return NextResponse.json({
      success: true,
      message: 'Regra deletada com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar regra:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}