import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schema de validação para parâmetros de relatório
const reportParamsSchema = z.object({
  tipo: z.enum(['vendas', 'produtos', 'financeiro', 'clientes'], {
    errorMap: () => ({ message: 'Tipo de relatório inválido' })
  }),
  data_inicio: z.string().nullable().optional(),
  data_fim: z.string().nullable().optional(),
  categoria_id: z.string().uuid().nullable().optional(),
  usuario_id: z.string().uuid().nullable().optional(),
  status: z.string().nullable().optional(),
  formato: z.enum(['json', 'csv']).default('json')
})

// GET /api/relatorios - Gerar relatórios
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params = {
      tipo: searchParams.get('tipo'),
      data_inicio: searchParams.get('data_inicio'),
      data_fim: searchParams.get('data_fim'),
      categoria_id: searchParams.get('categoria_id'),
      usuario_id: searchParams.get('usuario_id'),
      status: searchParams.get('status'),
      formato: searchParams.get('formato') || 'json'
    }

    // Validar parâmetros
    const validationResult = reportParamsSchema.safeParse(params)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ')
      return NextResponse.json(
        { success: false, error: `Parâmetros inválidos: ${errors}` },
        { status: 400 }
      )
    }

    const validatedParams = validationResult.data

    let reportData: any = {}
    let reportTitle = ''

    switch (validatedParams.tipo) {
      case 'vendas':
        reportData = await generateSalesReport(validatedParams)
        reportTitle = 'Relatório de Vendas'
        break
      case 'produtos':
        reportData = await generateProductsReport(validatedParams)
        reportTitle = 'Relatório de Produtos'
        break
      case 'financeiro':
        reportData = await generateFinancialReport(validatedParams)
        reportTitle = 'Relatório Financeiro'
        break
      case 'clientes':
        reportData = await generateClientsReport(validatedParams)
        reportTitle = 'Relatório de Clientes'
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Tipo de relatório não suportado' },
          { status: 400 }
        )
    }

    if (validatedParams.formato === 'csv') {
      const csv = convertToCSV(reportData.data || [])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportTitle.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      title: reportTitle,
      generated_at: new Date().toISOString(),
      parameters: validatedParams,
      ...reportData
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para gerar relatório de vendas
async function generateSalesReport(params: any) {
  let query = supabase
    .from('sales')
    .select(`
      id,
      total,
      discount,
      final_total,
      status,
      payment_method,
      notes,
      created_at,
      updated_at,
      users:user_id (id, name, email),
      sale_items (
        id,
        quantity,
        unit_price,
        total,
        products (id, name, barcode)
      ),
      payments (
        id,
        amount,
        method,
        status,
        created_at
      )
    `)

  // Aplicar filtros de data
  if (params.data_inicio) {
    query = query.gte('created_at', params.data_inicio)
  }
  if (params.data_fim) {
    query = query.lte('created_at', params.data_fim)
  }
  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.usuario_id) {
    query = query.eq('user_id', params.usuario_id)
  }

  query = query.order('created_at', { ascending: false })

  const { data: sales, error } = await query

  if (error) {
    throw new Error(`Erro ao buscar vendas: ${error.message}`)
  }

  // Calcular estatísticas
  const totalVendas = sales?.length || 0
  const valorTotal = sales?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0
  const valorMedio = totalVendas > 0 ? valorTotal / totalVendas : 0

  // Agrupar por método de pagamento
  const vendasPorMetodo = sales?.reduce((acc: any, sale) => {
    const metodo = sale.payment_method || 'não_informado'
    acc[metodo] = (acc[metodo] || 0) + 1
    return acc
  }, {}) || {}

  // Agrupar por status
  const vendasPorStatus = sales?.reduce((acc: any, sale) => {
    const status = sale.status || 'não_informado'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {}) || {}

  return {
    data: sales || [],
    statistics: {
      total_vendas: totalVendas,
      valor_total: valorTotal,
      valor_medio: valorMedio,
      vendas_por_metodo: vendasPorMetodo,
      vendas_por_status: vendasPorStatus
    }
  }
}

// Função para gerar relatório de produtos
async function generateProductsReport(params: any) {
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      barcode,
      sale_price,
      cost_price,
      stock,
      unit,
      description,
      is_active,
      created_at,
      updated_at,
      categories:category_id (id, name),
      sale_items (
        quantity,
        total_price,
        sales:sale_id (created_at)
      )
    `)

  if (params.categoria_id) {
    query = query.eq('category_id', params.categoria_id)
  }

  query = query.order('name', { ascending: true })

  const { data: products, error } = await query

  if (error) {
    throw new Error(`Erro ao buscar produtos: ${error.message}`)
  }

  // Calcular estatísticas
  const totalProdutos = products?.length || 0
  const produtosAtivos = products?.filter(p => p.is_active).length || 0
  const produtosInativos = totalProdutos - produtosAtivos
  const estoqueTotal = products?.reduce((sum, product) => sum + (product.stock || 0), 0) || 0
  const valorEstoque = products?.reduce((sum, product) => {
    return sum + ((product.cost_price || 0) * (product.stock || 0))
  }, 0) || 0

  // Produtos com estoque baixo (menos de 10 unidades)
  const estoqueBaixo = products?.filter(p => (p.stock || 0) < 10) || []

  // Produtos mais vendidos (baseado nos itens de venda)
  const produtosComVendas = products?.map(product => {
    const totalVendido = product.sale_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0
    const receitaTotal = product.sale_items?.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0) || 0
    return {
      ...product,
      total_vendido: totalVendido,
      receita_total: receitaTotal
    }
  }).sort((a, b) => (b.total_vendido || 0) - (a.total_vendido || 0)) || []

  return {
    data: produtosComVendas,
    statistics: {
      total_produtos: totalProdutos,
      produtos_ativos: produtosAtivos,
      produtos_inativos: produtosInativos,
      estoque_total: estoqueTotal,
      valor_estoque: valorEstoque,
      produtos_estoque_baixo: estoqueBaixo.length,
      top_10_mais_vendidos: produtosComVendas.slice(0, 10)
    }
  }
}

// Função para gerar relatório financeiro
async function generateFinancialReport(params: any) {
  // Buscar vendas
  let salesQuery = supabase
    .from('sales')
    .select('id, total, discount, created_at, status')

  // Buscar pagamentos
  let paymentsQuery = supabase
    .from('payments')
    .select('id, valor, metodo, status, created_at, venda_id')

  // Aplicar filtros de data
  if (params.data_inicio) {
    salesQuery = salesQuery.gte('created_at', params.data_inicio)
    paymentsQuery = paymentsQuery.gte('created_at', params.data_inicio)
  }
  if (params.data_fim) {
    salesQuery = salesQuery.lte('created_at', params.data_fim)
    paymentsQuery = paymentsQuery.lte('created_at', params.data_fim)
  }

  const [salesResult, paymentsResult] = await Promise.all([
    salesQuery.order('created_at', { ascending: false }),
    paymentsQuery.order('created_at', { ascending: false })
  ])

  if (salesResult.error) {
    throw new Error(`Erro ao buscar vendas: ${salesResult.error.message}`)
  }
  if (paymentsResult.error) {
    throw new Error(`Erro ao buscar pagamentos: ${paymentsResult.error.message}`)
  }

  const sales = salesResult.data || []
  const payments = paymentsResult.data || []

  // Calcular métricas financeiras
  const receitaBruta = sales.reduce((sum, sale) => sum + (sale.total || 0), 0)
  const descontos = sales.reduce((sum, sale) => sum + (sale.discount || 0), 0)
  const receitaLiquida = receitaBruta - descontos

  const pagamentosRecebidos = payments
    .filter(p => p.status === 'concluido')
    .reduce((sum, payment) => sum + (payment.valor || 0), 0)

  const pagamentosPendentes = payments
    .filter(p => p.status === 'pendente')
    .reduce((sum, payment) => sum + (payment.valor || 0), 0)

  // Agrupar por método de pagamento
  const receitaPorMetodo = payments
    .filter(p => p.status === 'concluido')
    .reduce((acc: any, payment) => {
      const metodo = payment.metodo || 'não_informado'
      acc[metodo] = (acc[metodo] || 0) + (payment.valor || 0)
      return acc
    }, {})

  // Receita por dia (últimos 30 dias)
  const receitaPorDia = sales.reduce((acc: any, sale) => {
    const data = sale.created_at?.split('T')[0] || 'sem_data'
    acc[data] = (acc[data] || 0) + (sale.total || 0)
    return acc
  }, {})

  return {
    data: {
      vendas: sales,
      pagamentos: payments
    },
    statistics: {
      receita_bruta: receitaBruta,
      descontos_total: descontos,
      receita_liquida: receitaLiquida,
      pagamentos_recebidos: pagamentosRecebidos,
      pagamentos_pendentes: pagamentosPendentes,
      receita_por_metodo: receitaPorMetodo,
      receita_por_dia: receitaPorDia,
      total_vendas: sales.length,
      total_pagamentos: payments.length
    }
  }
}

// Função para gerar relatório de clientes
async function generateClientsReport(params: any) {
  let query = supabase
    .from('clients')
    .select(`
      id,
      nome,
      email,
      telefone,
      cpf,
      endereco,
      created_at,
      updated_at,
      sales (
        id,
        total,
        created_at,
        status
      )
    `)

  query = query.order('nome', { ascending: true })

  const { data: clients, error } = await query

  if (error) {
    throw new Error(`Erro ao buscar clientes: ${error.message}`)
  }

  // Calcular estatísticas
  const totalClientes = clients?.length || 0
  
  const clientesComVendas = clients?.map(client => {
    const vendas = client.sales || []
    const totalCompras = vendas.length
    const valorTotal = vendas.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0)
    const ultimaCompra = vendas.length > 0 ? 
      vendas.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null
    
    return {
      ...client,
      total_compras: totalCompras,
      valor_total_compras: valorTotal,
      ultima_compra: ultimaCompra,
      ticket_medio: totalCompras > 0 ? valorTotal / totalCompras : 0
    }
  }).sort((a, b) => (b.valor_total_compras || 0) - (a.valor_total_compras || 0)) || []

  const clientesAtivos = clientesComVendas.filter(c => c.total_compras > 0)
  const valorTotalVendas = clientesComVendas.reduce((sum, client) => sum + (client.valor_total_compras || 0), 0)
  const ticketMedioGeral = clientesAtivos.length > 0 ? valorTotalVendas / clientesAtivos.length : 0

  return {
    data: clientesComVendas,
    statistics: {
      total_clientes: totalClientes,
      clientes_ativos: clientesAtivos.length,
      clientes_inativos: totalClientes - clientesAtivos.length,
      valor_total_vendas: valorTotalVendas,
      ticket_medio_geral: ticketMedioGeral,
      top_10_clientes: clientesComVendas.slice(0, 10)
    }
  }
}

// Função para converter dados para CSV
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return 'Nenhum dado encontrado'
  }

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header]
      // Escapar aspas e quebras de linha
      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value || ''
    }).join(',')
  })

  return [csvHeaders, ...csvRows].join('\n')
}