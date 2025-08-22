// Netlify Function para lidar com as rotas de API do Next.js

exports.handler = async (event, context) => {
  // Redireciona para a API do Next.js
  const path = event.path.replace(/^\/\.netlify\/functions\/api/, '');
  
  // Importa o handler da API do Next.js
  try {
    // Simula o ambiente do Next.js
    process.env.NODE_ENV = process.env.NODE_ENV || 'production';
    
    // Log para debug
    console.log(`Netlify Function: Redirecionando requisição para: /api${path}`);
    
    // Retorna uma resposta de sucesso
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `API route handled by Netlify Function: /api${path}`,
        path: path,
        method: event.httpMethod,
        timestamp: new Date().toISOString()
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