import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Product, CartItem, PaymentMethod } from '@/types'

interface PDVState {
  // Estado do carrinho
  cart: CartItem[]
  cartTotal: number
  cartDiscount: number
  cartFinalTotal: number
  
  // Estado da busca
  searchTerm: string
  showSuggestions: boolean
  
  // Estado do scanner
  showScanner: boolean
  isScanning: boolean
  scanningBarcode: string | null
  
  // Estado do pagamento
  showPayment: boolean
  selectedPaymentMethod: PaymentMethod | null
  
  // Estado da sessão PDV
  pdvOpenTime: Date | null
  currentTime: Date | null
  
  // Estado de conectividade
  isOnline: boolean
  lastSyncTime: Date | null
  
  // Ações do carrinho
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartItemQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  applyDiscount: (discount: number) => void
  
  // Ações da busca
  setSearchTerm: (term: string) => void
  setShowSuggestions: (show: boolean) => void
  
  // Ações do scanner
  setShowScanner: (show: boolean) => void
  setIsScanning: (scanning: boolean) => void
  setScanningBarcode: (barcode: string | null) => void
  
  // Ações do pagamento
  setShowPayment: (show: boolean) => void
  setSelectedPaymentMethod: (method: PaymentMethod | null) => void
  
  // Ações da sessão
  initializePDV: () => void
  updateCurrentTime: () => void
  
  // Ações de conectividade
  setIsOnline: (online: boolean) => void
  updateLastSyncTime: () => void
  
  // Ações utilitárias
  resetPDV: () => void
}

// Função para calcular totais do carrinho
const calculateCartTotals = (cart: CartItem[], discount: number = 0) => {
  const total = cart.reduce((sum, item) => sum + item.total, 0)
  const finalTotal = Math.max(0, total - discount)
  return { total, finalTotal }
}

// Função para salvar carrinho no localStorage
const saveCartToStorage = (cart: CartItem[]) => {
  try {
    localStorage.setItem('pdv_cart', JSON.stringify(cart))
    localStorage.setItem('pdv_cart_timestamp', Date.now().toString())
  } catch (error) {
    console.warn('⚠️ Erro ao salvar carrinho no localStorage:', error)
  }
}

// Função para carregar carrinho do localStorage
const loadCartFromStorage = (): CartItem[] => {
  try {
    const cart = localStorage.getItem('pdv_cart')
    const timestamp = localStorage.getItem('pdv_cart_timestamp')
    
    if (cart && timestamp) {
      const age = Date.now() - parseInt(timestamp)
      const maxAge = 24 * 60 * 60 * 1000 // 24 horas
      
      if (age < maxAge) {
        return JSON.parse(cart)
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar carrinho do localStorage:', error)
  }
  
  return []
}

export const usePDVStore = create<PDVState>()(immer((set, get) => ({
  // Estado inicial
  cart: [],
  cartTotal: 0,
  cartDiscount: 0,
  cartFinalTotal: 0,
  
  searchTerm: '',
  showSuggestions: false,
  
  showScanner: false,
  isScanning: false,
  scanningBarcode: null,
  
  showPayment: false,
  selectedPaymentMethod: null,
  
  pdvOpenTime: null,
  currentTime: null,
  
  isOnline: true,
  lastSyncTime: null,
  
  // Ações do carrinho
  addToCart: (product: Product, quantity = 1) => {
    set((state) => {
      const existingItemIndex = state.cart.findIndex(
        (item) => item.product.id === product.id
      )
      
      if (existingItemIndex >= 0) {
        // Atualizar item existente
        const existingItem = state.cart[existingItemIndex]
        const newQuantity = existingItem.quantity + quantity
        const newTotal = newQuantity * product.salePrice
        
        state.cart[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total: newTotal
        }
      } else {
        // Adicionar novo item
        const newItem: CartItem = {
          product,
          quantity,
          total: quantity * product.salePrice
        }
        state.cart.push(newItem)
      }
      
      // Recalcular totais
      const { total, finalTotal } = calculateCartTotals(state.cart, state.cartDiscount)
      state.cartTotal = total
      state.cartFinalTotal = finalTotal
      
      // Salvar no localStorage
      saveCartToStorage(state.cart)
      
      console.log('🛒 Produto adicionado ao carrinho:', {
        product: product.name,
        quantity,
        cartSize: state.cart.length,
        total: state.cartTotal
      })
    })
  },
  
  removeFromCart: (productId: string) => {
    set((state) => {
      const itemIndex = state.cart.findIndex(
        (item) => item.product.id === productId
      )
      
      if (itemIndex >= 0) {
        const removedItem = state.cart[itemIndex]
        state.cart.splice(itemIndex, 1)
        
        // Recalcular totais
        const { total, finalTotal } = calculateCartTotals(state.cart, state.cartDiscount)
        state.cartTotal = total
        state.cartFinalTotal = finalTotal
        
        // Salvar no localStorage
        saveCartToStorage(state.cart)
        
        console.log('🗑️ Produto removido do carrinho:', {
          product: removedItem.product.name,
          cartSize: state.cart.length,
          total: state.cartTotal
        })
      }
    })
  },
  
  updateCartItemQuantity: (productId: string, quantity: number) => {
    set((state) => {
      const itemIndex = state.cart.findIndex(
        (item) => item.product.id === productId
      )
      
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // Remover item se quantidade for 0 ou negativa
          state.cart.splice(itemIndex, 1)
        } else {
          // Atualizar quantidade
          const item = state.cart[itemIndex]
          state.cart[itemIndex] = {
            ...item,
            quantity,
            total: quantity * item.product.salePrice
          }
        }
        
        // Recalcular totais
        const { total, finalTotal } = calculateCartTotals(state.cart, state.cartDiscount)
        state.cartTotal = total
        state.cartFinalTotal = finalTotal
        
        // Salvar no localStorage
        saveCartToStorage(state.cart)
      }
    })
  },
  
  clearCart: () => {
    set((state) => {
      state.cart = []
      state.cartTotal = 0
      state.cartFinalTotal = 0
      state.cartDiscount = 0
      
      // Limpar localStorage
      try {
        localStorage.removeItem('pdv_cart')
        localStorage.removeItem('pdv_cart_timestamp')
      } catch (error) {
        console.warn('⚠️ Erro ao limpar carrinho do localStorage:', error)
      }
      
      console.log('🧹 Carrinho limpo')
    })
  },
  
  applyDiscount: (discount: number) => {
    set((state) => {
      state.cartDiscount = Math.max(0, discount)
      
      // Recalcular total final
      const { finalTotal } = calculateCartTotals(state.cart, state.cartDiscount)
      state.cartFinalTotal = finalTotal
      
      console.log('💰 Desconto aplicado:', {
        discount: state.cartDiscount,
        finalTotal: state.cartFinalTotal
      })
    })
  },
  
  // Ações da busca
  setSearchTerm: (term: string) => {
    set((state) => {
      state.searchTerm = term
    })
  },
  
  setShowSuggestions: (show: boolean) => {
    set((state) => {
      state.showSuggestions = show
    })
  },
  
  // Ações do scanner
  setShowScanner: (show: boolean) => {
    set((state) => {
      state.showScanner = show
      if (!show) {
        state.isScanning = false
        state.scanningBarcode = null
      }
    })
  },
  
  setIsScanning: (scanning: boolean) => {
    set((state) => {
      state.isScanning = scanning
    })
  },
  
  setScanningBarcode: (barcode: string | null) => {
    set((state) => {
      state.scanningBarcode = barcode
    })
  },
  
  // Ações do pagamento
  setShowPayment: (show: boolean) => {
    set((state) => {
      state.showPayment = show
      if (!show) {
        state.selectedPaymentMethod = null
      }
    })
  },
  
  setSelectedPaymentMethod: (method: PaymentMethod | null) => {
    set((state) => {
      state.selectedPaymentMethod = method
    })
  },
  
  // Ações da sessão
  initializePDV: () => {
    set((state) => {
      const now = new Date()
      state.pdvOpenTime = now
      state.currentTime = now
      
      // Carregar carrinho do localStorage
      const savedCart = loadCartFromStorage()
      if (savedCart.length > 0) {
        state.cart = savedCart
        const { total, finalTotal } = calculateCartTotals(savedCart, state.cartDiscount)
        state.cartTotal = total
        state.cartFinalTotal = finalTotal
        
        console.log('📦 Carrinho restaurado do localStorage:', {
          items: savedCart.length,
          total: state.cartTotal
        })
      }
      
      console.log('🏪 PDV inicializado:', {
        openTime: now.toISOString(),
        cartItems: state.cart.length
      })
    })
  },
  
  updateCurrentTime: () => {
    set((state) => {
      state.currentTime = new Date()
    })
  },
  
  // Ações de conectividade
  setIsOnline: (online: boolean) => {
    set((state) => {
      const wasOffline = !state.isOnline
      state.isOnline = online
      
      if (online && wasOffline) {
        console.log('🌐 Conexão restaurada')
        state.lastSyncTime = new Date()
      } else if (!online) {
        console.log('📴 Conexão perdida - modo offline')
      }
    })
  },
  
  updateLastSyncTime: () => {
    set((state) => {
      state.lastSyncTime = new Date()
    })
  },
  
  // Ações utilitárias
  resetPDV: () => {
    set((state) => {
      // Resetar tudo exceto configurações de conectividade
      state.cart = []
      state.cartTotal = 0
      state.cartDiscount = 0
      state.cartFinalTotal = 0
      
      state.searchTerm = ''
      state.showSuggestions = false
      
      state.showScanner = false
      state.isScanning = false
      state.scanningBarcode = null
      
      state.showPayment = false
      state.selectedPaymentMethod = null
      
      // Limpar localStorage
      try {
        localStorage.removeItem('pdv_cart')
        localStorage.removeItem('pdv_cart_timestamp')
      } catch (error) {
        console.warn('⚠️ Erro ao limpar localStorage:', error)
      }
      
      console.log('🔄 PDV resetado')
    })
  }
})))

// Seletores otimizados para evitar re-renders desnecessários
export const selectCartItems = (state: PDVState) => state.cart
export const selectCartTotal = (state: PDVState) => state.cartTotal
export const selectCartFinalTotal = (state: PDVState) => state.cartFinalTotal
export const selectCartCount = (state: PDVState) => state.cart.length
export const selectIsCartEmpty = (state: PDVState) => state.cart.length === 0
export const selectSearchTerm = (state: PDVState) => state.searchTerm
export const selectShowSuggestions = (state: PDVState) => state.showSuggestions
export const selectShowScanner = (state: PDVState) => state.showScanner
export const selectIsScanning = (state: PDVState) => state.isScanning
export const selectShowPayment = (state: PDVState) => state.showPayment
export const selectSelectedPaymentMethod = (state: PDVState) => state.selectedPaymentMethod
export const selectIsOnline = (state: PDVState) => state.isOnline
export const selectPDVOpenTime = (state: PDVState) => state.pdvOpenTime
export const selectCurrentTime = (state: PDVState) => state.currentTime