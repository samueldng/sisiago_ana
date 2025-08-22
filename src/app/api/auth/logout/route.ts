import { NextRequest, NextResponse } from 'next/server';
import { createAuditLog } from '@/lib/supabase';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

export async function POST(request: NextRequest) {
  try {
    // Obter informações do usuário do token antes de invalidá-lo
    const token = request.cookies.get('auth-token')?.value;
    let userInfo = null;
    
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userInfo = {
          userId: payload.userId as string,
          email: payload.email as string,
          role: payload.role as string
        };
      } catch (tokenError) {
        console.error('Erro ao verificar token no logout:', tokenError);
      }
    }

    // Log de logout
    if (userInfo) {
      try {
        await createAuditLog('auth_attempts', userInfo.userId, 'LOGOUT', {
          newValues: {
            email: userInfo.email,
            user_id: userInfo.userId,
            user_role: userInfo.role,
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown',
            timestamp: new Date().toISOString()
          },
          userId: userInfo.userId,
          userEmail: userInfo.email,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        });
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria no logout:', auditError);
      }
    }

    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });

    // Remover o cookie de autenticação
    console.log('🚪 Logout: Removendo cookie auth-token');
    
    // Obter o domínio da requisição para configurar o cookie corretamente
    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const domain = isLocalhost ? undefined : host.includes('.') ? host.split(':')[0] : undefined;
    
    console.log('🌐 Logout: Host detectado:', host);
    console.log('🌐 Logout: Domínio para cookie:', domain || 'default');
    
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
      domain: domain, // Usar o mesmo domínio que foi usado no login
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return response;

  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}