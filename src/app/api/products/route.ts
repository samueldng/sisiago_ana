import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { createAuditLog } from '@/lib/supabase'

// Schema de validação para criação de produto
const createProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  barcode: z.string().optional(),
  salePrice: z.number().positive('Preço de venda deve ser positivo'),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo'),
  unit: z.string().default('UN'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  isActive: z.boolean().default(true),
  isPerishable: z.boolean().default(false),
  expiryDate: z.string().datetime().optional()
}).refine((data) => {
  // Se o produto é perecível, a data de vencimento é obrigatória
  if (data.isPerishable && !data.expiryDate) {
    return false;
  }
  // Se não é perecível, não deve ter data de vencimento
  if (!data.isPerishable && data.expiryDate) {
    return false;
  }
  return true;
}, {
  message: 'Produtos perecíveis devem ter data de vencimento e produtos não perecíveis não devem ter',
  path: ['expiryDate']
})

// GET /api/products - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const isActive = searchParams.get('isActive')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    
    let query = supabase
      .from('products')
      .select('*, category:categories(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    
    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,barcode.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }
    
    const { data: products, error, count } = await query
    
    if (error) {
      throw error
    }
    
    const total = count || 0
    
    // Mapear campos do snake_case para camelCase
    const mappedProducts = products?.map(product => ({
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      salePrice: product.sale_price,
      costPrice: product.cost_price,
      stock: product.stock,
      unit: product.unit,
      description: product.description,
      isActive: product.is_active,
      isPerishable: product.is_perishable || false,
      expiryDate: product.expiry_date,
      categoryId: product.category_id,
      category: product.category,
      createdAt: product.created_at,
      updatedAt: product.updated_at
    })) || []
    
    return NextResponse.json({
      success: true,
      data: mappedProducts, // Corrigido: usar 'data' como esperado pelo frontend
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar produtos:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/products - Criar produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)
    
    // Verificar se o código de barras já existe
    if (validatedData.barcode) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', validatedData.barcode)
        .single()
      
      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Código de barras já existe' },
          { status: 400 }
        )
      }
    }
    
    // Verificar se a categoria existe
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('id', validatedData.categoryId)
      .single()
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 400 }
      )
    }
    
    // Converter campos para snake_case para o Supabase
    const productData = {
      name: validatedData.name,
      barcode: validatedData.barcode,
      sale_price: validatedData.salePrice,
      cost_price: validatedData.costPrice,
      stock: validatedData.stock,
      unit: validatedData.unit,
      description: validatedData.description,
      category_id: validatedData.categoryId,
      is_active: validatedData.isActive,
      is_perishable: validatedData.isPerishable,
      expiry_date: validatedData.expiryDate
    }
    
    const { data: product, error } = await supabase
      .from('products')
      .insert([productData])
      .select('*, category:categories(*)')
      .single()
    
    if (error) {
      throw error
    }
    
    // Mapear campos do snake_case para camelCase
    const mappedProduct = {
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      salePrice: product.sale_price,
      costPrice: product.cost_price,
      stock: product.stock,
      unit: product.unit,
      description: product.description,
      isActive: product.is_active,
      isPerishable: product.is_perishable,
      expiryDate: product.expiry_date,
      categoryId: product.category_id,
      category: product.category,
      createdAt: product.created_at,
      updatedAt: product.updated_at
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
        tableName: 'products',
        operation: 'INSERT',
        recordId: product.id,
        newValues: {
          name: product.name,
          barcode: product.barcode,
          sale_price: product.sale_price,
          cost_price: product.cost_price,
          stock: product.stock,
          unit: product.unit,
          description: product.description,
          category_id: product.category_id,
          is_active: product.is_active,
          is_perishable: product.is_perishable,
          expiry_date: product.expiry_date
        },
        userId: userId,
        userEmail: userEmail,
        ipAddress: ipAddress,
        userAgent: userAgent
      })
    } catch (auditError) {
      console.error('Erro ao criar log de auditoria:', auditError)
      // Não falhar a operação por causa do log
    }
    
    return NextResponse.json(
      { success: true, data: mappedProduct, message: 'Produto criado com sucesso' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Erro ao criar produto:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}