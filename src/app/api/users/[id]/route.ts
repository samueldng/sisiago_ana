import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { auditLogger } from '@/middleware/auditMiddleware';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Schema de validação para atualização de usuário
const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['admin', 'manager', 'user'], {
    errorMap: () => ({ message: 'Role deve ser admin, manager ou user' })
  }).optional()
});

type UpdateUser = z.infer<typeof updateUserSchema>;

// GET - Buscar usuário específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const currentUserId = request.headers.get('x-user-id');
    
    // Admin pode ver qualquer usuário, outros usuários só podem ver a si mesmos
    if (userRole !== 'admin' && currentUserId !== params.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { data: user, error } = await db.users.findById(params.id);

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar usuário' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Remover senha antes de retornar
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Erro na busca de usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const currentUserId = request.headers.get('x-user-id');
    
    // Admin pode atualizar qualquer usuário, outros usuários só podem atualizar a si mesmos
    if (userRole !== 'admin' && currentUserId !== params.id) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validatedData = updateUserSchema.parse(body);

    // Verificar se o usuário existe
    const { data: existingUser, error: findError } = await db.users.findById(params.id);
    
    if (findError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Se está tentando alterar email, verificar se já existe
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const { data: emailExists } = await db.users.findByEmail(validatedData.email);
      if (emailExists) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        );
      }
    }

    // Usuários não-admin não podem alterar sua própria role
    if (userRole !== 'admin' && validatedData.role && validatedData.role !== existingUser.role) {
      return NextResponse.json(
        { error: 'Você não pode alterar sua própria role' },
        { status: 403 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = { ...validatedData };
    
    // Hash da nova senha se fornecida
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12);
    }

    // Atualizar usuário
    const { data: updatedUser, error } = await db.users.update(params.id, updateData);

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário' },
        { status: 500 }
      );
    }

    // Preparar valores antigos e novos (sem senha)
    const { password: oldPassword, ...oldValues } = existingUser;
    const { password: newPassword, ...newValues } = updatedUser;
    
    await auditLogger.logUpdate(
      'users',
      params.id,
      oldValues,
      newValues,
      currentUserId,
      request
    );

    // Remover senha antes de retornar
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro na atualização de usuário:', error);
    
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

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = request.headers.get('x-user-role');
    const currentUserId = request.headers.get('x-user-id');
    
    // Apenas admin pode deletar usuários
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem deletar usuários.' },
        { status: 403 }
      );
    }

    // Não permitir que admin delete a si mesmo
    if (currentUserId === params.id) {
      return NextResponse.json(
        { error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      );
    }

    // Verificar se o usuário existe
    const { data: existingUser, error: findError } = await db.users.findById(params.id);
    
    if (findError || !existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Deletar usuário
    const { error } = await db.users.delete(params.id);

    if (error) {
      console.error('Erro ao deletar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar usuário' },
        { status: 500 }
      );
    }

    // Preparar valores antigos (sem senha)
    const { password, ...oldValues } = existingUser;
    
    await auditLogger.logDelete(
      'users',
      params.id,
      oldValues,
      currentUserId,
      request
    );

    return NextResponse.json({
      message: 'Usuário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro na deleção de usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}