import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { auditLogger } from '@/middleware/auditMiddleware';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Schema de validação para criação de usuário
const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['admin', 'manager', 'user'], {
    errorMap: () => ({ message: 'Role deve ser admin, manager ou user' })
  })
});

// Schema de validação para atualização de usuário
const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  role: z.enum(['admin', 'manager', 'user'], {
    errorMap: () => ({ message: 'Role deve ser admin, manager ou user' })
  }).optional()
});

type CreateUser = z.infer<typeof createUserSchema>;
type UpdateUser = z.infer<typeof updateUserSchema>;

// GET - Listar usuários
export async function GET(request: NextRequest) {
  try {
    // Verificar se o usuário é admin (middleware já verificou autenticação)
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem listar usuários.' },
        { status: 403 }
      );
    }

    const { data: users, error } = await db.users.findMany();

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      );
    }

    // Remover senhas dos usuários antes de retornar
    const usersWithoutPassword = users?.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }) || [];

    return NextResponse.json({
      success: true,
      users: usersWithoutPassword
    });

  } catch (error) {
    console.error('Erro na listagem de usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar usuário
export async function POST(request: NextRequest) {
  try {
    // Verificar se o usuário é admin
    const userRole = request.headers.get('x-user-role');
    
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem criar usuários.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar dados
    const validatedData = createUserSchema.parse(body);

    // Verificar se o email já existe
    const { data: existingUser } = await db.users.findByEmail(validatedData.email);
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Criar usuário
    const { data: newUser, error } = await db.users.create({
      email: validatedData.email,
      name: validatedData.name,
      password: hashedPassword,
      role: validatedData.role
    });

    if (error) {
      console.error('Erro ao criar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // Registrar log de auditoria
    try {
      const { createAuditLog } = await import('@/lib/audit');
      await createAuditLog('users', newUser.id, 'INSERT', {
        newValues: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          is_active: newUser.is_active
        },
        userId: request.headers.get('x-user-id') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    } catch (auditError) {
      console.error('Erro ao registrar log de auditoria:', auditError);
      // Não falhar a operação por causa do log
    }

    // Remover senha antes de retornar
    const { password, ...userWithoutPassword } = newUser;

    return NextResponse.json(
      { 
        message: 'Usuário criado com sucesso',
        user: userWithoutPassword 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro na criação de usuário:', error);
    
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