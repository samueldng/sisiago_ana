import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { triggerDashboardUpdateServer } from '@/utils/dashboardUpdater'
import { createAuditLog } from '@/lib/supabase'

// Forçar revalidação a cada requisição
export const revalidate = 0
export const dynamic = 'force-dynamic'

// Schema de validação para criação de venda
const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1, 'ID do produto é obrigatório'),
    quantity: z.number().positive('Quantidade deve ser positiva'),
    unitPrice: z.number().positive('Preço unitário deve ser positivo')
  })).min(1, 'Pelo menos um item é obrigatório'),
  discount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX']),
  notes: z.string().optional().default(''),
  userId: z.string().min(1, 'ID do usuário é obrigatório')
})

// GET /api/sales - Listar vendas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const paymentMethod = searchParams.get('paymentMethod')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    let query = supabase
      .from('sales')
      .select('*, users(id, name, email), sale_items(*, products(*)), payments(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    
    // Aplicar filtro de data baseado no parâmetro 'date'
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (dateFilter) {
      case 'today':
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        query = query.gte('created_at', today.toISOString()).lt('created_at', tomorrow.toISOString())
        break
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        query = query.gte('created_at', weekStart.toISOString())
        break
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        query = query.gte('created_at', monthStart.toISOString())
        break
      case 'all':
        // Não aplicar filtro de data
        break
    }
    
    // Aplicar outros filtros
    if (startDate && endDate) {
      query = query.gte('created_at', startDate).lte('created_at', endDate)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod)
    }
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data: sales, error, count } = await query
    
    console.log('🔍 API Sales Debug:', {
      dateFilter,
      today: today.toISOString(),
      salesCount: sales?.length || 0,
      totalCount: count,
      error: error?.message
    })
    
    if (error) {
      throw error
    }
    
    const total = count || 0
    
    const response = NextResponse.json({
      success: true,
      sales: sales || [],
      data: sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
    
    // Headers para evitar cache
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
  } catch (error) {
    console.error('Erro ao buscar vendas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/sales - Criar venda
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSaleSchema.parse(body)
    
    // Verificar se todos os produtos existem e têm estoque suficiente
    const productIds = validatedData.items.map(item => item.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, stock')
      .in('id', productIds)
      .eq('is_active', true)
    
    if (productsError) {
      console.error('Erro ao buscar produtos:', productsError)
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar produtos' },
        { status: 500 }
      )
    }
    
    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'Um ou mais produtos não foram encontrados' },
        { status: 400 }
      )
    }
    
    // Verificar estoque
    for (const item of validatedData.items) {
      const product = products.find(p => p.id === item.productId)
      if (product && product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `Estoque insuficiente para o produto ${product.name}` },
          { status: 400 }
        )
      }
    }
    
    // Calcular totais
    const total = validatedData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)
    
    const finalTotal = total - validatedData.discount
    
    // Verificar se o usuário existe, se não, criar um usuário padrão
    let userId = validatedData.userId
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (!existingUser) {
      // Criar usuário padrão para desenvolvimento
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: `user-${userId}@temp.com`,
          name: 'Usuário Temporário',
          password: 'temp123',
          role: 'OPERATOR'
        })
        .select()
        .single()
      
      if (userError) {
        console.error('Erro ao criar usuário temporário:', userError)
        // Se falhar, usar um usuário padrão fixo
        userId = 'default-user'
        
        // Tentar criar usuário padrão fixo
        const { error: defaultUserError } = await supabase
          .from('users')
          .upsert({
            id: 'default-user',
            email: 'default@sisiago.com',
            name: 'Usuário Padrão',
            password: 'default123',
            role: 'OPERATOR'
          })
        
        if (defaultUserError) {
          console.error('Erro ao criar usuário padrão:', defaultUserError)
        }
      }
    }

    // Criar a venda
    const { data: newSale, error: saleError } = await supabase
      .from('sales')
      .insert({
        total,
        discount: validatedData.discount,
        final_total: finalTotal,
        payment_method: validatedData.paymentMethod,
        status: 'PAID', // Marcar como paga diretamente
        notes: validatedData.notes || '',
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (saleError || !newSale) {
      console.error('Erro ao criar venda:', saleError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar venda' },
        { status: 500 }
      )
    }
    
    // Criar os itens da venda
    const saleItemsData = validatedData.items.map(item => ({
      sale_id: newSale.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.quantity * item.unitPrice
    }))
    
    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItemsData)
    
    if (itemsError) {
      console.error('Erro ao criar itens da venda:', itemsError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar itens da venda' },
        { status: 500 }
      )
    }
    
    // Atualizar estoque dos produtos
    for (const item of validatedData.items) {
      const product = products.find(p => p.id === item.productId)
      if (product) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: product.stock - item.quantity })
          .eq('id', item.productId)
        
        if (stockError) {
          console.error('Erro ao atualizar estoque:', stockError)
          // Continuar mesmo com erro de estoque para não falhar a venda
        }
      }
    }
    
    // Buscar os itens da venda para retornar
    const { data: saleItems, error: itemsFetchError } = await supabase
      .from('sale_items')
      .select('*')
      .eq('sale_id', newSale.id)
    
    if (itemsFetchError) {
      console.error('Erro ao buscar itens da venda:', itemsFetchError)
    }
    
    // Criar log de auditoria
    try {
      const userAgent = request.headers.get('user-agent') || undefined
      const forwardedFor = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined
      
      await createAuditLog({
        table_name: 'sales',
        operation: 'INSERT',
        record_id: newSale.id,
        new_values: {
          total: newSale.total,
          discount: newSale.discount,
          final_total: newSale.final_total,
          payment_method: newSale.payment_method,
          status: newSale.status,
          notes: newSale.notes,
          items_count: validatedData.items.length
        },
        user_id: userId,
        user_email: existingUser?.email || 'sistema@sisiago.com',
        ip_address: ipAddress,
        user_agent: userAgent
      })
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError)
      // Não falhar a operação por causa do log
    }

    // Disparar atualização do dashboard
    await triggerDashboardUpdateServer()

    // Retornar venda com itens
    const saleResponse = {
      ...newSale,
      items: saleItems || []
    }

    return NextResponse.json(
      { success: true, data: saleResponse, message: 'Venda criada com sucesso' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao criar venda:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}