const http = require('http');

// Teste para verificar se o problema está na renderização dos dados
const testDashboardRendering = async () => {
  try {
    console.log('🧪 Testando renderização do Dashboard...');
    
    // Primeiro, vamos testar a API
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
          console.log('✅ API Response Status:', res.statusCode);
          console.log('📊 Dados da API:');
          console.log(`- todaySales: ${response.todaySales} (tipo: ${typeof response.todaySales})`);
          console.log(`- todayRevenue: ${response.todayRevenue} (tipo: ${typeof response.todayRevenue})`);
          console.log(`- totalProducts: ${response.totalProducts} (tipo: ${typeof response.totalProducts})`);
          console.log(`- lowStockProducts: ${response.lowStockProducts} (tipo: ${typeof response.lowStockProducts})`);
          
          // Simular o que o componente React faz
          console.log('\n🔄 Simulando renderização do componente:');
          console.log(`- Vendas Hoje: ${response.todaySales.toString()}`);
          console.log(`- Faturamento Hoje: R$ ${response.todayRevenue.toFixed(2).replace('.', ',')}`);
          console.log(`- Total de Produtos: ${response.totalProducts.toString()}`);
          console.log(`- Estoque Baixo: ${response.lowStockProducts.toString()}`);
          
          // Verificar se os valores são válidos
          if (response.todaySales > 0) {
            console.log('\n✅ DADOS VÁLIDOS: Vendas encontradas!');
            console.log('🔍 Se o dashboard não está mostrando estes dados, o problema pode ser:');
            console.log('1. Cache do navegador - tente Ctrl+F5');
            console.log('2. Estado do React não está atualizando');
            console.log('3. Componente não está re-renderizando');
            console.log('4. Hook useDashboardStats com problema');
          } else {
            console.log('\n⚠️  ATENÇÃO: Nenhuma venda encontrada hoje');
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

testDashboardRendering();