import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint para debug de headers e cookies em produção
 * Útil para diagnosticar problemas de autenticação
 */
export async function GET(request: NextRequest) {
  // Extrair headers relevantes para diagnóstico
  const headers = {
    host: request.headers.get('host'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
    cookie: request.headers.get('cookie'),
    'user-agent': request.headers.get('user-agent'),
  };

  // Extrair cookies para diagnóstico
  const cookies = {};
  request.cookies.getAll().forEach(cookie => {
    cookies[cookie.name] = {
      value: cookie.name === 'auth-token' ? '[REDACTED]' : cookie.value,
      attributes: {
        path: cookie.path,
        domain: cookie.domain,
        expires: cookie.expires,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
      }
    };
  });

  // Informações de ambiente
  const environment = {
    nodeEnv: process.env.NODE_ENV,
    hasJwtSecret: !!process.env.JWT_SECRET,
    url: request.url,
    nextUrl: {
      pathname: request.nextUrl.pathname,
      host: request.nextUrl.host,
      protocol: request.nextUrl.protocol,
    }
  };

  return NextResponse.json({
    headers,
    cookies,
    environment,
    timestamp: new Date().toISOString(),
  });
}