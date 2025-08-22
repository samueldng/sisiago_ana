import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsService } from '@/services/productsService'
import type { Product, ProductFilters } from '@/types'
import type { CreateProductData, UpdateProductData } from '@/services/productsService'

// Hook para buscar produtos
export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      try {
        return await productsService.getProducts(filters)
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        // Fallback para dados locais (apenas no cliente)
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('sisiago_products_cache')
          if (cached) {
            const products = JSON.parse(cached)
            return {
              products,
              total: products.length,
              hasMore: false,
              fromCache: true
            }
          }
        }
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  })
}

// Hook para buscar produto por ID
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productsService.getProductById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  })
}

// Hook para buscar produto por código de barras
export function useProductByBarcode(barcode: string) {
  return useQuery({
    queryKey: ['product', 'barcode', barcode],
    queryFn: () => productsService.getProductByBarcode(barcode),
    enabled: !!barcode,
    staleTime: 10 * 60 * 1000, // 10 minutos
    retry: 2
  })
}

// Hook para busca de produtos com debounce
export function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['products', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return []
      
      try {
        return await productsService.searchProducts(query)
      } catch (error) {
        console.error('Erro na busca de produtos:', error)
        // Fallback para busca local
        const cached = localStorage.getItem('sisiago_products_cache')
        if (cached) {
          const products = JSON.parse(cached)
          const searchLower = query.toLowerCase()
          return products.filter((product: Product) =>
            product.name.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower) ||
            product.barcode?.includes(query)
          ).map((product: any) => ({
            ...product,
            salePrice: product.salePrice ?? product.sale_price ?? 0,
            costPrice: product.costPrice ?? product.cost_price ?? 0
          })).slice(0, 20)
        }
        return []
      }
    },
    enabled: !!query.trim(),
    staleTime: 30 * 1000, // 30 segundos
    retry: 1
  })
}

// Hook para criar produto
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateProductData) => productsService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

// Hook para atualizar produto
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductData }) => 
      productsService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', id] })
    }
  })
}

// Hook para deletar produto
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: productsService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

// Hook para pré-carregar produtos
export function usePreloadProducts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      try {
        const data = await productsService.getProducts({ is_active: true, limit: 100 })
        // Cache os produtos para uso offline (apenas no cliente)
        if (typeof window !== 'undefined' && data.products) {
          localStorage.setItem('sisiago_products_cache', JSON.stringify(data.products))
        }
        return data
      } catch (error) {
        console.warn('Falha ao pré-carregar produtos:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      // Atualizar cache do React Query
      queryClient.setQueryData(['products', { is_active: true, limit: 100 }], data)
    }
  })
}