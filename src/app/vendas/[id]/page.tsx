'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Package,
  Receipt,
  Download,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { formatCurrency, formatDateTime, translatePaymentMethod, translateSaleStatus } from '@/utils'
import { Sale, SaleStatus, PaymentMethod } from '@/types'

export default function SaleDetailsPage() {
  const params = useParams()
  const saleId = params.id as string
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (saleId) {
      loadSale()
    }
  }, [saleId])

  const loadSale = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales/${saleId}`)
      
      if (!response.ok) {
        throw new Error('Venda não encontrada')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setSale(data.data)
      } else {
        throw new Error(data.error || 'Erro ao carregar venda')
      }
    } catch (error) {
      console.error('Erro ao carregar venda:', error)
      // Fallback para dados básicos em caso de erro
       setSale({
         id: saleId,
         total: 0,
         discount: 0,
         finalTotal: 0,
         paymentMethod: PaymentMethod.CASH,
         status: SaleStatus.PENDING,
         notes: '',
         userId: '',
         items: [],
         user: null,
         payment: null,
         createdAt: new Date(),
         updatedAt: new Date()
       })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSale = async () => {
    if (!sale || sale.status !== SaleStatus.PENDING) return
    
    if (!confirm('Tem certeza que deseja cancelar esta venda?')) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/sales/${saleId}`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cancelar venda')
      }
      
      setSale(prev => prev ? { ...prev, status: SaleStatus.CANCELLED } : null)
      alert('Venda cancelada com sucesso!')
    } catch (error) {
      console.error('Erro ao cancelar venda:', error)
      alert(error instanceof Error ? error.message : 'Erro ao cancelar venda')
    } finally {
      setUpdating(false)
    }
  }

  const handleRefreshStatus = async () => {
    if (!sale) return
    
    try {
      setUpdating(true)
      
      // Atualizar status para PAID se estiver PENDING
      if (sale.status === SaleStatus.PENDING) {
        const response = await fetch(`/api/sales/${saleId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: SaleStatus.PAID
          })
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao atualizar status')
        }
        
        setSale(prev => prev ? { ...prev, status: SaleStatus.PAID } : null)
        alert('Status atualizado! Pagamento confirmado.')
      } else {
        alert('Esta venda não pode ter o status alterado.')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert(error instanceof Error ? error.message : 'Erro ao verificar status do pagamento')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: SaleStatus) => {
    switch (status) {
      case SaleStatus.PAID:
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case SaleStatus.PENDING:
        return <Clock className="w-5 h-5 text-yellow-600" />
      case SaleStatus.CANCELLED:
        return <XCircle className="w-5 h-5 text-red-600" />
      case SaleStatus.REFUNDED:
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: SaleStatus) => {
    switch (status) {
      case SaleStatus.PAID:
        return 'bg-green-100 text-green-800 border-green-200'
      case SaleStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case SaleStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200'
      case SaleStatus.REFUNDED:
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando detalhes da venda...</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Venda não encontrada</h2>
          <p className="text-gray-600 mb-4">A venda #{saleId} não foi encontrada.</p>
          <Button asChild>
            <Link href="/vendas">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Vendas
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/vendas" className="flex items-center text-gray-600 mr-4">
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:block">Voltar</span>
              </Link>
              <Receipt className="w-6 h-6 mr-2 text-orange-600" />
              <h1 className="text-xl font-semibold text-gray-900">Venda #{sale.id}</h1>
            </div>
            <div className="flex items-center space-x-2">
              {sale.status === SaleStatus.PENDING && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshStatus}
                  disabled={updating}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
                  Verificar Pagamento
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              {sale.status === SaleStatus.PENDING && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSale}
                  disabled={updating}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status e Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {getStatusIcon(sale.status)}
                  <span>Informações da Venda</span>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(sale.status)}`}>
                    {translateSaleStatus(sale.status)}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Data e Hora</div>
                      <div className="font-medium">{formatDateTime(sale.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Forma de Pagamento</div>
                      <div className="font-medium">{translatePaymentMethod(sale.paymentMethod)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Vendedor</div>
                      <div className="font-medium">{sale.user?.name || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-600">Total de Itens</div>
                      <div className="font-medium">{sale.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                    </div>
                  </div>
                </div>
                
                {sale.notes && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600 mb-1">Observações</div>
                    <div className="text-gray-900">{sale.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Itens da Venda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Itens da Venda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sale.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.product?.name}</div>
                        <div className="text-sm text-gray-600">
                          Código: {item.product?.barcode}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informações de Pagamento */}
            {sale.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Informações de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const payment = sale.payment;
                      return (
                      <div key={payment.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{translatePaymentMethod(payment.method)}</div>
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        </div>
                        {payment.transactionId && (
                          <div className="text-sm text-gray-600">
                            ID da Transação: {payment.transactionId}
                          </div>
                        )}
                        {payment.paidAt && (
                          <div className="text-sm text-gray-600">
                            Processado em: {formatDateTime(payment.paidAt)}
                          </div>
                        )}
                      </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo Financeiro */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(sale.total)}</span>
                </div>
                
                {sale.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span className="font-medium">-{formatCurrency(sale.discount)}</span>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(sale.finalTotal)}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">Status do Pagamento</div>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(sale.status)}`}>
                    {getStatusIcon(sale.status)}
                    <span className="ml-2">{translateSaleStatus(sale.status)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Comprovante
                </Button>
                <Button className="w-full" variant="outline">
                  <Receipt className="w-4 h-4 mr-2" />
                  Imprimir Recibo
                </Button>
                {sale.status === SaleStatus.PAID && (
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Solicitar Estorno
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}