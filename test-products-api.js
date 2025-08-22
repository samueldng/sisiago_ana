const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function testProductsAPI() {
  try {
    console.log('🔄 Testando API de produtos...')
    
    // Testar listagem de produtos
    console.log('\n📋 Testando GET /api/products')
    const response = await fetch('http://localhost:3000/api/products')
    const data = await response.json()
    
    if (data.success) {
      console.log(`✅ Produtos encontrados: ${data.data.length}`)
      
      if (data.data.length > 0) {
        const firstProduct = data.data[0]
        console.log('\n📦 Primeiro produto:')
        console.log(`  ID: ${firstProduct.id}`)
        console.log(`  Nome: ${firstProduct.name}`)
        console.log(`  Preço: R$ ${firstProduct.salePrice}`)
        console.log(`  Status: ${firstProduct.isActive ? 'Ativo' : 'Inativo'}`)
        console.log(`  Categoria: ${firstProduct.category?.name || 'N/A'}`)
        
        // Testar busca por ID
        console.log(`\n🔍 Testando GET /api/products/${firstProduct.id}`)
        const productResponse = await fetch(`http://localhost:3000/api/products/${firstProduct.id}`)
        const productData = await productResponse.json()
        
        if (productData.success) {
          console.log('✅ Produto encontrado por ID')
          console.log(`  Nome: ${productData.data.name}`)
          console.log(`  Preço: R$ ${productData.data.salePrice}`)
          console.log(`  Status: ${productData.data.isActive ? 'Ativo' : 'Inativo'}`)
          console.log(`  Categoria: ${productData.data.category?.name || 'N/A'}`)
        } else {
          console.log('❌ Erro ao buscar produto por ID:', productData.error)
        }
      }
    } else {
      console.log('❌ Erro ao listar produtos:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

testProductsAPI()