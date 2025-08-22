'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  BarChart3,
  Search,
  Filter,
  Download,
  Eye,
  ArrowLeft,
  Calendar,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { formatCurrency, formatDateTime, translatePaymentMethod, translateSaleStatus } from '@/utils'
import { Sale, SaleStatus, PaymentMethod } from '@/types'

export default function SalesPage() {
  console.log('🎯 COMPONENTE SALESPAGE RENDERIZADO!')
  const [sales, setSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    async function fetchSales() {
      try {
        setLoading(true)
        console.log('🚀 Fazendo requisição para API com dateFilter:', dateFilter)
         const response = await fetch(`/api/sales?date=${dateFilter}`)
         const data = await response.json()
         console.log('📡 Resposta da API recebida:', data)
         
         if (data.success && data.sales) {
           console.log('✅ Dados válidos recebidos, mapeando vendas...')
           console.log('📊 Vendas brutas da API:', data.sales)
           
           const mappedSales: Sale[] = data.sales.map((sale: any) => {
             console.log('🔄 Mapeando venda:', sale.id)
             return {
               id: sale.id,
               total: sale.total,
               discount: sale.discount || 0,
               finalTotal: sale.final_total || sale.total,
               paymentMethod: sale.payment_method || PaymentMethod.CASH,
               status: sale.status || SaleStatus.PENDING,
               notes: sale.notes || '',
               userId: sale.user_id || '',
               user: sale.users || undefined,
               items: sale.sale_items?.map((item: any) => ({
                 id: item.id,
                 quantity: item.quantity,
                 unitPrice: item.unit_price,
                 total: item.quantity * item.unit_price,
                 saleId: item.sale_id,
                 productId: item.product_id,
                 product: item.products,
                 createdAt: new Date(item.created_at)
               })) || [],
               payment: sale.payments?.[0] || undefined,
               createdAt: new Date(sale.created_at),
               updatedAt: new Date(sale.updated_at || sale.created_at)
             }
           })
           
           console.log('🎯 Vendas mapeadas:', mappedSales)
           console.log('💾 Chamando setSales...')
           setSales(mappedSales)
           console.log('✅ setSales executado!')
         } else {
           console.log('❌ Dados inválidos ou sem vendas:', data)
         }
      } catch (error) {
        console.error('Erro ao carregar vendas:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSales()
  }, [dateFilter])

  // Filtrar vendas
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id.includes(searchTerm) ||
                         (sale.items || []).some(item => 
                           item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    const matchesStatus = !selectedStatus || sale.status === selectedStatus
    const matchesPaymentMethod = !selectedPaymentMethod || sale.paymentMethod === selectedPaymentMethod
    
    return matchesSearch && matchesStatus && matchesPaymentMethod
  })

  // Debug do estado das vendas
  useEffect(() => {
    console.log('📊 Debug vendas (estado atualizado):', {
      totalSales: sales.length,
      filteredSales: filteredSales.length,
      searchTerm,
      selectedStatus,
      selectedPaymentMethod,
      dateFilter,
      salesData: sales
    })
  }, [sales, filteredSales, searchTerm, selectedStatus, selectedPaymentMethod, dateFilter])

  // Calcular estatísticas
  const totalSales = filteredSales.length
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.finalTotal, 0)
  const paidSales = filteredSales.filter(sale => sale.status === SaleStatus.PAID).length
  const pendingSales = filteredSales.filter(sale => sale.status === SaleStatus.PENDING).length

  const getStatusIcon = (status: SaleStatus) => {
    switch (status) {
      case SaleStatus.PAID:
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case SaleStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-600" />
      case SaleStatus.CANCELLED:
        return <XCircle className="w-4 h-4 text-red-600" />
      case SaleStatus.REFUNDED:
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: SaleStatus) => {
    switch (status) {
      case SaleStatus.PAID:
        return 'bg-green-100 text-green-800'
      case SaleStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case SaleStatus.CANCELLED:
        return 'bg-red-100 text-red-800'
      case SaleStatus.REFUNDED:
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-gray-600 mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:block">Voltar</span>
              </Link>
              <BarChart3 className="w-6 h-6 mr-2 text-orange-600" />
              <h1 className="text-xl font-semibold text-gray-900">Vendas</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" asChild>
                <Link href="/pdv">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Nova Venda
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalSales}</div>
                  <div className="text-sm text-gray-600">Total de Vendas</div>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
                  <div className="text-sm text-gray-600">Faturamento</div>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{paidSales}</div>
                  <div className="text-sm text-gray-600">Vendas Pagas</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{pendingSales}</div>
                  <div className="text-sm text-gray-600">Pendentes</div>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por ID da venda ou produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="today">Hoje</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mês</option>
                  <option value="all">Todas</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value={SaleStatus.PAID}>Pago</option>
                  <option value={SaleStatus.PENDING}>Pendente</option>
                  <option value={SaleStatus.CANCELLED}>Cancelado</option>
                  <option value={SaleStatus.REFUNDED}>Estornado</option>
                </select>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todas as formas</option>
                  <option value={PaymentMethod.CASH}>Dinheiro</option>
                  <option value={PaymentMethod.PIX}>PIX</option>
                  <option value={PaymentMethod.CREDIT_CARD}>Cartão de Crédito</option>
                  <option value={PaymentMethod.DEBIT_CARD}>Cartão de Débito</option>
                </select>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas ({filteredSales.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando vendas...</p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhuma venda encontrada</p>
                <Button className="mt-4" asChild>
                  <Link href="/pdv">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Fazer Primeira Venda
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">ID</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Pagamento</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Data</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Itens</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => (
                        <tr key={sale.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-mono text-sm text-gray-900">#{sale.id}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(sale.status)}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                                {translateSaleStatus(sale.status)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <CreditCard className="w-3 h-3" />
                              {translatePaymentMethod(sale.paymentMethod)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600">
                              {formatDateTime(sale.createdAt)}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600">
                              {(sale.items || []).length} {(sale.items || []).length === 1 ? 'item' : 'itens'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-right">
                              {sale.discount > 0 && (
                                <div className="text-xs text-gray-500 line-through">
                                  {formatCurrency(sale.total)}
                                </div>
                              )}
                              <div className="font-medium text-gray-900">
                                {formatCurrency(sale.finalTotal)}
                              </div>
                              {sale.discount > 0 && (
                                <div className="text-xs text-green-600">
                                  Desc: {formatCurrency(sale.discount)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/vendas/${sale.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {filteredSales.map((sale) => (
                    <Card key={sale.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-gray-900">
                            #{sale.id}
                          </span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(sale.status)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sale.status)}`}>
                              {translateSaleStatus(sale.status)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {sale.discount > 0 && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatCurrency(sale.total)}
                            </div>
                          )}
                          <div className="font-medium text-gray-900">
                            {formatCurrency(sale.finalTotal)}
                          </div>
                          {sale.discount > 0 && (
                            <div className="text-xs text-green-600">
                              Desc: {formatCurrency(sale.discount)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-gray-600">Pagamento:</span>
                          <div className="flex items-center gap-1 font-medium">
                            <CreditCard className="w-3 h-3" />
                            {translatePaymentMethod(sale.paymentMethod)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Data:</span>
                          <div className="font-medium">
                            {formatDateTime(sale.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-1">Itens ({(sale.items || []).length}):</div>
                        <div className="space-y-1">
                          {(sale.items || []).slice(0, 2).map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.quantity}x {item.product?.name || 'Produto'} - {formatCurrency(item.total)}
                            </div>
                          ))}
                          {(sale.items || []).length > 2 && (
                            <div className="text-sm text-gray-500">
                              +{(sale.items || []).length - 2} {(sale.items || []).length - 2 === 1 ? 'item' : 'itens'}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {sale.notes && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-1">Observações:</div>
                          <div className="text-sm text-gray-800">{sale.notes}</div>
                        </div>
                      )}
                      
                      <div className="pt-3 border-t">
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <Link href={`/vendas/${sale.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}