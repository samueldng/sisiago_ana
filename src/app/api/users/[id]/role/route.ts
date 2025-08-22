import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { z } from 'zod';

// Schema de validação para alteração de role
const roleSchema = z.object({
  role: z.enum(['admin', 'manager', 'user'], {
    errorMap: () => ({ message: 'Role deve ser admin, manager ou user' })
  })
});

type RoleUpdate = z.infer<typeof roleSchema>;

// PATCH - Alterar role do usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const currentUserId = request.headers.get('x-user-id');
    
    // Apenas admin pode alterar role de usuários
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem alterar role de usuários.' },
        { status: 403 }
      );
    }

    // Admin não pode alterar sua própria role
    if (currentUserId === params.id) {
      return NextResponse.json(
        { error: 'Você não pode alterar sua própria role' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validatedData = roleSchema.parse(body);

    // Verificar se o usuário existe
    const { data: existingUser, error: findError } = await db.users.findById(params.id);
    
    if (findError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar role do usuário
    const { data: updatedUser, error } = await db.users.update(params.id, {
      role: validatedData.role
    });

    if (error) {
      console.error('Erro ao atualizar role do usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar role do usuário' },
        { status: 500 }
      );
    }

    // Registrar log de auditoria
    try {
      const { createAuditLog } = await import('@/lib/audit');
      await createAuditLog('users', params.id, 'UPDATE', {
        oldValues: {
          role: existingUser.role
        },
        newValues: {
          role: updatedUser.role
        },
        userId: currentUserId || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    } catch (auditError) {
      console.error('Erro ao registrar log de auditoria:', auditError);
      // Não falhar a operação por causa do log
    }

    // Remover senha antes de retornar
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: 'Role do usuário atualizada com sucesso',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro na atualização de role:', error);
    
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