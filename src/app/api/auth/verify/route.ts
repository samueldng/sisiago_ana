import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Garantir que o JWT_SECRET esteja definido
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Log para debug em produção
console.log('🔐 JWT_SECRET configurado:', JWT_SECRET ? 'Sim' : 'Não');

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    // Debug: listar todos os cookies disponíveis
    const allCookies = cookieStore.getAll();
    console.log('🍪 Todos os cookies disponíveis:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));
    console.log('🔍 Cookie auth-token encontrado:', !!token);
    console.log('🔍 Valor do token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'null');

    if (!token) {
      console.log('❌ Token não encontrado nos cookies');
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 401 }
      );
    }

    // Verificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Simular dados do usuário (em produção, buscar do banco de dados)
    const user = {
      id: decoded.userId || '1',
      name: decoded.name || 'Administrador',
      email: decoded.email || 'admin@sisiago.com',
      role: decoded.role || 'admin',
      permissions: decoded.permissions || ['read', 'write', 'admin']
    };

    return NextResponse.json({
      user,
      authenticated: true
    });
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    );
  }
}