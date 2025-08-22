// Script para testar se o problema é cache do frontend
const http = require('http');

// Função para fazer requisição com timestamp para evitar cache
function makeRequest(path, description) {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const fullPath = `${path}?t=${timestamp}`;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: fullPath,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };

    console.log(`\n🔍 Testing ${description}...`);
    console.log(`📡 Request: GET ${fullPath}`);
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`✅ ${description} - Status: ${res.statusCode}`);
          
          if (path.includes('/api/dashboard/stats')) {
            console.log(`📊 Dashboard Stats:`);
            console.log(`   - Today Sales: ${response.todaySales}`);
            console.log(`   - Today Revenue: R$ ${response.todayRevenue}`);
            console.log(`   - Last Update: ${response.lastUpdate}`);
          }
          
          resolve(response);
        } catch (error) {
          console.error(`❌ Error parsing ${description}:`, error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request error for ${description}:`, error);
      reject(error);
    });

    req.end();
  });
}

async function testAPIs() {
  try {
    console.log('🚀 Testing APIs to identify cache issues...');
    
    // Test 1: Dashboard Stats API
    await makeRequest('/api/dashboard/stats', 'Dashboard Stats API');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Sales API with today filter
    await makeRequest('/api/sales?date=today', 'Sales API (today)');
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Dashboard Stats API again
    await makeRequest('/api/dashboard/stats', 'Dashboard Stats API (second call)');
    
    console.log('\n✅ All tests completed!');
    console.log('\n💡 If dashboard shows 0 sales but APIs return 1 sale:');
    console.log('   - Clear browser cache (Ctrl+Shift+R)');
    console.log('   - Check browser console for errors');
    console.log('   - Verify frontend is using latest compiled code');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPIs();