import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Atualizar vendas com status COMPLETED para PAID
    const { data: updatedSales, error: updateError } = await supabase
      .from('sales')
      .update({ status: 'PAID' })
      .eq('status', 'COMPLETED')
      .select('id')
    
    if (updateError) {
      console.error('Erro ao atualizar vendas:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar vendas' },
        { status: 500 }
      )
    }

    // Verificar quantas vendas foram atualizadas
    const updatedCount = updatedSales?.length || 0

    // Buscar estatísticas atuais
    const { data: salesStats, error: statsError } = await supabase
      .from('sales')
      .select('status')
    
    if (statsError) {
      console.error('Erro ao buscar estatísticas:', statsError)
    }

    const statusCounts = salesStats?.reduce((acc: any, sale: any) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      message: `${updatedCount} vendas atualizadas de COMPLETED para PAID`,
      updatedCount,
      statusCounts
    })
  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}