import { NextRequest, NextResponse } from 'next/server';
import { checkUserPermission } from '@/lib/supabase';
import { getAuditLogs, exportAuditLogs } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário é admin
    const hasPermission = await checkUserPermission(userId, 'admin');
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem visualizar logs de auditoria.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const table_name = searchParams.get('table_name');
    const operation = searchParams.get('operation');
    const user_id = searchParams.get('user_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');
    const export_format = searchParams.get('export');

    // Filtros para busca
    const filters: any = { limit, offset };
    if (table_name) filters.tableName = table_name;
    if (operation) filters.operation = operation;
    if (user_id) filters.userId = user_id;
    if (start_date) filters.startDate = start_date;
    if (end_date) filters.endDate = end_date;

    // Se for exportação, usar função específica
    if (export_format) {
      const exportData = await exportAuditLogs(filters, export_format as 'csv' | 'json');
      
      if (export_format === 'csv') {
        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
          }
        });
      } else {
        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`
          }
        });
      }
    }

    const result = await getAuditLogs(filters);

    return NextResponse.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });

  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Método não permitido' },
    { status: 405 }
  );
}