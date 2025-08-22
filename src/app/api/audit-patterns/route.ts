import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUserPermission } from '@/lib/auth'

export interface PatternAnalysisFilters {
  user_id?: string
  start_date?: string
  end_date?: string
  pattern_type?: 'behavioral' | 'temporal' | 'geographic' | 'operational' | 'all'
  severity_threshold?: 'low' | 'medium' | 'high' | 'critical'
  confidence_threshold?: number // 0-100
}

export interface PatternDetection {
  id: string
  type: 'behavioral' | 'temporal' | 'geographic' | 'operational'
  name: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number // 0-100
  user_id?: string
  user_email?: string
  detected_at: string
  first_occurrence: string
  last_occurrence: string
  occurrence_count: number
  pattern_data: any
  risk_indicators: string[]
  recommended_actions: string[]
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
}

export interface BehavioralPattern {
  user_id: string
  user_email: string
  baseline: {
    avg_daily_actions: number
    common_hours: number[]
    frequent_operations: string[]
    typical_tables: string[]
    usual_locations: string[]
  }
  current: {
    daily_actions: number
    active_hours: number[]
    operations: string[]
    tables: string[]
    locations: string[]
  }
  anomalies: {
    volume_spike: boolean
    unusual_hours: boolean
    new_operations: boolean
    sensitive_data_access: boolean
    location_change: boolean
  }
  risk_score: number
}

export interface TemporalPattern {
  pattern_type: 'burst' | 'sustained' | 'periodic' | 'irregular'
  time_window: string
  frequency: number
  intensity: number
  operations: string[]
  affected_tables: string[]
  users_involved: string[]
  risk_level: 'low' | 'medium' | 'high' | 'critical'
}

// GET /api/audit-patterns - Analisar padrões de comportamento
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão de administrador
    const authResult = await checkUserPermission(request, 'audit-patterns', 'admin')
    if (!authResult.success) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters: PatternAnalysisFilters = {
      user_id: searchParams.get('user_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      pattern_type: (searchParams.get('pattern_type') as any) || 'all',
      severity_threshold: (searchParams.get('severity_threshold') as any) || 'low',
      confidence_threshold: parseInt(searchParams.get('confidence_threshold') || '70')
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Simular detecções de padrões
    const patternDetections: PatternDetection[] = [
      {
        id: 'pattern_1',
        type: 'behavioral',
        name: 'Acesso Excessivo a Dados Sensíveis',
        description: 'Usuário acessando dados sensíveis em volume muito acima do normal',
        severity: 'high',
        confidence: 92,
        user_id: 'user_3',
        user_email: 'analyst@sisiago.com',
        detected_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        first_occurrence: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        last_occurrence: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        occurrence_count: 47,
        pattern_data: {
          baseline_daily_access: 12,
          current_daily_access: 89,
          spike_percentage: 642,
          sensitive_tables: ['users', 'documents', 'financial_data'],
          access_pattern: 'burst'
        },
        risk_indicators: [
          'Volume 642% acima da baseline',
          'Acesso a múltiplas tabelas sensíveis',
          'Padrão de acesso em rajada',
          'Fora do horário normal de trabalho'
        ],
        recommended_actions: [
          'Investigar imediatamente',
          'Revisar permissões do usuário',
          'Contatar o usuário para verificação',
          'Considerar suspensão temporária'
        ],
        status: 'active'
      },
      {
        id: 'pattern_2',
        type: 'temporal',
        name: 'Atividade Automatizada Suspeita',
        description: 'Padrão de atividade muito regular, possivelmente automatizada',
        severity: 'medium',
        confidence: 85,
        user_id: 'user_5',
        user_email: 'guest@sisiago.com',
        detected_at: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        first_occurrence: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        last_occurrence: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        occurrence_count: 144,
        pattern_data: {
          interval_consistency: 98.7, // %
          exact_timing_matches: 142,
          operation_sequence_repetition: 'SELECT->UPDATE->SELECT',
          time_interval: '5 minutes',
          deviation: 0.3 // seconds
        },
        risk_indicators: [
          'Intervalos extremamente regulares',
          'Sequência de operações repetitiva',
          'Baixa variação temporal',
          'Possível script automatizado'
        ],
        recommended_actions: [
          'Verificar se é automação autorizada',
          'Analisar user agent e origem',
          'Implementar CAPTCHA se necessário',
          'Revisar políticas de API'
        ],
        status: 'investigating'
      },
      {
        id: 'pattern_3',
        type: 'geographic',
        name: 'Acesso de Múltiplas Localizações',
        description: 'Usuário acessando de localizações geograficamente impossíveis',
        severity: 'critical',
        confidence: 96,
        user_id: 'user_1',
        user_email: 'admin@sisiago.com',
        detected_at: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        first_occurrence: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        last_occurrence: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        occurrence_count: 8,
        pattern_data: {
          locations: [
            { country: 'Brasil', city: 'São Paulo', ip: '200.123.45.67', time: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString() },
            { country: 'China', city: 'Beijing', ip: '123.45.67.89', time: new Date(now.getTime() - 2.5 * 60 * 60 * 1000).toISOString() },
            { country: 'Rússia', city: 'Moscow', ip: '87.65.43.21', time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
            { country: 'Brasil', city: 'São Paulo', ip: '200.123.45.67', time: new Date(now.getTime() - 15 * 60 * 1000).toISOString() }
          ],
          impossible_travel_speed: 15000, // km/h
          max_realistic_speed: 900 // km/h (avião comercial)
        },
        risk_indicators: [
          'Velocidade de viagem impossível (15.000 km/h)',
          'Múltiplos países em curto período',
          'IPs de países de alto risco',
          'Possível comprometimento de conta'
        ],
        recommended_actions: [
          'Suspender conta imediatamente',
          'Forçar redefinição de senha',
          'Ativar autenticação multifator',
          'Investigar comprometimento'
        ],
        status: 'active'
      },
      {
        id: 'pattern_4',
        type: 'operational',
        name: 'Escalação de Privilégios Gradual',
        description: 'Tentativas graduais de acesso a recursos não autorizados',
        severity: 'high',
        confidence: 78,
        user_id: 'user_4',
        user_email: 'operator@sisiago.com',
        detected_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        first_occurrence: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        last_occurrence: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        occurrence_count: 23,
        pattern_data: {
          permission_attempts: [
            { resource: 'user_management', attempts: 5, success: false },
            { resource: 'system_settings', attempts: 8, success: false },
            { resource: 'audit_logs', attempts: 6, success: false },
            { resource: 'admin_panel', attempts: 4, success: false }
          ],
          escalation_pattern: 'gradual',
          time_between_attempts: 'decreasing',
          current_role: 'operator',
          attempted_roles: ['manager', 'admin', 'super_admin']
        },
        risk_indicators: [
          'Múltiplas tentativas de acesso negado',
          'Padrão de escalação gradual',
          'Tentativas em recursos críticos',
          'Frequência crescente de tentativas'
        ],
        recommended_actions: [
          'Revisar permissões atuais',
          'Investigar motivação do usuário',
          'Implementar monitoramento adicional',
          'Considerar treinamento de segurança'
        ],
        status: 'investigating'
      },
      {
        id: 'pattern_5',
        type: 'behavioral',
        name: 'Mudança Súbita de Comportamento',
        description: 'Alteração drástica no padrão de uso normal do usuário',
        severity: 'medium',
        confidence: 82,
        user_id: 'user_2',
        user_email: 'manager@sisiago.com',
        detected_at: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        first_occurrence: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        last_occurrence: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        occurrence_count: 156,
        pattern_data: {
          baseline_period: '30 days',
          behavior_changes: {
            login_frequency: { before: 2.3, after: 8.7, change: '+278%' },
            session_duration: { before: 45, after: 180, change: '+300%' },
            operations_per_session: { before: 12, after: 67, change: '+458%' },
            new_features_used: ['export', 'bulk_operations', 'admin_reports']
          },
          change_trigger_date: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
        },
        risk_indicators: [
          'Aumento súbito de 278% na frequência de login',
          'Sessões 300% mais longas',
          'Uso de funcionalidades nunca utilizadas',
          'Mudança comportamental abrupta'
        ],
        recommended_actions: [
          'Verificar se houve mudança de função',
          'Confirmar identidade do usuário',
          'Revisar atividades recentes',
          'Implementar verificação adicional'
        ],
        status: 'active'
      }
    ]

    // Aplicar filtros
    let filteredPatterns = patternDetections

    if (filters.user_id) {
      filteredPatterns = filteredPatterns.filter(p => p.user_id === filters.user_id)
    }

    if (filters.pattern_type && filters.pattern_type !== 'all') {
      filteredPatterns = filteredPatterns.filter(p => p.type === filters.pattern_type)
    }

    if (filters.severity_threshold) {
      const severityLevels = { low: 0, medium: 1, high: 2, critical: 3 }
      const threshold = severityLevels[filters.severity_threshold]
      filteredPatterns = filteredPatterns.filter(p => 
        severityLevels[p.severity] >= threshold
      )
    }

    if (filters.confidence_threshold) {
      filteredPatterns = filteredPatterns.filter(p => 
        p.confidence >= filters.confidence_threshold!
      )
    }

    // Ordenar por severidade e confiança
    filteredPatterns.sort((a, b) => {
      const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      return b.confidence - a.confidence
    })

    // Estatísticas resumidas
    const summary = {
      total_patterns: filteredPatterns.length,
      by_severity: {
        critical: filteredPatterns.filter(p => p.severity === 'critical').length,
        high: filteredPatterns.filter(p => p.severity === 'high').length,
        medium: filteredPatterns.filter(p => p.severity === 'medium').length,
        low: filteredPatterns.filter(p => p.severity === 'low').length
      },
      by_type: {
        behavioral: filteredPatterns.filter(p => p.type === 'behavioral').length,
        temporal: filteredPatterns.filter(p => p.type === 'temporal').length,
        geographic: filteredPatterns.filter(p => p.type === 'geographic').length,
        operational: filteredPatterns.filter(p => p.type === 'operational').length
      },
      by_status: {
        active: filteredPatterns.filter(p => p.status === 'active').length,
        investigating: filteredPatterns.filter(p => p.status === 'investigating').length,
        resolved: filteredPatterns.filter(p => p.status === 'resolved').length,
        false_positive: filteredPatterns.filter(p => p.status === 'false_positive').length
      },
      avg_confidence: Math.round(
        filteredPatterns.reduce((sum, p) => sum + p.confidence, 0) / filteredPatterns.length
      ),
      high_risk_users: [...new Set(
        filteredPatterns
          .filter(p => p.severity === 'critical' || p.severity === 'high')
          .map(p => p.user_email)
          .filter(Boolean)
      )]
    }

    return NextResponse.json({
      success: true,
      data: {
        patterns: filteredPatterns,
        summary
      },
      filters,
      analysis_timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao analisar padrões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/audit-patterns - Atualizar status de padrão ou executar análise
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar permissão de administrador
    const authResult = await checkUserPermission(request, 'audit-patterns', 'admin')
    if (!authResult.success) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { action, pattern_id, status, notes } = body

    if (action === 'update_status') {
      if (!pattern_id || !status) {
        return NextResponse.json(
          { error: 'Pattern ID e status são obrigatórios' },
          { status: 400 }
        )
      }

      if (!['active', 'investigating', 'resolved', 'false_positive'].includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido' },
          { status: 400 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Status do padrão atualizado com sucesso',
        pattern_id,
        new_status: status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        notes
      })
    }

    if (action === 'run_analysis') {
      // Simular execução de análise
      return NextResponse.json({
        success: true,
        message: 'Análise de padrões executada com sucesso',
        analysis_id: `analysis_${Math.random().toString(36).substr(2, 9)}`,
        started_at: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos
      })
    }

    return NextResponse.json(
      { error: 'Ação não reconhecida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Erro ao processar padrões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}