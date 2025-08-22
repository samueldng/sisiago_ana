import { NextRequest, NextResponse } from 'next/server';
import { getAuditStats } from '@/lib/audit';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar logs de auditoria.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Buscar estatísticas completas (incluindo horárias, diárias e métricas de risco)
    const stats = await getAuditStats({
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });

    // Transformar os dados para o formato esperado pelo frontend
    const transformedStats = {
      totalLogs: stats.totalLogs,
      operationStats: {
        INSERT: stats.byOperation?.INSERT || 0,
        UPDATE: stats.byOperation?.UPDATE || 0,
        DELETE: stats.byOperation?.DELETE || 0
      },
      tableStats: Object.entries(stats.byTable || {}).map(([table_name, count]) => ({
        table_name,
        count: count as number
      })),
      userStats: Object.entries(stats.byUser || {}).map(([user_name, count]) => ({
        user_id: user_name,
        user_email: user_name,
        count: count as number
      })),
      hourlyStats: stats.hourlyStats || [],
      dailyStats: stats.dailyStats || [],
      riskMetrics: stats.riskMetrics || {
        suspiciousActivities: 0,
        failedLogins: 0,
        unusualPatterns: 0,
        riskScore: 0
      }
    };

    return NextResponse.json(transformedStats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de auditoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}