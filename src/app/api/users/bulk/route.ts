import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { z } from 'zod';

// Schema de validação para ações em lote
const bulkActionSchema = z.object({
  userIds: z.array(z.string().uuid('ID de usuário inválido')).min(1, 'Pelo menos um usuário deve ser selecionado'),
  action: z.enum(['activate', 'deactivate', 'changeRole'], {
    errorMap: () => ({ message: 'Ação deve ser activate, deactivate ou changeRole' })
  }),
  role: z.enum(['admin', 'manager', 'user']).optional()
});

type BulkAction = z.infer<typeof bulkActionSchema>;

// POST - Executar ações em lote
export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário é admin
    const userRole = request.headers.get('x-user-role');
    const currentUserId = request.headers.get('x-user-id');
    
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem executar ações em lote.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validatedData = bulkActionSchema.parse(body);
    const { userIds, action, role } = validatedData;

    // Verificar se a ação de mudança de role tem o parâmetro role
    if (action === 'changeRole' && !role) {
      return NextResponse.json(
        { error: 'Role é obrigatória para ação de mudança de role' },
        { status: 400 }
      );
    }

    // Buscar usuários antes da atualização para auditoria
    const { data: usersBeforeUpdate, error: fetchError } = await db
      .from('users')
      .select('id, name, email, role, is_active')
      .in('id', userIds);

    if (fetchError) {
      console.error('Erro ao buscar usuários:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      );
    }

    if (!usersBeforeUpdate || usersBeforeUpdate.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum usuário encontrado com os IDs fornecidos' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let actionDescription = '';

    // Definir dados de atualização baseado na ação
    switch (action) {
      case 'activate':
        updateData = { is_active: true };
        actionDescription = 'ativação';
        break;
      case 'deactivate':
        updateData = { is_active: false };
        actionDescription = 'desativação';
        break;
      case 'changeRole':
        updateData = { role };
        actionDescription = `mudança de role para ${role}`;
        break;
    }

    // Executar atualização em lote
    const { data: updatedUsers, error: updateError } = await db
      .from('users')
      .update(updateData)
      .in('id', userIds)
      .select('id, name, email, role, is_active');

    if (updateError) {
      console.error('Erro ao atualizar usuários:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar usuários' },
        { status: 500 }
      );
    }

    // Registrar logs de auditoria para cada usuário atualizado
    try {
      const { createAuditLog } = await import('@/lib/audit');
      
      for (const userBefore of usersBeforeUpdate) {
        const userAfter = updatedUsers?.find(u => u.id === userBefore.id);
        
        if (userAfter) {
          await createAuditLog('users', userBefore.id, 'UPDATE', {
            oldValues: {
              name: userBefore.name,
              email: userBefore.email,
              role: userBefore.role,
              is_active: userBefore.is_active
            },
            newValues: {
              name: userAfter.name,
              email: userAfter.email,
              role: userAfter.role,
              is_active: userAfter.is_active
            },
            bulkAction: {
              action,
              totalUsers: userIds.length,
              description: actionDescription
            },
            userId: currentUserId || undefined,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          });
        }
      }
    } catch (auditError) {
      console.error('Erro ao registrar logs de auditoria:', auditError);
      // Não falhar a operação por causa do log
    }

    return NextResponse.json({
      success: true,
      message: `${actionDescription} aplicada com sucesso para ${updatedUsers?.length || 0} usuário(s)`,
      updatedUsers: updatedUsers?.length || 0,
      action,
      ...(role && { role })
    });

  } catch (error) {
    console.error('Erro na ação em lote:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
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