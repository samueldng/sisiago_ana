'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle
} from 'lucide-react'
import { formatCurrency } from '@/utils'
import { useDashboardStats } from '@/hooks/useDashboardStats'

export function DashboardStats() {
  const { stats, loading, error, refresh } = useDashboardStats()

  // Debug: Log dos dados recebidos
  useEffect(() => {
    console.log('📊 DashboardStats Component - Stats atualizados:', {
      stats,
      loading,
      error,
      todaySales: stats.todaySales,
      todayRevenue: stats.todayRevenue
    })
  }, [stats, loading, error])

  const statsCards = [
    {
      title: 'Vendas Hoje',
      value: stats.todaySales.toString(),
      description: 'vendas realizadas',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Faturamento Hoje',
      value: formatCurrency(stats.todayRevenue),
      description: 'receita do dia',
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'Total de Produtos',
      value: stats.totalProducts.toString(),
      description: 'produtos cadastrados',
      icon: Package,
      color: 'text-purple-600'
    },
    {
      title: 'Estoque Baixo',
      value: stats.lowStockProducts.toString(),
      description: 'produtos em falta',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ]

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Dia</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-1 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Dia</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Erro ao carregar estatísticas: {error}</p>
          <button 
            onClick={refresh}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Dia</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

export default DashboardStats