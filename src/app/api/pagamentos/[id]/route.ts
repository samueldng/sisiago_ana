import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Schema de validação para atualização de pagamento
const updatePaymentSchema = z.object({
  method: z.enum(['cash', 'credit', 'debit', 'pix']).optional(),
  amount: z.number().positive('Valor deve ser positivo').optional(),
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
  notes: z.string().optional()
})

// GET /api/pagamentos/[id] - Buscar pagamento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      )
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        sales:sale_id (
          id,
          total,
          status,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar pagamento:', error)
      return NextResponse.json(
        { success: false, error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: payment
    })
  } catch (error) {
    console.error('Erro interno ao buscar pagamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/pagamentos/[id] - Atualizar pagamento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      )
    }

    // Validar dados de entrada
    const validationResult = updatePaymentSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { success: false, error: `Dados inválidos: ${errors}` },
        { status: 400 }
      )
    }

    const paymentData = validationResult.data

    // Verificar se o pagamento existe
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('id, sale_id, amount, status')
      .eq('id', id)
      .single()

    if (checkError || !existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Se está alterando o valor, verificar se não excede o total da venda
    if (paymentData.amount && paymentData.amount !== existingPayment.amount) {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select('total')
        .eq('id', existingPayment.sale_id)
        .single()

      if (saleError || !sale) {
        return NextResponse.json(
          { success: false, error: 'Venda associada não encontrada' },
          { status: 404 }
        )
      }

      // Calcular total de outros pagamentos
      const { data: otherPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('sale_id', existingPayment.sale_id)
        .neq('id', id)
        .eq('status', 'paid')

      if (paymentsError) {
        console.error('Erro ao verificar outros pagamentos:', paymentsError)
        return NextResponse.json(
          { success: false, error: 'Erro ao verificar outros pagamentos' },
          { status: 500 }
        )
      }

      const totalOutrosPagamentos = (otherPayments || []).reduce((sum, p) => sum + p.amount, 0)
      const novoTotal = totalOutrosPagamentos + paymentData.amount

      if (novoTotal > sale.total) {
        return NextResponse.json(
          { success: false, error: `Valor do pagamento excede o total da venda. Máximo permitido: R$ ${(sale.total - totalOutrosPagamentos).toFixed(2)}` },
          { status: 400 }
        )
      }
    }

    // Atualizar pagamento
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update({
        ...paymentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        sales:sale_id (
          id,
          total,
          status,
          created_at
        )
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar pagamento:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar pagamento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedPayment,
      message: 'Pagamento atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro interno ao atualizar pagamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/pagamentos/[id] - Excluir pagamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o pagamento existe
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('id, venda_id, valor, status')
      .eq('id', id)
      .single()

    if (checkError || !existingPayment) {
      return NextResponse.json(
        { success: false, error: 'Pagamento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o pagamento pode ser excluído (apenas pendentes ou cancelados)
    if (existingPayment.status === 'concluido') {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir pagamento concluído' },
        { status: 400 }
      )
    }

    // Excluir pagamento
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir pagamento:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir pagamento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pagamento excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro interno ao excluir pagamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}