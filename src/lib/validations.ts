import { z } from 'zod'
import { ProductUnit, PaymentMethod, UserRole } from '@/types'

// Validações para produtos
export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  barcode: z.string().optional(),
  salePrice: z.number().min(0.01, 'Preço de venda deve ser maior que zero'),
  costPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo'),
  unit: z.nativeEnum(ProductUnit),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
})

export const productUpdateSchema = productSchema.partial()

// Validações para categorias
export const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
})

export const createCategorySchema = categorySchema
export const updateCategorySchema = categorySchema.partial()

// Validações para usuários
export const userSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.nativeEnum(UserRole),
})

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

// Validações para vendas
export const saleItemSchema = z.object({
  productId: z.string().min(1, 'Produto é obrigatório'),
  quantity: z.number().min(0.01, 'Quantidade deve ser maior que zero'),
  unitPrice: z.number().min(0.01, 'Preço unitário deve ser maior que zero'),
})

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, 'Pelo menos um item é obrigatório'),
  discount: z.number().min(0).default(0),
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
})

// Validações para pagamento Pix
export const pixPaymentSchema = z.object({
  saleId: z.string().min(1, 'ID da venda é obrigatório'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  pixKey: z.string().optional(),
})

// Validações para filtros
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
})

export const saleFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  userId: z.string().optional(),
})

// Validações para paginação
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
})

// Tipos inferidos dos schemas
export type ProductFormData = z.infer<typeof productSchema>
export type CategoryFormData = z.infer<typeof categorySchema>
export type UserFormData = z.infer<typeof userSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type SaleFormData = z.infer<typeof saleSchema>
export type PixPaymentData = z.infer<typeof pixPaymentSchema>
export type ProductFilters = z.infer<typeof productFiltersSchema>
export type SaleFilters = z.infer<typeof saleFiltersSchema>
export type PaginationParams = z.infer<typeof paginationSchema>