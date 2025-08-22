const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sales?date=all',
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
      console.log('📊 Response Data:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('\n📈 Sales Summary:');
        console.log(`- Total sales found: ${response.sales?.length || 0}`);
        console.log(`- Total count: ${response.pagination?.total || 0}`);
        
        if (response.sales && response.sales.length > 0) {
          console.log('\n🔍 First sale details:');
          const firstSale = response.sales[0];
          console.log(`- ID: ${firstSale.id}`);
          console.log(`- Total: R$ ${firstSale.total}`);
          console.log(`- Status: ${firstSale.status}`);
          console.log(`- Created: ${firstSale.created_at}`);
          console.log(`- Items: ${firstSale.sale_items?.length || 0}`);
        }
      } else {
        console.log('❌ API returned error:', response.error);
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