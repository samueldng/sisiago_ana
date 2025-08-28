import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key'
);

// Rotas que não precisam de autenticação
const publicRoutes = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/debug-headers'];

// Rotas da API que sempre devem passar pelo middleware (para adicionar headers)
const apiRoutes = ['/api/audit-logs', '/api/users'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('🔧 Middleware: Processando rota:', pathname);

  // Permitir acesso total a rotas públicas
  if (publicRoutes.includes(pathname)) {
    console.log('🔧 Middleware: Rota pública, permitindo acesso');
    return NextResponse.next();
  }

  // Verificar token
  const token = request.cookies.get('auth-token')?.value;
  console.log('🔧 Middleware: Token encontrado:', !!token);
  
  // Log de debug para ambiente de produção
  if (process.env.NODE_ENV === 'production') {
    console.log('🔧 Middleware: URL completa:', request.url);
    console.log('🔧 Middleware: Host:', request.headers.get('host'));
    console.log('🔧 Middleware: Cookie header:', request.headers.get('cookie'));
  }

  if (!token) {
    // Para rotas da API, retornar 401
    if (pathname.startsWith('/api/')) {
      console.log('🔧 Middleware: API sem token, retornando 401');
      return NextResponse.json(
        { error: 'Token não encontrado', authenticated: false },
        { status: 401 }
      );
    }
    // Para páginas, redirecionar para login apenas se não estiver já na página de login
    if (pathname !== '/login') {
      console.log('🔧 Middleware: Página sem token, redirecionando para login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    // Verificar se o token é válido
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('🔧 Middleware: Token válido para usuário:', payload.email);
    
    // Adicionar informações do usuário aos headers para uso nas rotas da API
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-user-email', payload.email as string);
    requestHeaders.set('x-user-role', payload.role as string);

    // Se o usuário está autenticado e tenta acessar /login, redirecionar para home
    if (pathname === '/login') {
      console.log('🔧 Middleware: Usuário autenticado tentando acessar login, redirecionando para home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('🔧 Middleware: Erro ao verificar token:', error);
    
    // Token inválido
    if (pathname.startsWith('/api/')) {
      console.log('🔧 Middleware: API com token inválido, retornando 401');
      const response = NextResponse.json(
        { error: 'Token inválido', authenticated: false },
        { status: 401 }
      );
      response.cookies.delete('auth-token');
      return response;
    }
    
    // Para páginas, redirecionar para login apenas se não estiver já lá
    if (pathname !== '/login') {
      console.log('🔧 Middleware: Página com token inválido, redirecionando para login');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
    
    // Se já está na página de login, apenas limpar o cookie inválido
    const response = NextResponse.next();
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.ico|.*\\.css|.*\\.js|.*\\.ts|.*\\.json|@vite).*)',
  ],
};