// Script para testar API de produtos vencidos
const http = require('http');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ ok: res.statusCode === 200, json: () => jsonData });
        } catch (error) {
          reject(new Error('Erro ao parsear JSON: ' + error.message));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
}

async function testExpiredProductsAPI() {
  try {
    console.log('🧪 Testando API de produtos vencidos...');
    
    const response = await makeRequest('http://localhost:3000/api/products/expired?days=7');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('📊 Resposta da API:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n📈 Resumo:');
    console.log(`✅ Sucesso: ${data.success}`);
    console.log(`📦 Total de produtos: ${data.data.total}`);
    console.log(`❌ Produtos vencidos: ${data.data.expired.length}`);
    console.log(`⚠️ Produtos vencendo em breve: ${data.data.expiringSoon.length}`);
    
    if (data.data.expired.length > 0) {
      console.log('\n🚨 Produtos vencidos encontrados:');
      data.data.expired.forEach(product => {
        console.log(`- ${product.name} (${product.barcode}) - Venceu em: ${new Date(product.expiryDate).toLocaleDateString('pt-BR')}`);
      });
    }
    
    if (data.data.expiringSoon.length > 0) {
      console.log('\n⏰ Produtos vencendo em breve:');
      data.data.expiringSoon.forEach(product => {
        console.log(`- ${product.name} (${product.barcode}) - Vence em: ${new Date(product.expiryDate).toLocaleDateString('pt-BR')} (${product.daysUntilExpiry} dias)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testExpiredProductsAPI();