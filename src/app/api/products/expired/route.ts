import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const daysAhead = parseInt(searchParams.get('days') || '7') // Padrão: 7 dias
    
    // Data atual
    const now = new Date()
    
    // Data limite (hoje + dias especificados)
    const limitDate = new Date()
    limitDate.setDate(now.getDate() + daysAhead)
    
    console.log('🔍 Verificando produtos vencidos/próximos ao vencimento...')
    console.log('📅 Data atual:', now.toISOString())
    console.log('📅 Data limite:', limitDate.toISOString())
    
    // Buscar produtos perecíveis que estão vencidos ou próximos ao vencimento
    const { data: expiredProducts, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        barcode,
        sale_price,
        stock,
        is_perishable,
        expiry_date,
        category_id,
        categories (
          id,
          name
        )
      `)
      .eq('is_perishable', true)
      .eq('is_active', true)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', limitDate.toISOString())
      .order('expiry_date', { ascending: true })
    
    if (error) {
      console.error('❌ Erro ao buscar produtos vencidos:', error)
      throw error
    }
    
    // Categorizar produtos por status de vencimento
    const categorizedProducts = {
      expired: [] as any[],
      expiringSoon: [] as any[],
      total: expiredProducts?.length || 0
    }
    
    expiredProducts?.forEach(product => {
      const expiryDate = new Date(product.expiry_date)
      const isExpired = expiryDate < now
      
      const mappedProduct = {
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        salePrice: product.sale_price,
        stock: product.stock,
        isPerishable: product.is_perishable,
        expiryDate: product.expiry_date,
        categoryId: product.category_id,
        category: product.categories,
        daysUntilExpiry: Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        status: isExpired ? 'expired' : 'expiring_soon'
      }
      
      if (isExpired) {
        categorizedProducts.expired.push(mappedProduct)
      } else {
        categorizedProducts.expiringSoon.push(mappedProduct)
      }
    })
    
    console.log('📊 Produtos encontrados:', {
      total: categorizedProducts.total,
      expired: categorizedProducts.expired.length,
      expiringSoon: categorizedProducts.expiringSoon.length
    })
    
    return NextResponse.json({
      success: true,
      data: categorizedProducts,
      summary: {
        totalExpiredProducts: categorizedProducts.total,
        expiredCount: categorizedProducts.expired.length,
        expiringSoonCount: categorizedProducts.expiringSoon.length,
        daysAhead,
        checkDate: now.toISOString(),
        limitDate: limitDate.toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao verificar produtos vencidos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}