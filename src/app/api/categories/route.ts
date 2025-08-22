import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Schema de validação para criação de categoria
const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional()
})

// GET /api/categories - Listar categorias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    let query = supabase
      .from('categories')
      .select('*, products(count)')
      .order('name', { ascending: true })
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    const { data: categories, error } = await query
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Criar categoria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createCategorySchema.parse(body)
    
    // Verificar se o nome já existe
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', validatedData.name)
      .single()
    
    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Categoria com este nome já existe' },
        { status: 400 }
      )
    }
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert([validatedData])
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json(
      { success: true, data: category, message: 'Categoria criada com sucesso' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}