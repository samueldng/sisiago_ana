const http = require('http');

// Teste simples para verificar se o frontend está recebendo os dados
const testDashboardAPI = async () => {
  try {
    console.log('🧪 Testando API do Dashboard...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Status da API:', res.statusCode);
          console.log('📊 Dados recebidos:');
          console.log(`- Vendas Hoje: ${response.todaySales}`);
          console.log(`- Faturamento Hoje: R$ ${response.todayRevenue}`);
          console.log(`- Total Produtos: ${response.totalProducts}`);
          console.log(`- Estoque Baixo: ${response.lowStockProducts}`);
          console.log(`- Última Atualização: ${response.lastUpdate}`);
          
          if (response.todaySales > 0) {
            console.log('\n✅ SUCESSO: API está retornando vendas de hoje!');
            console.log('🔍 O problema está no frontend. Verifique:');
            console.log('1. Se o hook useDashboardStats está sendo chamado');
            console.log('2. Se há erros no console do navegador');
            console.log('3. Se os dados estão sendo atualizados no estado');
          } else {
            console.log('\n⚠️  API retorna 0 vendas - problema na API');
          }
        } catch (error) {
          console.error('❌ Erro ao parsear resposta:', error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error);
    });

    req.end();
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
};

testDashboardAPI();