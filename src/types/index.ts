// Tipos globais do sistema

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  avatar?: string;
  phone?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR'
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  salePrice: number;
  costPrice?: number;
  stock: number;
  unit: ProductUnit;
  description?: string;
  isActive: boolean;
  isPerishable: boolean;
  expiryDate?: Date;
  categoryId: string;
  category?: Category;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProductUnit {
  UN = 'UN',
  KG = 'KG',
  L = 'L',
  M = 'M',
  M2 = 'M2',
  M3 = 'M3'
}

export interface Sale {
  id: string;
  total: number;
  discount: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes?: string;
  userId: string;
  user?: User;
  items: SaleItem[];
  payment?: Payment;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX'
}

export enum SaleStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export interface SaleItem {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  saleId: string;
  productId: string;
  product?: Product;
  createdAt: Date;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  pixQrCode?: string;
  pixKey?: string;
  expiresAt?: Date;
  paidAt?: Date;
  webhookData?: string;
  saleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para o carrinho de compras
export interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  discount: number;
  finalTotal: number;
}

// Tipos para formulários
export interface ProductFormData {
  name: string;
  barcode?: string;
  salePrice: number;
  costPrice?: number;
  stock: number;
  unit: ProductUnit;
  description?: string;
  isPerishable: boolean;
  expiryDate?: Date;
  categoryId: string;
}

export interface CategoryFormData {
  name: string;
  description?: string;
}

export interface UserFormData {
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  phone?: string;
  department?: string;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  department?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<UserRole, number>;
}

export interface UserModalData {
  mode: 'create' | 'edit' | 'view';
  user?: User;
  isOpen: boolean;
}

// Tipos para API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para filtros e busca
export interface ProductFilters {
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface SaleFilters {
  startDate?: Date;
  endDate?: Date;
  status?: SaleStatus;
  paymentMethod?: PaymentMethod;
  userId?: string;
}

// Tipos para relatórios
export interface SalesReport {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  topProducts: Array<{
    product: Product;
    quantity: number;
    revenue: number;
  }>;
  salesByPaymentMethod: Array<{
    method: PaymentMethod;
    count: number;
    total: number;
  }>;
  salesByPeriod: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}