import { createClient } from '@supabase/supabase-js'

// Usar valores padrão para evitar erros durante o build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Aviso em vez de erro para permitir o build
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Aviso: Variáveis de ambiente do Supabase não configuradas. Usando valores padrão.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para as tabelas
export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  barcode?: string
  sale_price: number
  cost_price?: number
  stock: number
  unit: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  category_id: string
  category?: Category
}

export interface User {
  id: string
  email: string
  name?: string
  password: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  total: number
  discount: number
  final_total: number
  payment_method: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  user_id: string
}

export interface SaleItem {
  id: string
  quantity: number
  unit_price: number
  total: number
  created_at: string
  sale_id: string
  product_id: string
  product?: Product
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  document?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  amount: number
  method: string
  status: string
  transaction_id?: string
  pix_qr_code?: string
  pix_key?: string
  expires_at?: string
  paid_at?: string
  webhook_data?: string
  created_at: string
  updated_at: string
  sale_id: string
}

// Funções helper para operações comuns
export const db = {
  // Categorias
  categories: {
    findMany: () => supabase.from('categories').select('*'),
    findById: (id: string) => supabase.from('categories').select('*').eq('id', id).single(),
    create: (data: Omit<Category, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('categories').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('categories').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('categories').delete().eq('id', id)
  },

  // Produtos
  products: {
    findMany: () => supabase.from('products').select(`
      *,
      category:categories(*)
    `),
    findById: (id: string) => supabase.from('products').select(`
      *,
      category:categories(*)
    `).eq('id', id).single(),
    findByBarcode: (barcode: string) => supabase.from('products').select(`
      *,
      category:categories(*)
    `).eq('barcode', barcode).single(),
    create: (data: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>) => 
      supabase.from('products').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category'>>) => 
      supabase.from('products').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('products').delete().eq('id', id)
  },

  // Vendas
  sales: {
    findMany: () => supabase.from('sales').select('*'),
    findById: (id: string) => supabase.from('sales').select('*').eq('id', id).single(),
    create: (data: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('sales').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Sale, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('sales').update(data).eq('id', id).select().single()
  },

  // Itens de venda
  saleItems: {
    findBySaleId: (saleId: string) => supabase.from('sale_items').select(`
      *,
      product:products(*)
    `).eq('sale_id', saleId),
    create: (data: Omit<SaleItem, 'id' | 'created_at' | 'product'>) => 
      supabase.from('sale_items').insert(data).select().single(),
    delete: (id: string) => supabase.from('sale_items').delete().eq('id', id)
  },

  clients: {
    findMany: () => supabase.from('clients').select('*'),
    findById: (id: string) => supabase.from('clients').select('*').eq('id', id).single(),
    findByEmail: (email: string) => supabase.from('clients').select('*').eq('email', email).single(),
    create: (data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('clients').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('clients').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('clients').delete().eq('id', id)
  },

  payments: {
    findMany: () => supabase.from('payments').select('*'),
    findById: (id: string) => supabase.from('payments').select('*').eq('id', id).single(),
    findBySaleId: (saleId: string) => supabase.from('payments').select('*').eq('sale_id', saleId),
    create: (data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('payments').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('payments').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('payments').delete().eq('id', id)
  },

  // Usuários
  users: {
    findMany: () => supabase.from('users').select('*'),
    findById: (id: string) => supabase.from('users').select('*').eq('id', id).single(),
    findByEmail: (email: string) => supabase.from('users').select('*').eq('email', email).single(),
    create: (data: Omit<User, 'id' | 'created_at' | 'updated_at'>) => 
      supabase.from('users').insert(data).select().single(),
    update: (id: string, data: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>) => 
      supabase.from('users').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('users').delete().eq('id', id)
  },

  // Logs de auditoria
  auditLogs: {
    findMany: (filters?: {
      table_name?: string;
      user_id?: string;
      operation?: string;
      limit?: number;
      offset?: number;
    }) => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.table_name) {
        query = query.eq('table_name', filters.table_name);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.operation) {
        query = query.eq('operation', filters.operation);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      return query;
    },
    findById: (id: string) => supabase.from('audit_logs').select('*').eq('id', id).single(),
    create: (data: Omit<AuditLog, 'id' | 'created_at'>) => 
      supabase.from('audit_logs').insert(data).select().single(),
    findByRecordId: (recordId: string, tableName?: string) => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      return query;
    }
  }
}

// Interface para logs de auditoria
export interface AuditLog {
  id: string;
  table_name: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  user_id: string;
  user_email: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Função para verificar permissões do usuário
export const checkUserPermission = async (userId: string, requiredRole: string): Promise<boolean> => {
  try {
    const { data: user, error } = await db.users.findById(userId);
    
    if (error || !user) {
      console.error('Erro ao verificar permissão do usuário:', error);
      return false;
    }
    
    return user.role === requiredRole;
  } catch (error) {
    console.error('Erro ao verificar permissão do usuário:', error);
    return false;
  }
};

// Função helper para criar logs de auditoria
export const createAuditLog = async ({
  tableName,
  operation,
  recordId,
  oldValues,
  newValues,
  userId,
  userEmail,
  ipAddress,
  userAgent
}: {
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  userId: string;
  userEmail: string;
  ipAddress?: string;
  userAgent?: string;
}) => {
  return await db.auditLogs.create({
    table_name: tableName,
    operation,
    record_id: recordId,
    old_values: oldValues,
    new_values: newValues,
    user_id: userId,
    user_email: userEmail,
    timestamp: new Date().toISOString(),
    ip_address: ipAddress,
    user_agent: userAgent
  });
};