import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Schema de validação para atualização de cliente
const updateClientSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  endereco: z.string().optional()
})

// GET /api/clientes/[id] - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente é obrigatório' },
        { status: 400 }
      )
    }

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar cliente:', error)
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: client
    })
  } catch (error) {
    console.error('Erro interno ao buscar cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/clientes/[id] - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente é obrigatório' },
        { status: 400 }
      )
    }

    // Validar dados de entrada
    const validationResult = updateClientSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { success: false, error: `Dados inválidos: ${errors}` },
        { status: 400 }
      )
    }

    const clientData = validationResult.data

    // Verificar se o cliente existe
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingClient) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe outro cliente com o mesmo email (se fornecido)
    if (clientData.email) {
      const { data: existingEmail, error: emailError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', clientData.email)
        .neq('id', id)
        .single()

      if (existingEmail && !emailError) {
        return NextResponse.json(
          { success: false, error: 'Já existe um cliente com este email' },
          { status: 400 }
        )
      }
    }

    // Atualizar cliente
    const { data: updatedClient, error: updateError } = await supabase
      .from('clients')
      .update({
        ...clientData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar cliente:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar cliente' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: 'Cliente atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro interno ao atualizar cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/clientes/[id] - Excluir cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do cliente é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o cliente existe
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id, nome')
      .eq('id', id)
      .single()

    if (checkError || !existingClient) {
      return NextResponse.json(
        { success: false, error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o cliente está sendo usado em vendas
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id')
      .eq('client_id', id)
      .limit(1)

    if (salesError) {
      console.error('Erro ao verificar vendas:', salesError)
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar dependências' },
        { status: 500 }
      )
    }

    if (sales && sales.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir cliente que possui vendas associadas' },
        { status: 400 }
      )
    }

    // Excluir cliente
    const { error: deleteError } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir cliente:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir cliente' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro interno ao excluir cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}