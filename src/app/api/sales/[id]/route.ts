import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { triggerDashboardUpdateServer } from '@/utils/dashboardUpdater'
import { createAuditLog } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id

    // Buscar venda com todos os relacionamentos
    const { data: sale, error } = await supabase
      .from('sales')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          role
        ),
        sale_items (
          id,
          quantity,
          unit_price,
          total,
          products (
            id,
            name,
            barcode,
            sale_price,
            cost_price,
            stock,
            unit,
            description,
            is_active,
            category_id,
            categories (
              id,
              name
            )
          )
        ),
        payments (
          id,
          amount,
          method,
          status,
          transaction_id,
          paid_at,
          created_at
        )
      `)
      .eq('id', saleId)
      .single()

    if (error) {
      console.error('Erro ao buscar venda:', error)
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    if (!sale) {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    // Mapear dados para o formato esperado pelo frontend
    const mappedSale = {
      id: sale.id,
      total: sale.total,
      discount: sale.discount || 0,
      finalTotal: sale.final_total || sale.total,
      paymentMethod: sale.payment_method,
      status: sale.status,
      notes: sale.notes,
      userId: sale.user_id,
      user: sale.users,
      items: (sale.sale_items || []).map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        total: item.total,
        saleId: sale.id,
        productId: item.products?.id,
        product: item.products ? {
          ...item.products,
          salePrice: item.products.sale_price,
          costPrice: item.products.cost_price,
          isActive: item.products.is_active,
          categoryId: item.products.category_id,
          category: item.products.categories
        } : null,
        createdAt: item.created_at
      })),
      payment: sale.payments?.[0] ? {
        ...sale.payments[0],
        method: sale.payments[0].method,
        transactionId: sale.payments[0].transaction_id,
        paidAt: sale.payments[0].paid_at,
        createdAt: sale.payments[0].created_at
      } : null,
      createdAt: sale.created_at,
      updatedAt: sale.updated_at
    }

    return NextResponse.json({
      success: true,
      data: mappedSale
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Atualizar status da venda
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id
    const body = await request.json()
    const { status, notes } = body

    // Validar status
    const validStatuses = ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Buscar dados antigos da venda para auditoria
    const { data: oldSale } = await supabase
      .from('sales')
      .select('status, notes')
      .eq('id', saleId)
      .single()

    // Atualizar venda
    const { data: sale, error } = await supabase
      .from('sales')
      .update({
        status: status,
        notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar venda:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar venda' },
        { status: 500 }
      )
    }

    // Criar log de auditoria
    try {
      const userAgent = request.headers.get('user-agent') || undefined
      const forwardedFor = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined
      const userId = request.headers.get('x-user-id') || 'sistema'
      const userEmail = request.headers.get('x-user-email') || 'sistema@sisiago.com'
      
      await createAuditLog({
        table_name: 'sales',
        operation: 'UPDATE',
        record_id: saleId,
        old_values: {
          status: oldSale?.status,
          notes: oldSale?.notes
        },
        new_values: {
          status: sale.status,
          notes: sale.notes
        },
        user_id: userId,
        user_email: userEmail,
        ip_address: ipAddress,
        user_agent: userAgent
      })
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError)
      // Não falhar a operação por causa do log
    }

    // Disparar atualização do dashboard se o status foi alterado
    if (status) {
      await triggerDashboardUpdateServer()
    }

    return NextResponse.json({
      success: true,
      data: sale
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Cancelar venda
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id

    // Verificar se a venda existe e pode ser cancelada
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('status, total, final_total, payment_method, notes')
      .eq('id', saleId)
      .single()

    if (fetchError || !sale) {
      return NextResponse.json(
        { success: false, error: 'Venda não encontrada' },
        { status: 404 }
      )
    }

    if (sale.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Venda já está cancelada' },
        { status: 400 }
      )
    }

    // Cancelar venda
    const { error: updateError } = await supabase
      .from('sales')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)

    if (updateError) {
      console.error('Erro ao cancelar venda:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao cancelar venda' },
        { status: 500 }
      )
    }

    // Criar log de auditoria
    try {
      const userAgent = request.headers.get('user-agent') || undefined
      const forwardedFor = request.headers.get('x-forwarded-for')
      const realIp = request.headers.get('x-real-ip')
      const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined
      const userId = request.headers.get('x-user-id') || 'sistema'
      const userEmail = request.headers.get('x-user-email') || 'sistema@sisiago.com'
      
      await createAuditLog({
        table_name: 'sales',
        operation: 'DELETE',
        record_id: saleId,
        old_values: {
          status: sale.status,
          total: sale.total,
          final_total: sale.final_total,
          payment_method: sale.payment_method,
          notes: sale.notes
        },
        new_values: {
          status: 'CANCELLED'
        },
        user_id: userId,
        user_email: userEmail,
        ip_address: ipAddress,
        user_agent: userAgent
      })
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError)
      // Não falhar a operação por causa do log
    }

    // Disparar atualização do dashboard
    await triggerDashboardUpdateServer()

    return NextResponse.json({
      success: true,
      message: 'Venda cancelada com sucesso'
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}