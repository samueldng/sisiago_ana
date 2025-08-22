'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  ArrowLeft,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/utils'
import { SalesReport, PaymentMethod } from '@/types'
import SimpleChart from '@/components/SimpleChart'

interface ReportData {
  totalSales: number
  totalRevenue: number
  averageTicket: number
  salesByDay: Array<{ date: string; sales: number; revenue: number }>
  salesByPaymentMethod: Array<{ method: PaymentMethod; count: number; total: number }>
  topProducts: Array<{ name: string; quantity: number; revenue: number }>
}

export default function RelatoriosPage() {
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalRevenue: 0,
    averageTicket: 0,
    salesByDay: [],
    salesByPaymentMethod: [],
    topProducts: []
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    endDate: new Date().toISOString().split('T')[0] // hoje
  })

  useEffect(() => {
    loadReportData()
  }, [dateRange])

  const loadReportData = async () => {
    try {
      setLoading(true)
      // Simular dados para demonstração
      // TODO: Implementar chamada real à API de relatórios
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData: ReportData = {
        totalSales: 156,
        totalRevenue: 12450.80,
        averageTicket: 79.81,
        salesByDay: [
          { date: '2024-01-01', sales: 12, revenue: 890.50 },
          { date: '2024-01-02', sales: 18, revenue: 1250.30 },
          { date: '2024-01-03', sales: 15, revenue: 980.75 },
          { date: '2024-01-04', sales: 22, revenue: 1680.90 },
          { date: '2024-01-05', sales: 19, revenue: 1420.60 },
          { date: '2024-01-06', sales: 25, revenue: 2100.45 },
          { date: '2024-01-07', sales: 21, revenue: 1650.80 }
        ],
        salesByPaymentMethod: [
          { method: PaymentMethod.CASH, count: 45, total: 3200.50 },
          { method: PaymentMethod.PIX, count: 62, total: 4850.30 },
          { method: PaymentMethod.CREDIT_CARD, count: 35, total: 3100.75 },
          { method: PaymentMethod.DEBIT_CARD, count: 14, total: 1299.25 }
        ],
        topProducts: [
          { name: 'Produto A', quantity: 45, revenue: 2250.00 },
          { name: 'Produto B', quantity: 38, revenue: 1900.00 },
          { name: 'Produto C', quantity: 32, revenue: 1600.00 },
          { name: 'Produto D', quantity: 28, revenue: 1400.00 },
          { name: 'Produto E', quantity: 25, revenue: 1250.00 }
        ]
      }
      
      setReportData(mockData)
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const translatePaymentMethod = (method: PaymentMethod): string => {
    const translations = {
      [PaymentMethod.CASH]: 'Dinheiro',
      [PaymentMethod.PIX]: 'PIX',
      [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
      [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito'
    }
    return translations[method] || method
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center min-w-0 flex-1">
              <Link href="/" className="flex items-center text-gray-600 mr-2 sm:mr-4 touch-friendly">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:block text-sm">Voltar</span>
              </Link>
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-red-600 flex-shrink-0" />
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">Relatórios</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <Button variant="outline" size="sm" onClick={loadReportData} className="touch-friendly">
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline text-xs sm:text-sm">Atualizar</span>
              </Button>
              <Button variant="outline" size="sm" className="touch-friendly">
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline text-xs sm:text-sm">Exportar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Filtros de Data */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="truncate">Período de Análise</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <Input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button onClick={loadReportData} className="w-full h-9 sm:h-10 text-sm touch-friendly">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span className="hidden sm:inline">Aplicar Filtro</span>
                  <span className="sm:hidden">Filtrar</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando relatórios...</p>
          </div>
        ) : (
          <>
            {/* Estatísticas Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              <Card>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total de Vendas</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{reportData.totalSales}</p>
                    </div>
                    <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Faturamento Total</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 truncate">{formatCurrency(reportData.totalRevenue)}</p>
                    </div>
                    <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-600 flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="sm:col-span-2 lg:col-span-1">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Ticket Médio</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 truncate">{formatCurrency(reportData.averageTicket)}</p>
                    </div>
                    <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-purple-600 flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {/* Vendas por Dia */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg truncate">Vendas por Dia</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64 sm:h-72 lg:h-80">
                    <SimpleChart
                      data={reportData.salesByDay.map(item => ({
                        label: new Date(item.date).toLocaleDateString('pt-BR'),
                        value: item.sales
                      }))}
                      type="line"
                      color="#3b82f6"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Faturamento por Dia */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg truncate">Faturamento por Dia</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-64 sm:h-72 lg:h-80">
                    <SimpleChart
                      data={reportData.salesByDay.map(item => ({
                        label: new Date(item.date).toLocaleDateString('pt-BR'),
                        value: item.revenue
                      }))}
                      type="bar"
                      color="#10b981"
                      formatValue={(value) => formatCurrency(value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Vendas por Método de Pagamento */}
            <Card className="mb-6 sm:mb-8">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-base sm:text-lg truncate">Vendas por Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-64 sm:h-72 lg:h-80">
                  <SimpleChart
                    data={reportData.salesByPaymentMethod.map(item => ({
                      label: translatePaymentMethod(item.method),
                      value: item.total
                    }))}
                    type="doughnut"
                    formatValue={(value) => formatCurrency(value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Top Produtos */}
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="truncate">Produtos Mais Vendidos</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {reportData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center min-w-0 flex-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{product.quantity} unidades vendidas</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="font-bold text-green-600 text-sm sm:text-base">{formatCurrency(product.revenue)}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Faturamento</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}