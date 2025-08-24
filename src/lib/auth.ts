import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { createServerClient } from '@/lib/supabase/server';

// Simulação do banco de dados para permissões
const db = {
  permissions: {
    findByUserAndEntity: async ({ userId, entityId }: { userId: string, entityId: string }) => {
      // Simulação: todos os usuários têm permissão de admin para todas as entidades
      return { data: ['admin', 'read', 'write'], error: null };
    }
  },
  users: {
    findById: async (userId: string) => {
      // Simulação: retornar um usuário fictício para qualquer ID
      return { 
        data: {
          id: userId,
          email: 'admin@sisiago.com',
          name: 'Administrador',
          role: 'admin',
          password: 'hashed_password_here'
        }, 
        error: null 
      };
    }
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  error?: string;
}

/**
 * Função para verificar permissões do usuário para uma entidade específica
 */
export async function checkUserPermission(
  request: NextRequest,
  entityId: string,
  requiredPermission: string
): Promise<AuthResult> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }
  
  // Verificar se o usuário é admin (tem acesso total)
  if (authResult.user.role === 'admin') {
    return authResult;
  }
  
  // Buscar permissões do usuário para a entidade
  const { data: permissions, error } = await db.permissions.findByUserAndEntity({
    userId: authResult.user.id,
    entityId
  });
  
  if (error || !permissions || !permissions.includes(requiredPermission)) {
    return {
      success: false,
      error: `Permissão insuficiente: ${requiredPermission} necessária`
    };
  }
  
  return authResult;
}

/**
 * Função para verificar autenticação em APIs
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Obter token do cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return {
        success: false,
        error: 'Token não encontrado'
      };
    }

    // Verificar e decodificar o token usando jose (mesma lib do middleware)
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const decoded = {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string
    };

    // Buscar usuário atualizado no banco
    const { data: user, error } = await db.users.findById(decoded.userId);

    if (error || !user) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      };
    }

    // Retornar dados do usuário (sem senha)
    const { password, ...userWithoutPassword } = user;
    
    return {
      success: true,
      user: userWithoutPassword
    };

  } catch (error) {
    console.error('Erro na verificação de token:', error);
    return {
      success: false,
      error: 'Token inválido'
    };
  }
}

/**
 * Função para verificar se o usuário tem uma role específica
 */
export async function verifyRole(request: NextRequest, requiredRole: string): Promise<AuthResult> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }
  
  if (authResult.user.role !== requiredRole) {
    return {
      success: false,
      error: `Acesso negado. Role '${requiredRole}' necessária.`
    };
  }
  
  return authResult;
}

/**
 * Função para verificar se o usuário tem uma das roles permitidas
 */
export async function verifyRoles(request: NextRequest, allowedRoles: string[]): Promise<AuthResult> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.success || !authResult.user) {
    return authResult;
  }
  
  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      success: false,
      error: `Acesso negado. Uma das seguintes roles é necessária: ${allowedRoles.join(', ')}`
    };
  }
  
  return authResult;
}