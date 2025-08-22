'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CreditCard,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Smartphone,
  QrCode,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { formatCurrency, formatDateTime, translatePaymentMethod } from '@/utils'
import { Payment, PaymentMethod, PaymentStatus } from '@/types'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('today')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [dateFilter])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/payments?date=${dateFilter}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar pagamentos')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setPayments(data.data.payments || [])
      } else {
        throw new Error(data.error || 'Erro ao carregar pagamentos')
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar pagamentos
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.id.includes(searchTerm) ||
                         payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.saleId.includes(searchTerm)
    
    const matchesStatus = !selectedStatus || payment.status === selectedStatus
    const matchesMethod = !selectedMethod || payment.method === selectedMethod
    
    return matchesSearch && matchesStatus && matchesMethod
  })

  // Calcular estatísticas
  const totalPayments = filteredPayments.length
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const paidPayments = filteredPayments.filter(payment => payment.status === PaymentStatus.PAID)
  const pendingPayments = filteredPayments.filter(payment => payment.status === PaymentStatus.PENDING)
  const pixPayments = filteredPayments.filter(payment => payment.method === PaymentMethod.PIX)
  const pixAmount = pixPayments.reduce((sum, payment) => sum + payment.amount, 0)

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case PaymentStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-600" />
      case PaymentStatus.PROCESSING:
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
      case PaymentStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-600" />
      case PaymentStatus.EXPIRED:
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case PaymentStatus.CANCELLED:
        return <XCircle className="w-4 h-4 text-gray-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'bg-green-100 text-green-800'
      case PaymentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case PaymentStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800'
      case PaymentStatus.FAILED:
        return 'bg-red-100 text-red-800'
      case PaymentStatus.EXPIRED:
        return 'bg-orange-100 text-orange-800'
      case PaymentStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.PIX:
        return <QrCode className="w-4 h-4" />
      case PaymentMethod.CASH:
        return <DollarSign className="w-4 h-4" />
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.DEBIT_CARD:
        return <CreditCard className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const translatePaymentStatus = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID:
        return 'Pago'
      case PaymentStatus.PENDING:
        return 'Pendente'
      case PaymentStatus.PROCESSING:
        return 'Processando'
      case PaymentStatus.FAILED:
        return 'Falhou'
      case PaymentStatus.EXPIRED:
        return 'Expirado'
      case PaymentStatus.CANCELLED:
        return 'Cancelado'
      default:
        return 'Desconhecido'
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
              <CreditCard className="w-6 h-6 mr-2 text-orange-600" />
              <h1 className="text-xl font-semibold text-gray-900">Pagamentos</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button size="sm" asChild>
                <Link href="/pdv">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Novo Pagamento
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
                  <div className="text-2xl font-bold text-gray-900">{totalPayments}</div>
                  <div className="text-sm text-gray-600">Total de Pagamentos</div>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{pixPayments.length}</div>
                  <div className="text-sm text-gray-600">Pagamentos PIX</div>
                  <div className="text-xs text-gray-500">{formatCurrency(pixAmount)}</div>
                </div>
                <QrCode className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{pendingPayments.length}</div>
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
                    placeholder="Buscar por ID, transação ou venda..."
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
                  <option value="all">Todos</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todos os status</option>
                  <option value={PaymentStatus.PAID}>Pago</option>
                  <option value={PaymentStatus.PENDING}>Pendente</option>
                  <option value={PaymentStatus.PROCESSING}>Processando</option>
                  <option value={PaymentStatus.FAILED}>Falhou</option>
                  <option value={PaymentStatus.EXPIRED}>Expirado</option>
                  <option value={PaymentStatus.CANCELLED}>Cancelado</option>
                </select>
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Todos os métodos</option>
                  <option value={PaymentMethod.PIX}>PIX</option>
                  <option value={PaymentMethod.CASH}>Dinheiro</option>
                  <option value={PaymentMethod.CREDIT_CARD}>Cartão de Crédito</option>
                  <option value={PaymentMethod.DEBIT_CARD}>Cartão de Débito</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pagamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamentos ({filteredPayments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Carregando pagamentos...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Nenhum pagamento encontrado</p>
                <Button className="mt-4" asChild>
                  <Link href="/pdv">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Fazer Primeira Venda
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-gray-600">#{payment.id}</span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(payment.status)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {translatePaymentStatus(payment.status)}
                            </span>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getMethodIcon(payment.method)}
                            <span className="ml-1">{translatePaymentMethod(payment.method)}</span>
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <Calendar className="inline w-4 h-4 mr-1" />
                          Criado em: {formatDateTime(payment.createdAt)}
                          {payment.paidAt && (
                            <span className="ml-4">
                              Processado em: {formatDateTime(payment.paidAt)}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-700">
                          <strong>Venda:</strong> #{payment.saleId}
                          {payment.transactionId && (
                            <span className="ml-4">
                              <strong>Transação:</strong> {payment.transactionId}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between lg:justify-end gap-4 mt-4 lg:mt-0">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {payment.status === PaymentStatus.PENDING && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Implementar verificação de status
                                alert('Verificando status do pagamento...')
                              }}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Verificar
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/vendas/${payment.saleId}`}>
                              Ver Venda
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}