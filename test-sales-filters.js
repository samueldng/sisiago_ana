const http = require('http');

const filters = [
  { name: 'Todas', value: 'all' },
  { name: 'Hoje', value: 'today' },
  { name: 'Esta semana', value: 'week' },
  { name: 'Este mês', value: 'month' }
];

async function testFilter(filter) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/sales?date=${filter.value}`,
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
          resolve({
            filter: filter.name,
            status: res.statusCode,
            success: response.success,
            count: response.sales?.length || 0,
            total: response.pagination?.total || 0
          });
        } catch (error) {
          reject({ filter: filter.name, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      reject({ filter: filter.name, error: error.message });
    });

    req.end();
  });
}

async function testAllFilters() {
  console.log('🧪 Testando todos os filtros de data da API de vendas...\n');
  
  for (const filter of filters) {
    try {
      console.log(`🔍 Testando filtro: ${filter.name} (${filter.value})`);
      const result = await testFilter(filter);
      
      if (result.success) {
        console.log(`✅ ${result.filter}: ${result.count} vendas encontradas (total: ${result.total})`);
      } else {
        console.log(`❌ ${result.filter}: Falha na requisição`);
      }
    } catch (error) {
      console.log(`❌ ${error.filter}: Erro - ${error.error}`);
    }
    console.log('');
  }
  
  console.log('🎯 Teste de filtros concluído!');
}

testAllFilters();