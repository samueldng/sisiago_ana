import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Buscar todos os produtos com suas categorias
    const { data: products, error } = await supabase
      .from('products')
      .select('id, category_id')

    if (error) {
      throw error
    }

    // Contar produtos por categoria
    const counts: Record<string, number> = {}
    
    products?.forEach((product) => {
      const categoryId = product.category_id || 'sem-categoria'
      counts[categoryId] = (counts[categoryId] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: counts
    })
  } catch (error) {
    console.error('Erro ao buscar contagem de produtos por categoria:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}