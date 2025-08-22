// Netlify Function para lidar com as rotas de API do Next.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Garantir que o JWT_SECRET esteja definido
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

exports.handler = async (event, context) => {
  // Redireciona para a API do Next.js
  const path = event.path.replace(/^\/\.netlify\/functions\/api/, '');
  const method = event.httpMethod;
  
  console.log(`Netlify Function: Processando requisição ${method} para: /api${path}`);
  
  try {
    // Processar rotas de autenticação
    if (path === '/auth/login' && method === 'POST') {
      return handleLogin(event);
    } else if (path === '/auth/verify' && method === 'GET') {
      return handleVerify(event);
    } else if (path === '/auth/logout' && method === 'POST') {
      return handleLogout(event);
    }
    
    // Rota não implementada
    return {
      statusCode: 501,
      body: JSON.stringify({
        error: `Rota não implementada: /api${path}`,
        path: path,
        method: method
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('Erro ao processar requisição de API:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};

// Função para lidar com login
async function handleLogin(event) {
  try {
    const body = JSON.parse(event.body);
    const { email, password } = body;
    
    // Validação básica
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email e senha são obrigatórios' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    // Simulação de autenticação - em produção, verificar contra banco de dados
    // Aqui estamos apenas verificando um usuário hardcoded para teste
    if (email === 'admin@sisiago.com' && password === 'admin123') {
      // Gerar JWT token
      const token = jwt.sign(
        { 
          userId: '1', 
          email: email, 
          role: 'admin',
          name: 'Administrador'
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Criar resposta com cookie httpOnly
      const response = {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: email,
            name: 'Administrador',
            role: 'admin'
          },
          token
        }),
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `auth-token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
        }
      };
      
      return response;
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Credenciais inválidas' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  } catch (error) {
    console.error('Erro no login:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}

// Função para verificar autenticação
async function handleVerify(event) {
  try {
    // Extrair token do cookie
    const cookies = parseCookies(event.headers.cookie || '');
    const token = cookies['auth-token'];
    
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Token não encontrado' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    
    // Verificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Retornar informações do usuário
    return {
      statusCode: 200,
      body: JSON.stringify({
        user: {
          id: decoded.userId || '1',
          name: decoded.name || 'Administrador',
          email: decoded.email || 'admin@sisiago.com',
          role: decoded.role || 'admin'
        },
        authenticated: true
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Token inválido' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}

// Função para lidar com logout
async function handleLogout() {
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
    }
  };
}

// Função auxiliar para analisar cookies
function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[name] = value;
    });
  }
  return cookies;
}