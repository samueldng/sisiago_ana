import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/products/barcode/[barcode] - Buscar produto por código de barras
export async function GET(
  request: NextRequest,
  { params }: { params: { barcode: string } }
) {
  try {
    const { barcode } = params
    
    if (!barcode) {
      return NextResponse.json(
        { success: false, error: 'Código de barras é obrigatório' },
        { status: 400 }
      )
    }
    
    const { data: product, error } = await supabase
      .from('products')
      .select('*, categories(id, name)')
      .eq('barcode', barcode)
      .eq('is_active', true)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }
    
    // Mapear campos do snake_case para camelCase
    const mappedProduct = {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      salePrice: product.sale_price,
      costPrice: product.cost_price,
      stock: product.stock,
      unit: product.unit,
      description: product.description,
      isActive: product.is_active,
      categoryId: product.category_id,
      category: product.categories,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    }
    
    return NextResponse.json({
      success: true,
      data: mappedProduct
    })
  } catch (error) {
    console.error('Erro ao buscar produto por código de barras:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}