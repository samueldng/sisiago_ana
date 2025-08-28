import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Data de hoje (início e fim do dia)
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Buscar vendas de hoje (apenas pagas)
    const { count: todaySales } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PAID')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    // Buscar receita de hoje (apenas vendas pagas)
    const { data: todayRevenueData } = await supabase
      .from('sales')
      .select('final_total')
      .eq('status', 'PAID')
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString())

    const todayRevenue = todayRevenueData?.reduce((sum, sale) => sum + (sale.final_total || 0), 0) || 0

    // Buscar total de produtos
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Buscar produtos com estoque baixo (menos de 10 unidades)
    const { count: lowStockProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('stock', 10)

    // Buscar vendas da semana para comparação (apenas pagas)
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - 7)
    
    const { count: weekSales } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PAID')
      .gte('created_at', startOfWeek.toISOString())
      .lt('created_at', endOfDay.toISOString())

    const { data: weekRevenueData } = await supabase
      .from('sales')
      .select('final_total')
      .eq('status', 'PAID')
      .gte('created_at', startOfWeek.toISOString())
      .lt('created_at', endOfDay.toISOString())

    const weekRevenue = weekRevenueData?.reduce((sum, sale) => sum + (sale.final_total || 0), 0) || 0

    // Buscar produtos mais vendidos hoje (apenas de vendas pagas)
    const { data: topProductsData } = await supabase
      .from('sale_items')
      .select(`
        product_id,
        quantity,
        products (
          id,
          name,
          sale_price
        ),
        sales!inner (
          created_at,
          status
        )
      `)
      .eq('sales.status', 'PAID')
      .gte('sales.created_at', startOfDay.toISOString())
      .lt('sales.created_at', endOfDay.toISOString())

    // Agrupar produtos por ID e somar quantidades
    const productSales = (topProductsData || []).reduce((acc: any, item: any) => {
      const productId = item.product_id
      if (!acc[productId]) {
        acc[productId] = {
          product: item.products,
          quantity: 0
        }
      }
      acc[productId].quantity += item.quantity
      return acc
    }, {})

    // Converter para array e ordenar por quantidade
    const topProductsWithDetails = Object.values(productSales)
      .sort((a: any, b: any) => b.quantity - a.quantity)
      .slice(0, 5)

    const stats = {
      todaySales: todaySales || 0,
      todayRevenue,
      totalProducts: totalProducts || 0,
      lowStockProducts: lowStockProducts || 0,
      weekSales: weekSales || 0,
      weekRevenue,
      topProducts: topProductsWithDetails,
      lastUpdate: new Date().toISOString()
    }

    const response = NextResponse.json(stats)
    
    // Headers para evitar cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}