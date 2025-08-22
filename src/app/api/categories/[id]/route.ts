import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { updateCategorySchema } from '@/lib/validations'

// PUT /api/categories/[id] - Atualizar categoria
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateCategorySchema.parse(body)
    
    // Verificar se a categoria existe
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se o nome já existe em outra categoria
    if (validatedData.name !== existingCategory.name) {
      const { data: nameExists } = await supabase
        .from('categories')
        .select('id')
        .eq('name', validatedData.name)
        .neq('id', params.id)
        .single()
      
      if (nameExists) {
        return NextResponse.json(
          { success: false, error: 'Categoria com este nome já existe' },
          { status: 400 }
        )
      }
    }
    
    const { data: category, error } = await supabase
      .from('categories')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      data: category,
      message: 'Categoria atualizada com sucesso'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Excluir categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se a categoria existe
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    // Verificar se há produtos vinculados
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', params.id)
    
    if (productsCount && productsCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Não é possível excluir a categoria. Há ${productsCount} produto(s) vinculado(s) a ela.` 
        },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      message: 'Categoria excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir categoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET /api/categories/[id] - Buscar categoria por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*, products(count)')
      .eq('id', params.id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: category
    })
  } catch (error) {
    console.error('Erro ao buscar categoria:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}