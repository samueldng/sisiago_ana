import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Schema de validação para criação de pagamento
const createPaymentSchema = z.object({
  sale_id: z.string().uuid('ID da venda deve ser um UUID válido'),
  method: z.enum(['cash', 'credit', 'debit', 'pix'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  amount: z.number().positive('Valor deve ser positivo'),
  status: z.enum(['pending', 'paid', 'cancelled']).default('pending'),
  notes: z.string().optional()
})

// GET /api/pagamentos - Listar pagamentos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const saleId = searchParams.get('sale_id')
    const method = searchParams.get('method')
    const status = searchParams.get('status')
    const dataInicio = searchParams.get('data_inicio')
    const dataFim = searchParams.get('data_fim')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Validar parâmetros
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros de paginação inválidos' },
        { status: 400 }
      )
    }

    // Construir query
    let query = supabase
      .from('payments')
      .select(`
        *,
        sale:sales!sale_id(
          id,
          total,
          created_at
        )
      `, { count: 'exact' })

    // Aplicar filtros
    if (saleId) {
      query = query.eq('sale_id', saleId)
    }
    if (method) {
      query = query.eq('method', method)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (dataInicio) {
      query = query.gte('created_at', dataInicio)
    }

    if (dataFim) {
      query = query.lte('created_at', dataFim)
    }

    // Aplicar ordenação e paginação
    const offset = (page - 1) * limit
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data: payments, error, count } = await query

    if (error) {
      console.error('Erro ao buscar pagamentos:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar pagamentos' },
        { status: 500 }
      )
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: payments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Erro interno ao buscar pagamentos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/pagamentos - Criar pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validationResult = createPaymentSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { success: false, error: `Dados inválidos: ${errors}` },
        { status: 400 }
      )
    }
    
    const paymentData = validationResult.data
    
    // Verificar se a venda existe
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('id, total, status')
      .eq('id', paymentData.sale_id)
      .single()
    
    if (saleError || !sale) {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se a venda não está cancelada
    if (sale.status === 'cancelada') {
      return NextResponse.json(
        { success: false, error: 'Não é possível adicionar pagamento a uma venda cancelada' },
        { status: 400 }
      )
    }
    
    // Verificar se o valor do pagamento não excede o total da venda
    const { data: existingPayments, error: paymentsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('sale_id', paymentData.sale_id)
      .eq('status', 'paid')
    
    if (paymentsError) {
      console.error('Erro ao verificar pagamentos existentes:', paymentsError)
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar pagamentos existentes' },
        { status: 500 }
      )
    }
    
    const totalPago = (existingPayments || []).reduce((sum, p) => sum + p.amount, 0)
    const novoTotal = totalPago + paymentData.amount
    
    if (novoTotal > sale.total) {
      return NextResponse.json(
        { success: false, error: `Valor do pagamento excede o total da venda. Restante: R$ ${(sale.total - totalPago).toFixed(2)}` },
        { status: 400 }
      )
    }
    
    // Criar pagamento
    const { data: newPayment, error } = await supabase
      .from('payments')
      .insert({
          sale_id: paymentData.sale_id,
          method: paymentData.method,
          amount: paymentData.amount,
        status: paymentData.status,
          notes: paymentData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar pagamento:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar pagamento' },
        { status: 500 }
      )
    }
    
    // Atualizar status da venda se totalmente paga
    if (novoTotal === sale.total && paymentData.status === 'paid') {
      await supabase
        .from('sales')
        .update({ status: 'paid' })
        .eq('id', paymentData.sale_id)
    }
    
    return NextResponse.json({
      success: true,
      data: newPayment,
      message: 'Pagamento criado com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar pagamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}