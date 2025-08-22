const http = require('http');

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
      console.log('✅ Dashboard Stats API Response Status:', res.statusCode);
      console.log('📊 Response Data:', JSON.stringify(response, null, 2));
      
      if (response.error) {
        console.log('❌ API returned error:', response.error);
      } else {
        console.log('\n📈 Dashboard Stats Summary:');
        console.log(`- Today Sales: ${response.todaySales}`);
        console.log(`- Today Revenue: R$ ${response.todayRevenue}`);
        console.log(`- Week Sales: ${response.weekSales}`);
        console.log(`- Week Revenue: R$ ${response.weekRevenue}`);
        console.log(`- Total Products: ${response.totalProducts}`);
        console.log(`- Low Stock Products: ${response.lowStockProducts}`);
        console.log(`- Top Products: ${response.topProducts?.length || 0}`);
        console.log(`- Last Update: ${response.lastUpdate}`);
        
        // Verificar se há vendas hoje
        if (response.todaySales === 0) {
          console.log('\n⚠️  WARNING: No sales found for today!');
          console.log('This might indicate:');
          console.log('1. No sales were made today');
          console.log('2. Sales exist but are not in PAID status');
          console.log('3. Date filtering issue');
        } else {
          console.log('\n✅ Sales found for today!');
        }
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.end();