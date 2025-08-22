import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFilter = searchParams.get('date') || 'today'
    const status = searchParams.get('status')
    const method = searchParams.get('method')

    // Calcular range de datas
    let startDate: Date
    let endDate: Date = new Date()
    endDate.setHours(23, 59, 59, 999)

    switch (dateFilter) {
      case 'today':
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date()
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'all':
      default:
        startDate = new Date('2020-01-01')
        break
    }

    // Construir query
    let query = supabase
      .from('payments')
      .select(`
        *,
        sales (
          id,
          total,
          final_total,
          status,
          created_at
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    // Aplicar filtros adicionais
    if (status) {
      query = query.eq('status', status)
    }

    if (method) {
      query = query.eq('method', method)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error('Erro ao buscar pagamentos:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar pagamentos' },
        { status: 500 }
      )
    }

    // Mapear dados para o formato esperado pelo frontend
    const mappedPayments = (payments || []).map((payment: any) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transaction_id,
      paidAt: payment.paid_at,
      saleId: payment.sale_id,
      sale: payment.sales,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    }))

    // Calcular estatísticas
    const totalPayments = mappedPayments.length
    const totalAmount = mappedPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0)
    const paidPayments = mappedPayments.filter((payment: any) => payment.status === 'PAID').length
    const pendingPayments = mappedPayments.filter((payment: any) => payment.status === 'PENDING').length
    const paidAmount = mappedPayments
      .filter((payment: any) => payment.status === 'PAID')
      .reduce((sum: number, payment: any) => sum + payment.amount, 0)

    // Estatísticas por método de pagamento
    const paymentsByMethod = mappedPayments.reduce((acc: any, payment: any) => {
      if (!acc[payment.method]) {
        acc[payment.method] = { count: 0, amount: 0 }
      }
      acc[payment.method].count++
      if (payment.status === 'PAID') {
        acc[payment.method].amount += payment.amount
      }
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        payments: mappedPayments,
        stats: {
          totalPayments,
          totalAmount,
          paidPayments,
          pendingPayments,
          paidAmount,
          paymentsByMethod
        }
      }
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Criar novo pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { saleId, amount, method, transactionId } = body

    // Validar dados obrigatórios
    if (!saleId || !amount || !method) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Verificar se a venda existe
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('id, final_total')
      .eq('id', saleId)
      .single()

    if (saleError || !sale) {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se o valor está correto
    if (amount !== sale.final_total) {
      return NextResponse.json(
        { success: false, error: 'Valor do pagamento não confere com o total da venda' },
        { status: 400 }
      )
    }

    // Criar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        sale_id: saleId,
        amount: amount,
        method: method,
        status: method === 'CASH' ? 'PAID' : 'PENDING',
        transaction_id: transactionId,
        paid_at: method === 'CASH' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Erro ao criar pagamento:', paymentError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar pagamento' },
        { status: 500 }
      )
    }

    // Se for pagamento em dinheiro, atualizar status da venda
    if (method === 'CASH') {
      await supabase
        .from('sales')
        .update({ status: 'PAID' })
        .eq('id', saleId)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...payment,
        transactionId: payment.transaction_id,
        paidAt: payment.paid_at,
        saleId: payment.sale_id,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at
      }
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}