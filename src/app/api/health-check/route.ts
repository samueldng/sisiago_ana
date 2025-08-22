import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/health-check - Verificar saúde da aplicação
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Verificar conexão com Supabase
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
      .single()
    
    const responseTime = Date.now() - startTime
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (ok para health check)
      throw error
    }
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'connected',
          responseTime: `${responseTime}ms`
        },
        api: {
          status: 'operational'
        }
      },
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          database: {
            status: 'disconnected'
          },
          api: {
            status: 'degraded'
          }
        }
      },
      { status: 503 }
    )
  }
}

// HEAD /api/health-check - Verificação rápida de saúde
export async function HEAD(request: NextRequest) {
  try {
    // Verificação mais simples para HEAD requests
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}