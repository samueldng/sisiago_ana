import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Placeholder para configurações do sistema
    const configs = {
      empresa: {
        nome: 'Sis IA Go',
        cnpj: '',
        endereco: ''
      },
      pdv: {
        impressora: 'padrão',
        gaveta: false
      }
    }

    return NextResponse.json({
      success: true,
      data: configs
    })
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Placeholder para salvar configurações
    console.log('Configurações recebidas:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso'
    })
  } catch (error) {
    console.error('Erro ao salvar configurações:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}