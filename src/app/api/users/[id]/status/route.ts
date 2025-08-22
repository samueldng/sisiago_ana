import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { z } from 'zod';

// Schema de validação para alteração de status/role
const statusRoleSchema = z.object({
  is_active: z.boolean().optional(),
  role: z.enum(['admin', 'manager', 'user']).optional()
}).refine(data => data.is_active !== undefined || data.role !== undefined, {
  message: "Pelo menos um campo (is_active ou role) deve ser fornecido"
});

type StatusRoleUpdate = z.infer<typeof statusRoleSchema>;

// PATCH - Alterar status ou role do usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const currentUserId = request.headers.get('x-user-id');
    
    // Apenas admin pode alterar status/role de usuários
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem alterar status/role de usuários.' },
        { status: 403 }
      );
    }

    // Admin não pode alterar seu próprio status
    if (currentUserId === params.id) {
      return NextResponse.json(
        { error: 'Você não pode alterar seu próprio status ou role' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validatedData = statusRoleSchema.parse(body);

    // Verificar se o usuário existe
    const { data: existingUser, error: findError } = await db.users.findById(params.id);
    
    if (findError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    // Temporariamente removido is_active até a coluna ser adicionada ao banco
    // if (validatedData.is_active !== undefined) {
    //   updateData.is_active = validatedData.is_active;
    // }
    
    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role;
    }
    
    // Se não há dados para atualizar, retornar erro
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum dado válido fornecido para atualização. Coluna is_active não está disponível.' },
        { status: 400 }
      );
    }

    // Atualizar usuário
    const { data: updatedUser, error } = await db.users.update(params.id, updateData);

    if (error) {
      console.error('Erro ao atualizar status/role do usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar status/role do usuário' },
        { status: 500 }
      );
    }

    // Registrar log de auditoria
    try {
      const { createAuditLog } = await import('@/lib/audit');
      await createAuditLog('users', params.id, 'UPDATE', {
        oldValues: {
          is_active: existingUser.is_active,
          role: existingUser.role
        },
        newValues: validatedData,
        userId: request.headers.get('x-user-id') || undefined,
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
      message: 'Status/Role do usuário atualizado com sucesso',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro na atualização de status/role:', error);
    
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