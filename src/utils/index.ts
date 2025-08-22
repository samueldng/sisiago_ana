import { ProductUnit, PaymentMethod, SaleStatus, PaymentStatus } from '@/types'

// Formatação de moeda brasileira
export function formatCurrency(value: number | null | undefined): string {
  // Tratar valores inválidos
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00'
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Formatação de data brasileira
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return '--/--/----'
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return '--/--/----'
    }
    
    return new Intl.DateTimeFormat('pt-BR').format(dateObj)
  } catch (error) {
    return '--/--/----'
  }
}

// Formatação de data e hora brasileira
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) {
    return '--:--'
  }
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return '--:--'
    }
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  } catch (error) {
    return '--:--'
  }
}

// Formatação de números
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

// Tradução de unidades de medida
export function translateUnit(unit: ProductUnit): string {
  const translations = {
    [ProductUnit.UN]: 'Unidade',
    [ProductUnit.KG]: 'Quilograma',
    [ProductUnit.L]: 'Litro',
    [ProductUnit.M]: 'Metro',
    [ProductUnit.M2]: 'Metro²',
    [ProductUnit.M3]: 'Metro³',
  }
  return translations[unit] || unit
}

// Tradução de métodos de pagamento
export function translatePaymentMethod(method: PaymentMethod): string {
  const translations = {
    [PaymentMethod.CASH]: 'Dinheiro',
    [PaymentMethod.CREDIT_CARD]: 'Cartão de Crédito',
    [PaymentMethod.DEBIT_CARD]: 'Cartão de Débito',
    [PaymentMethod.PIX]: 'PIX',
  }
  return translations[method] || method
}

// Tradução de status de venda
export function translateSaleStatus(status: SaleStatus): string {
  const translations = {
    [SaleStatus.PENDING]: 'Pendente',
    [SaleStatus.PAID]: 'Pago',
    [SaleStatus.CANCELLED]: 'Cancelado',
    [SaleStatus.REFUNDED]: 'Estornado',
  }
  return translations[status] || status
}

// Tradução de status de pagamento
export function translatePaymentStatus(status: PaymentStatus): string {
  const translations = {
    [PaymentStatus.PENDING]: 'Pendente',
    [PaymentStatus.PROCESSING]: 'Processando',
    [PaymentStatus.PAID]: 'Pago',
    [PaymentStatus.FAILED]: 'Falhou',
    [PaymentStatus.EXPIRED]: 'Expirado',
    [PaymentStatus.CANCELLED]: 'Cancelado',
  }
  return translations[status] || status
}

// Geração de ID único simples
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Validação de código de barras EAN
export function isValidEAN(barcode: string): boolean {
  if (!/^\d{8}$|^\d{13}$/.test(barcode)) {
    return false
  }

  const digits = barcode.split('').map(Number)
  const checkDigit = digits.pop()!
  
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3)
  }
  
  const calculatedCheckDigit = (10 - (sum % 10)) % 10
  return calculatedCheckDigit === checkDigit
}

// Cálculo de desconto
export function calculateDiscount(total: number, discountPercent: number): number {
  return (total * discountPercent) / 100
}

// Cálculo de margem de lucro
export function calculateProfitMargin(salePrice: number, costPrice: number): number {
  if (costPrice === 0) return 0
  return ((salePrice - costPrice) / salePrice) * 100
}

// Debounce para otimizar buscas
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined
  return (...args: Parameters<T>) => {
    if (timeout !== undefined) {
      clearTimeout(timeout)
    }
    timeout = window.setTimeout(() => func(...args), wait)
  }
}

// Validação de email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Formatação de telefone brasileiro
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

// Formatação de CPF
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return cpf
}

// Formatação de CNPJ
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return cnpj
}

// Truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Capitalizar primeira letra
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

// Gerar cores aleatórias para avatares
export function generateAvatarColor(name: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

// Verificar se é dispositivo móvel
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
}

// Copiar texto para clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Erro ao copiar texto:', error)
    return false
  }
}