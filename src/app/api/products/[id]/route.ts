import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import { createAuditLog } from '@/lib/supabase'

// Schema de validação para atualização de produto
const updateProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  barcode: z.string().nullable().optional(),
  salePrice: z.number().positive('Preço de venda deve ser positivo'),
  costPrice: z.number().nullable().optional(),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo'),
  unit: z.enum(['UN', 'KG', 'G', 'L', 'ML', 'M', 'CM']),
  categoryId: z.string().uuid('ID da categoria inválido'),
  isActive: z.boolean().optional().default(true),
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

// GET /api/products/[id] - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar produto com categoria
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar produto:', error)
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
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
    isPerishable: product.is_perishable || false,
    expiryDate: product.expiry_date,
    categoryId: product.category_id,
    category: product.category,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  }
  
  return NextResponse.json({
    success: true,
    data: mappedProduct
  })

  } catch (error) {
    console.error('Erro interno ao buscar produto:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Validar dados de entrada
    const validationResult = updateProductSchema.safeParse(body)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { success: false, error: `Dados inválidos: ${errors}` },
        { status: 400 }
      )
    }

    const productData = validationResult.data

    // Verificar se o produto existe e buscar valores antigos para auditoria
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a categoria existe
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', productData.categoryId)
      .single()

    if (categoryError || !category) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 400 }
      )
    }

    // Verificar se já existe outro produto com o mesmo código de barras (se fornecido)
    if (productData.barcode) {
      const { data: existingBarcode, error: barcodeError } = await supabase
        .from('products')
        .select('id')
        .eq('barcode', productData.barcode)
        .neq('id', id)
        .single()

      if (existingBarcode && !barcodeError) {
        return NextResponse.json(
          { success: false, error: 'Já existe um produto com este código de barras' },
          { status: 400 }
        )
      }
    }

    // Atualizar produto
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        name: productData.name,
        description: productData.description || null,
        barcode: productData.barcode || null,
        sale_price: productData.salePrice,
        cost_price: productData.costPrice || null,
        stock: productData.stock,
        unit: productData.unit,
        category_id: productData.categoryId,
        is_active: productData.isActive,
        is_perishable: productData.isPerishable,
        expiry_date: productData.expiryDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
      .single()

    if (updateError) {
      console.error('Erro ao atualizar produto:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar produto' },
        { status: 500 }
      )
    }

    // Mapear campos do snake_case para camelCase
    const mappedProduct = {
      id: updatedProduct.id,
      name: updatedProduct.name,
      barcode: updatedProduct.barcode,
      salePrice: updatedProduct.sale_price,
      costPrice: updatedProduct.cost_price,
      stock: updatedProduct.stock,
      unit: updatedProduct.unit,
      description: updatedProduct.description,
      isActive: updatedProduct.is_active,
      isPerishable: updatedProduct.is_perishable,
      expiryDate: updatedProduct.expiry_date,
      categoryId: updatedProduct.category_id,
      category: updatedProduct.category,
      createdAt: updatedProduct.created_at,
      updatedAt: updatedProduct.updated_at
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
        operation: 'UPDATE',
        recordId: id,
        oldValues: {
          name: existingProduct.name,
          barcode: existingProduct.barcode,
          sale_price: existingProduct.sale_price,
          cost_price: existingProduct.cost_price,
          stock: existingProduct.stock,
          unit: existingProduct.unit,
          description: existingProduct.description,
          category_id: existingProduct.category_id,
          is_active: existingProduct.is_active,
          is_perishable: existingProduct.is_perishable,
          expiry_date: existingProduct.expiry_date
        },
        newValues: {
          name: updatedProduct.name,
          barcode: updatedProduct.barcode,
          sale_price: updatedProduct.sale_price,
          cost_price: updatedProduct.cost_price,
          stock: updatedProduct.stock,
          unit: updatedProduct.unit,
          description: updatedProduct.description,
          category_id: updatedProduct.category_id,
          is_active: updatedProduct.is_active,
          is_perishable: updatedProduct.is_perishable,
          expiry_date: updatedProduct.expiry_date
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
    
    return NextResponse.json({
      success: true,
      data: mappedProduct,
      message: 'Produto atualizado com sucesso'
    })

  } catch (error) {
    console.error('Erro interno ao atualizar produto:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Excluir produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do produto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o produto existe e buscar dados para auditoria
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (checkError || !existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o produto está sendo usado em vendas
    const { data: salesItems, error: salesError } = await supabase
      .from('sale_items')
      .select('id')
      .eq('product_id', id)
      .limit(1)

    if (salesError) {
      console.error('Erro ao verificar vendas:', salesError)
      return NextResponse.json(
        { success: false, error: 'Erro ao verificar dependências' },
        { status: 500 }
      )
    }

    if (salesItems && salesItems.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir produto que possui vendas associadas' },
        { status: 400 }
      )
    }

    // Excluir produto
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao excluir produto:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir produto' },
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
        tableName: 'products',
        operation: 'DELETE',
        recordId: id,
        oldValues: {
          name: existingProduct.name,
          barcode: existingProduct.barcode,
          sale_price: existingProduct.sale_price,
          cost_price: existingProduct.cost_price,
          stock: existingProduct.stock,
          unit: existingProduct.unit,
          description: existingProduct.description,
          category_id: existingProduct.category_id,
          is_active: existingProduct.is_active,
          is_perishable: existingProduct.is_perishable,
          expiry_date: existingProduct.expiry_date
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

    return NextResponse.json({
      success: true,
      message: 'Produto excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro interno ao excluir produto:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}