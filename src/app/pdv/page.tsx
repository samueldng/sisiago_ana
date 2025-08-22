'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ShoppingCart,
  Scan,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { formatCurrency } from '@/utils'
import { Product, CartItem, PaymentMethod } from '@/types'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { usePDVStore } from '@/stores/pdvStore'
import { useProducts, useProductSearch, useProductByBarcode, usePreloadProducts } from '@/hooks/useProducts'
import NetworkMonitor, { useNetworkStatus } from '@/components/NetworkMonitor'
import { useDbConnectivity } from '@/hooks/useDbConnectivity'
import { ConnectivityStatus } from '@/components/ConnectivityStatus'
import ZXingReliableScanner from '@/components/ZXingReliableScanner'
import { triggerDashboardUpdate } from '@/hooks/useDashboardStats'

function PDVPageContent() {
  const searchParams = useSearchParams()
  const networkStatus = useNetworkStatus()
  const { isConnected, status, forceReconnect, startAutoReconnect } = useDbConnectivity()
  
  // Estados do PDV Store
  const {
    cart,
    searchTerm,
    isScanning,
    selectedPaymentMethod,
    showPayment,
    pdvOpenTime,
    currentTime,
    isOnline,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    setSearchTerm,
    setIsScanning,
    setSelectedPaymentMethod,
    setShowPayment,
    initializePDV,
    updateCurrentTime
  } = usePDVStore()

  // Estados locais
  const [showScanner, setShowScanner] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [scannedBarcode, setScannedBarcode] = useState<string>('')

  // Hooks de produtos
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    error: productsError,
    refetch: refetchProducts
  } = useProducts({ 
    is_active: true, 
    limit: 100 
  })

  const {
    data: searchResults = [],
    isLoading: searchLoading
  } = useProductSearch(searchTerm)

  const {
    data: scannedProduct,
    isLoading: barcodeLoading,
    error: barcodeError
  } = useProductByBarcode(scannedBarcode)

  const { mutate: preloadProducts } = usePreloadProducts()

  // Inicializar PDV
  useEffect(() => {
    initializePDV()
    
    // Pré-carregar produtos em background
    preloadProducts()
    
    // Atualizar relógio a cada segundo
    const timer = setInterval(() => {
      updateCurrentTime()
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Monitorar conectividade do banco de dados com debounce
  useEffect(() => {
    let disconnectionTimer: NodeJS.Timeout
    let hasShownDisconnectionToast = false

    if (!isConnected && isOnline) {
      // Aguardar 10 segundos antes de mostrar a notificação
      // Isso evita notificações para desconexões momentâneas
      disconnectionTimer = setTimeout(() => {
        if (!hasShownDisconnectionToast) {
          toast.error('Conexão com banco de dados perdida. Tentando reconectar...')
          hasShownDisconnectionToast = true
        }
      }, 10000) // 10 segundos de delay
      
      startAutoReconnect()
    } else if (isConnected && isOnline) {
      // Limpar timer se reconectou antes dos 10 segundos
      if (disconnectionTimer) {
        clearTimeout(disconnectionTimer)
      }
      
      // Só mostrar toast de sucesso se já havia mostrado o de erro antes
      if (hasShownDisconnectionToast) {
        toast.success('Conectado ao banco de dados!')
      }
    }

    return () => {
      if (disconnectionTimer) {
        clearTimeout(disconnectionTimer)
      }
    }
  }, [isConnected, isOnline, startAutoReconnect])

  // Detectar parâmetro scanner=true na URL
  useEffect(() => {
    const scannerParam = searchParams.get('scanner')
    if (scannerParam === 'true') {
      setShowScanner(true)
    }
  }, [searchParams])

  // Processar produto escaneado
  useEffect(() => {
    if (scannedProduct && scannedBarcode) {
      addToCart(scannedProduct, 1)
      setScannedBarcode('')
      setShowScanner(false)
      toast.success(`Produto "${scannedProduct.name}" adicionado ao carrinho!`)
    }
  }, [scannedProduct, scannedBarcode, addToCart])

  // Tratar erro de código de barras
  useEffect(() => {
    if (barcodeError && scannedBarcode) {
      toast.error(`Produto com código ${scannedBarcode} não encontrado`)
      setScannedBarcode('')
    }
  }, [barcodeError, scannedBarcode])

  // Controlar sugestões de busca
  useEffect(() => {
    const shouldShow = searchTerm.length >= 2 && searchResults.length > 0
    if (showSuggestions !== shouldShow) {
      setShowSuggestions(shouldShow)
    }
  }, [searchTerm, searchResults, showSuggestions])

  // Formatar data e hora
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Lidar com código de barras escaneado
  const handleBarcodeScanned = useCallback((barcode: string) => {
    if (barcode && barcode !== scannedBarcode) {
      console.log('📱 Código de barras escaneado:', barcode)
      setScannedBarcode(barcode)
    }
  }, [scannedBarcode])

  // Selecionar produto da sugestão
  const selectProductFromSuggestion = useCallback((product: Product) => {
    addToCart(product, 1)
    setSearchTerm('')
    setShowSuggestions(false)
    toast.success(`"${product.name}" adicionado ao carrinho!`)
  }, [addToCart, setSearchTerm])

  // Calcular totais
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const discount = 0 // TODO: Implementar sistema de desconto
  const total = subtotal - discount

  // Finalizar venda
  const finalizeSale = async () => {
    if (cart.length === 0) {
      toast.error('Carrinho vazio!')
      return
    }

    if (!selectedPaymentMethod) {
      toast.error('Selecione um método de pagamento!')
      return
    }

    try {
      const saleData = {
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.salePrice
        })),
        paymentMethod: selectedPaymentMethod,
        discount: discount,
        notes: '',
        userId: 'default-user' // Usuário padrão para desenvolvimento
      }

      console.log('💰 Finalizando venda:', saleData)
      
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao finalizar venda')
      }
      
      toast.success('Venda finalizada com sucesso!')
      console.log('✅ Venda criada:', result.data)
      
      // Disparar atualização do dashboard
      triggerDashboardUpdate()
      
      clearCart()
      
    } catch (error) {
      console.error('❌ Erro ao finalizar venda:', error)
      toast.error(`Erro ao finalizar venda: ${error instanceof Error ? error.message : 'Tente novamente.'}`)
    }
  }

  // Produtos para exibir (apenas busca quando há termo de pesquisa)
  const displayProducts = searchTerm.length >= 2 ? searchResults : []

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">PDV</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Status de Conectividade */}
          <ConnectivityStatus compact className="hidden sm:flex" />
          
          {/* Monitor de rede */}
          <NetworkMonitor showIndicator={true} className="hidden sm:flex" />
          
          {/* Botão de atualizar */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchProducts()}
            disabled={productsLoading}
            className="hidden sm:flex"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${productsLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          {/* Botão do scanner */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScanner(!showScanner)}
            className="flex items-center gap-2"
          >
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Scanner</span>
          </Button>
        </div>
      </div>

      {/* Informações do PDV */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">PDV Aberto</p>
                <p className="font-medium">
                  {pdvOpenTime ? formatDateTime(pdvOpenTime) : 'Carregando...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Itens no Carrinho</p>
                <p className="font-medium">{cart.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner */}
      {showScanner && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Scanner de Código de Barras</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScanner(false)}
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ZXingReliableScanner
              onScan={handleBarcodeScanned}
              onClose={() => setShowScanner(false)}
              isOpen={showScanner}
            />
            {barcodeLoading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Buscando produto...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Produtos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Digite o nome ou código do produto (mín. 2 caracteres)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                

              </div>
            </CardHeader>
            <CardContent>
              {/* Status de carregamento */}
              {productsLoading && (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-gray-600">Carregando produtos...</p>
                  {!isOnline && (
                    <p className="text-sm text-orange-600 mt-1">
                      Tentando carregar do cache offline...
                    </p>
                  )}
                </div>
              )}
              
              {/* Erro de carregamento */}
              {productsError && (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-red-600 mb-4">Erro ao carregar produtos</p>
                  <Button
                    variant="outline"
                    onClick={() => refetchProducts()}
                    className="mx-auto"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar Novamente
                  </Button>
                </div>
              )}
              
              {/* Lista de produtos */}
              {!productsLoading && !productsError && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {displayProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      {searchTerm.length >= 2 ? 'Nenhum produto encontrado' : 'Digite pelo menos 2 caracteres para buscar produtos'}
                    </div>
                  ) : (
                    displayProducts.map((product) => (
                      <Card key={product.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <h3 className="font-medium text-sm mb-2 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-lg font-bold text-green-600 mb-3">
                            {formatCurrency(product.salePrice)}
                          </p>
                          {product.barcode && (
                            <p className="text-xs text-gray-500 mb-3">
                              Código: {product.barcode}
                            </p>
                          )}
                          <Button
                            onClick={() => addToCart(product, 1)}
                            className="w-full"
                            size="sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
              
              {/* Indicador de cache */}
              {productsData?.fromCache && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="flex items-center gap-2 text-orange-700">
                    <WifiOff className="w-4 h-4" />
                    <span className="text-sm">
                      Dados carregados do cache offline
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Carrinho */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Carrinho</span>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Carrinho vazio</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.product.name}</h4>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.product.salePrice)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totais */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto:</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Métodos de pagamento */}
                  {!showPayment ? (
                    <Button
                      onClick={() => setShowPayment(true)}
                      className="w-full mt-4"
                      size="lg"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Finalizar Venda
                    </Button>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <h4 className="font-medium">Método de Pagamento:</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { method: PaymentMethod.CASH, icon: Banknote, label: 'Dinheiro' },
                          { method: PaymentMethod.CREDIT_CARD, icon: CreditCard, label: 'Cartão de Crédito' },
                          { method: PaymentMethod.DEBIT_CARD, icon: CreditCard, label: 'Cartão de Débito' },
                          { method: PaymentMethod.PIX, icon: Smartphone, label: 'PIX' },
                        ].map(({ method, icon: Icon, label }) => (
                          <Button
                            key={method}
                            variant={selectedPaymentMethod === method ? 'default' : 'outline'}
                            onClick={() => setSelectedPaymentMethod(method)}
                            className="justify-start"
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {label}
                          </Button>
                        ))}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowPayment(false)}
                          className="flex-1"
                        >
                          Voltar
                        </Button>
                        <Button
                          onClick={finalizeSale}
                          disabled={!selectedPaymentMethod}
                          className="flex-1"
                        >
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PDVPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-gray-600">Carregando PDV...</p>
        </div>
      </div>
    }>
      <PDVPageContent />
    </Suspense>
  )
}