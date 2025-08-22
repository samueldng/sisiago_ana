import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Schema de validação para criação de cliente
const createClientSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  endereco: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    if (search) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%,cpf.ilike.%${search}%`)
    }
    
    const { data: clients, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
    
    if (error) {
      console.error('Erro ao buscar clientes:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar clientes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: clients || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validationResult = createClientSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { success: false, error: `Dados inválidos: ${errors}` },
        { status: 400 }
      )
    }
    
    const clientData = validationResult.data
    
    // Verificar se já existe cliente com o mesmo email (se fornecido)
    if (clientData.email) {
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', clientData.email)
        .single()
      
      if (existingClient && !checkError) {
        return NextResponse.json(
          { success: false, error: 'Já existe um cliente com este email' },
          { status: 400 }
        )
      }
    }
    
    // Criar cliente
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({
        nome: clientData.nome,
        email: clientData.email || null,
        telefone: clientData.telefone || null,
        cpf: clientData.cpf || null,
        endereco: clientData.endereco || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar cliente:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar cliente' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: newClient,
      message: 'Cliente criado com sucesso'
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}