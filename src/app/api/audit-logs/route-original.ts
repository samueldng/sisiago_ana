import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { z } from 'zod';

// Schema de validação para filtros
const auditFiltersSchema = z.object({
  table_name: z.string().optional(),
  user_id: z.string().optional(),
  operation: z.enum(['INSERT', 'UPDATE', 'DELETE']).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

type AuditFilters = z.infer<typeof auditFiltersSchema>;

// GET - Listar logs de auditoria
export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário é admin (middleware já verificou autenticação)
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem visualizar logs de auditoria.' },
        { status: 403 }
      );
    }

    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url);
    const filters: AuditFilters = {
      table_name: searchParams.get('table_name') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      operation: (searchParams.get('operation') as 'INSERT' | 'UPDATE' | 'DELETE') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined
    };

    // Validar filtros
    const validatedFilters = auditFiltersSchema.parse(filters);

    // Buscar logs de auditoria
    const { data: auditLogs, error } = await db.auditLogs.findMany(validatedFilters);

    if (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar logs de auditoria' },
        { status: 500 }
      );
    }

    // Contar total de registros para paginação
    let totalCount = 0;
    try {
      const { count } = await db.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });
      totalCount = count || 0;
    } catch (countError) {
      console.warn('Erro ao contar logs de auditoria:', countError);
    }

    return NextResponse.json({
      logs: auditLogs || [],
      pagination: {
        total: totalCount,
        limit: validatedFilters.limit || 50,
        offset: validatedFilters.offset || 0,
        hasMore: (validatedFilters.offset || 0) + (validatedFilters.limit || 50) < totalCount
      }
    });

  } catch (error) {
    console.error('Erro na busca de logs de auditoria:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Parâmetros inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}