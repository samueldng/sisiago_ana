import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createAuditLog } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = loginSchema.parse(body);
    const { email, password } = validatedData;

    // Buscar usuário no banco
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', validatedData.email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Erro ao buscar usuário:', userError);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    if (!user) {
      // Log de tentativa de login falhada - usuário não encontrado
      try {
        await createAuditLog('auth_attempts', null, 'LOGIN_FAILED', {
          newValues: {
            email: validatedData.email,
            reason: 'user_not_found',
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString()
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError);
      }
      
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Log de tentativa de login falhada - senha incorreta
      try {
        await createAuditLog('auth_attempts', user.id, 'LOGIN_FAILED', {
          newValues: {
            email: validatedData.email,
            user_id: user.id,
            reason: 'invalid_password',
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString()
          },
          userId: user.id,
          userEmail: user.email,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError);
      }
      
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Gerar JWT token
    const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Log de login bem-sucedido
    try {
      await createAuditLog('auth_attempts', user.id, 'LOGIN_SUCCESS', {
        newValues: {
          email: user.email,
          user_id: user.id,
          user_name: user.name,
          user_role: user.role,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        },
        userId: user.id,
        userEmail: user.email,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
    } catch (auditError) {
      console.error('Erro ao registrar log de auditoria:', auditError);
    }

    // Remover senha da resposta
    const { password: _, ...userWithoutPassword } = user;

    // Criar resposta com cookie httpOnly
    const response = NextResponse.json({
      success: true,
      user: userWithoutPassword,
      token
    });

    // Definir cookie httpOnly para o token
    console.log('🍪 Definindo cookie auth-token para produção:', process.env.NODE_ENV === 'production');
    
    // Obter o domínio da requisição para configurar o cookie corretamente
    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    
    console.log('🌐 Host detectado:', host);
    console.log('🌐 É localhost:', isLocalhost);
    
    // Configuração do cookie otimizada para Netlify
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/' // Garantir que o cookie seja válido para todo o site
    };
    
    // Não definir domínio para Netlify - deixar o navegador gerenciar
    if (isLocalhost) {
      // Para localhost, não definir domínio
      console.log('🍪 Configurando cookie para localhost');
    } else {
      // Para produção (Netlify), não definir domínio explicitamente
      console.log('🍪 Configurando cookie para produção (sem domínio explícito)');
    }
    
    response.cookies.set('auth-token', token, cookieOptions);
    
    console.log('✅ Cookie definido com sucesso');

    return response;

  } catch (error) {
    console.error('Erro no login:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}