import { NextRequest, NextResponse } from 'next/server';

// Mock data para demonstração dos logs de auditoria
const mockAuditLogs = [
  {
    id: '1',
    table_name: 'users',
    record_id: 'admin-user-001',
    operation: 'INSERT',
    old_values: null,
    new_values: {
      email: 'admin@sisiago.com',
      name: 'Administrador',
      role: 'admin'
    },
    user_id: 'admin-user-001',
    ip_address: '127.0.0.1',
    user_agent: 'Sistema de Gestão',
    created_at: new Date('2024-01-15T10:30:00Z').toISOString()
  },
  {
    id: '2',
    table_name: 'products',
    record_id: 'prod-001',
    operation: 'UPDATE',
    old_values: {
      stock: 100,
      sale_price: 3.50
    },
    new_values: {
      stock: 95,
      sale_price: 3.75
    },
    user_id: 'admin-user-001',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    created_at: new Date('2024-01-15T14:22:00Z').toISOString()
  },
  {
    id: '3',
    table_name: 'categories',
    record_id: 'cat-001',
    operation: 'INSERT',
    old_values: null,
    new_values: {
      name: 'Bebidas',
      description: 'Bebidas em geral'
    },
    user_id: 'admin-user-001',
    ip_address: '192.168.1.100',
    user_agent: 'Sistema PDV',
    created_at: new Date('2024-01-15T09:15:00Z').toISOString()
  },
  {
    id: '4',
    table_name: 'sales',
    record_id: 'sale-001',
    operation: 'INSERT',
    old_values: null,
    new_values: {
      total: 15.75,
      payment_method: 'PIX',
      status: 'COMPLETED'
    },
    user_id: 'admin-user-001',
    ip_address: '192.168.1.105',
    user_agent: 'Sistema PDV Mobile',
    created_at: new Date('2024-01-15T16:45:00Z').toISOString()
  },
  {
    id: '5',
    table_name: 'products',
    record_id: 'prod-002',
    operation: 'DELETE',
    old_values: {
      name: 'Produto Descontinuado',
      stock: 0,
      is_active: false
    },
    new_values: null,
    user_id: 'admin-user-001',
    ip_address: '127.0.0.1',
    user_agent: 'Sistema de Gestão',
    created_at: new Date('2024-01-14T11:20:00Z').toISOString()
  },
  {
    id: '6',
    table_name: 'users',
    record_id: 'user-002',
    operation: 'UPDATE',
    old_values: {
      role: 'operator'
    },
    new_values: {
      role: 'manager'
    },
    user_id: 'admin-user-001',
    ip_address: '192.168.1.100',
    user_agent: 'Sistema de Gestão',
    created_at: new Date('2024-01-14T15:30:00Z').toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (simplificado para demonstração)
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');
    
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem visualizar logs de auditoria.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tableName = searchParams.get('table_name');
    const operation = searchParams.get('operation');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Filtrar logs baseado nos parâmetros
    let filteredLogs = [...mockAuditLogs];

    if (tableName) {
      filteredLogs = filteredLogs.filter(log => log.table_name === tableName);
    }

    if (operation) {
      filteredLogs = filteredLogs.filter(log => log.operation === operation);
    }

    if (startDate) {
      const start = new Date(startDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.created_at) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      filteredLogs = filteredLogs.filter(log => new Date(log.created_at) <= end);
    }

    // Ordenar por data (mais recente primeiro)
    filteredLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Aplicar paginação
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);
    const totalCount = filteredLogs.length;

    return NextResponse.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
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